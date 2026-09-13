"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  IndianRupee,
  Plus,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  category: string;
  charge: number;
  active: boolean;
};

type Transaction = {
  id: string;
  serviceId: string | null;
  transactionAmount: number;
  serviceCharge: number;
  paymentMethod: "Cash" | "UPI" | "Other";
  note: string | null;
  createdAt: string;
  service: Service | null;
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    []
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [paymentMethod, setPaymentMethod] =
    useState<string>("All");

  useEffect(() => {
    const loadTransactions = async (): Promise<void> => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/transactions", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "Transactions load thai shakya nathi."
          );
        }

        const data: Transaction[] = await response.json();

        setTransactions(data);
      } catch (err) {
        console.error(err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Transactions load thai shakya nathi.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadTransactions();
  }, []);

  const categories = useMemo<string[]>(() => {
    const values = transactions
      .map((transaction) => transaction.service?.category)
      .filter((value): value is string => Boolean(value));

    return ["All", ...Array.from(new Set(values))];
  }, [transactions]);

  const filteredTransactions = useMemo<Transaction[]>(() => {
    const searchValue = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const serviceName =
        transaction.service?.name?.toLowerCase() ?? "";

      const note = transaction.note?.toLowerCase() ?? "";

      const matchesSearch =
        searchValue.length === 0 ||
        serviceName.includes(searchValue) ||
        note.includes(searchValue) ||
        transaction.paymentMethod
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        category === "All" ||
        transaction.service?.category === category;

      const matchesPayment =
        paymentMethod === "All" ||
        transaction.paymentMethod === paymentMethod;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPayment
      );
    });
  }, [transactions, search, category, paymentMethod]);

  const totalRevenue = useMemo<number>(() => {
    return filteredTransactions.reduce(
      (total, transaction) =>
        total + transaction.serviceCharge,
      0
    );
  }, [filteredTransactions]);

  const totalTransactionAmount = useMemo<number>(() => {
    return filteredTransactions.reduce(
      (total, transaction) =>
        total + transaction.transactionAmount,
      0
    );
  }, [filteredTransactions]);

  const todayRevenue = useMemo<number>(() => {
    const today = new Date();

    return transactions.reduce((total, transaction) => {
      const transactionDate = new Date(transaction.createdAt);

      const isToday =
        transactionDate.getDate() === today.getDate() &&
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() ===
          today.getFullYear();

      return isToday
        ? total + transaction.serviceCharge
        : total;
    }, 0);
  }, [transactions]);

  const handleSearch = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSearch(event.target.value);
  };

  return (
    <main className="min-h-screen bg-[#070b12] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Dashboard
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Transactions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and review all CSC transactions.
            </p>
          </div>

          <Link
            href="/transactions/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <Plus size={18} />
            New Transaction
          </Link>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Transactions"
            value={String(filteredTransactions.length)}
            icon={<ReceiptText size={20} />}
            delay={0}
          />

          <StatCard
            title="Shop Revenue"
            value={formatMoney(totalRevenue)}
            icon={<IndianRupee size={20} />}
            delay={0.05}
          />

          <StatCard
            title="Transaction Volume"
            value={formatMoney(totalTransactionAmount)}
            icon={<Wallet size={20} />}
            delay={0.1}
          />

          <StatCard
            title="Today's Revenue"
            value={formatMoney(todayRevenue)}
            icon={<CalendarDays size={20} />}
            delay={0.15}
          />
        </div>

        {/* Filters */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 rounded-3xl border border-white/10 bg-[#0c111b] p-4 shadow-2xl shadow-black/10 md:p-5"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search service, note or payment..."
                className="w-full rounded-2xl border border-white/10 bg-[#080d16] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-[#080d16] px-4 py-3.5 text-sm font-medium text-slate-300 outline-none transition focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-[#080d16] text-white"
                >
                  {item === "All"
                    ? "All Categories"
                    : item}
                </option>
              ))}
            </select>

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-[#080d16] px-4 py-3.5 text-sm font-medium text-slate-300 outline-none transition focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
            >
              <option
                value="All"
                className="bg-[#080d16] text-white"
              >
                All Payments
              </option>

              <option
                value="Cash"
                className="bg-[#080d16] text-white"
              >
                Cash
              </option>

              <option
                value="UPI"
                className="bg-[#080d16] text-white"
              >
                UPI
              </option>

              <option
                value="Other"
                className="bg-[#080d16] text-white"
              >
                Other
              </option>
            </select>
          </div>
        </motion.section>

        {/* Transactions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c111b] shadow-2xl shadow-black/20"
        >
          <div className="border-b border-white/10 px-5 py-5 md:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">
                  Transaction History
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredTransactions.length} records found
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <TransactionSkeleton />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredTransactions.map(
                (transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(index * 0.03, 0.3),
                    }}
                    className="px-5 py-5 transition hover:bg-white/[0.02] md:px-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Service */}
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-500/10 text-blue-400">
                          <ReceiptText size={20} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-white">
                            {transaction.service?.name ??
                              "Service Deleted"}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>
                              {transaction.service
                                ?.category ?? "Other"}
                            </span>

                            <span>•</span>

                            <span>
                              {formatDate(
                                transaction.createdAt
                              )}
                            </span>

                            <span>•</span>

                            <span>
                              {formatTime(
                                transaction.createdAt
                              )}
                            </span>
                          </div>

                          {transaction.note && (
                            <p className="mt-1 max-w-xl truncate text-xs text-slate-500">
                              {transaction.note}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:min-w-[520px]">
                        <div>
                          <p className="text-xs text-slate-500">
                            Transaction
                          </p>

                          <p className="mt-1 font-semibold text-slate-300">
                            {formatMoney(
                              transaction.transactionAmount
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Shop Revenue
                          </p>

                          <p className="mt-1 font-bold text-emerald-400">
                            +
                            {formatMoney(
                              transaction.serviceCharge
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Payment
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              transaction.paymentMethod ===
                              "Cash"
                                ? "border-emerald-400/10 bg-emerald-500/10 text-emerald-300"
                                : transaction.paymentMethod ===
                                  "UPI"
                                ? "border-blue-400/10 bg-blue-500/10 text-blue-300"
                                : "border-orange-400/10 bg-orange-500/10 text-orange-300"
                            }`}
                          >
                            {transaction.paymentMethod}
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-3xl border border-white/10 bg-[#0c111b] p-5 shadow-2xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0f1520]"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <p className="text-xs font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold text-white">
        {value}
      </p>
    </motion.div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="divide-y divide-white/[0.06]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse px-5 py-5 md:px-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-white/[0.06]" />

            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-white/[0.07]" />
              <div className="mt-2 h-3 w-56 rounded bg-white/[0.04]" />
            </div>

            <div className="hidden gap-8 md:flex">
              <div className="h-8 w-20 rounded bg-white/[0.04]" />
              <div className="h-8 w-20 rounded bg-white/[0.04]" />
              <div className="h-8 w-20 rounded bg-white/[0.04]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] text-slate-500">
        <ReceiptText size={28} />
      </div>

      <h3 className="mt-5 font-bold text-white">
        No transactions found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Start recording your CSC service transactions.
      </p>

      <Link
        href="/transactions/new"
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
      >
        Create Transaction
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}