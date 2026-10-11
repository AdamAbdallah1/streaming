import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEye,
  FiInfo,
  FiLogOut,
  FiPackage,
  FiPlus,
  FiFileText,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import Logo from "../assets/logo-black.png";
import { db } from "../../firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import Badge from "../components/ui/Badge";
import Button, { IconButton } from "../components/ui/Button";
import { inputClasses } from "../lib/inputStyles";
import EmptyState from "../components/ui/EmptyState";
import { PanelSkeleton } from "../components/ui/Feedback";
import { cn } from "../lib/cn";
import { ORDER_STATUS, ORDER_STATUS_META, STORAGE_KEYS } from "../lib/config";
import { formatDateTime } from "../lib/format";
import { setOrderStatus, subscribeOrders } from "../lib/orders";

const DURATIONS = ["Instant", "1-24 Hours", "Monthly", "Yearly"];
const PLAN_TYPES = ["Full Account", "1 User", "Private", "Shared", "Coins", "Top-Up"];
const CATEGORIES = ["Streaming", "Productivity", "Entertainment", "Tools", "Games", "Gift Cards", "Other"];

const STATUS_ACTIONS = [
  { status: ORDER_STATUS.PENDING_PAYMENT, label: "Pending payment" },
  { status: ORDER_STATUS.AWAITING_VERIFICATION, label: "Awaiting verification" },
  { status: ORDER_STATUS.CONFIRMED, label: "Confirmed" },
  { status: ORDER_STATUS.CANCELLED, label: "Cancelled" },
];

function toDate(value) {
  return value?.toDate?.() ?? null;
}

export default function Admin({ setIsAuthed }) {
  const nav = useNavigate();
  const [tab, setTab] = useState("catalogue");

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.adminAuth);
    sessionStorage.removeItem(STORAGE_KEYS.adminAuth);
    setIsAuthed(false);
    nav("/login");
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center gap-3 px-5 lg:px-8">
          <img src={Logo} alt="" className="size-7" width={28} height={28} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-ink">
              Cedars Admin
            </p>
            <p className="truncate text-[12px] text-ink-tertiary">Manage your catalogue</p>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="quiet" size="sm" onClick={() => nav("/prices")}>
              <FiEye size={15} /> View store
            </Button>
            <Button variant="quiet" size="sm" onClick={logout}>
              <FiLogOut size={15} /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div
          className="flex w-fit gap-1 rounded-[var(--radius-md)] border border-line bg-muted p-1"
          role="tablist"
          aria-label="Admin sections"
        >
          {[
            { id: "catalogue", label: "Catalogue", icon: FiPackage },
            { id: "orders", label: "Orders", icon: FiFileText },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-[13px] font-medium transition-colors duration-150",
                tab === item.id
                  ? "bg-surface text-ink shadow-card"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>

        {tab === "catalogue" ? <CatalogueTab /> : <OrdersTab />}
      </main>
    </div>
  );
}

