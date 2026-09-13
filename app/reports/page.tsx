"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileBarChart,
  IndianRupee,
  RefreshCw,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

type Period = "today" | "week" | "month";

type Service = {
  id: string;
  name: string;
  category: string;
};

type Transaction = {
  id: string;
  transactionAmount: number;
  serviceCharge: number;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
  service: Service | null;
};

type Expense = {
  id: string;
  category: string;
  amount: number;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
};

type ReportData = {
  period: Period;
  summary: {
    revenue: number;
    expenses: number;
    profit: number;
    transactions: number;
  };
  paymentBreakdown: {
    Cash: number;
    UPI: number;
    Other: number;
  };
  topServices: {
    name: string;
    category: string;
    transactions: number;
    revenue: number;
  }[];
  transactions: Transaction[];
  expenses: Expense[];
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const periodLabels: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

const chartTooltipStyle = {
  backgroundColor: "#0b111b",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "14px",
  color: "#f8fafc",
  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] =
    useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchReports = useCallback(
    async (
      showRefreshLoader: boolean = false
    ): Promise<void> => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `/api/reports?period=${period}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Reports load thai shakya nathi."
          );
        }

        const result =
          (await response.json()) as ReportData;

        setData(result);
      } catch (err: unknown) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Reports load thai shakya nathi."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleRefresh = (): void => {
    void fetchReports(true);
  };

  const paymentChartData = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        name: "Cash",
        value: data.paymentBreakdown.Cash,
      },
      {
        name: "UPI",
        value: data.paymentBreakdown.UPI,
      },
      {
        name: "Other",
        value: data.paymentBreakdown.Other,
      },
    ].filter((item) => item.value > 0);
  }, [data]);

  const performanceData = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        name: "Revenue",
        amount: data.summary.revenue,
        fill: "#3b82f6",
      },
      {
        name: "Expenses",
        amount: data.summary.expenses,
        fill: "#f97316",
      },
      {
        name: "Profit",
        amount: data.summary.profit,
        fill: "#22c55e",
      },
    ];
  }, [data]);

  const topServicesData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.topServices.slice(0, 6).map((service) => ({
      name:
        service.name.length > 15
          ? `${service.name.slice(0, 15)}...`
          : service.name,
      revenue: service.revenue,
      transactions: service.transactions,
    }));
  }, [data]);

  const maxServiceRevenue = useMemo(() => {
    if (!data || data.topServices.length === 0) {
      return 0;
    }

    return Math.max(
      ...data.topServices.map(
        (service) => service.revenue
      )
    );
  }, [data]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060a10] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-blue-500/[0.035] blur-3xl" />
        <div className="absolute -right-40 top-[35%] h-[28rem] w-[28rem] rounded-full bg-orange-500/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <motion.header
          initial={{
            opacity: 0,
            y: -18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
          className="mb-7"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href="/"
                className="group mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-500 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                />
              </Link>

              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-500/[0.08] text-blue-400">
                    <FileBarChart size={20} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      Reports
                    </h1>

                    <p className="mt-0.5 text-sm text-slate-600">
                      Business performance & financial overview
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-2xl border border-white/[0.08] bg-[#0b1019] p-1 shadow-xl shadow-black/20">
                {(
                  ["today", "week", "month"] as Period[]
                ).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriod(item)}
                    className={`relative rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:text-sm ${
                      period === item
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                        : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {periodLabels[item]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="group flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0b1019] px-3.5 text-sm font-semibold text-slate-400 shadow-xl shadow-black/20 transition-all hover:border-white/[0.15] hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : "transition-transform duration-300 group-hover:rotate-45"
                  }
                />
                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm font-medium text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* SUMMARY */}
        <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
          <SummaryCard
            title="Revenue"
            value={
              data
                ? formatMoney(data.summary.revenue)
                : "₹0"
            }
            subtitle="Service charges earned"
            icon={<TrendingUp size={20} />}
            accent="blue"
            loading={loading}
            delay={0}
          />

          <SummaryCard
            title="Expenses"
            value={
              data
                ? formatMoney(data.summary.expenses)
                : "₹0"
            }
            subtitle="Total business expenses"
            icon={<ArrowDownRight size={20} />}
            accent="orange"
            loading={loading}
            delay={0.05}
          />

          <SummaryCard
            title="Net Profit"
            value={
              data
                ? formatMoney(data.summary.profit)
                : "₹0"
            }
            subtitle="Revenue − expenses"
            icon={<CircleDollarSign size={20} />}
            accent="green"
            loading={loading}
            delay={0.1}
          />

          <SummaryCard
            title="Transactions"
            value={
              data
                ? data.summary.transactions.toString()
                : "0"
            }
            subtitle={`${periodLabels[period]} transactions`}
            icon={<Receipt size={20} />}
            accent="purple"
            loading={loading}
            delay={0.15}
          />
        </section>

        {/* CHARTS */}
        <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Financial performance */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.16,
            }}
            className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1019]/95 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-6"
          >
            <SectionHeader
              title="Financial Performance"
              subtitle="Revenue vs expenses vs profit"
              icon={<BarChart3 size={19} />}
              iconClass="bg-blue-500/[0.08] text-blue-400 border-blue-400/10"
            />

            <div className="h-[300px] w-full">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={performanceData}
                    margin={{
                      top: 15,
                      right: 5,
                      left: -15,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#475569"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#64748b",
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      stroke="#475569"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                      tickFormatter={(value) =>
                        `₹${value}`
                      }
                    />

                    <Tooltip
                      cursor={{
                        fill: "rgba(255,255,255,0.025)",
                      }}
                      contentStyle={
                        chartTooltipStyle
                      }
                      formatter={(value) => [
                        formatMoney(Number(value)),
                        "Amount",
                      ]}
                    />

                    <Bar
                      dataKey="amount"
                      radius={[10, 10, 3, 3]}
                      animationDuration={800}
                    >
                      {performanceData.map(
                        (entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.fill}
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Payment revenue */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.21,
            }}
            className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1019]/95 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-6"
          >
            <SectionHeader
              title="Payment Revenue"
              subtitle="Revenue by payment method"
              icon={<Wallet size={19} />}
              iconClass="bg-orange-500/[0.08] text-orange-400 border-orange-400/10"
            />

            <div className="h-[300px] w-full">
              {loading ? (
                <ChartSkeleton />
              ) : paymentChartData.length === 0 ? (
                <EmptyChart text="No payment revenue yet" />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={104}
                      paddingAngle={5}
                      stroke="none"
                      animationDuration={800}
                    >
                      {paymentChartData.map(
                        (entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={
                              index === 0
                                ? "#3b82f6"
                                : index === 1
                                ? "#22c55e"
                                : "#f97316"
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      contentStyle={
                        chartTooltipStyle
                      }
                      formatter={(value) => [
                        formatMoney(Number(value)),
                        "Revenue",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {!loading &&
              paymentChartData.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                  {paymentChartData.map(
                    (item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            0.25 + index * 0.06,
                        }}
                        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 text-center transition hover:bg-white/[0.04]"
                      >
                        <div className="mb-1.5 flex items-center justify-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              index === 0
                                ? "bg-blue-500"
                                : index === 1
                                ? "bg-green-500"
                                : "bg-orange-500"
                            }`}
                          />

                          <span className="text-[11px] font-medium text-slate-500">
                            {item.name}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-white">
                          {formatMoney(item.value)}
                        </p>
                      </motion.div>
                    )
                  )}
                </div>
              )}
          </motion.div>
        </section>

        {/* TOP SERVICES */}
        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.25,
          }}
          className="mb-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1019]/95 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <SectionHeader
              title="Top Services"
              subtitle="Highest revenue generating services"
              icon={<Receipt size={19} />}
              iconClass="bg-purple-500/[0.08] text-purple-400 border-purple-400/10"
            />

            <Link
              href="/settings/services"
              className="group flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/[0.06] hover:text-blue-300 sm:text-sm"
            >
              Manage
              <ChevronRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-[62px] animate-pulse rounded-2xl bg-white/[0.035]"
                  />
                )
              )}
            </div>
          ) : data?.topServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] py-14 text-center">
              <Receipt
                size={30}
                className="mx-auto mb-3 text-slate-700"
              />

              <p className="text-sm text-slate-500">
                No service transactions yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {data?.topServices.map(
                (service, index) => {
                  const percentage =
                    maxServiceRevenue > 0
                      ? (service.revenue /
                          maxServiceRevenue) *
                        100
                      : 0;

                  return (
                    <motion.div
                      key={`${service.name}-${index}`}
                      initial={{
                        opacity: 0,
                        x: -8,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        delay:
                          0.28 + index * 0.05,
                      }}
                      className="group"
                    >
                      <div className="mb-2.5 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-500/[0.08] text-xs font-bold text-blue-400">
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {service.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-600">
                              {service.category}{" "}
                              •{" "}
                              {service.transactions}{" "}
                              transaction
                              {service.transactions !==
                              1
                                ? "s"
                                : ""}
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-white">
                          {formatMoney(
                            service.revenue
                          )}
                        </p>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${percentage}%`,
                          }}
                          transition={{
                            duration: 0.8,
                            delay:
                              0.35 +
                              index * 0.06,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"
                        />
                      </div>
                    </motion.div>
                  );
                }
              )}
            </div>
          )}
        </motion.section>

        {/* RECENT LISTS */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ReportList
            title="Recent Transactions"
            subtitle="Latest transactions in selected period"
            icon={<ArrowUpRight size={19} />}
            iconClass="bg-green-500/[0.08] text-green-400 border-green-400/10"
            loading={loading}
            emptyText="No transactions found."
          >
            {data?.transactions
              .slice(0, 8)
              .map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{
                    opacity: 0,
                    y: 7,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.035,
                  }}
                  className="group flex items-center justify-between gap-3 border-b border-white/[0.055] py-3.5 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/[0.07] text-green-400">
                      <ArrowUpRight size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {transaction.service?.name ??
                          "Unknown Service"}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-slate-600">
                        {formatDate(
                          transaction.createdAt
                        )}{" "}
                        •{" "}
                        {formatTime(
                          transaction.createdAt
                        )}{" "}
                        •{" "}
                        {transaction.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-green-400">
                      +
                      {formatMoney(
                        transaction.serviceCharge
                      )}
                    </p>

                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-700">
                      Revenue
                    </p>
                  </div>
                </motion.div>
              ))}
          </ReportList>

          <ReportList
            title="Recent Expenses"
            subtitle="Latest expenses in selected period"
            icon={<ArrowDownRight size={19} />}
            iconClass="bg-orange-500/[0.08] text-orange-400 border-orange-400/10"
            loading={loading}
            emptyText="No expenses found."
          >
            {data?.expenses
              .slice(0, 8)
              .map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{
                    opacity: 0,
                    y: 7,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.035,
                  }}
                  className="group flex items-center justify-between gap-3 border-b border-white/[0.055] py-3.5 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/[0.07] text-orange-400">
                      <ArrowDownRight size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {expense.category}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-slate-600">
                        {formatDate(
                          expense.createdAt
                        )}{" "}
                        •{" "}
                        {formatTime(
                          expense.createdAt
                        )}{" "}
                        • {expense.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-orange-400">
                      -
                      {formatMoney(
                        expense.amount
                      )}
                    </p>

                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-700">
                      Expense
                    </p>
                  </div>
                </motion.div>
              ))}
          </ReportList>
        </section>

        {/* FOOTER */}
        <div className="mt-7 flex items-center justify-center gap-2 pb-3 text-center text-xs text-slate-700">
          <CalendarDays size={13} />
          Report period:{" "}
          <span className="text-slate-500">
            {periodLabels[period]}
          </span>
        </div>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: "blue" | "orange" | "green" | "purple";
  loading: boolean;
  delay: number;
};

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  loading,
  delay,
}: SummaryCardProps) {
  const styles = {
    blue: {
      icon: "border-blue-400/10 bg-blue-500/[0.08] text-blue-400",
      hover: "hover:border-blue-500/20",
      dot: "bg-blue-400",
    },
    orange: {
      icon: "border-orange-400/10 bg-orange-500/[0.08] text-orange-400",
      hover: "hover:border-orange-500/20",
      dot: "bg-orange-400",
    },
    green: {
      icon: "border-green-400/10 bg-green-500/[0.08] text-green-400",
      hover: "hover:border-green-500/20",
      dot: "bg-green-400",
    },
    purple: {
      icon: "border-purple-400/10 bg-purple-500/[0.08] text-purple-400",
      hover: "hover:border-purple-500/20",
      dot: "bg-purple-400",
    },
  };

  const current = styles[accent];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
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
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1019] p-4 shadow-xl shadow-black/15 transition-all duration-200 sm:p-5 ${current.hover}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.02] blur-2xl transition group-hover:bg-white/[0.04]" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded-lg bg-white/[0.06]" />
          ) : (
            <p className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {value}
            </p>
          )}

          <p className="mt-2 text-[11px] text-slate-600">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${current.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
        />

        <span className="text-[10px] font-medium text-slate-700">
          {periodLabels[
            accent === "purple"
              ? "today"
              : "today"
          ]}
        </span>
      </div>
    </motion.div>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
};

