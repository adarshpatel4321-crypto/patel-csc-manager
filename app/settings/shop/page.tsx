"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Save,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ShopSettings = {
  shopName: string;
  address: string;
  cscMobile: string;
  openingTime: string;
  closingTime: string;
};

const defaultSettings: ShopSettings = {
  shopName: "PATEL FINANCE & CSC CENTER",
  address: "A-19, RB Plaza, Rankuva–Tankal Road",
  cscMobile: "8460329135",
  openingTime: "09:00",
  closingTime: "18:00",
};

type FieldProps = {
  label: string;
  icon: typeof Store;
  children: React.ReactNode;
};

function Field({ label, icon: Icon, children }: FieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Icon size={15} className="text-slate-500" />
        {label}
      </label>

      {children}
    </motion.div>
  );
}

export default function ShopInformationPage() {
  const [form, setForm] = useState<ShopSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const data = (await response.json()) as ShopSettings & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Failed to load settings");
        }

        if (!mounted) {
          return;
        }

        setForm({
          shopName: data.shopName || defaultSettings.shopName,
          address: data.address || defaultSettings.address,
          cscMobile: data.cscMobile || defaultSettings.cscMobile,
          openingTime: data.openingTime || defaultSettings.openingTime,
          closingTime: data.closingTime || defaultSettings.closingTime,
        });
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Shop information load થઈ શક્યું નથી.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = <K extends keyof ShopSettings>(
    field: K,
    value: ShopSettings[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
    setError("");
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    if (!form.shopName.trim()) {
      setError("Shop name required chhe.");
      setSuccess("");
      return;
    }

    if (!form.address.trim()) {
      setError("Shop address required chhe.");
      setSuccess("");
      return;
    }

    if (form.cscMobile && form.cscMobile.length !== 10) {
      setError("CSC mobile number 10 digits nu hovu joiye.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          shopName: form.shopName.trim(),
          address: form.address.trim(),
          cscMobile: form.cscMobile.trim(),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        settings?: ShopSettings;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      if (data.settings) {
        setForm(data.settings);
      }

      setSuccess("Shop information successfully saved.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Shop information save થઈ શક્યું નથી."
      );
    } finally {
      setSaving(false);
    }
  };

  const businessStatus = useMemo(() => {
    if (!form.openingTime || !form.closingTime) {
      return "Hours not configured";
    }

    return `${form.openingTime} – ${form.closingTime}`;
  }, [form.openingTime, form.closingTime]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b14] text-white">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />

            <div className="mt-8 flex gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/[0.06]" />

              <div className="flex-1">
                <div className="h-3 w-28 rounded bg-white/[0.06]" />
                <div className="mt-3 h-9 w-64 rounded-xl bg-white/[0.06]" />
                <div className="mt-3 h-4 w-full max-w-xl rounded bg-white/[0.06]" />
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="space-y-6">
                <div className="h-16 rounded-xl bg-white/[0.05]" />
                <div className="h-24 rounded-xl bg-white/[0.05]" />
                <div className="h-16 rounded-xl bg-white/[0.05]" />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="h-16 rounded-xl bg-white/[0.05]" />
                  <div className="h-16 rounded-xl bg-white/[0.05]" />
                </div>

                <div className="h-28 rounded-2xl bg-white/[0.05]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 25, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-44 -top-44 h-[420px] w-[420px] rounded-full bg-blue-600/[0.08] blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-44 -right-44 h-[420px] w-[420px] rounded-full bg-orange-500/[0.07] blur-3xl"
        />

        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
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
            href="/settings"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/[0.08] hover:text-white"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Settings
          </Link>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.08,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/[0.10] text-blue-400 shadow-lg shadow-blue-950/20"
              >
                <Store size={26} />
              </motion.div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Shop Settings
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Shop Information
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Manage the core business information used across your shop
                  management system.
                </p>
              </div>
            </div>

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex w-fit items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={18} />

                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-[#070b14]" />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Configuration
                </p>

                <p className="mt-0.5 text-sm font-semibold text-slate-200">
                  Active
                </p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Card */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.12,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          {/* Top Accent */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          {/* Card Header */}
          <div className="border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Business details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Keep your shop profile accurate and up to date.
                </p>
              </div>

              <div className="hidden rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-500 sm:block">
                Local database
              </div>
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            {/* Shop Name */}
            <Field label="Shop Name" icon={Store}>
              <div className="group relative">
                <Store
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within:text-blue-400"
                />

                <input
                  id="shopName"
                  type="text"
                  value={form.shopName}
                  onChange={(event) =>
                    updateField("shopName", event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter shop name"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm font-medium text-white outline-none transition-all duration-300 placeholder:text-slate-600 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/[0.025] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </Field>

            {/* Address */}
            <Field label="Shop Address" icon={MapPin}>
              <div className="group relative">
                <MapPin
                  size={18}
                  className="pointer-events-none absolute left-4 top-4 text-slate-500 transition-colors duration-300 group-focus-within:text-blue-400"
                />

                <textarea
                  id="address"
                  rows={3}
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter shop address"
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm leading-6 text-white outline-none transition-all duration-300 placeholder:text-slate-600 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/[0.025] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </Field>

            {/* Mobile */}
            <Field label="CSC Mobile Number" icon={Phone}>
              <div className="group relative">
                <Phone
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within:text-blue-400"
                />

                <input
                  id="cscMobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.cscMobile}
                  onChange={(event) =>
                    updateField(
                      "cscMobile",
                      event.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  disabled={saving}
                  placeholder="10 digit mobile number"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm tracking-wide text-white outline-none transition-all duration-300 placeholder:text-slate-600 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/[0.025] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="flex items-center justify-between px-1 text-[11px]">
                <span className="text-slate-600">
                  Used for CSC business contact
                </span>

                <span
                  className={
                    form.cscMobile.length === 10
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }
                >
                  {form.cscMobile.length}/10
                </span>
              </div>
            </Field>

            {/* Business Hours */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Clock3 size={15} className="text-slate-500" />

                <p className="text-sm font-medium text-slate-300">
                  Business Hours
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="group relative">
                  <label
                    htmlFor="openingTime"
                    className="mb-2 block text-xs text-slate-500"
                  >
                    Opening Time
                  </label>

                  <Clock3
                    size={17}
                    className="pointer-events-none absolute left-4 top-[2.65rem] -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within:text-blue-400"
                  />

                  <input
                    id="openingTime"
                    type="time"
                    value={form.openingTime}
                    onChange={(event) =>
                      updateField("openingTime", event.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all duration-300 [color-scheme:dark] hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/[0.025] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="group relative">
                  <label
                    htmlFor="closingTime"
                    className="mb-2 block text-xs text-slate-500"
                  >
                    Closing Time
                  </label>

                  <Clock3
                    size={17}
                    className="pointer-events-none absolute left-4 top-[2.65rem] -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within:text-orange-400"
                  />

                  <input
                    id="closingTime"
                    type="time"
                    value={form.closingTime}
                    onChange={(event) =>
                      updateField("closingTime", event.target.value)
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all duration-300 [color-scheme:dark] hover:border-white/15 focus:border-orange-500/50 focus:bg-orange-500/[0.025] focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <motion.div
              layout
              className="relative overflow-hidden rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-500/[0.065] to-white/[0.015] p-5"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/[0.08] blur-3xl" />

              <div className="relative">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <motion.div
                      key={form.shopName}
                      initial={{ scale: 0.92, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400"
                    >
                      <Store size={21} />
                    </motion.div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                          Live Preview
                        </p>

                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      </div>

                      <h3 className="mt-1 break-words text-base font-semibold text-white">
                        {form.shopName || "Shop Name"}
                      </h3>

                      <p className="mt-1 break-words text-sm leading-6 text-slate-400">
                        {form.address || "Shop Address"}
                      </p>
                    </div>
                  </div>

                  <div className="w-fit rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Status
                    </p>

                    <p className="mt-0.5 text-xs font-semibold text-emerald-400">
                      Ready
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
                    <Phone size={13} className="text-blue-400" />
                    {form.cscMobile || "Not set"}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
                    <Clock3 size={13} className="text-orange-400" />
                    {businessStatus}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Messages */}
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  <span>{error}</span>
                </motion.div>
              ) : success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3.5 text-sm text-emerald-300"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Check size={16} />
                  </div>

                  <span>{success}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Save Footer */}
            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                Changes are saved to your local shop database.
              </div>

              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                whileHover={!saving ? { y: -2 } : undefined}
                whileTap={!saving ? { scale: 0.98 } : undefined}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-500 hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.45,
            duration: 0.4,
          }}
          className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-600 sm:flex-row"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Shop settings are stored locally</span>
        </motion.footer>
      </div>
    </main>
  );
}