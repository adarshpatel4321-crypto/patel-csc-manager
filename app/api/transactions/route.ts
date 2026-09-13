import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PaymentMethod = "Cash" | "UPI" | "Other";

type CreateTransactionBody = {
  serviceId?: unknown;
  transactionAmount?: unknown;
  serviceCharge?: unknown;
  paymentMethod?: unknown;
  note?: unknown;
  idempotencyKey?: unknown;
};

type RecentRequest = {
  fingerprint: string;
  createdAt: number;
};

/*
 * Server-side short duplicate protection.
 *
 * This survives multiple POST requests reaching the API
 * with different idempotency keys within the same short window.
 */
const globalForTransactionGuard =
  globalThis as typeof globalThis & {
    transactionRecentRequests?: Map<
      string,
      RecentRequest
    >;
  };

const recentRequests =
  globalForTransactionGuard.transactionRecentRequests ??
  new Map<string, RecentRequest>();

globalForTransactionGuard.transactionRecentRequests =
  recentRequests;

const DUPLICATE_WINDOW_MS = 5000;

function isPaymentMethod(
  value: unknown
): value is PaymentMethod {
  return (
    value === "Cash" ||
    value === "UPI" ||
    value === "Other"
  );
}

function normalizeNumber(
  value: number
): string {
  return value.toFixed(2);
}

function createFingerprint(data: {
  serviceId: string;
  transactionAmount: number;
  serviceCharge: number;
  paymentMethod: PaymentMethod;
  note: string | null;
}): string {
  return [
    data.serviceId,
    normalizeNumber(data.transactionAmount),
    normalizeNumber(data.serviceCharge),
    data.paymentMethod,
    data.note ?? "",
  ].join("|");
}

