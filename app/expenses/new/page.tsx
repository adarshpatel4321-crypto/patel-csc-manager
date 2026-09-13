"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  Receipt,
  Save,
  WalletCards,
  XCircle,
} from "lucide-react";

type PaymentMethod = "Cash" | "UPI" | "Other";

type PaymentMethods = {
  cash: boolean;
  upi: boolean;
  other: boolean;
};

type PaymentOption = {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof Banknote;
  key: keyof PaymentMethods;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "Cash",
    label: "Cash",
    description: "Paid using cash",
    icon: Banknote,
    key: "cash",
  },
  {
    value: "UPI",
    label: "UPI",
    description: "Paid digitally",
    icon: CreditCard,
    key: "upi",
  },
  {
    value: "Other",
    label: "Other",
    description: "Other payment method",
    icon: WalletCards,
    key: "other",
  },
];

const CATEGORIES = [
  "Rent",
  "Electricity",
  "Internet",
  "Stationery",
  "Printing",
  "Travel",
  "Maintenance",
  "Tea / Snacks",
  "Other",
];

const DEFAULT_PAYMENT_METHODS: PaymentMethods = {
  cash: true,
  upi: true,
  other: true,
};

function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export default function NewExpensePage() {
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Cash");
  const [note, setNote] = useState("");

  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethods>(DEFAULT_PAYMENT_METHODS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Prevent multiple submit requests from rapid clicks.
  const submitLockRef = useRef(false);

  // One key belongs to one save attempt.
  // If the same request is accidentally repeated,
  // the API returns the already-created expense.
  const idempotencyKeyRef = useRef<string>(
    createIdempotencyKey()
  );

  const successTimerRef = useRef<number | null>(null);

  const availablePaymentOptions = useMemo(() => {
    return PAYMENT_OPTIONS.filter(
      (option) => paymentMethods[option.key]
    );
  }, [paymentMethods]);

  const numericAmount = Number(amount) || 0;

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await fetch(
          "/api/settings/payment-methods",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load payment methods");
        }

        const data = await response.json();

        const methods: PaymentMethods = {
          cash: Boolean(data.cash),
          upi: Boolean(data.upi),
          other: Boolean(data.other),
        };

        setPaymentMethods(methods);
      } catch (err) {
        console.error(err);
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      } finally {
        setLoading(false);
      }
    };

    void loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (availablePaymentOptions.length === 0) {
      return;
    }

    const currentMethodEnabled =
      availablePaymentOptions.some(
        (option) => option.value === paymentMethod
      );

    if (!currentMethodEnabled) {
      setPaymentMethod(
        availablePaymentOptions[0].value
      );
    }
  }, [availablePaymentOptions, paymentMethod]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // Hard protection against rapid double/triple clicks.
    if (submitLockRef.current || saving) {
      return;
    }

    setSuccess("");
    setError("");

    if (!category.trim()) {
      setError("Please select an expense category.");
      return;
    }

    if (!amount.trim() || numericAmount <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    if (availablePaymentOptions.length === 0) {
      setError(
        "No payment method is enabled. Enable at least one from Settings."
      );
      return;
    }

    submitLockRef.current = true;
    setSaving(true);

    const currentIdempotencyKey =
      idempotencyKeyRef.current;

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": currentIdempotencyKey,
        },
        body: JSON.stringify({
          category: category.trim(),
          amount: numericAmount,
          paymentMethod,
          note: note.trim() || null,
          idempotencyKey: currentIdempotencyKey,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to save expense.";

        throw new Error(errorMessage);
      }

      setSuccess("Expense saved successfully.");

      setAmount("");
      setNote("");
      setCategory("Rent");

      // IMPORTANT:
      // New form data = new idempotency key.
      // This prevents the next expense from being considered
      // the same request as the previous one.
      idempotencyKeyRef.current =
        createIdempotencyKey();

      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Expense save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);

      // Unlock only after the request is completely finished.
      submitLockRef.current = false;
    }
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-7"
        >
          <Link
            href="/expenses"
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-orange-400/30 hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Expenses
          </Link>

          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
              <Receipt size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Add Expense
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Record a shop expense quickly and accurately.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        <div className="mb-5 space-y-3">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              <CheckCircle2 size={18} />
              {success}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <XCircle size={18} />
              {error}
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main Form */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/10 bg-[#0c111b] p-5 shadow-2xl shadow-black/20 sm:p-7"
            >
              <div className="mb-7">
                <h2 className="text-lg font-semibold">
                  Expense Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the basic details of this expense.
                </p>
              </div>

              <div className="space-y-6">
                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Expense Category
                  </label>

                  <div className="relative">
                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value)
                      }
                      disabled={saving}
                      className="w-full appearance-none rounded-2xl border border-white/10 bg-[#080d16] px-4 py-3.5 pr-11 text-sm text-white outline-none transition focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {CATEGORIES.map((item) => (
                        <option
                          key={item}
                          value={item}
                          className="bg-[#0c111b] text-white"
                        >
                          {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Expense Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-orange-400">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      disabled={saving}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-white/10 bg-[#080d16] py-3.5 pl-10 pr-4 text-lg font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300">
                        Payment Method
                      </label>

                      <p className="mt-1 text-xs text-slate-500">
                        Available methods are controlled from Settings.
                      </p>
                    </div>

                    <Link
                      href="/settings/payments"
                      className="text-xs font-medium text-orange-400 transition hover:text-orange-300"
                    >
                      Manage methods
                    </Link>
                  </div>

                  {loading ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-[88px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
                        />
                      ))}
                    </div>
                  ) : availablePaymentOptions.length === 0 ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
                      <div className="flex items-center gap-3 text-red-300">
                        <XCircle size={19} />

                        <div>
                          <p className="text-sm font-medium">
                            No payment method enabled
                          </p>

                          <p className="mt-1 text-xs text-red-300/70">
                            Enable Cash, UPI or Other from Settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {availablePaymentOptions.map(
                        (option) => {
                          const Icon = option.icon;

                          const selected =
                            paymentMethod === option.value;

                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              disabled={saving}
                              whileTap={{
                                scale: saving ? 1 : 0.97,
                              }}
                              onClick={() =>
                                setPaymentMethod(
                                  option.value
                                )
                              }
                              className={`relative rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? "border-orange-400/60 bg-orange-500/10 shadow-lg shadow-orange-500/5"
                                  : "border-white/10 bg-[#080d16] hover:border-white/20 hover:bg-white/[0.04]"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                    selected
                                      ? "bg-orange-500/15 text-orange-400"
                                      : "bg-white/[0.05] text-slate-400"
                                  }`}
                                >
                                  <Icon size={19} />
                                </div>

                                {selected && (
                                  <CheckCircle2
                                    size={18}
                                    className="text-orange-400"
                                  />
                                )}
                              </div>

                              <p className="mt-3 text-sm font-semibold text-white">
                                {option.label}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {option.description}
                              </p>
                            </motion.button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Note{" "}
                    <span className="font-normal text-slate-600">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                    disabled={saving}
                    rows={4}
                    placeholder="Add a short note..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#080d16] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Save */}
                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
                  <Link
                    href="/expenses"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Cancel
                  </Link>

                  <motion.button
                    type="submit"
                    disabled={
                      saving ||
                      loading ||
                      availablePaymentOptions.length === 0
                    }
                    whileHover={{
                      scale: saving ? 1 : 1.01,
                    }}
                    whileTap={{
                      scale: saving ? 1 : 0.98,
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 px-7 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Expense
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.section>

            {/* Summary */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.08,
              }}
              className="h-fit rounded-3xl border border-white/10 bg-[#0c111b] p-5 shadow-2xl shadow-black/20 sm:p-6 lg:sticky lg:top-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Receipt size={19} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Expense Summary
                  </h2>

                  <p className="text-xs text-slate-500">
                    Live preview
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Category
                  </span>

                  <span className="max-w-[170px] truncate text-right text-sm font-medium text-white">
                    {category}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    Payment
                  </span>

                  <span className="text-sm font-medium text-white">
                    {paymentMethod}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm text-slate-400">
                      Total Expense
                    </span>

                    <span className="text-2xl font-bold tracking-tight text-orange-400">
                      ₹
                      {numericAmount.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-orange-400/10 bg-orange-500/5 p-4">
                <p className="text-xs leading-5 text-slate-400">
                  This amount will be recorded as a shop expense
                  and will reduce your net profit in Reports.
                </p>
              </div>
            </motion.aside>
          </div>
        </form>
      </div>
    </main>
  );
}