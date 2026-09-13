import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  shopName: "PATEL FINANCE & CSC CENTER",
  address: "A-19, RB Plaza, Rankuva–Tankal Road",
  cscMobile: "8460329135",
  openingTime: "09:00",
  closingTime: "18:00",
};

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: Object.keys(DEFAULT_SETTINGS),
        },
      },
    });

    const result: Record<string, string> = {
      ...DEFAULT_SETTINGS,
    };

    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/settings error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch settings",
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
      shopName?: string;
      address?: string;
      cscMobile?: string;
      openingTime?: string;
      closingTime?: string;
    };

    const shopName = body.shopName?.trim();
    const address = body.address?.trim();
    const cscMobile = body.cscMobile?.trim();
    const openingTime = body.openingTime?.trim();
    const closingTime = body.closingTime?.trim();

    if (!shopName) {
      return NextResponse.json(
        { error: "Shop name is required" },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    if (!cscMobile) {
      return NextResponse.json(
        { error: "CSC mobile number is required" },
        { status: 400 }
      );
    }

    if (!/^[0-9]{10}$/.test(cscMobile)) {
      return NextResponse.json(
        { error: "CSC mobile number must be 10 digits" },
        { status: 400 }
      );
    }

    if (!openingTime || !closingTime) {
      return NextResponse.json(
        { error: "Opening and closing time are required" },
        { status: 400 }
      );
    }

    const settings = {
      shopName,
      address,
      cscMobile,
      openingTime,
      closingTime,
    };

    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
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
      settings,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);

    return NextResponse.json(
      {
        error: "Failed to save settings",
      },
      {
        status: 500,
      }
    );
  }
}