function cleanupRecentRequests() {
  const now = Date.now();

  for (const [
    key,
    request,
  ] of recentRequests.entries()) {
    if (
      now - request.createdAt >
      DUPLICATE_WINDOW_MS
    ) {
      recentRequests.delete(key);
    }
  }
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json(transactions);
  } catch (error: unknown) {
    console.error("GET /api/transactions ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown transactions load error.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    cleanupRecentRequests();

    const body =
      (await request.json()) as CreateTransactionBody;

    const serviceId =
      typeof body.serviceId === "string"
        ? body.serviceId.trim()
        : "";

    const transactionAmount =
      typeof body.transactionAmount === "number"
        ? body.transactionAmount
        : Number(
            body.transactionAmount
          );

    const serviceCharge =
      typeof body.serviceCharge === "number"
        ? body.serviceCharge
        : Number(
            body.serviceCharge
          );

    const paymentMethod =
      body.paymentMethod;

    const note =
      typeof body.note === "string"
        ? body.note.trim()
        : null;

    /*
     * ------------------------------------------------
     * VALIDATION
     * ------------------------------------------------
     */

    if (!serviceId) {
      return NextResponse.json(
        {
          error:
            "Service is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        transactionAmount
      ) ||
      transactionAmount < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Transaction amount must be a valid non-negative number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        serviceCharge
      ) ||
      serviceCharge < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Service charge must be a valid non-negative number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isPaymentMethod(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payment method.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------
     * IDEMPOTENCY KEY
     * ------------------------------------------------
     */

    const headerKey =
      request.headers.get(
        "Idempotency-Key"
      );

    const bodyKey =
      typeof body.idempotencyKey ===
      "string"
        ? body.idempotencyKey.trim()
        : "";

    const idempotencyKey =
      headerKey?.trim() ||
      bodyKey;

    /*
     * No random UUID fallback here.
     *
     * Every save request must identify itself.
     */
    if (!idempotencyKey) {
      return NextResponse.json(
        {
          error:
            "Save request key missing. Please try again.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------
     * LEVEL 1
     * DATABASE IDEMPOTENCY CHECK
     * ------------------------------------------------
     */

    const existing =
      await prisma.transaction.findUnique(
        {
          where: {
            idempotencyKey,
          },
          include: {
            service: true,
          },
        }
      );

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          transaction: existing,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * ------------------------------------------------
     * SERVICE CHECK
     * ------------------------------------------------
     */

    const service =
      await prisma.service.findUnique({
        where: {
          id: serviceId,
        },
      });

    if (!service) {
      return NextResponse.json(
        {
          error:
            "Selected service not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!service.active) {
      return NextResponse.json(
        {
          error:
            "Selected service is inactive.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------
     * LEVEL 2
     * SHORT-TIME DUPLICATE GUARD
     *
     * Even if frontend accidentally generates
     * different idempotency keys, an identical
     * transaction within 5 seconds is blocked.
     * ------------------------------------------------
     */

    const fingerprint =
      createFingerprint({
        serviceId,
        transactionAmount,
        serviceCharge,
        paymentMethod,
        note,
      });

    const now = Date.now();

    const recent =
      recentRequests.get(
        fingerprint
      );

    if (
      recent &&
      now - recent.createdAt <
        DUPLICATE_WINDOW_MS
    ) {
      /*
       * Find the transaction that was just created.
       */
      const recentTransaction =
        await prisma.transaction.findFirst(
          {
            where: {
              serviceId,
              transactionAmount,
              serviceCharge,
              paymentMethod,
              note: note || null,
              createdAt: {
                gte: new Date(
                  now -
                    DUPLICATE_WINDOW_MS
                ),
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            include: {
              service: true,
            },
          }
        );

      if (recentTransaction) {
        return NextResponse.json(
          {
            success: true,
            duplicate: true,
            transaction:
              recentTransaction,
          },
          {
            status: 200,
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          duplicate: true,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * Put the lock BEFORE database creation.
     *
     * This is important when multiple requests arrive
     * almost simultaneously.
     */
    recentRequests.set(
      fingerprint,
      {
        fingerprint,
        createdAt: now,
      }
    );

    /*
     * ------------------------------------------------
     * LEVEL 3
     * DATABASE UNIQUE CONSTRAINT
     * ------------------------------------------------
     */

    try {
      const transaction =
        await prisma.transaction.create(
          {
            data: {
              serviceId,
              transactionAmount,
              serviceCharge,
              paymentMethod,
              note: note || null,
              idempotencyKey,
            },
            include: {
              service: true,
            },
          }
        );

      return NextResponse.json(
        {
          success: true,
          duplicate: false,
          transaction,
        },
        {
          status: 201,
        }
      );
    } catch (createError: unknown) {
      /*
       * Prisma P2002 means unique constraint violation.
       * Another request won the race.
       */

      if (
        typeof createError ===
          "object" &&
        createError !== null &&
        "code" in createError &&
        (
          createError as {
            code?: string;
          }
        ).code === "P2002"
      ) {
        const duplicate =
          await prisma.transaction.findUnique(
            {
              where: {
                idempotencyKey,
              },
              include: {
                service: true,
              },
            }
          );

        if (duplicate) {
          return NextResponse.json(
            {
              success: true,
              duplicate: true,
              transaction:
                duplicate,
            },
            {
              status: 200,
            }
          );
        }

        /*
         * Even if the exact key was not found,
         * return duplicate instead of creating another
         * transaction.
         */
        return NextResponse.json(
          {
            success: true,
            duplicate: true,
          },
          {
            status: 200,
          }
        );
      }

      console.error(
        "Transaction create error:",
        createError
      );

      /*
       * Remove short lock only when actual save failed.
       */
      recentRequests.delete(
        fingerprint
      );

      return NextResponse.json(
        {
          error:
            createError instanceof
            Error
              ? createError.message
              : "Transaction could not be created.",
        },
        {
          status: 500,
        }
      );
    }
  } catch (error: unknown) {
    console.error(
      "POST /api/transactions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Transaction save failed.",
      },
      {
        status: 500,
      }
    );
  }
}