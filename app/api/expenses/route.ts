import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAYMENT_METHODS = ["Cash", "UPI", "Other"] as const;

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch expenses",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      category,
      amount,
      paymentMethod,
      note,
    } = body;

    if (
      typeof category !== "string" ||
      category.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Please enter an expense category",
        },
        {
          status: 400,
        }
      );
    }

    const parsedAmount = Number(amount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return NextResponse.json(
        {
          error: "Please enter a valid expense amount",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !PAYMENT_METHODS.includes(
        paymentMethod as (typeof PAYMENT_METHODS)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid payment method",
        },
        {
          status: 400,
        }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        category: category.trim(),
        amount: parsedAmount,
        paymentMethod,
        note:
          typeof note === "string" &&
          note.trim().length > 0
            ? note.trim()
            : null,
      },
    });

    return NextResponse.json(
      expense,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/expenses error:", error);

    return NextResponse.json(
      {
        error: "Failed to create expense",
      },
      {
        status: 500,
      }
    );
  }
}