function CatalogueTab() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onSnapshot(collection(db, "services"), (snapshot) => {
        setServices(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            plans: d.data().plans || [],
            category: d.data().category || "Other",
            serviceNote: d.data().serviceNote || "",
          }))
        );
        setLoading(false);
      }),
    []
  );

  const addService = async () => {
    await addDoc(collection(db, "services"), {
      name: "New Service",
      plans: [],
      category: "Other",
      serviceNote: "",
      imageUrl: "",
      updatedAt: serverTimestamp(),
    });
  };

  const removeService = async (id) => {
    if (window.confirm("Delete this service?")) {
      await deleteDoc(doc(db, "services", id));
    }
  };

  const updateServiceField = async (id, field, value) => {
    await updateDoc(doc(db, "services", id), { [field]: value, updatedAt: serverTimestamp() });
  };

  const updatePlanField = async (serviceId, plans, index, field, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    await updateDoc(doc(db, "services", serviceId), { plans: updatedPlans, updatedAt: serverTimestamp() });
  };

  const addPlan = async (service) => {
    const newPlans = [
      ...service.plans,
      { label: "New Plan", costPrice: "0", sellPrice: "0", discount: "0", duration: "Instant", type: "Coins", inStock: true },
    ];
    await updateDoc(doc(db, "services", service.id), { plans: newPlans, updatedAt: serverTimestamp() });
  };

  const removePlan = async (service, index) => {
    const newPlans = [...service.plans];
    newPlans.splice(index, 1);
    await updateDoc(doc(db, "services", service.id), { plans: newPlans, updatedAt: serverTimestamp() });
  };

  const exportToCSV = () => {
    let csv = "Service,Category,Plan,Type,Duration,Cost,Sell,Discount,FinalPrice,Profit,Stock\n";
    services.forEach((s) => {
      (s.plans || []).forEach((p) => {
        const finalPrice = (+p.sellPrice || 0) - (+p.discount || 0);
        const profit = finalPrice - (+p.costPrice || 0);
        csv += `"${s.name}","${s.category || 'Other'}","${p.label}","${p.type || 'N/A'}","${p.duration}",${p.costPrice},${p.sellPrice},${p.discount || 0},${finalPrice},${profit},${p.inStock !== false ? 'In Stock' : 'Out of Stock'}\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cedars_report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <FiSearch
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search services"
            aria-label="Search services"
            className={inputClasses(false, "pl-10")}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportToCSV}>
            <FiDownload size={15} /> Export CSV
          </Button>
          <Button onClick={addService}>
            <FiPlus size={15} /> Add service
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6">
          <PanelSkeleton />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((service) => {
            const isOpen = expanded === service.id;
            const serviceProfit = (service.plans || []).reduce(
              (acc, p) => acc + ((+p.sellPrice || 0) - (+p.discount || 0) - (+p.costPrice || 0)),
              0
            );

            return (
              <section
                key={service.id}
                className={cn(
                  "overflow-hidden rounded-[var(--radius-lg)] border bg-surface transition-colors duration-150",
                  isOpen ? "border-line-strong" : "border-line"
                )}
              >
                <div className="flex flex-wrap items-center gap-3 p-3.5">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : service.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <input
                      onClick={(event) => event.stopPropagation()}
                      aria-label="Service name"
                      className={inputClasses(false, "h-9 max-w-[10rem] text-[14px] md:max-w-xs")}
                      value={service.name}
                      onChange={(event) =>
                        updateServiceField(service.id, "name", event.target.value)
                      }
                    />
                    <span className="shrink-0 text-[12px] text-ink-tertiary tnum">
                      {service.plans.length} {service.plans.length === 1 ? "item" : "items"}
                    </span>
                    <span className="ml-auto shrink-0 text-ink-tertiary">
                      {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </span>
                  </button>

                  <IconButton
                    aria-label={`Delete ${service.name}`}
                    onClick={() => removeService(service.id)}
                    className="hover:bg-danger-soft hover:text-danger"
                  >
                    <FiTrash2 size={16} />
                  </IconButton>
                </div>

                {isOpen && (
                  <div className="border-t border-line bg-inset p-3.5 sm:p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="label-xs text-ink-tertiary">Category</span>
                        <select
                          value={service.category || "Other"}
                          onChange={(event) =>
                            updateServiceField(service.id, "category", event.target.value)
                          }
                          className={inputClasses(false, "mt-1.5 h-10")}
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="label-xs flex items-center gap-1 text-warning">
                          <FiInfo size={11} /> Service note
                        </span>
                        <input
                          placeholder="e.g. 1 User (Mobile) — Full Account (TV + Mobile)"
                          value={service.serviceNote || ""}
                          onChange={(event) =>
                            updateServiceField(service.id, "serviceNote", event.target.value)
                          }
                          className={inputClasses(false, "mt-1.5 h-10")}
                        />
                      </label>
                    </div>

                    <div className="mt-4 space-y-3">
                      {service.plans.map((plan, planIndex) => {
                        const planProfit =
                          (+plan.sellPrice || 0) - (+plan.discount || 0) - (+plan.costPrice || 0);
                        const inStock = plan.inStock !== false;
                        const isCoin = plan.type === "Coins" || plan.type === "Top-Up";

                        return (
                          <div
                            key={planIndex}
                            className={cn(
                              "grid gap-3 rounded-[var(--radius-md)] border p-3 md:grid-cols-4 lg:grid-cols-8",
                              isCoin ? "border-warning-line bg-warning-soft" : "border-line bg-surface"
                            )}
                          >
                            <PlanCell label={isCoin ? "Units" : "Plan name"}>
                              <input
                                aria-label="Plan name"
                                className={inputClasses(false, "h-9 text-[14px]")}
                                value={plan.label}
                                onChange={(event) =>
                                  updatePlanField(service.id, service.plans, planIndex, "label", event.target.value)
                                }
                              />
                            </PlanCell>

                            <PlanCell label="Type">
                              <select
                                aria-label="Plan type"
                                className={inputClasses(false, "h-9 text-[14px]")}
                                value={plan.type || "Full Account"}
                                onChange={(event) =>
                                  updatePlanField(service.id, service.plans, planIndex, "type", event.target.value)
                                }
                              >
                                {PLAN_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </PlanCell>

                            <PlanCell label="Cost ($)">
                              <input
                                aria-label="Cost"
                                className={inputClasses(false, "h-9 text-[14px] tnum")}
                                value={plan.costPrice ?? ""}
                                onChange={(event) =>
                                  updatePlanField(service.id, service.plans, planIndex, "costPrice", event.target.value)
                                }
                              />
                            </PlanCell>

                            <PlanCell label="Sell ($)">
                              <input
                                aria-label="Sell price"
                                className={inputClasses(false, "h-9 text-[14px] tnum")}
                                value={plan.sellPrice ?? ""}
                                onChange={(event) =>
                                  updatePlanField(service.id, service.plans, planIndex, "sellPrice", event.target.value)
                                }
                              />
                            </PlanCell>

                            <PlanCell label="Discount ($)">
                              <input
                                aria-label="Discount"
                                className={inputClasses(false, "h-9 text-[14px] tnum")}
                                value={plan.discount ?? "0"}
                                onChange={(event) =>
                                  updatePlanField(service.id, service.plans, planIndex, "discount", event.target.value)
                                }
                              />
                            </PlanCell>

                            <PlanCell label="Profit">
                              <p
                                className={cn(
                                  "flex h-9 items-center text-[14px] font-semibold tnum",
                                  planProfit >= 0 ? "text-positive" : "text-danger"
                                )}
                              >
                                ${planProfit.toFixed(2)}
                              </p>
                            </PlanCell>

                            <PlanCell label="Stock">
                              <button
                                type="button"
                                onClick={() =>
                                  updatePlanField(service.id, service.plans, planIndex, "inStock", !inStock)
                                }
                                className={cn(
                                  "flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border text-[12px] font-medium transition-colors duration-150",
                                  inStock
                                    ? "border-positive-line bg-positive-soft text-positive"
                                    : "border-danger-line bg-danger-soft text-danger"
                                )}
                              >
                                <span className={cn("size-1.5 rounded-full", inStock ? "bg-positive" : "bg-danger")} />
                                {inStock ? "In stock" : "Out"}
                              </button>
                            </PlanCell>

                            <PlanCell label="Duration">
                              <select
                                aria-label="Duration"
                                className={inputClasses(false, "h-9 text-[14px]")}
                                value={plan.duration || ""}
                                onChange={(event) =>
                                  updatePlanField(service.id, service.plans, planIndex, "duration", event.target.value)
                                }
                              >
                                <option value="">—</option>
                                {DURATIONS.map((duration) => (
                                  <option key={duration} value={duration}>
                                    {duration}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removePlan(service, planIndex)}
                                className="mt-1 text-[12px] text-ink-tertiary transition-colors hover:text-danger"
                              >
                                Delete
                              </button>
                            </PlanCell>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <Button variant="quiet" size="sm" onClick={() => addPlan(service)}>
                        <FiPlus size={14} /> Add item
                      </Button>
                      <p className="text-[13px] text-ink-secondary">
                        Total service profit:{" "}
                        <span className="font-semibold text-positive tnum">
                          ${serviceProfit.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          className="mt-6"
          icon={<FiPackage size={18} />}
          title={services.length === 0 ? "No services yet" : "No matching services"}
          description={
            services.length === 0
              ? "Add your first service to publish it in the store."
              : "Try a different search term."
          }
          action={services.length === 0 && <Button onClick={addService}>Add service</Button>}
        />
      )}
    </>
  );
}

function PlanCell({ label, children }) {
  return (
    <label className="block">
      <span className="label-xs block text-ink-tertiary">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(
    () =>
      subscribeOrders(
        (next) => {
          setOrders(next);
          setLoading(false);
        },
        () => setLoading(false)
      ),
    []
  );

  const counts = useMemo(() => {
    const result = {};
    for (const order of orders) {
      const status = order.status || ORDER_STATUS.PENDING_PAYMENT;
      result[status] = (result[status] || 0) + 1;
    }
    return result;
  }, [orders]);

  const changeStatus = async (reference, status) => {
    setUpdating(reference);
    try {
      await setOrderStatus(reference, status);
    } catch {
      /* surfaced by the live snapshot not changing */
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_ACTIONS.map((action) => (
          <Badge
            key={action.status}
            tone={
              ORDER_STATUS_META[action.status]?.tone === "info"
                ? "brand"
                : ORDER_STATUS_META[action.status]?.tone
            }
          >
            {action.label}: {counts[action.status] || 0}
          </Badge>
        ))}
      </div>

      <p className="mt-4 max-w-2xl rounded-[var(--radius-md)] border border-line bg-inset px-4 py-3 text-[12px] leading-5 text-ink-secondary">
        Customers see these statuses live on their invoice page. Marking an order{" "}
        <strong className="font-semibold text-ink">Confirmed</strong> is the only
        action that verifies a Whish transfer — check your Whish app first.
      </p>

      {loading ? (
        <div className="mt-6">
          <PanelSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<FiFileText size={18} />}
          title="No orders yet"
          description="Orders placed in the store will appear here with their status."
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-surface">
          <table className="w-full min-w-[46rem] text-left text-[13px]">
            <thead className="border-b border-line">
              <tr>
                {["Invoice", "Customer", "Items", "Total", "Placed", "Status"].map((heading) => (
                  <th key={heading} className="label-xs px-4 py-3 font-semibold text-ink-tertiary">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {orders.map((order) => {
                const status = order.status || ORDER_STATUS.PENDING_PAYMENT;
                const meta = ORDER_STATUS_META[status];
                const placedAt = toDate(order.createdAt);

                return (
                  <tr key={order.reference} className="align-top">
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-ink tnum">{order.reference}</span>
                      <span className="mt-0.5 block text-[12px] text-ink-tertiary">
                        {order.payment?.method || "Whish Money"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block text-ink">{order.customer?.name || "—"}</span>
                      <span className="block text-[12px] text-ink-tertiary tnum">
                        {order.customer?.phone || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary">
                      {(order.lines || [])
                        .map((line) => `${line.serviceName} ${line.label}`)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-ink tnum">
                      ${(order.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-ink-tertiary tnum">
                      {placedAt ? formatDateTime(placedAt) : order.placedAtLabel || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={meta?.tone === "info" ? "brand" : meta?.tone}>
                          {meta?.label || status}
                        </Badge>
                        {STATUS_ACTIONS.filter((action) => action.status !== status).map((action) => (
                          <button
                            key={action.status}
                            type="button"
                            disabled={updating === order.reference}
                            onClick={() => changeStatus(order.reference, action.status)}
                            className="rounded-[var(--radius-sm)] border border-line bg-surface px-2 py-1 text-[12px] text-ink-secondary transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:opacity-50"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                      {order.customer?.notes && (
                        <p className="mt-1.5 max-w-xs text-[12px] text-ink-tertiary">
                          Note: {order.customer.notes}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