function SectionHeader({
  title,
  subtitle,
  icon,
  iconClass,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
      >
        {icon}
      </div>

      <div>
        <h2 className="font-semibold tracking-tight text-white">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-600">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

type ReportListProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
  loading: boolean;
  emptyText: string;
  children: React.ReactNode;
};

function ReportList({
  title,
  subtitle,
  icon,
  iconClass,
  loading,
  emptyText,
  children,
}: ReportListProps) {
  const childArray = Array.isArray(children)
    ? children
    : children
    ? [children]
    : [];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay: 0.3,
      }}
      className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1019]/95 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-6"
    >
      <div className="mb-3">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          iconClass={iconClass}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-[62px] animate-pulse rounded-2xl bg-white/[0.035]"
              />
            )
          )}
        </div>
      ) : childArray.length === 0 ? (
        <div className="py-12 text-center">
          <Receipt
            size={28}
            className="mx-auto mb-3 text-slate-700"
          />

          <p className="text-sm text-slate-600">
            {emptyText}
          </p>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </motion.div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-end gap-3 px-5 pb-8 pt-8">
      {[45, 62, 38, 76, 55, 68, 48].map(
        (height, index) => (
          <motion.div
            key={index}
            initial={{
              height: 0,
            }}
            animate={{
              height: `${height}%`,
            }}
            transition={{
              duration: 0.5,
              delay: index * 0.05,
            }}
            className="flex-1 rounded-t-xl bg-white/[0.045]"
          />
        )
      )}
    </div>
  );
}

function EmptyChart({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
        <BarChart3
          size={27}
          className="text-slate-700"
        />
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {text}
      </p>
    </div>
  );
}