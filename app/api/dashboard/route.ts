import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const startOfWeek = new Date(startOfDay);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;

    startOfWeek.setDate(startOfWeek.getDate() - diff);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [
      todayTransactionCount,
      todayRevenueResult,
      todayExpenseResult,

      weekRevenueResult,
      weekExpenseResult,

      monthRevenueResult,
      monthExpenseResult,

      recentTransactions,
      recentExpenses,

      pendingReminders,
      overdueReminders,
      todayReminders,
    ] = await Promise.all([
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),

      prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        _sum: {
          serviceCharge: true,
        },
      }),

      prisma.expense.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: startOfWeek,
        },
        },
        _sum: {
          serviceCharge: true,
        },
      }),

      prisma.expense.aggregate({
        where: {
          createdAt: {
            gte: startOfWeek,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          serviceCharge: true,
        },
      }),

      prisma.expense.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.transaction.findMany({
        include: {
          service: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.expense.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.reminder.count({
        where: {
          completed: false,
        },
      }),

      prisma.reminder.count({
        where: {
          completed: false,
          remindAt: {
            lt: now,
          },
        },
      }),

      prisma.reminder.count({
        where: {
          completed: false,
          remindAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),
    ]);

    const todayRevenue =
      todayRevenueResult._sum.serviceCharge ?? 0;

    const todayExpenses =
      todayExpenseResult._sum.amount ?? 0;

    const weekRevenue =
      weekRevenueResult._sum.serviceCharge ?? 0;

    const weekExpenses =
      weekExpenseResult._sum.amount ?? 0;

    const monthRevenue =
      monthRevenueResult._sum.serviceCharge ?? 0;

    const monthExpenses =
      monthExpenseResult._sum.amount ?? 0;

    return NextResponse.json({
      today: {
        revenue: todayRevenue,
        expenses: todayExpenses,
        profit: todayRevenue - todayExpenses,
        transactions: todayTransactionCount,
      },

      week: {
        revenue: weekRevenue,
        expenses: weekExpenses,
        profit: weekRevenue - weekExpenses,
      },

      month: {
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      },

      reminders: {
        pending: pendingReminders,
        overdue: overdueReminders,
        today: todayReminders,
      },

      recentTransactions,
      recentExpenses,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}