import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REPEAT_OPTIONS = [
  "none",
  "daily",
  "weekly",
  "monthly",
] as const;

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

    const existing = await prisma.reminder.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Reminder not found",
        },
        {
          status: 404,
        }
      );
    }

    const updateData: {
      title?: string;
      description?: string | null;
      remindAt?: Date;
      repeat?: string;
      completed?: boolean;
    } = {};

    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        body.title.trim().length === 0
      ) {
        return NextResponse.json(
          {
            error: "Invalid reminder title",
          },
          {
            status: 400,
          }
        );
      }

      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description =
        typeof body.description === "string" &&
        body.description.trim().length > 0
          ? body.description.trim()
          : null;
    }

    if (body.remindAt !== undefined) {
      const parsedDate = new Date(body.remindAt);

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            error: "Invalid reminder date and time",
          },
          {
            status: 400,
          }
        );
      }

      updateData.remindAt = parsedDate;
    }

    if (body.repeat !== undefined) {
      if (
        typeof body.repeat !== "string" ||
        !REPEAT_OPTIONS.includes(
          body.repeat as (typeof REPEAT_OPTIONS)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: "Invalid repeat option",
          },
          {
            status: 400,
          }
        );
      }

      updateData.repeat = body.repeat;
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== "boolean") {
        return NextResponse.json(
          {
            error: "Invalid completed value",
          },
          {
            status: 400,
          }
        );
      }

      updateData.completed = body.completed;
    }

    const reminder = await prisma.reminder.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("PATCH /api/reminders/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update reminder",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.reminder.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Reminder not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.reminder.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/reminders/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete reminder",
      },
      {
        status: 500,
      }
    );
  }
}