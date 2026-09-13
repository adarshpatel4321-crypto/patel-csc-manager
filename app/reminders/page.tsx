"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Repeat2,
  Trash2,
  X,
  Sparkles,
  AlertTriangle,
  TimerReset,
} from "lucide-react";

type RepeatOption = "none" | "daily" | "weekly" | "monthly";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  remindAt: string;
  repeat: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type ReminderForm = {
  title: string;
  description: string;
  remindAt: string;
  repeat: RepeatOption;
};

type ReminderStatus =
  | "completed"
  | "overdue"
  | "today"
  | "upcoming";

const repeatLabels: Record<RepeatOption, string> = {
  none: "Does not repeat",
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getInputDateTime = (value: Date = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getReminderStatus = (
  reminder: Reminder
): ReminderStatus => {
  if (reminder.completed) {
    return "completed";
  }

  const reminderTime = new Date(
    reminder.remindAt
  ).getTime();

  const now = Date.now();

  if (reminderTime < now) {
    return "overdue";
  }

  const difference = reminderTime - now;

  if (difference <= 24 * 60 * 60 * 1000) {
    return "today";
  }

  return "upcoming";
};

const statusConfig: Record<
  ReminderStatus,
  {
    label: string;
    icon: React.ReactNode;
    badge: string;
    dot: string;
    border: string;
  }
> = {
  overdue: {
    label: "Overdue",
    icon: <AlertTriangle size={12} />,
    badge:
      "border-red-500/20 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
    border: "border-red-500/20",
  },
  today: {
    label: "Today",
    icon: <TimerReset size={12} />,
    badge:
      "border-orange-500/20 bg-orange-500/10 text-orange-300",
    dot: "bg-orange-400",
    border: "border-orange-500/20",
  },
  upcoming: {
    label: "Upcoming",
    icon: <CalendarDays size={12} />,
    badge:
      "border-blue-500/20 bg-blue-500/10 text-blue-300",
    dot: "bg-blue-400",
    border: "border-slate-800",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 size={12} />,
    badge:
      "border-green-500/20 bg-green-500/10 text-green-300",
    dot: "bg-green-400",
    border: "border-green-500/10",
  },
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] =
    useState<Reminder | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(
    null
  );

  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<ReminderForm>({
    title: "",
    description: "",
    remindAt: getInputDateTime(
      new Date(Date.now() + 60 * 60 * 1000)
    ),
    repeat: "none",
  });

  const fetchReminders = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/reminders", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reminders");
      }

      const result = (await response.json()) as Reminder[];

      setReminders(result);
    } catch (err) {
      console.error(err);
      setError("Reminders load thai shakya nathi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const openAddModal = () => {
    setEditingReminder(null);

    setForm({
      title: "",
      description: "",
      remindAt: getInputDateTime(
        new Date(Date.now() + 60 * 60 * 1000)
      ),
      repeat: "none",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);

    setForm({
      title: reminder.title,
      description: reminder.description ?? "",
      remindAt: getInputDateTime(
        new Date(reminder.remindAt)
      ),
      repeat:
        reminder.repeat === "daily" ||
        reminder.repeat === "weekly" ||
        reminder.repeat === "monthly"
          ? reminder.repeat
          : "none",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingReminder(null);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Reminder title enter kar.");
      return;
    }

    if (!form.remindAt) {
      setError("Date and time select kar.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing = Boolean(editingReminder);

      const endpoint = isEditing
        ? `/api/reminders/${editingReminder?.id}`
        : "/api/reminders";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          remindAt: new Date(
            form.remindAt
          ).toISOString(),
          repeat: form.repeat,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Something went wrong"
        );
      }

      setModalOpen(false);
      setEditingReminder(null);

      showSuccess(
        isEditing
          ? "Reminder updated successfully."
          : "Reminder created successfully."
      );

      await fetchReminders();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCompleted = async (
    reminder: Reminder
  ) => {
    try {
      setActionId(reminder.id);
      setError("");

      const response = await fetch(
        `/api/reminders/${reminder.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: !reminder.completed,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to update reminder"
        );
      }

      setReminders((current) =>
        current.map((item) =>
          item.id === reminder.id ? result : item
        )
      );

      showSuccess(
        reminder.completed
          ? "Reminder moved back to pending."
          : "Reminder completed."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Reminder update failed."
      );
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setActionId(deleteId);
      setError("");

      const response = await fetch(
        `/api/reminders/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to delete reminder"
        );
      }

      setReminders((current) =>
        current.filter((item) => item.id !== deleteId)
      );

      setDeleteId(null);

      showSuccess("Reminder deleted successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Reminder delete failed."
      );
    } finally {
      setActionId(null);
    }
  };

  const stats = useMemo(() => {
    const pending = reminders.filter(
      (item) => !item.completed
    );

    const completed = reminders.filter(
      (item) => item.completed
    );

    const overdue = pending.filter(
      (item) => getReminderStatus(item) === "overdue"
    );

    const today = pending.filter(
      (item) => getReminderStatus(item) === "today"
    );

    return {
      total: reminders.length,
      pending: pending.length,
      completed: completed.length,
      overdue: overdue.length,
      today: today.length,
    };
  }, [reminders]);

  const pendingReminders = useMemo(
    () =>
      reminders
        .filter((item) => !item.completed)
        .sort(
          (a, b) =>
            new Date(a.remindAt).getTime() -
            new Date(b.remindAt).getTime()
        ),
    [reminders]
  );

  const completedReminders = useMemo(
    () =>
      reminders
        .filter((item) => item.completed)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
        ),
    [reminders]
  );

  const handleRefresh = () => {
    if (refreshing) return;

    setRefreshing(true);
    fetchReminders();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b12] text-slate-100">
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-32 top-32 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1450px] px-4 py-5 sm:px-6 lg:px-8">
        {/* HEADER */}
        <motion.header
          initial={{
            opacity: 0,
            y: -14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
          className="mb-7"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href="/"
                className="group mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/80 text-slate-400 shadow-lg shadow-black/10 backdrop-blur transition duration-200 hover:-translate-x-0.5 hover:border-blue-500/40 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft
                  size={19}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                />
              </Link>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    <Bell size={18} />
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Reminders
                  </h1>

                  {!loading && stats.pending > 0 && (
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      {stats.pending} pending
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Keep important shop tasks on track.
                </p>
              </div>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 text-sm font-medium text-slate-300 shadow-lg shadow-black/10 backdrop-blur transition hover:border-blue-500/30 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:bg-blue-500 hover:shadow-blue-500/20 active:scale-[0.98] sm:flex-none"
              >
                <Plus size={18} />
                <span>New Reminder</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* ALERTS */}
        <AnimatePresence initial={false}>
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
              <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 shadow-lg shadow-red-950/10">
                <div className="flex min-w-0 items-center gap-2">
                  <AlertTriangle
                    size={16}
                    className="shrink-0"
                  />
                  <span className="truncate">
                    {error}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/10 hover:text-red-200"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 0.98,
              }}
              className="mb-5 flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300 shadow-lg shadow-green-950/10"
            >
              <CheckCircle2 size={17} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATS */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Total"
            value={stats.total}
            icon={<Bell size={18} />}
            accent="blue"
            delay={0}
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock3 size={18} />}
            accent="orange"
            delay={0.04}
          />

          <StatCard
            title="Today"
            value={stats.today}
            icon={<CalendarDays size={18} />}
            accent="purple"
            delay={0.08}
          />

          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={<AlertTriangle size={18} />}
            accent="red"
            delay={0.12}
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle2 size={18} />}
            accent="green"
            delay={0.16}
          />
        </section>

        {/* CONTENT */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* PENDING */}
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
              duration: 0.45,
              delay: 0.08,
            }}
            className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/75 shadow-2xl shadow-black/20 backdrop-blur"
          >
            <div className="border-b border-slate-800/80 px-5 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-white">
                      Pending Reminders
                    </h2>

                    {stats.overdue > 0 && (
                      <span className="flex h-5 items-center gap-1 rounded-full bg-red-500/10 px-2 text-[9px] font-bold uppercase tracking-wide text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        {stats.overdue} overdue
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Tasks that still need your attention
                  </p>
                </div>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 px-2.5 text-xs font-bold text-blue-400">
                  {pendingReminders.length}
                </div>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <ReminderSkeleton />
              ) : pendingReminders.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={30} />}
                  title="All clear!"
                  description="No pending reminders right now."
                  action={
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                    >
                      <Plus size={16} />
                      Create Reminder
                    </button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence
                    mode="popLayout"
                    initial={false}
                  >
                    {pendingReminders.map(
                      (reminder, index) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          index={index}
                          actionId={actionId}
                          onComplete={() =>
                            toggleCompleted(reminder)
                          }
                          onEdit={() =>
                            openEditModal(reminder)
                          }
                          onDelete={() =>
                            setDeleteId(
                              reminder.id
                            )
                          }
                        />
                      )
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.section>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* QUICK ADD */}
            <motion.div
              initial={{
                opacity: 0,
                x: 18,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.45,
                delay: 0.14,
              }}
              className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/[0.14] via-slate-900/90 to-orange-500/[0.07] p-5 shadow-2xl shadow-black/20"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    <Sparkles size={20} />
                  </div>

                  <span className="rounded-full border border-slate-700/80 bg-slate-950/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Quick Add
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white">
                  Stay ahead
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Set reminders for important shop tasks,
                  follow-ups and daily work.
                </p>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                >
                  <Plus size={17} />
                  Add Reminder
                </button>
              </div>
            </motion.div>

            {/* COMPLETED */}
            <motion.section
              initial={{
                opacity: 0,
                x: 18,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.45,
                delay: 0.2,
              }}
              className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/75 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <div className="border-b border-slate-800/80 px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-white">
                      Completed
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Recently completed tasks
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 text-green-400">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
              </div>

              <div className="p-5">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-14 animate-pulse rounded-xl bg-slate-800/70"
                      />
                    ))}
                  </div>
                ) : completedReminders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center">
                    <CheckCircle2
                      size={25}
                      className="mx-auto text-slate-700"
                    />

                    <p className="mt-3 text-sm text-slate-600">
                      No completed reminders yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedReminders
                      .slice(0, 5)
                      .map((reminder, index) => (
                        <motion.div
                          key={reminder.id}
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay: index * 0.035,
                          }}
                          className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 transition hover:border-green-500/10 hover:bg-slate-950"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleCompleted(
                                reminder
                              )
                            }
                            disabled={
                              actionId ===
                              reminder.id
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green-500/10 bg-green-500/10 text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
                          >
                            {actionId ===
                            reminder.id ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Check size={15} />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-slate-300 line-through">
                              {reminder.title}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-600">
                              {formatDate(
                                reminder.remindAt
                              )}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 18,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 18,
              }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 28,
              }}
              className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0d131d] shadow-2xl shadow-black/60"
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    {editingReminder ? (
                      <Edit3 size={18} />
                    ) : (
                      <Bell size={18} />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {editingReminder
                        ? "Edit Reminder"
                        : "New Reminder"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Schedule your next important task.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              </div>

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Reminder Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Check printer ink"
                    className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    autoFocus
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                    <span className="ml-2 text-xs font-normal text-slate-600">
                      Optional
                    </span>
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }))
                    }
                    placeholder="Add some details about this reminder..."
                    rows={3}
                    disabled={saving}
                    className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Date & Time
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="datetime-local"
                        value={form.remindAt}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            remindAt:
                              event.target.value,
                          }))
                        }
                        disabled={saving}
                        className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 text-sm text-white outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Repeat
                    </label>

                    <div className="relative">
                      <Repeat2
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <select
                        value={form.repeat}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            repeat:
                              event.target
                                .value as RepeatOption,
                          }))
                        }
                        disabled={saving}
                        className="h-12 w-full appearance-none rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3 text-sm text-white outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                      >
                        {(
                          Object.entries(
                            repeatLabels
                          ) as [
                            RepeatOption,
                            string
                          ][]
                        ).map(
                          ([value, label]) => (
                            <option
                              key={value}
                              value={value}
                              className="bg-slate-950"
                            >
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                  >
                    <AlertTriangle size={15} />
                    {error}
                  </motion.div>
                )}

                <div className="flex flex-col-reverse gap-2 border-t border-slate-800/80 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={17} />
                        {editingReminder
                          ? "Update Reminder"
                          : "Create Reminder"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setDeleteId(null);
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 28,
              }}
              className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0d131d] p-5 shadow-2xl shadow-black/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                <Trash2 size={20} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                Delete Reminder?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                This reminder will be permanently
                deleted. This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  disabled={Boolean(actionId)}
                  className="h-11 flex-1 rounded-xl border border-slate-800 bg-slate-950 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={Boolean(actionId)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white shadow-lg shadow-red-600/10 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionId ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
  delay,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent:
    | "blue"
    | "orange"
    | "purple"
    | "red"
    | "green";
  delay: number;
}) {
  const config = {
    blue: {
      icon: "border-blue-500/20 bg-blue-500/10 text-blue-400",
      glow: "bg-blue-500/10",
    },
    orange: {
      icon: "border-orange-500/20 bg-orange-500/10 text-orange-400",
      glow: "bg-orange-500/10",
    },
    purple: {
      icon: "border-purple-500/20 bg-purple-500/10 text-purple-400",
      glow: "bg-purple-500/10",
    },
    red: {
      icon: "border-red-500/20 bg-red-500/10 text-red-400",
      glow: "bg-red-500/10",
    },
    green: {
      icon: "border-green-500/20 bg-green-500/10 text-green-400",
      glow: "bg-green-500/10",
    },
  }[accent];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay,
      }}
      whileHover={{
        y: -3,
      }}
      className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4 shadow-lg shadow-black/10 backdrop-blur transition-colors hover:border-slate-700"
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full ${config.glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">
          {title}
        </span>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${config.icon}`}
        >
          {icon}
        </div>
      </div>

      <motion.p
        key={value}
        initial={{
          opacity: 0.4,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="relative mt-3 text-2xl font-bold tracking-tight text-white"
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

function ReminderCard({
  reminder,
  index,
  actionId,
  onComplete,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  index: number;
  actionId: string | null;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getReminderStatus(reminder);
  const config = statusConfig[status];

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.96,
      }}
      transition={{
        delay: Math.min(index * 0.035, 0.2),
      }}
      className={`group relative overflow-hidden rounded-2xl border bg-slate-950/55 p-4 transition duration-200 hover:bg-slate-950 ${config.border}`}
    >
      {/* STATUS LINE */}
      <div
        className={`absolute bottom-0 left-0 top-0 w-[2px] ${config.dot}`}
      />

      <div className="flex items-start gap-3">
        {/* COMPLETE BUTTON */}
        <button
          type="button"
          onClick={onComplete}
          disabled={actionId === reminder.id}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-transparent transition duration-200 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Complete reminder"
        >
          {actionId === reminder.id ? (
            <Loader2
              size={16}
              className="animate-spin text-blue-400"
            />
          ) : (
            <Check size={17} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="max-w-full truncate text-sm font-semibold text-white">
              {reminder.title}
            </h3>

            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}
            >
              {config.icon}
              {config.label}
            </span>
          </div>

          {reminder.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {reminder.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDate(reminder.remindAt)}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3 size={14} />
              {formatTime(reminder.remindAt)}
            </span>

            {reminder.repeat &&
              reminder.repeat !== "none" && (
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Repeat2 size={14} />
                  {repeatLabels[
                    reminder.repeat as RepeatOption
                  ] ?? reminder.repeat}
                </span>
              )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            disabled={Boolean(actionId)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-40"
            aria-label="Edit reminder"
          >
            <Edit3 size={16} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={Boolean(actionId)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
            aria-label="Delete reminder"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ReminderSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: index * 0.05,
          }}
          className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/60"
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
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
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500 shadow-lg">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-slate-300">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-600">
        {description}
      </p>

      {action}
    </motion.div>
  );
}