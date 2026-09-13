import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      category?: string;
      charge?: number;
      active?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name =
        typeof body.name === "string" ? body.name.trim() : "";

      if (!name) {
        return NextResponse.json(
          { error: "Service name is required" },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (body.category !== undefined) {
      const category =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      if (!category) {
        return NextResponse.json(
          { error: "Category is required" },
          { status: 400 }
        );
      }

      data.category = category;
    }

    if (body.charge !== undefined) {
      const charge = Number(body.charge);

      if (!Number.isFinite(charge) || charge < 0) {
        return NextResponse.json(
          { error: "Charge must be a valid positive number" },
          { status: 400 }
        );
      }

      data.charge = charge;
    }

    if (body.active !== undefined) {
      if (typeof body.active !== "boolean") {
        return NextResponse.json(
          { error: "Active must be true or false" },
          { status: 400 }
        );
      }

      data.active = body.active;
    }

    const service = await prisma.service.update({
      where: { id },
      data,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Cannot delete this service. It may be linked to transactions.",
      },
      { status: 500 }
    );
  }
}