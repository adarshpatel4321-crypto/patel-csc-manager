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
  Loader2,
  ReceiptText,
  Save,
  Smartphone,
  WalletCards,
  XCircle,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  category: string;
  charge: number;
  active: boolean;
};

type PaymentMethods = {
  cash: boolean;
  upi: boolean;
  other: boolean;
};

type PaymentMethod = "Cash" | "UPI" | "Other";

type PaymentOption = {
  value: PaymentMethod;
  label: string;
  key: keyof PaymentMethods;
  icon: typeof Banknote;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "Cash",
    label: "Cash",
    key: "cash",
    icon: Banknote,
  },
  {
    value: "UPI",
    label: "UPI",
    key: "upi",
    icon: Smartphone,
  },
  {
    value: "Other",
    label: "Other",
    key: "other",
    icon: WalletCards,
  },
];

const DEFAULT_PAYMENT_METHODS: PaymentMethods = {
  cash: true,
  upi: true,
  other: true,
};

export default function NewTransactionPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethods>(
      DEFAULT_PAYMENT_METHODS
    );

  const [serviceId, setServiceId] = useState("");
  const [transactionAmount, setTransactionAmount] =
    useState("");
  const [serviceCharge, setServiceCharge] =
    useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | "">("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  /*
   * IMPORTANT:
   * This lock changes immediately before React re-render.
   * Therefore multiple clicks cannot start multiple saves.
   */
  const submitLockRef = useRef(false);

  /*
   * One unique key belongs to one save attempt.
   * The same key is sent to the API.
   */
  const idempotencyKeyRef = useRef<string | null>(
    null
  );

  const selectedService = useMemo(() => {
    return services.find(
      (service) => service.id === serviceId
    );
  }, [services, serviceId]);

  const availablePaymentOptions = useMemo(() => {
    return PAYMENT_OPTIONS.filter(
      (option) => paymentMethods[option.key]
    );
  }, [paymentMethods]);

  const transactionValue =
    Number(transactionAmount) || 0;

  const chargeValue =
    Number(serviceCharge) || 0;

  const customerPays =
    transactionValue + chargeValue;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const servicesResponse = await fetch(
          "/api/services",
          {
            cache: "no-store",
          }
        );

        const paymentResponse = await fetch(
          "/api/settings/payment-methods",
          {
            cache: "no-store",
          }
        );

        if (!servicesResponse.ok) {
          throw new Error(
            "Services load failed."
          );
        }

        const servicesData =
          await servicesResponse.json();

        const activeServices: Service[] =
          Array.isArray(servicesData)
            ? servicesData.filter(
                (service: Service) =>
                  service.active
              )
            : [];

        setServices(activeServices);

        if (activeServices.length > 0) {
          const firstService =
            activeServices[0];

          setServiceId(firstService.id);
          setServiceCharge(
            String(firstService.charge)
          );
        }

        if (paymentResponse.ok) {
          const paymentData =
            await paymentResponse.json();

          const methods: PaymentMethods = {
            cash: Boolean(paymentData.cash),
            upi: Boolean(paymentData.upi),
            other: Boolean(
              paymentData.other
            ),
          };

          setPaymentMethods(methods);

          const firstAvailable =
            PAYMENT_OPTIONS.find(
              (option) =>
                methods[option.key]
            );

          setPaymentMethod(
            firstAvailable?.value ?? ""
          );
        } else {
          setPaymentMethods(
            DEFAULT_PAYMENT_METHODS
          );
          setPaymentMethod("Cash");
        }
      } catch (err) {
        console.error(err);

        setError(
          "Transaction setup load nahi thayu."
        );

        setPaymentMethods(
          DEFAULT_PAYMENT_METHODS
        );

        setPaymentMethod("Cash");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    setServiceCharge(
      String(selectedService.charge)
    );
  }, [selectedService]);

  useEffect(() => {
    const currentMethodAvailable =
      availablePaymentOptions.some(
        (option) =>
          option.value === paymentMethod
      );

    if (!currentMethodAvailable) {
      setPaymentMethod(
        availablePaymentOptions[0]?.value ?? ""
      );
    }
  }, [
    availablePaymentOptions,
    paymentMethod,
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    /*
     * HARD LOCK
     *
     * This happens BEFORE any async work.
     * Second/third/fourth click returns immediately.
     */
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;

    setSaving(true);
    setSuccess("");
    setError("");

    /*
     * Validation
     */
    if (!serviceId) {
      setError("Please select a service.");

      submitLockRef.current = false;
      setSaving(false);

      return;
    }

    if (!paymentMethod) {
      setError(
        "Please select a payment method."
      );

      submitLockRef.current = false;
      setSaving(false);

      return;
    }

    if (transactionValue < 0) {
      setError(
        "Transaction amount cannot be negative."
      );

      submitLockRef.current = false;
      setSaving(false);

      return;
    }

    if (chargeValue < 0) {
      setError(
        "Service charge cannot be negative."
      );

      submitLockRef.current = false;
      setSaving(false);

      return;
    }

    /*
     * Create ONE idempotency key for this save attempt.
     *
     * Even if the browser/network retries the same
     * request, the API receives the SAME key.
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
            transactionAmount:
              transactionValue,
            serviceCharge:
              chargeValue,
            paymentMethod,
            note:
              note.trim() || null,
            idempotencyKey,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Transaction save failed."
        );
      }

      /*
       * Success.
       *
       * Clear the key so the NEXT transaction gets
       * a completely new unique key.
       */
      idempotencyKeyRef.current = null;

      setSuccess(
        data.duplicate
          ? "Transaction already saved."
          : "Transaction saved successfully."
      );

      setTransactionAmount("");
      setNote("");
    } catch (err) {
      console.error(
        "Transaction submit error:",
        err
      );

      /*
       * Allow retry after a real error.
       */
      idempotencyKeyRef.current = null;

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      submitLockRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050914] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-xl bg-white/10" />

            <div className="h-[500px] rounded-3xl border border-white/10 bg-white/[0.03]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

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
          className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link
              href="/transactions"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to Transactions
            </Link>

            <h1 className="text-2xl font-bold sm:text-3xl">
              New Transaction
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Record a CSC service transaction.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 sm:block">
            <ReceiptText
              size={24}
              className="text-blue-400"
            />
          </div>
        </motion.div>

        {/* ALERT */}
        {(success || error) && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              success
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {success ? (
              <CheckCircle2 size={19} />
            ) : (
              <XCircle size={19} />
            )}

            <span>
              {success || error}
            </span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* FORM */}
            <motion.section
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl sm:p-7"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Transaction Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter service and payment details.
                </p>
              </div>

              <div className="space-y-5">

                {/* SERVICE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Service
                  </label>

                  <select
                    value={serviceId}
                    onChange={(event) =>
                      setServiceId(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {services.length === 0 ? (
                      <option value="">
                        No active services
                      </option>
                    ) : (
                      services.map(
                        (service) => (
                          <option
                            key={service.id}
                            value={service.id}
                          >
                            {service.name} — ₹
                            {service.charge}
                          </option>
                        )
                      )
                    )}
                  </select>
                </div>

                {/* AMOUNTS */}
                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Transaction Amount
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        ₹
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          transactionAmount
                        }
                        onChange={(event) =>
                          setTransactionAmount(
                            event.target.value
                          )
                        }
                        disabled={saving}
                        placeholder="0"
                        className="w-full rounded-2xl border border-white/10 bg-[#0b1220] py-3.5 pl-9 pr-4 text-sm text-white outline-none focus:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Example: Money Transfer ₹5,000
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Service Charge
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        ₹
                      </span>

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
                        placeholder="0"
                        className="w-full rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] py-3.5 pl-9 pr-4 text-sm text-white outline-none focus:border-orange-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    <p className="mt-2 text-xs text-orange-400">
                      Your shop revenue
                    </p>
                  </div>
                </div>

                {/* PAYMENT */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Payment Method
                    </label>

                    <Link
                      href="/settings/payments"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Manage methods
                    </Link>
                  </div>

                  {availablePaymentOptions.length ===
                  0 ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                      No payment method enabled.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availablePaymentOptions.map(
                        (option) => {
                          const Icon =
                            option.icon;

                          const selected =
                            paymentMethod ===
                            option.value;

                          return (
                            <button
                              key={
                                option.value
                              }
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                setPaymentMethod(
                                  option.value
                                )
                              }
                              className={`rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                selected
                                  ? "border-blue-500/60 bg-blue-500/10"
                                  : "border-white/10 bg-[#0b1220] hover:border-white/20"
                              }`}
                            >
                              <Icon
                                size={21}
                                className={
                                  selected
                                    ? "text-blue-400"
                                    : "text-slate-500"
                                }
                              />

                              <div
                                className={`mt-2 text-sm font-medium ${
                                  selected
                                    ? "text-white"
                                    : "text-slate-400"
                                }`}
                              >
                                {option.label}
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* NOTE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Note
                    <span className="ml-2 text-xs text-slate-600">
                      Optional
                    </span>
                  </label>

                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNote(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    rows={4}
                    placeholder="Add transaction note..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/transactions"
                  className={`flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white ${
                    saving
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !serviceId ||
                    !paymentMethod ||
                    services.length === 0
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                      Save Transaction
                    </>
                  )}
                </button>
              </div>
            </motion.section>

            {/* SUMMARY */}
            <motion.aside
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-orange-500/10 p-2.5">
                  <ReceiptText
                    size={20}
                    className="text-orange-400"
                  />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Transaction Summary
                  </h2>

                  <p className="text-xs text-slate-500">
                    Live calculation
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                  <p className="text-xs text-slate-500">
                    Service
                  </p>

                  <p className="mt-1 font-medium text-white">
                    {selectedService?.name ??
                      "Select service"}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Transaction Amount
                  </span>

                  <span className="font-semibold">
                    ₹
                    {transactionValue.toFixed(
                      2
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Shop Revenue
                  </span>

                  <span className="font-semibold text-orange-400">
                    ₹
                    {chargeValue.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">
                      Customer Pays
                    </span>

                    <span className="text-xl font-bold">
                      ₹
                      {customerPays.toFixed(
                        2
                      )}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.05] p-4">
                  <div className="flex items-center gap-2">
                    {paymentMethod ===
                    "Cash" ? (
                      <Banknote
                        size={18}
                        className="text-blue-400"
                      />
                    ) : paymentMethod ===
                      "UPI" ? (
                      <Smartphone
                        size={18}
                        className="text-blue-400"
                      />
                    ) : (
                      <WalletCards
                        size={18}
                        className="text-blue-400"
                      />
                    )}

                    <div>
                      <p className="text-xs text-slate-500">
                        Payment Method
                      </p>

                      <p className="text-sm font-semibold text-white">
                        {paymentMethod ||
                          "Not selected"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </form>
      </div>
    </main>
  );
}