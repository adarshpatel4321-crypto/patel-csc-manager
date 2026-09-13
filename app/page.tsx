"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Menu,
  Plus,
  Receipt,
  RefreshCw,
  Settings,
  Wallet,
  X,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  category: string;
  charge: number;
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

type DashboardData = {
  today: {
    revenue: number;
    expenses: number;
    profit: number;
    transactions: number;
  };
  recentTransactions: Transaction[];
  recentExpenses: Expense[];
};

type Motivation = {
  quote: string;
  message: string;
};

const dailyMotivations: Motivation[] = [
  {
    quote: "Small steps every day create big results.",
    message:
      "Keep building. Keep improving. Keep moving forward.",
  },
  {
    quote:
      "Consistency beats intensity when building a business.",
    message:
      "Show up every day and let your progress compound.",
  },
  {
    quote:
      "Your shop may start small, but your vision should never be small.",
    message:
      "Think bigger, work smarter, and stay patient.",
  },
  {
    quote:
      "Every customer is an opportunity to build trust.",
    message:
      "Serve people well and success will follow.",
  },
  {
    quote:
      "Don't wait for the perfect time. Start with what you have.",
    message:
      "Progress comes from action, not perfection.",
  },
  {
    quote:
      "Today's hard work becomes tomorrow's freedom.",
    message:
      "Keep working toward the life you want.",
  },
  {
    quote:
      "A successful business is built one good decision at a time.",
    message:
      "Stay focused and make today's decision count.",
  },
  {
    quote: "Learn. Improve. Repeat.",
    message:
      "Every day is a chance to make your business better.",
  },
  {
    quote:
      "Your competition can copy your service, but not your discipline.",
    message:
      "Build habits that make you difficult to beat.",
  },
  {
    quote:
      "Don't measure your beginning against someone else's success.",
    message:
      "Build your own journey at your own pace.",
  },
  {
    quote:
      "Hard work gets you started. Discipline keeps you going.",
    message:
      "Stay consistent even when results are slow.",
  },
  {
    quote:
      "Trust takes time to build and seconds to lose.",
    message:
      "Protect your reputation with every customer.",
  },
  {
    quote:
      "Every problem in business is a chance to improve the system.",
    message:
      "Fix the process instead of repeating the problem.",
  },
  {
    quote:
      "Revenue is important, but reputation is priceless.",
    message:
      "Build a business people are happy to recommend.",
  },
  {
    quote:
      "Dream big, start small, and move every day.",
    message:
      "Big businesses are built from small consistent actions.",
  },
  {
    quote:
      "Don't chase customers. Create reasons for them to return.",
    message:
      "Great service turns first-time customers into regulars.",
  },
  {
    quote:
      "Your future business depends on what you do today.",
    message:
      "Make today's work count.",
  },
  {
    quote: "Focus on progress, not perfection.",
    message:
      "Improve one thing every single day.",
  },
  {
    quote:
      "The best investment is becoming better at what you do.",
    message:
      "Keep learning and keep upgrading your skills.",
  },
  {
    quote: "Slow growth is still growth.",
    message:
      "Stay patient. Strong foundations take time.",
  },
  {
    quote:
      "A busy day is not always a productive day.",
    message:
      "Focus on work that actually moves the business forward.",
  },
  {
    quote: "Build systems, not just hustle.",
    message:
      "Smart systems make business easier to manage.",
  },
  {
    quote:
      "Customer satisfaction is the best marketing.",
    message:
      "Serve well and let your customers speak for you.",
  },
  {
    quote:
      "Every rupee earned is a result of value created.",
    message:
      "Focus on creating more value for people.",
  },
  {
    quote:
      "Success comes from doing ordinary things extraordinarily well.",
    message:
      "Take care of the small details.",
  },
  {
    quote:
      "Don't fear slow days. Use them to prepare for busy days.",
    message:
      "Improve your systems, skills, and services.",
  },
  {
    quote:
      "Your mindset is part of your business strategy.",
    message:
      "Stay calm, focused, and solution-oriented.",
  },
  {
    quote:
      "One loyal customer can become ten through trust.",
    message:
      "Treat every customer relationship seriously.",
  },
  {
    quote:
      "Business grows when value grows.",
    message:
      "Keep finding better ways to help your customers.",
  },
  {
    quote:
      "Discipline is doing the work even when motivation disappears.",
    message:
      "Keep showing up.",
  },
  {
    quote:
      "Don't quit because it's slow. Adjust your strategy.",
    message:
      "Keep moving forward and learn from every day.",
  },
  {
    quote:
      "The goal is not just to make money. Build something valuable.",
    message:
      "Create a business you can be proud of.",
  },
  {
    quote:
      "Every day is a fresh chance to grow your business.",
    message:
      "Make today better than yesterday.",
  },
  {
    quote:
      "Success is built quietly before it becomes visible.",
    message:
      "Keep working even when nobody is watching.",
  },
  {
    quote:
      "Stay humble when business is good and stay strong when it is slow.",
    message:
      "Consistency matters in every season.",
  },
  {
    quote:
      "Your next level requires your next level of discipline.",
    message:
      "Upgrade your habits as you upgrade your business.",
  },
  {
    quote:
      "Keep your vision big and your daily actions simple.",
    message:
      "One focused day at a time.",
  },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Wallet,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Reminders",
    href: "/reminders",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const quickActions = [
  {
    title: "New Transaction",
    description: "Record a CSC service",
    href: "/transactions/new",
    icon: Plus,
  },
  {
    title: "Add Expense",
    description: "Record shop expense",
    href: "/expenses/new",
    icon: ArrowDownRight,
  },
  {
    title: "Services",
    description: "Manage service charges",
    href: "/settings/services",
    icon: Settings,
  },
  {
    title: "Reminders",
    description: "Manage daily reminders",
    href: "/reminders",
    icon: Bell,
  },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  valueClassName = "text-white",
  iconClassName = "text-orange-400",
  delay,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof IndianRupee;
  valueClassName?: string;
  iconClassName?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -4,
        transition: {
          duration: 0.2,
        },
      }}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0c111b] p-5 shadow-xl shadow-black/20 transition-colors duration-300 hover:border-slate-700"
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl transition-opacity duration-300 group-hover:bg-blue-500/10" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <h2
            className={`mt-2 truncate text-2xl font-bold tracking-tight ${valueClassName}`}
          >
            {value}
          </h2>

          <p className="mt-2 text-xs font-medium text-slate-500">
            {subtitle}
          </p>
        </div>

        <motion.div
          whileHover={{
            scale: 1.08,
            rotate: 2,
          }}
          className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 p-3"
        >
          <Icon
            className={`h-5 w-5 ${iconClassName}`}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c111b] p-5">
      <div className="flex animate-pulse justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-slate-800" />
          <div className="h-7 w-32 rounded bg-slate-800" />
          <div className="h-3 w-20 rounded bg-slate-800" />
        </div>

        <div className="h-11 w-11 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-5 py-4">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800" />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-32 rounded bg-slate-800" />
        <div className="h-2 w-24 rounded bg-slate-800" />
      </div>

      <div className="h-4 w-16 rounded bg-slate-800" />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      }

      try {
        setError("");

        const response = await fetch(
          "/api/dashboard",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load dashboard"
          );
        }

        const result =
          (await response.json()) as DashboardData;

        setData(result);
      } catch (err) {
        console.error(err);
        setError(
          "Dashboard data load thai nathi."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = async () => {
    await loadDashboard(true);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 17) {
      return "Good Afternoon";
    }

    return "Good Evening";
  }, []);

  const todayMotivation = useMemo(() => {
    const now = new Date();

    const startOfYear = new Date(
      now.getFullYear(),
      0,
      1
    );

    const dayOfYear = Math.floor(
      (now.getTime() -
        startOfYear.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return dailyMotivations[
      dayOfYear % dailyMotivations.length
    ];
  }, []);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-800 bg-[#070b12] transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
            <Link
              href="/"
              onClick={() =>
                setSidebarOpen(false)
              }
              className="group flex items-center gap-3"
            >
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-lg font-black text-white shadow-lg shadow-blue-900/30">
                <span className="relative z-10">
                  PF
                </span>

                <div className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-orange-400/30 blur-md" />
              </div>

              <div>
                <p className="text-sm font-bold tracking-wide text-white">
                  PATEL FINANCE
                </p>

                <p className="text-xs font-bold tracking-wide text-orange-400">
                  & CSC CENTER
                </p>
              </div>
            </Link>

            <button
              type="button"
              aria-label="Close navigation"
              onClick={() =>
                setSidebarOpen(false)
              }
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-blue-600"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  <Icon
                    className={`relative z-10 h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                      active
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  />

                  <span className="relative z-10">
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight className="relative z-10 ml-auto h-4 w-4 text-blue-200" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Bottom */}
          <div className="border-t border-slate-800 p-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0c111b] p-4">
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5 text-orange-400" />

                  <span className="text-sm font-bold text-white">
                    Shop Manager
                  </span>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Manage CSC transactions,
                  expenses and daily shop
                  performance.
                </p>
              </div>

              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-600/10 blur-2xl"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#070b12]/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                aria-label="Open navigation"
                onClick={() =>
                  setSidebarOpen(true)
                }
                whileTap={{ scale: 0.94 }}
                className="rounded-xl border border-slate-800 bg-[#0c111b] p-2.5 text-slate-300 shadow-sm transition hover:border-slate-700 hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </motion.button>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  {greeting}
                </p>

                <h1 className="text-lg font-bold text-white sm:text-xl">
                  Dashboard
                </h1>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              whileTap={{
                scale: refreshing ? 1 : 0.96,
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0c111b] px-3 py-2.5 text-sm font-semibold text-slate-300 shadow-sm transition-all hover:border-slate-700 hover:text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              <span className="hidden sm:block">
                Refresh
              </span>
            </motion.button>
          </div>
        </header>

        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          {/* Daily Motivation */}
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
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c111b] via-[#0b101a] to-blue-950/40 p-6 shadow-2xl shadow-black/20 sm:p-8"
          >
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    scale: [1, 1.06, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10"
                >
                  <CircleDollarSign className="h-5 w-5 text-orange-400" />
                </motion.div>

                <p className="text-sm font-semibold tracking-wide text-orange-400">
                  DAILY MOTIVATION
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={todayMotivation.quote}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.45,
                  }}
                >
                  <h2 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                    “{todayMotivation.quote}”
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                    {todayMotivation.message}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />

                PATEL FINANCE & CSC CENTER
              </div>
            </div>

            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.2, 0.35, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
            />
          </motion.section>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  y: -10,
                }}
                className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
              >
                <span>{error}</span>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="shrink-0 font-bold text-red-200 underline transition hover:text-white"
                >
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Performance */}
          <section>
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
              }}
              className="mb-4"
            >
              <h3 className="text-lg font-bold text-white">
                Today&apos;s Performance
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Live data from your shop database
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                <>
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Today's Revenue"
                    value={formatMoney(
                      data?.today.revenue ?? 0
                    )}
                    subtitle="Service charges earned"
                    icon={IndianRupee}
                    iconClassName="text-emerald-400"
                    delay={0.05}
                  />

                  <StatCard
                    title="Today's Expenses"
                    value={formatMoney(
                      data?.today.expenses ?? 0
                    )}
                    subtitle="Shop expenses today"
                    icon={ArrowDownRight}
                    iconClassName="text-red-400"
                    delay={0.1}
                  />

                  <StatCard
                    title="Today's Profit"
                    value={formatMoney(
                      data?.today.profit ?? 0
                    )}
                    subtitle="Revenue − Expenses"
                    icon={ArrowUpRight}
                    valueClassName={
                      (data?.today.profit ?? 0) >=
                      0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                    iconClassName={
                      (data?.today.profit ?? 0) >=
                      0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                    delay={0.15}
                  />

                  <StatCard
                    title="Transactions"
                    value={String(
                      data?.today.transactions ?? 0
                    )}
                    subtitle="Transactions today"
                    icon={CreditCard}
                    delay={0.2}
                  />
                </>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">
                Quick Actions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Frequently used shop actions
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map(
                (action, index) => {
                  const Icon = action.icon;

                  return (
                    <motion.div
                      key={action.title}
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.4,
                        delay:
                          0.1 + index * 0.05,
                      }}
                      whileHover={{
                        y: -4,
                      }}
                    >
                      <Link
                        href={action.href}
                        className="group flex h-full items-center gap-4 rounded-2xl border border-slate-800 bg-[#0c111b] p-5 shadow-xl shadow-black/10 transition-all duration-300 hover:border-slate-700 hover:bg-[#0e1420] hover:shadow-2xl"
                      >
                        <motion.div
                          whileTap={{
                            scale: 0.94,
                          }}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-orange-400 transition-all duration-300 group-hover:border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white"
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white">
                            {action.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {action.description}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-300" />
                      </Link>
                    </motion.div>
                  );
                }
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="grid gap-6 xl:grid-cols-2">
            {/* Transactions */}
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
                duration: 0.45,
                delay: 0.15,
              }}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0c111b] shadow-xl shadow-black/10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                  <h3 className="font-bold text-white">
                    Recent Transactions
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest CSC activity
                  </p>
                </div>

                <Link
                  href="/transactions"
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-orange-400"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="divide-y divide-slate-800">
                {loading ? (
                  Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <ActivitySkeleton
                      key={index}
                    />
                  ))
                ) : data?.recentTransactions
                    .length ? (
                  data.recentTransactions.map(
                    (transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-800/40"
                      >
                        <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                          <FileText className="h-4 w-4 text-blue-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">
                            {transaction.service
                              ?.name ??
                              "Unknown Service"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {formatDate(
                              transaction.createdAt
                            )}{" "}
                            ·{" "}
                            {
                              transaction.paymentMethod
                            }
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-emerald-400">
                            +
                            {formatMoney(
                              transaction.serviceCharge
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-600">
                            Revenue
                          </p>
                        </div>
                      </motion.div>
                    )
                  )
                ) : (
                  <div className="px-5 py-12 text-center">
                    <Receipt className="mx-auto h-8 w-8 text-slate-700" />

                    <p className="mt-3 text-sm font-semibold text-slate-400">
                      No transactions yet
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Create your first transaction.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Expenses */}
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
                duration: 0.45,
                delay: 0.2,
              }}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0c111b] shadow-xl shadow-black/10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                  <h3 className="font-bold text-white">
                    Recent Expenses
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest shop expenses
                  </p>
                </div>

                <Link
                  href="/expenses"
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-orange-400"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="divide-y divide-slate-800">
                {loading ? (
                  Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <ActivitySkeleton
                      key={index}
                    />
                  ))
                ) : data?.recentExpenses.length ? (
                  data.recentExpenses.map(
                    (expense) => (
                      <motion.div
                        key={expense.id}
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-800/40"
                      >
                        <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                          <ArrowDownRight className="h-4 w-4 text-red-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">
                            {expense.category}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {formatDate(
                              expense.createdAt
                            )}{" "}
                            ·{" "}
                            {expense.paymentMethod}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-red-400">
                            -
                            {formatMoney(
                              expense.amount
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-600">
                            Expense
                          </p>
                        </div>
                      </motion.div>
                    )
                  )
                ) : (
                  <div className="px-5 py-12 text-center">
                    <Wallet className="mx-auto h-8 w-8 text-slate-700" />

                    <p className="mt-3 text-sm font-semibold text-slate-400">
                      No expenses yet
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Add your first shop expense.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
}