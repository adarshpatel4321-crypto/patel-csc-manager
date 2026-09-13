"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Edit3,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
  Zap,
  Power,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  category: string;
  charge: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ServiceForm = {
  name: string;
  category: string;
  charge: string;
  active: boolean;
};

const categories = ["All", "CSC", "Banking", "Other"];

const emptyForm: ServiceForm = {
  name: "",
  category: "CSC",
  charge: "",
  active: true,
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
    },
  },
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<Service | null>(null);

  const [deleteService, setDeleteService] =
    useState<Service | null>(null);

  const [form, setForm] =
    useState<ServiceForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadServices() {
    try {
      setLoading(true);

      const response = await fetch("/api/services", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load services");
      }

      const data = (await response.json()) as Service[];

      setServices(data);
    } catch (error) {
      console.error(error);
      setMessage("Services load થવામાં problem આવી.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" ||
        service.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [services, search, category]);

  const activeCount = useMemo(
    () => services.filter((service) => service.active).length,
    [services]
  );

  const inactiveCount = services.length - activeCount;

  const activePercentage =
    services.length > 0
      ? Math.round((activeCount / services.length) * 100)
      : 0;

  function openAddModal() {
    setEditingService(null);
    setForm({
      ...emptyForm,
    });
    setMessage("");
    setModalOpen(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);

    setForm({
      name: service.name,
      category: service.category,
      charge: String(service.charge),
      active: service.active,
    });

    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingService(null);
  }

  async function saveService() {
    const name = form.name.trim();
    const charge = Number(form.charge || 0);

    if (!name) {
      setMessage("Service name નાખવું જરૂરી છે.");
      return;
    }

    if (!Number.isFinite(charge) || charge < 0) {
      setMessage("Valid charge નાખો.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const url = editingService
        ? `/api/services/${editingService.id}`
        : "/api/services";

      const method = editingService ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category: form.category,
          charge,
          active: form.active,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Something went wrong"
        );
      }

      await loadServices();

      setModalOpen(false);
      setEditingService(null);

      setMessage(
        editingService
          ? "Service successfully updated."
          : "Service successfully added."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleService(service: Service) {
    try {
      const response = await fetch(
        `/api/services/${service.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: !service.active,
          }),
        }
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update status"
        );
      }

      setServices((current) =>
        current.map((item) =>
          item.id === service.id
            ? {
                ...item,
                active: !item.active,
              }
            : item
        )
      );

      setMessage(
        service.active
          ? `${service.name} disabled.`
          : `${service.name} enabled.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Status update થવામાં problem આવી."
      );
    }
  }

  async function confirmDelete() {
    if (!deleteService || deleting) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/services/${deleteService.id}`,
        {
          method: "DELETE",
        }
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete service"
        );
      }

      setServices((current) =>
        current.filter(
          (service) =>
            service.id !== deleteService.id
        )
      );

      setMessage("Service deleted successfully.");
      setDeleteService(null);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Delete failed."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-600/[0.08] blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full bg-orange-500/[0.07] blur-3xl"
        />

        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{
            opacity: 0,
            y: -15,
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
          <button
            type="button"
            onClick={() => window.history.back()}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-blue-500/25 hover:bg-blue-500/[0.06] hover:text-white"
          >
            <ArrowLeft
              size={17}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Back
          </button>

          <div className="mt-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="flex items-start gap-4">
              <motion.div
                whileHover={{
                  scale: 1.04,
                  rotate: 2,
                }}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400"
              >
                <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl" />

                <Settings2
                  size={26}
                  className="relative"
                />
              </motion.div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  Service Management
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Services
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                  Manage CSC services, charges and
                  availability from one place.
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={openAddModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:from-blue-500 hover:to-blue-400"
            >
              <Plus size={19} />
              Add Service
            </motion.button>
          </div>
        </motion.header>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/20"
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Total Services
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {services.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/10 bg-blue-500/10 text-blue-400">
                <Settings2 size={19} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/20"
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Active Services
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-400">
                  {activeCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/10 text-emerald-400">
                <Check size={19} />
              </div>
            </div>

            <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${activePercentage}%`,
                }}
                transition={{
                  duration: 0.7,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20"
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Inactive Services
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-400">
                  {inactiveCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/10 bg-orange-500/10 text-orange-400">
                <Power size={19} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Toolbar */}
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
            delay: 0.15,
            duration: 0.4,
          }}
          className="mb-6 rounded-2xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search services..."
                className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-10 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-blue-500/40 focus:bg-black/30"
              />

              <AnimatePresence>
                {search && (
                  <motion.button
                    type="button"
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                    }}
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={15} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="relative lg:w-56">
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/20 pl-10 pr-10 text-sm text-white outline-none transition focus:border-blue-500/40"
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#111827]"
                  >
                    {item === "All"
                      ? "All Categories"
                      : item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
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
              className="mb-5 overflow-hidden"
            >
              <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                <span>{message}</span>

                <button
                  type="button"
                  onClick={() => setMessage("")}
                  className="ml-4 rounded-lg p-1 text-blue-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Header */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Service List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredServices.length} service
              {filteredServices.length === 1
                ? ""
                : "s"} found
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]"
              />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-16 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/10 bg-blue-500/10 text-blue-400">
              <Settings2 size={27} />
            </div>

            <h3 className="text-lg font-semibold text-white">
              No services found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search || category !== "All"
                ? "Try changing your search or category filter."
                : "Add your first CSC service and set its service charge."}
            </p>

            {!search && category === "All" && (
              <motion.button
                type="button"
                whileTap={{
                  scale: 0.98,
                }}
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <Plus size={17} />
                Add First Service
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredServices.map((service) => (
              <motion.article
                key={service.id}
                variants={itemVariants}
                whileHover={{
                  y: -3,
                }}
                className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 ${
                  service.active
                    ? "border-white/10 bg-white/[0.035] hover:border-blue-500/20 hover:bg-white/[0.05]"
                    : "border-white/[0.07] bg-white/[0.02] opacity-[0.88] hover:opacity-100"
                }`}
              >
                <div
                  className={`pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 ${
                    service.active
                      ? "bg-blue-500/10 opacity-100 group-hover:bg-blue-500/15"
                      : "opacity-0"
                  }`}
                />

                <div className="relative">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                        }}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                          service.active
                            ? "border-blue-500/10 bg-blue-500/10 text-blue-400"
                            : "border-white/10 bg-white/[0.04] text-slate-500"
                        }`}
                      >
                        <Zap size={19} />
                      </motion.div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">
                          {service.name}
                        </h3>

                        <span className="mt-1 inline-block rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                          {service.category}
                        </span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleService(service)
                      }
                      title={
                        service.active
                          ? "Deactivate"
                          : "Activate"
                      }
                      aria-label={`Toggle ${service.name}`}
                      aria-pressed={service.active}
                      className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                        service.active
                          ? "bg-emerald-500 shadow-lg shadow-emerald-500/10"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                    >
                      <motion.span
                        animate={{
                          x: service.active ? 20 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="block h-4 w-4 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </div>

                  {/* Charge */}
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
                        Service Charge
                      </p>

                      <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                        ₹
                        {service.charge.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                        service.active
                          ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-500/10 bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {service.active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2 border-t border-white/[0.07] pt-4">
                    <motion.button
                      type="button"
                      whileTap={{
                        scale: 0.98,
                      }}
                      onClick={() =>
                        openEditModal(service)
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.06] hover:text-white"
                    >
                      <Edit3 size={15} />
                      Edit
                    </motion.button>

                    <motion.button
                      type="button"
                      whileTap={{
                        scale: 0.96,
                      }}
                      onClick={() =>
                        setDeleteService(service)
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/[0.04] text-red-400 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/10"
                      title="Delete"
                      aria-label={`Delete ${service.name}`}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.98,
              }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0d1422] p-5 shadow-2xl shadow-black/50 sm:p-6"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                    <Settings2 size={13} />

                    {editingService
                      ? "Edit Service"
                      : "New Service"}
                  </div>

                  <h2 className="text-xl font-bold text-white">
                    {editingService
                      ? "Update Service"
                      : "Add New Service"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Set service name, category and charge.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Service Name
                  </label>

                  <input
                    autoFocus
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. PAN Card"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-blue-500/40 focus:bg-black/30"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Category
                  </label>

                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category:
                            event.target.value,
                        }))
                      }
                      className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 pr-10 text-sm text-white outline-none transition focus:border-blue-500/40"
                    >
                      <option
                        value="CSC"
                        className="bg-[#111827]"
                      >
                        CSC
                      </option>

                      <option
                        value="Banking"
                        className="bg-[#111827]"
                      >
                        Banking
                      </option>

                      <option
                        value="Other"
                        className="bg-[#111827]"
                      >
                        Other
                      </option>
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                </div>

                {/* Charge */}
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
                      step="1"
                      value={form.charge}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          charge: event.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-4 text-sm text-white outline-none transition focus:border-blue-500/40"
                    />
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Service Active
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Available while creating transactions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        active: !current.active,
                      }))
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-all duration-300 ${
                      form.active
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                  >
                    <motion.span
                      animate={{
                        x: form.active ? 20 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="block h-5 w-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <motion.button
                  type="button"
                  whileTap={
                    !saving
                      ? {
                          scale: 0.98,
                        }
                      : undefined
                  }
                  onClick={saveService}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={17} />

                      {editingService
                        ? "Update Service"
                        : "Save Service"}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteService && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                if (!deleting) {
                  setDeleteService(null);
                }
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.97,
              }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1422] p-6 shadow-2xl shadow-black/50"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/10 text-red-400">
                <Trash2 size={24} />
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-xl font-bold text-white">
                  Delete Service?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-300">
                    {deleteService.name}
                  </span>
                  ?
                </p>

                <p className="mt-2 text-xs text-red-400/80">
                  This action cannot be undone.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteService(null)
                  }
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <motion.button
                  type="button"
                  whileTap={
                    !deleting
                      ? {
                          scale: 0.98,
                        }
                      : undefined
                  }
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}