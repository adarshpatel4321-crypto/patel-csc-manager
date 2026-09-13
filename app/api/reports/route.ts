import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Period = "today" | "week" | "month";

const getDateRange = (period: Period) => {
  const now = new Date();

  const start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (period === "week") {
    const day = start.getDay();
    const difference = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - difference);
    start.setHours(0, 0, 0, 0);
  }

  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  const end = new Date(now);

  return {
    start,
    end,
  };
};

export async function GET(request: NextRequest) {
  try {
    const periodParam = request.nextUrl.searchParams.get("period");

    const period: Period =
      periodParam === "week" || periodParam === "month"
        ? periodParam
        : "today";

    const { start, end } = getDateRange(period);

    const [
      transactionCount,
      revenueResult,
      expenseResult,
      transactions,
      expenses,
    ] = await Promise.all([
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          serviceCharge: true,
        },
      }),

      prisma.expense.aggregate({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          service: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.expense.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const revenue =
      revenueResult._sum.serviceCharge ?? 0;

    const expensesTotal =
      expenseResult._sum.amount ?? 0;

    const profit = revenue - expensesTotal;

    const paymentBreakdown = {
      Cash: 0,
      UPI: 0,
      Other: 0,
    };

    for (const transaction of transactions) {
      if (transaction.paymentMethod === "Cash") {
        paymentBreakdown.Cash += transaction.serviceCharge;
      }

      if (transaction.paymentMethod === "UPI") {
        paymentBreakdown.UPI += transaction.serviceCharge;
      }

      if (transaction.paymentMethod === "Other") {
        paymentBreakdown.Other += transaction.serviceCharge;
      }
    }

    const serviceMap = new Map<
      string,
      {
        name: string;
        category: string;
        transactions: number;
        revenue: number;
      }
    >();

    for (const transaction of transactions) {
      const serviceName =
        transaction.service?.name ?? "Unknown Service";

      const serviceCategory =
        transaction.service?.category ?? "Other";

      const existing = serviceMap.get(
        transaction.serviceId ?? serviceName
      );

      if (existing) {
        existing.transactions += 1;
        existing.revenue += transaction.serviceCharge;
      } else {
        serviceMap.set(
          transaction.serviceId ?? serviceName,
          {
            name: serviceName,
            category: serviceCategory,
            transactions: 1,
            revenue: transaction.serviceCharge,
          }
        );
      }
    }

    const topServices = Array.from(
      serviceMap.values()
    )
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      period,
      range: {
        start,
        end,
      },
      summary: {
        revenue,
        expenses: expensesTotal,
        profit,
        transactions: transactionCount,
      },
      paymentBreakdown,
      topServices,
      transactions,
      expenses,
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch reports",
      },
      {
        status: 500,
      }
    );
  }
}