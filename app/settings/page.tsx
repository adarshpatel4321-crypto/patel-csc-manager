"use client";

import type { ElementType } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Moon,
  Palette,
  Settings2,
  ShieldCheck,
  Store,
  WalletCards,
  Zap,
} from "lucide-react";
import Link from "next/link";

type SettingCard = {
  title: string;
  description: string;
  icon: ElementType;
  href: string;
  accent: "blue" | "orange" | "emerald" | "violet";
  status: string;
};

const settingsCards: SettingCard[] = [
  {
    title: "Shop Information",
    description:
      "Manage your shop name, contact details, address and business information.",
    icon: Store,
    href: "/settings/shop",
    accent: "blue",
    status: "Configured",
  },
  {
    title: "Payment Methods",
    description:
      "Manage payment methods available while recording transactions and expenses.",
    icon: CreditCard,
    href: "/settings/payments",
    accent: "orange",
    status: "Configured",
  },
  {
    title: "Reminder Preferences",
    description:
      "Manage reminders and notification preferences for your shop.",
    icon: Bell,
    href: "/reminders",
    accent: "emerald",
    status: "Available",
  },
  {
    title: "Services Management",
    description:
      "Add, edit, activate or deactivate CSC services and their service charges.",
    icon: Settings2,
    href: "/settings/services",
    accent: "violet",
    status: "Manage",
  },
];

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const accentStyles = {
  blue: {
    icon:
      "border-blue-500/20 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/15",
    glow: "bg-blue-500/10",
    border: "hover:border-blue-500/30",
    text: "text-blue-400",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  orange: {
    icon:
      "border-orange-500/20 bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/15",
    glow: "bg-orange-500/10",
    border: "hover:border-orange-500/30",
    text: "text-orange-400",
    badge: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  },
  emerald: {
    icon:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15",
    glow: "bg-emerald-500/10",
    border: "hover:border-emerald-500/30",
    text: "text-emerald-400",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  violet: {
    icon:
      "border-violet-500/20 bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/15",
    glow: "bg-violet-500/10",
    border: "hover:border-violet-500/30",
    text: "text-violet-400",
    badge: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  },
};

export default function SettingsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 25, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl"
        />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-8"
        >
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300"
              >
                <Settings2 size={14} />
                Settings
              </motion.div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Manage your shop
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Configure services, payments, reminders and other shop
                preferences from one place.
              </p>
            </div>

            {/* System Status */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.035] px-4 py-3 backdrop-blur-xl"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck size={19} />

                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-[#070b14]" />
              </div>

              <div>
                <p className="text-xs text-slate-500">System status</p>

                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  All systems ready
                </p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Settings Cards */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2"
        >
          {settingsCards.map((card) => {
            const Icon = card.icon;
            const style = accentStyles[card.accent];

            return (
              <Link
                key={card.title}
                href={card.href}
                className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b14]"
              >
                <motion.div
                  variants={itemVariants}
                  whileHover={{
                    y: -5,
                    transition: {
                      duration: 0.22,
                      ease: "easeOut",
                    },
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                  className={`group relative h-full min-h-[235px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.055] ${style.border}`}
                >
                  {/* Glow */}
                  <div
                    className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-100 ${style.glow}`}
                  />

                  {/* Top shine */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative flex items-start justify-between gap-4">
                    <motion.div
                      whileHover={{
                        scale: 1.07,
                        rotate: 2,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${style.icon}`}
                    >
                      <Icon size={22} />
                    </motion.div>

                    <div
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}
                    >
                      {card.status}
                    </div>
                  </div>

                  <div className="relative mt-5">
                    <h2 className="text-lg font-semibold text-white">
                      {card.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {card.description}
                    </p>
                  </div>

                  <div
                    className={`relative mt-5 flex items-center gap-2 text-xs font-semibold ${style.text}`}
                  >
                    Open settings

                    <ChevronRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.section>

        {/* Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.38,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-8"
        >
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Current preferences
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              App appearance
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Dark Mode */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Moon size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Dark Mode
                  </p>

                  <p className="flex items-center gap-1 text-xs text-blue-300">
                    <CheckCircle2 size={12} />
                    Always enabled
                  </p>
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 0.8,
                    delay: 0.5,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-blue-500"
                />
              </div>
            </motion.div>

            {/* Smooth Animations */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Zap size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Smooth Animations
                  </p>

                  <p className="flex items-center gap-1 text-xs text-orange-300">
                    <CheckCircle2 size={12} />
                    Enabled
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                Premium transitions and interactions are enabled throughout
                the manager.
              </p>
            </motion.div>

            {/* Theme */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-slate-300">
                  <Palette size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Visual Theme
                  </p>

                  <p className="text-xs text-slate-400">
                    Dark + Blue + Orange
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <span className="h-7 flex-1 rounded-lg bg-[#070b14] ring-1 ring-white/10" />
                <span className="h-7 flex-1 rounded-lg bg-blue-600" />
                <span className="h-7 flex-1 rounded-lg bg-orange-500" />
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.58,
            duration: 0.45,
          }}
          className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-slate-400">
                <WalletCards size={18} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-200">
                  Patel CSC Manager
                </p>

                <p className="text-xs text-slate-500">
                  Shop management system
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Local database connected
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}