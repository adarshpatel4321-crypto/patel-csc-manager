import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REPEAT_OPTIONS = [
  "none",
  "daily",
  "weekly",
  "monthly",
] as const;

export async function GET() {
  try {
    const reminders = await prisma.reminder.findMany({
      orderBy: {
        remindAt: "asc",
      },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("GET /api/reminders error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch reminders",
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
      title,
      description,
      remindAt,
      repeat,
    } = body;

    if (
      typeof title !== "string" ||
      title.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Please enter a reminder title",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof remindAt !== "string" ||
      remindAt.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Please select reminder date and time",
        },
        {
          status: 400,
        }
      );
    }

    const parsedDate = new Date(remindAt);

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

    const normalizedRepeat =
      typeof repeat === "string" &&
      REPEAT_OPTIONS.includes(
        repeat as (typeof REPEAT_OPTIONS)[number]
      )
        ? repeat
        : "none";

    const reminder = await prisma.reminder.create({
      data: {
        title: title.trim(),
        description:
          typeof description === "string" &&
          description.trim().length > 0
            ? description.trim()
            : null,
        remindAt: parsedDate,
        repeat: normalizedRepeat,
      },
    });

    return NextResponse.json(
      reminder,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/reminders error:", error);

    return NextResponse.json(
      {
        error: "Failed to create reminder",
      },
      {
        status: 500,
      }
    );
  }
}