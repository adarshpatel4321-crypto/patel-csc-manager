"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  Save,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PaymentMethods = {
  cash: boolean;
  upi: boolean;
  other: boolean;
};

type PaymentOption = {
  key: keyof PaymentMethods;
  title: string;
  description: string;
  icon: typeof Banknote;
  accent: string;
  badge: string;
};

const paymentOptions: PaymentOption[] = [
  {
    key: "cash",
    title: "Cash",
    description: "Accept and record cash payments at the counter.",
    icon: Banknote,
    accent: "emerald",
    badge: "Physical",
  },
  {
    key: "upi",
    title: "UPI",
    description: "Accept digital payments through UPI.",
    icon: Smartphone,
    accent: "blue",
    badge: "Digital",
  },
  {
    key: "other",
    title: "Other",
    description: "Use this for any other payment method.",
    icon: CreditCard,
    accent: "orange",
    badge: "Flexible",
  },
];

const defaultMethods: PaymentMethods = {
  cash: true,
  upi: true,
  other: true,
};

const pageVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut" as const,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.12 + index * 0.07,
      duration: 0.42,
      ease: "easeOut" as const,
    },
  }),
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] =
    useState<PaymentMethods>(defaultMethods);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const enabledCount = useMemo(
    () =>
      Object.values(methods).filter(Boolean).length,
    [methods]
  );

  const allEnabled = enabledCount === 3;
  const onlyOneEnabled = enabledCount === 1;

  useEffect(() => {
    let mounted = true;

    const loadMethods = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/settings/payment-methods",
          {
            cache: "no-store",
          }
        );

        const data = (await response.json()) as
          | PaymentMethods
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "Failed to load payment methods"
          );
        }

        if (
          mounted &&
          "cash" in data &&
          "upi" in data &&
          "other" in data
        ) {
          setMethods({
            cash: Boolean(data.cash),
            upi: Boolean(data.upi),
            other: Boolean(data.other),
          });
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            "Payment methods load થઈ શક્યા નથી."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMethods();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleMethod = (
    key: keyof PaymentMethods
  ) => {
    setMethods((current) => {
      const enabledCount = Object.values(current).filter(
        Boolean
      ).length;

      if (current[key] && enabledCount === 1) {
        setError(
          "At least one payment method must remain enabled."
        );

        setSuccess("");

        return current;
      }

      return {
        ...current,
        [key]: !current[key],
      };
    });

    setSuccess("");
    setError("");
  };

  const handleSave = async () => {
    if (saving) return;

    if (enabledCount === 0) {
      setError(
        "At least one payment method must remain enabled."
      );
      return;
    }

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const response = await fetch(
        "/api/settings/payment-methods",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(methods),
        }
      );

      const data = (await response.json()) as {
        success?: boolean;
        paymentMethods?: PaymentMethods;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save payment methods"
        );
      }

      if (data.paymentMethods) {
        setMethods(data.paymentMethods);
      }

      setSuccess(
        "Payment methods successfully saved."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Payment methods save થઈ શક્યા નથી."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b14] text-white">
        <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />

            <div className="mt-8 flex gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/[0.06]" />

              <div className="flex-1">
                <div className="h-3 w-32 rounded bg-white/[0.06]" />
                <div className="mt-3 h-9 w-64 rounded-xl bg-white/[0.06]" />
                <div className="mt-3 h-4 w-full max-w-xl rounded bg-white/[0.04]" />
              </div>
            </div>

            <div className="mt-8 h-24 rounded-2xl bg-white/[0.05]" />

            <div className="mt-5 space-y-4">
              <div className="h-32 rounded-2xl bg-white/[0.05]" />
              <div className="h-32 rounded-2xl bg-white/[0.05]" />
              <div className="h-32 rounded-2xl bg-white/[0.05]" />
            </div>

            <div className="mt-5 h-24 rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white selection:bg-blue-500/30">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 25, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-600/[0.09] blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-orange-500/[0.08] blur-3xl"
        />

        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-500/[0.03] to-transparent" />
      </div>

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/settings"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2 text-sm font-medium text-slate-300 shadow-sm transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/[0.08] hover:text-white"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Settings
          </Link>

          <div className="mt-7 flex items-start gap-4">
            <motion.div
              whileHover={{
                scale: 1.04,
                rotate: 2,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 20,
              }}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 to-blue-500/[0.04] text-blue-400 shadow-lg shadow-blue-950/20"
            >
              <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl" />
              <WalletCards
                size={26}
                className="relative"
              />
            </motion.div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Payment Settings
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/15 bg-blue-500/[0.07] px-2 py-0.5 text-[10px] font-medium text-blue-300">
                  <Sparkles size={10} />
                  Shop-wide
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Payment Methods
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Choose which payment methods are available
                throughout your shop manager.
              </p>
            </div>
          </div>
        </header>

        {/* Summary */}
        <motion.section
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
            duration: 0.4,
          }}
          className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-5"
        >
          <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-blue-500/[0.06] blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-blue-400">
                <CreditCard size={19} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Active methods
                </p>

                <p className="mt-0.5 text-xl font-bold text-white">
                  {enabledCount}
                  <span className="ml-1 text-sm font-normal text-slate-500">
                    / 3 enabled
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  enabledCount > 0
                    ? "bg-emerald-400 shadow-lg shadow-emerald-400/40"
                    : "bg-red-400"
                }`}
              />

              <span
                className={`text-xs font-medium ${
                  enabledCount > 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {allEnabled
                  ? "All methods active"
                  : onlyOneEnabled
                    ? "One method active"
                    : "Partially active"}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(enabledCount / 3) * 100}%`,
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut" as const,
              }}
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
            />
          </div>
        </motion.section>

        {/* Payment Cards */}
        <section className="space-y-4">
          {paymentOptions.map((option, index) => {
            const Icon = option.icon;
            const enabled = methods[option.key];

            const accentClasses = {
              emerald: enabled
                ? "border-emerald-500/20 bg-emerald-500/[0.035] text-emerald-400"
                : "border-white/10 bg-white/[0.025] text-slate-500",
              blue: enabled
                ? "border-blue-500/25 bg-blue-500/[0.045] text-blue-400"
                : "border-white/10 bg-white/[0.025] text-slate-500",
              orange: enabled
                ? "border-orange-500/20 bg-orange-500/[0.035] text-orange-400"
                : "border-white/10 bg-white/[0.025] text-slate-500",
            };

            const iconClasses = {
              emerald: enabled
                ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-400"
                : "border-white/10 bg-white/[0.04] text-slate-500",
              blue: enabled
                ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                : "border-white/10 bg-white/[0.04] text-slate-500",
              orange: enabled
                ? "border-orange-500/15 bg-orange-500/10 text-orange-400"
                : "border-white/10 bg-white/[0.04] text-slate-500",
            };

            return (
              <motion.div
                key={option.key}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{
                  y: -2,
                  transition: {
                    duration: 0.2,
                  },
                }}
                className={`group relative overflow-hidden rounded-2xl border p-5 shadow-lg shadow-black/[0.08] backdrop-blur-xl transition-all duration-300 sm:p-6 ${accentClasses[option.accent as keyof typeof accentClasses]}`}
              >
                <div
                  className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition-opacity duration-500 ${
                    enabled
                      ? option.accent === "orange"
                        ? "bg-orange-500/10 opacity-100"
                        : option.accent === "emerald"
                          ? "bg-emerald-500/10 opacity-100"
                          : "bg-blue-500/10 opacity-100"
                      : "opacity-0"
                  }`}
                />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <motion.div
                      animate={
                        enabled
                          ? {
                              scale: [1, 1.03, 1],
                            }
                          : {
                              scale: 1,
                            }
                      }
                      transition={{
                        duration: 2.5,
                        repeat: enabled
                          ? Infinity
                          : 0,
                        ease: "easeInOut",
                      }}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${iconClasses[option.accent as keyof typeof iconClasses]}`}
                    >
                      <Icon size={22} />
                    </motion.div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-white">
                          {option.title}
                        </h2>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            enabled
                              ? "border-white/10 bg-white/[0.05] text-slate-400"
                              : "border-white/[0.06] bg-white/[0.025] text-slate-600"
                          }`}
                        >
                          {option.badge}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    aria-label={`Toggle ${option.title}`}
                    aria-pressed={enabled}
                    onClick={() =>
                      toggleMethod(option.key)
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                      enabled
                        ? "bg-blue-600 shadow-lg shadow-blue-600/20"
                        : "bg-white/10 hover:bg-white/[0.14]"
                    }`}
                  >
                    <motion.span
                      animate={{
                        x: enabled ? 20 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="block h-5 w-5 rounded-full bg-white shadow-md shadow-black/30"
                    />

                    {enabled && (
                      <motion.span
                        initial={{
                          opacity: 0,
                          scale: 0.5,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        className="absolute inset-0 flex items-center justify-start pl-1 text-white"
                      >
                        <span className="sr-only">
                          Enabled
                        </span>
                      </motion.span>
                    )}
                  </button>
                </div>

                {/* Bottom Status */}
                <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={
                        enabled
                          ? {
                              opacity: [0.6, 1, 0.6],
                            }
                          : {
                              opacity: 1,
                            }
                      }
                      transition={{
                        duration: 2,
                        repeat: enabled
                          ? Infinity
                          : 0,
                      }}
                      className={`h-1.5 w-1.5 rounded-full ${
                        enabled
                          ? "bg-emerald-400"
                          : "bg-slate-600"
                      }`}
                    />

                    <span
                      className={`text-xs font-medium ${
                        enabled
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    >
                      {enabled
                        ? "Available for transactions"
                        : "Currently disabled"}
                    </span>
                  </div>

                  {enabled && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      className="flex items-center gap-1 text-[10px] font-medium text-slate-600"
                    >
                      <CheckCircle2 size={12} />
                      Active
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Info */}
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
            delay: 0.42,
            duration: 0.4,
          }}
          className="mt-5 rounded-2xl border border-orange-500/15 bg-orange-500/[0.035] p-4 sm:p-5"
        >
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <Info size={16} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200">
                Keep at least one method enabled
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Disabled payment methods will not be
                available when recording new shop
                transactions and expenses.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              className="mt-5 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              initial={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                y: -8,
                height: 0,
              }}
              className="mt-5 flex items-center gap-2 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              <Check size={17} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Area */}
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
            delay: 0.48,
            duration: 0.4,
          }}
          className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs text-slate-600">
            Changes apply across the shop manager.
          </p>

          <motion.button
            type="button"
            onClick={handleSave}
            disabled={saving}
            whileHover={
              !saving
                ? {
                    y: -2,
                  }
                : undefined
            }
            whileTap={
              !saving
                ? {
                    scale: 0.98,
                  }
                : undefined
            }
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}