import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("GET SERVICES ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    const charge = Number(body.charge ?? 0);

    const active =
      typeof body.active === "boolean"
        ? body.active
        : true;

    if (!name) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(charge) || charge < 0) {
      return NextResponse.json(
        { error: "Charge must be a valid positive number" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        category,
        charge,
        active,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}