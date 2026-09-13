"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CreditCard,
  IndianRupee,
  Loader2,
  ReceiptText,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Service = {
  id: string;
  name: string;
  category: string;
  serviceCharge: number;
  active: boolean;
};

type PaymentMethod = "Cash" | "UPI" | "Other";

const paymentMethods: {
  value: PaymentMethod;
  label: string;
  icon: typeof Wallet;
}[] = [
  {
    value: "Cash",
    label: "Cash",
    icon: Wallet,
  },
  {
    value: "UPI",
    label: "UPI",
    icon: CreditCard,
  },
  {
    value: "Other",
    label: "Other",
    icon: ReceiptText,
  },
];

export default function NewTransactionPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] =
    useState(true);

  const [serviceId, setServiceId] = useState("");
  const [transactionAmount, setTransactionAmount] =
    useState("");
  const [serviceCharge, setServiceCharge] =
    useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | "">("");

  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /*
   * HARD FRONTEND LOCK
   * Prevents double click / rapid click / duplicate submit.
   */
  const submitLockRef = useRef(false);

  /*
   * One unique key belongs to ONE save attempt.
   */
  const idempotencyKeyRef =
    useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const response = await fetch(
          "/api/services",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Services load failed."
          );
        }

        const activeServices = Array.isArray(data)
          ? data.filter(
              (service: Service) =>
                service.active
            )
          : [];

        if (mounted) {
          setServices(activeServices);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Services load failed."
          );
        }
      } finally {
        if (mounted) {
          setLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedService = useMemo(() => {
    return services.find(
      (service) => service.id === serviceId
    );
  }, [services, serviceId]);

  const amountValue = Number(
    transactionAmount || 0
  );

  const chargeValue = Number(
    serviceCharge || 0
  );

  const totalCollected =
    amountValue + chargeValue;

  const isValidAmount =
    Number.isFinite(amountValue) &&
    amountValue >= 0;

  const isValidCharge =
    Number.isFinite(chargeValue) &&
    chargeValue >= 0;

  const canSubmit =
    !loadingServices &&
    services.length > 0 &&
    !!serviceId &&
    !!paymentMethod &&
    isValidAmount &&
    isValidCharge &&
    !saving &&
    !success;

  function handleServiceChange(
    value: string
  ) {
    setServiceId(value);

    const service = services.find(
      (item) => item.id === value
    );

    if (service) {
      setServiceCharge(
        String(service.serviceCharge ?? 0)
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /*
     * ABSOLUTE FIRST LOCK.
     *
     * Even if React state has not updated yet,
     * ref blocks another submit immediately.
     */
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setError("");

    if (!serviceId) {
      setError("Please select a service.");
      submitLockRef.current = false;
      return;
    }

    if (!paymentMethod) {
      setError(
        "Please select a payment method."
      );
      submitLockRef.current = false;
      return;
    }

    if (!isValidAmount) {
      setError(
        "Enter a valid transaction amount."
      );
      submitLockRef.current = false;
      return;
    }

    if (!isValidCharge) {
      setError(
        "Enter a valid service charge."
      );
      submitLockRef.current = false;
      return;
    }

    setSaving(true);

    /*
     * Create exactly ONE key for this save attempt.
     *
     * If duplicate HTTP requests somehow happen,
     * both requests carry the SAME key.
     */
    const idempotencyKey =
      idempotencyKeyRef.current ??
      crypto.randomUUID();

    idempotencyKeyRef.current =
      idempotencyKey;

    try {
      const response = await fetch(
        "/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key":
              idempotencyKey,
          },
          body: JSON.stringify({
            serviceId,
            transactionAmount: amountValue,
            serviceCharge: chargeValue,
            paymentMethod,
            note: note.trim() || null,
            idempotencyKey,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Transaction save failed."
        );
      }

      /*
       * Save completed successfully.
       * New transaction gets a new key.
       */
      idempotencyKeyRef.current = null;

      setSuccess(true);
      setSaving(false);

      /*
       * Keep success screen for a moment,
       * then go back to transactions.
       */
      window.setTimeout(() => {
        window.location.href =
          "/transactions";
      }, 1400);
    } catch (err) {
      console.error(err);

      /*
       * Failed request can be retried with a fresh key.
       */
      idempotencyKeyRef.current = null;

      setError(
        err instanceof Error
          ? err.message
          : "Transaction save failed."
      );

      setSaving(false);
      submitLockRef.current = false;
    }
  }

  function handleCancel() {
    if (saving) return;

    window.location.href =
      "/transactions";
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">

        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: -15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-7 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition ${
                saving
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-white/[0.08]"
              }`}
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  size={17}
                  className="text-orange-400"
                />

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  Transaction Center
                </p>
              </div>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                New Transaction
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 sm:flex">
            <Zap size={14} />
            Quick Save
          </div>
        </motion.div>

        {/* ERROR */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="mb-5 flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="ml-3 rounded-lg p-1 hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          {/* LEFT */}
          <motion.section
            initial={{
              opacity: 0,
              x: -15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.35,
            }}
            className="rounded-[28px] border border-white/10 bg-[#0b0f16] p-5 shadow-2xl shadow-black/20 sm:p-7"
          >
            <div className="mb-7">
              <h2 className="text-lg font-bold">
                Transaction Details
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Enter the service and payment details.
              </p>
            </div>

            {/* SERVICE */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Service
              </label>

              <div className="relative">
                <select
                  value={serviceId}
                  onChange={(event) =>
                    handleServiceChange(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingServices || saving
                  }
                  className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#070a10] px-4 pr-12 text-sm text-white outline-none transition focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option
                    value=""
                    className="bg-[#070a10]"
                  >
                    {loadingServices
                      ? "Loading services..."
                      : "Select a service"}
                  </option>

                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                      className="bg-[#070a10]"
                    >
                      {service.name} — ₹
                      {service.serviceCharge}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                />
              </div>

              {selectedService && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                  }}
                  className="mt-2 flex items-center justify-between rounded-xl border border-blue-500/10 bg-blue-500/[0.05] px-3 py-2 text-xs"
                >
                  <span className="text-white/40">
                    Service charge
                  </span>

                  <span className="font-bold text-blue-300">
                    ₹
                    {selectedService.serviceCharge}
                  </span>
                </motion.div>
              )}
            </div>

            {/* AMOUNTS */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Transaction Amount
                </label>

                <div className="relative">
                  <IndianRupee
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={transactionAmount}
                    onChange={(event) =>
                      setTransactionAmount(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="0.00"
                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#070a10] pl-11 pr-4 text-base font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                  />
                </div>

                <p className="mt-2 text-xs text-white/30">
                  Amount handled for customer
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Service Charge
                </label>

                <div className="relative">
                  <IndianRupee
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400/60"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceCharge}
                    onChange={(event) =>
                      setServiceCharge(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="0.00"
                    className="h-14 w-full rounded-2xl border border-orange-500/10 bg-[#070a10] pl-11 pr-4 text-base font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50"
                  />
                </div>

                <p className="mt-2 text-xs text-white/30">
                  Your actual shop revenue
                </p>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="mt-7">
              <label className="mb-3 block text-sm font-semibold text-white/70">
                Payment Method
              </label>

              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map(
                  (method) => {
                    const Icon = method.icon;
                    const active =
                      paymentMethod ===
                      method.value;

                    return (
                      <motion.button
                        key={method.value}
                        type="button"
                        whileTap={{
                          scale: 0.96,
                        }}
                        onClick={() =>
                          setPaymentMethod(
                            method.value
                          )
                        }
                        disabled={saving}
                        className={`relative flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition ${
                          active
                            ? "border-blue-500/60 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/10"
                            : "border-white/10 bg-[#070a10] text-white/50 hover:border-white/20 hover:text-white"
                        } disabled:pointer-events-none disabled:opacity-50`}
                      >
                        {active && (
                          <motion.div
                            layoutId="paymentActive"
                            className="absolute inset-0 rounded-2xl border border-blue-400/30"
                          />
                        )}

                        <Icon size={20} />

                        <span>
                          {method.label}
                        </span>

                        {active && (
                          <span className="absolute right-2 top-2">
                            <Check
                              size={13}
                              className="text-blue-300"
                            />
                          </span>
                        )}
                      </motion.button>
                    );
                  }
                )}
              </div>
            </div>

            {/* NOTE */}
            <div className="mt-7">
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Note{" "}
                <span className="font-normal text-white/25">
                  (optional)
                </span>
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                disabled={saving}
                rows={4}
                maxLength={500}
                placeholder="Add a short note..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#070a10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
              />

              <div className="mt-1 text-right text-[11px] text-white/20">
                {note.length}/500
              </div>
            </div>
          </motion.section>

          {/* RIGHT SUMMARY */}
          <motion.aside
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.35,
              delay: 0.05,
            }}
            className="h-fit rounded-[28px] border border-white/10 bg-[#0b0f16] p-5 shadow-2xl shadow-black/20 sm:p-6 lg:sticky lg:top-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                <ReceiptText size={20} />
              </div>

              <div>
                <h2 className="font-bold">
                  Live Summary
                </h2>

                <p className="text-xs text-white/30">
                  Preview before saving
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/40">
                  Service
                </span>

                <span className="max-w-[190px] truncate text-right font-semibold">
                  {selectedService?.name ||
                    "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/40">
                  Transaction
                </span>

                <span className="font-semibold">
                  ₹
                  {amountValue.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/40">
                  Service Charge
                </span>

                <span className="font-semibold text-orange-300">
                  ₹
                  {chargeValue.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.04] p-4">
                <div className="text-xs text-white/35">
                  Shop Revenue
                </div>

                <div className="mt-1 text-3xl font-black text-orange-300">
                  ₹
                  {chargeValue.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </div>

                <div className="mt-1 text-[11px] text-white/25">
                  Only service charge counts
                  as revenue
                </div>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/40">
                  Customer Pays
                </span>

                <span className="text-lg font-bold">
                  ₹
                  {totalCollected.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/40">
                  Payment
                </span>

                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold">
                  {paymentMethod || "—"}
                </span>
              </div>
            </div>

            {/* SAVE */}
            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={
                canSubmit
                  ? {
                      scale: 1.01,
                    }
                  : undefined
              }
              whileTap={
                canSubmit
                  ? {
                      scale: 0.98,
                    }
                  : undefined
              }
              className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-bold shadow-xl shadow-blue-500/20 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Saving Transaction...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Save Transaction
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.02] text-sm font-semibold text-white/50 transition hover:bg-white/[0.05] hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              Cancel
            </button>
          </motion.aside>
        </form>
      </div>

      {/* SUCCESS SCREEN */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040a]/95 px-5 backdrop-blur-xl"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.75,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 18,
              }}
              className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-blue-500/20 bg-[#0b1019] p-8 text-center shadow-2xl shadow-blue-500/10"
            >
              <motion.div
                animate={{
                  rotate: [0, -8, 8, 0],
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 0.6,
                }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-blue-300"
              >
                <Check size={38} />
              </motion.div>

              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 text-orange-300">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Transaction Complete
                  </span>
                  <Sparkles size={16} />
                </div>

                <h2 className="mt-3 text-3xl font-black">
                  Saved Successfully!
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Your transaction has been
                  recorded safely.
                </p>
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs text-white/30">
                  Shop Revenue
                </div>

                <div className="mt-1 text-3xl font-black text-orange-300">
                  +₹
                  {chargeValue.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/25">
                <Loader2
                  size={13}
                  className="animate-spin"
                />
                Opening transactions...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}