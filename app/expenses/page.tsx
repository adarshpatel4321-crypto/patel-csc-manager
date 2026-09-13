"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  IndianRupee,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";

type Expense = {
  id: string;
  category: string;
  amount: number;
  paymentMethod: "Cash" | "UPI" | "Other";
  note: string | null;
  createdAt: string;
};

const formatMoney = (value: number): string => {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isSameDay = (
  firstDate: Date,
  secondDate: Date
): boolean => {
  return (
    firstDate.getDate() === secondDate.getDate() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  );
};

const getPaymentStyles = (
  paymentMethod: Expense["paymentMethod"]
): string => {
  if (paymentMethod === "Cash") {
    return "border-emerald-400/15 bg-emerald-500/10 text-emerald-300";
  }

  if (paymentMethod === "UPI") {
    return "border-blue-400/15 bg-blue-500/10 text-blue-300";
  }

  return "border-orange-400/15 bg-orange-500/10 text-orange-300";
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [paymentMethod, setPaymentMethod] =
    useState<string>("All");

  const loadExpenses = useCallback(
    async (showRefreshLoader: boolean = false): Promise<void> => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch("/api/expenses", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "Expenses load thai shakya nathi."
          );
        }

        const data: Expense[] = await response.json();

        setExpenses(data);
      } catch (err: unknown) {
        console.error(err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Expenses load thai shakya nathi.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const categories = useMemo<string[]>(() => {
    const values = expenses
      .map((expense) => expense.category.trim())
      .filter(
        (value): value is string => Boolean(value)
      );

    return ["All", ...Array.from(new Set(values))];
  }, [expenses]);

  const filteredExpenses = useMemo<Expense[]>(() => {
    const searchValue = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const categoryValue =
        expense.category.toLowerCase();

      const noteValue =
        expense.note?.toLowerCase() ?? "";

      const paymentValue =
        expense.paymentMethod.toLowerCase();

      const matchesSearch =
        searchValue.length === 0 ||
        categoryValue.includes(searchValue) ||
        noteValue.includes(searchValue) ||
        paymentValue.includes(searchValue);

      const matchesCategory =
        category === "All" ||
        expense.category === category;

      const matchesPayment =
        paymentMethod === "All" ||
        expense.paymentMethod === paymentMethod;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPayment
      );
    });
  }, [
    expenses,
    search,
    category,
    paymentMethod,
  ]);

  const totalExpenses = useMemo<number>(() => {
    return filteredExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
  }, [filteredExpenses]);

  const todayExpenses = useMemo<number>(() => {
    const today = new Date();

    return expenses.reduce((total, expense) => {
      const expenseDate = new Date(expense.createdAt);

      return isSameDay(expenseDate, today)
        ? total + expense.amount
        : total;
    }, 0);
  }, [expenses]);

  const cashExpenses = useMemo<number>(() => {
    return filteredExpenses
      .filter(
        (expense) =>
          expense.paymentMethod === "Cash"
      )
      .reduce(
        (total, expense) => total + expense.amount,
        0
      );
  }, [filteredExpenses]);

  const hasFilters =
    search.trim().length > 0 ||
    category !== "All" ||
    paymentMethod !== "All";

  const clearFilters = (): void => {
    setSearch("");
    setCategory("All");
    setPaymentMethod("All");
  };

  const handleSearch = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSearch(event.target.value);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060a10] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-red-500/[0.035] blur-3xl" />
        <div className="absolute -right-32 top-[35%] h-96 w-96 rounded-full bg-blue-500/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 md:px-8 md:py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
          className="mb-7"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/"
                className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] transition-all group-hover:border-white/20 group-hover:bg-white/[0.07]">
                  <ArrowLeft size={16} />
                </span>
                Dashboard
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/15 bg-red-500/10 text-red-400 shadow-lg shadow-red-950/20">
                  <Receipt size={21} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Expenses
                  </h1>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Track and manage all shop expenses.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/expenses/new"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-red-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-red-500/20 active:translate-y-0"
            >
              <Plus
                size={18}
                className="transition-transform duration-200 group-hover:rotate-90"
              />
              Add Expense
            </Link>
          </div>
        </motion.header>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              className="mb-5 overflow-hidden"
            >
              <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-4 rounded-lg p-1 text-red-300/60 transition hover:bg-red-500/10 hover:text-red-200"
                  aria-label="Close error"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            title="Total Expenses"
            value={formatMoney(totalExpenses)}
            icon={<IndianRupee size={19} />}
            delay={0}
          />

          <StatCard
            title="Today's Expenses"
            value={formatMoney(todayExpenses)}
            icon={<CalendarDays size={19} />}
            delay={0.05}
          />

          <StatCard
            title="Cash Expenses"
            value={formatMoney(cashExpenses)}
            icon={<Wallet size={19} />}
            delay={0.1}
          />

          <StatCard
            title="Expense Records"
            value={String(filteredExpenses.length)}
            icon={<Receipt size={19} />}
            delay={0.15}
          />
        </section>

        {/* Filters */}
        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.15,
          }}
          className="mb-6 rounded-3xl border border-white/[0.08] bg-[#0b1019]/95 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Filters
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                Find expenses quickly
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => void loadExpenses(true)}
                disabled={refreshing}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh expenses"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search category, note or payment..."
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#070c14] pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-700 hover:border-white/[0.13] focus:border-blue-500/50 focus:bg-[#080e17] focus:ring-4 focus:ring-blue-500/[0.08]"
              />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="h-12 rounded-2xl border border-white/[0.08] bg-[#070c14] px-4 text-sm font-medium text-slate-300 outline-none transition-all hover:border-white/[0.13] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/[0.08]"
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-[#070c14] text-white"
                >
                  {item === "All"
                    ? "All Categories"
                    : item}
                </option>
              ))}
            </select>

            {/* Payment */}
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              className="h-12 rounded-2xl border border-white/[0.08] bg-[#070c14] px-4 text-sm font-medium text-slate-300 outline-none transition-all hover:border-white/[0.13] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/[0.08]"
            >
              <option
                value="All"
                className="bg-[#070c14] text-white"
              >
                All Payments
              </option>

              <option
                value="Cash"
                className="bg-[#070c14] text-white"
              >
                Cash
              </option>

              <option
                value="UPI"
                className="bg-[#070c14] text-white"
              >
                UPI
              </option>

              <option
                value="Other"
                className="bg-[#070c14] text-white"
              >
                Other
              </option>
            </select>
          </div>

          {/* Filter result */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-400">
                {filteredExpenses.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-400">
                {expenses.length}
              </span>{" "}
              records
            </p>

            {hasFilters && (
              <span className="rounded-full border border-blue-400/10 bg-blue-500/[0.07] px-2.5 py-1 text-[11px] font-semibold text-blue-300">
                Filters active
              </span>
            )}
          </div>
        </motion.section>

        {/* Expense History */}
        <motion.section
          initial={{
            opacity: 0,
            y: 22,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.2,
          }}
          className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1019]/95 shadow-2xl shadow-black/25 backdrop-blur-xl"
        >
          {/* Section header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 md:px-6">
            <div>
              <h2 className="font-bold tracking-tight text-white">
                Expense History
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {filteredExpenses.length} records found
              </p>
            </div>

            <div className="hidden rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 sm:block">
              <span className="text-xs font-semibold text-slate-500">
                Total{" "}
              </span>

              <span className="text-sm font-bold text-red-400">
                {formatMoney(totalExpenses)}
              </span>
            </div>
          </div>

          {loading ? (
            <ExpenseSkeleton />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <div className="divide-y divide-white/[0.055]">
              {filteredExpenses.map(
                (expense, index) => (
                  <motion.div
                    key={expense.id}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(
                        index * 0.025,
                        0.25
                      ),
                      ease: "easeOut",
                    }}
                    whileHover={{
                      backgroundColor:
                        "rgba(255,255,255,0.018)",
                    }}
                    className="group px-5 py-5 transition-colors md:px-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left */}
                      <div className="flex min-w-0 items-center gap-4">
                        <motion.div
                          whileHover={{
                            scale: 1.05,
                            rotate: -2,
                          }}
                          transition={{
                            duration: 0.2,
                          }}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-400/10 bg-red-500/[0.08] text-red-400 transition-colors group-hover:border-red-400/20 group-hover:bg-red-500/[0.12]"
                        >
                          <Receipt size={19} />
                        </motion.div>

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate font-semibold text-white">
                              {expense.category}
                            </h3>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                            <span>
                              {formatDate(
                                expense.createdAt
                              )}
                            </span>

                            <span className="text-slate-700">
                              •
                            </span>

                            <span>
                              {formatTime(
                                expense.createdAt
                              )}
                            </span>

                            <span className="text-slate-700">
                              •
                            </span>

                            <span className="text-slate-500">
                              {expense.paymentMethod}
                            </span>
                          </div>

                          {expense.note && (
                            <p
                              title={expense.note}
                              className="mt-1.5 max-w-xl truncate text-xs text-slate-600"
                            >
                              {expense.note}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex items-center justify-between gap-5 pl-[60px] sm:justify-end sm:pl-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                            Expense
                          </p>

                          <p className="mt-0.5 text-lg font-bold tracking-tight text-red-400">
                            -{formatMoney(expense.amount)}
                          </p>
                        </div>

                        <div className="hidden h-10 w-px bg-white/[0.07] sm:block" />

                        <div className="text-left sm:text-right">
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                            Payment
                          </p>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStyles(
                              expense.paymentMethod
                            )}`}
                          >
                            {expense.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </motion.section>

        {/* Bottom spacing */}
        <div className="h-6" />
      </div>
    </main>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  delay: number;
};

function StatCard({
  title,
  value,
  icon,
  delay,
}: StatCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        y: -3,
      }}
      className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1019] p-4 shadow-xl shadow-black/15 transition-colors duration-200 hover:border-white/[0.14] hover:bg-[#0d131e] sm:p-5"
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/[0.045] blur-2xl transition-all duration-300 group-hover:bg-red-500/[0.08]" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-400/10 bg-red-500/[0.08] text-red-400">
            {icon}
          </div>

          <span className="h-1.5 w-1.5 rounded-full bg-red-400/60 shadow-lg shadow-red-400/30" />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {title}
        </p>

        <p className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

function ExpenseSkeleton() {
  return (
    <div className="divide-y divide-white/[0.055]">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: index * 0.04,
            }}
            className="px-5 py-5 md:px-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-white/[0.055]" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-28 animate-pulse rounded-lg bg-white/[0.065]" />

                <div className="mt-2 h-3 w-48 max-w-full animate-pulse rounded-lg bg-white/[0.035]" />
              </div>

              <div className="hidden sm:block">
                <div className="h-3 w-14 animate-pulse rounded bg-white/[0.035]" />

                <div className="mt-2 h-5 w-24 animate-pulse rounded-lg bg-white/[0.055]" />
              </div>

              <div className="hidden h-7 w-16 animate-pulse rounded-full bg-white/[0.045] sm:block" />
            </div>
          </motion.div>
        )
      )}
    </div>
  );
}

type EmptyStateProps = {
  hasFilters: boolean;
};

function EmptyState({
  hasFilters,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.35,
      }}
      className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center"
    >
      <motion.div
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.035] text-slate-600"
      >
        <Receipt size={27} />
      </motion.div>

      <h3 className="mt-5 font-bold text-white">
        {hasFilters
          ? "No matching expenses"
          : "No expenses yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {hasFilters
          ? "Try changing your search or filters to find another expense."
          : "Start recording your shop expenses to keep your accounts organized."}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
        >
          Clear and refresh
          <RefreshCw size={16} />
        </button>
      ) : (
        <Link
          href="/expenses/new"
          className="group mt-5 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
        >
          Add Expense
          <ArrowRight
            size={17}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </motion.div>
  );
}