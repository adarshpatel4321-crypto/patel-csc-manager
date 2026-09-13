import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAYMENT_METHODS = {
  cash: true,
  upi: true,
  other: true,
};

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "payment_cash_enabled",
            "payment_upi_enabled",
            "payment_other_enabled",
          ],
        },
      },
    });

    const values: Record<string, string> = {};

    for (const setting of settings) {
      values[setting.key] = setting.value;
    }

    return NextResponse.json({
      cash:
        values.payment_cash_enabled === undefined
          ? DEFAULT_PAYMENT_METHODS.cash
          : values.payment_cash_enabled === "true",

      upi:
        values.payment_upi_enabled === undefined
          ? DEFAULT_PAYMENT_METHODS.upi
          : values.payment_upi_enabled === "true",

      other:
        values.payment_other_enabled === undefined
          ? DEFAULT_PAYMENT_METHODS.other
          : values.payment_other_enabled === "true",
    });
  } catch (error) {
    console.error("GET /api/settings/payment-methods error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch payment methods",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      cash?: boolean;
      upi?: boolean;
      other?: boolean;
    };

    const cash = body.cash ?? true;
    const upi = body.upi ?? true;
    const other = body.other ?? true;

    if (!cash && !upi && !other) {
      return NextResponse.json(
        {
          error: "At least one payment method must remain enabled.",
        },
        {
          status: 400,
        }
      );
    }

    const paymentMethods = {
      payment_cash_enabled: String(cash),
      payment_upi_enabled: String(upi),
      payment_other_enabled: String(other),
    };

    await prisma.$transaction(
      Object.entries(paymentMethods).map(([key, value]) =>
        prisma.setting.upsert({
          where: {
            key,
          },
          update: {
            value,
          },
          create: {
            key,
            value,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      paymentMethods: {
        cash,
        upi,
        other,
      },
    });
  } catch (error) {
    console.error("PUT /api/settings/payment-methods error:", error);

    return NextResponse.json(
      {
        error: "Failed to save payment methods",
      },
      {
        status: 500,
      }
    );
  }
}