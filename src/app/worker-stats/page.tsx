"use client";

import { useState, useEffect, useCallback } from "react";
import { Worker } from "@prisma/client";
import {
  Users,
  RefreshCw,
  Car,
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Wrench,
  UserCheck,
  UserX,
  Edit2,
  Check,
  X,
} from "lucide-react";
import clsx from "clsx";

interface WorkerStats {
  worker: Worker | null;
  stats: {
    totalCars: number;
    finishedCars: number;
    totalRevenue: number;
    instapayTips: number;
    cashRevenue: number;
    instapayRevenue: number;
    netRevenue: number;
    byWashType: {
      INNER: number;
      OUTER: number;
      FULL: number;
      FREE: number;
    };
  };
}

interface StatsData {
  period: string;
  startDate: string;
  endDate: string;
  workerStats: WorkerStats[];
  totals: {
    totalCars: number;
    finishedCars: number;
    totalRevenue: number;
    instapayTips: number;
    cashRevenue: number;
    instapayRevenue: number;
    netRevenue: number;
  };
}

type WorkerRole = "CARWASH" | "MECHANIC" | "BOTH";

const roleLabels: Record<WorkerRole, string> = {
  CARWASH: "Car Wash",
  MECHANIC: "Mechanic",
  BOTH: "Both",
};

const roleColors: Record<WorkerRole, string> = {
  CARWASH: "badge-blue",
  MECHANIC: "badge-purple",
  BOTH: "badge-green",
};

export default function WorkerStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerRole, setNewWorkerRole] = useState<WorkerRole>("CARWASH");
  const [addingWorker, setAddingWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<WorkerRole>("CARWASH");
  const [deletingWorker, setDeletingWorker] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch("/api/workers");
      const data = await response.json();
      if (data.success) setWorkers(data.data);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/worker-stats?period=${period}`;
      if (period === "day" || period === "week") {
        url += `&date=${selectedDate}`;
      } else if (period === "month") {
        url += `&month=${selectedMonth}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate, selectedMonth]);

  useEffect(() => {
    fetchWorkers();
    fetchStats();
  }, [fetchWorkers, fetchStats]);

  const handleAddWorker = async () => {
    if (!newWorkerName.trim()) return;
    
    setAddingWorker(true);
    try {
      const response = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkerName.trim(), role: newWorkerRole }),
      });
      const data = await response.json();
      if (data.success) {
        setWorkers((prev) => [...prev, data.data]);
        setNewWorkerName("");
        setNewWorkerRole("CARWASH");
        setShowAddWorker(false);
      }
    } catch (error) {
      console.error("Failed to add worker:", error);
    } finally {
      setAddingWorker(false);
    }
  };

  const handleUpdateRole = async (id: string) => {
    try {
      const response = await fetch(`/api/workers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await response.json();
      if (data.success) {
        setWorkers((prev) => prev.map((w) => (w.id === id ? data.data : w)));
        setEditingWorker(null);
      }
    } catch (error) {
      console.error("Failed to update worker:", error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setTogglingActive(id);
    try {
      const response = await fetch(`/api/workers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await response.json();
      if (data.success) {
        setWorkers((prev) => prev.map((w) => (w.id === id ? data.data : w)));
      }
    } catch (error) {
      console.error("Failed to toggle worker:", error);
    } finally {
      setTogglingActive(null);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    if (!confirm("Are you sure? This will deactivate the worker if they have records.")) return;
    
    setDeletingWorker(id);
    try {
      const response = await fetch(`/api/workers/${id}`, { method: "DELETE" });
      if (response.ok) {
        setWorkers((prev) => prev.filter((w) => w.id !== id));
        fetchWorkers(); // Refresh to get updated list
      }
    } catch (error) {
      console.error("Failed to delete worker:", error);
    } finally {
      setDeletingWorker(null);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    if (period === "day") {
      date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    } else if (period === "week") {
      date.setDate(date.getDate() + (direction === "next" ? 7 : -7));
    }
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + (direction === "next" ? 1 : -1), 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const formatDateRange = () => {
    if (!stats) return "";
    const start = new Date(stats.startDate);
    const end = new Date(stats.endDate);
    
    if (period === "day") {
      return start.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } else if (period === "week") {
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return start.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    }
  };

  const activeWorkers = workers.filter((w) => w.isActive);
  const inactiveWorkers = workers.filter((w) => !w.isActive);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers & Statistics</h1>
          <p className="text-gray-500">Manage workers and track performance</p>
        </div>
      </div>

      {/* Worker Management Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            Workers ({activeWorkers.length} active)
          </h3>
          <button
            onClick={() => setShowAddWorker(!showAddWorker)}
            className="btn btn-sm btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Worker
          </button>
        </div>

        {showAddWorker && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="input flex-1"
                placeholder="Worker name"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
              />
              <select
                className="select"
                value={newWorkerRole}
                onChange={(e) => setNewWorkerRole(e.target.value as WorkerRole)}
              >
                <option value="CARWASH">Car Wash</option>
                <option value="MECHANIC">Mechanic</option>
                <option value="BOTH">Both</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddWorker}
                  disabled={addingWorker || !newWorkerName.trim()}
                  className="btn btn-primary"
                >
                  {addingWorker ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
                <button
                  onClick={() => { setShowAddWorker(false); setNewWorkerName(""); }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {activeWorkers.map((worker) => (
            <div
              key={worker.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="font-semibold text-red-700">{worker.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{worker.name}</p>
                  {editingWorker === worker.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        className="select select-sm"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as WorkerRole)}
                      >
                        <option value="CARWASH">Car Wash</option>
                        <option value="MECHANIC">Mechanic</option>
                        <option value="BOTH">Both</option>
                      </select>
                      <button onClick={() => handleUpdateRole(worker.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingWorker(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={clsx("badge text-xs", roleColors[worker.role as WorkerRole] || "badge-gray")}>
                      {roleLabels[worker.role as WorkerRole] || worker.role}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingWorker(worker.id); setEditRole(worker.role as WorkerRole); }}
                  className="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50"
                  title="Edit role"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(worker.id, worker.isActive)}
                  disabled={togglingActive === worker.id}
                  className="btn btn-sm btn-ghost text-amber-600 hover:bg-amber-50"
                  title="Deactivate"
                >
                  {togglingActive === worker.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteWorker(worker.id)}
                  disabled={deletingWorker === worker.id}
                  className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                  title="Delete"
                >
                  {deletingWorker === worker.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {activeWorkers.length === 0 && (
            <p className="text-gray-500 text-center py-4">No active workers. Add one above!</p>
          )}
        </div>

        {inactiveWorkers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Inactive Workers ({inactiveWorkers.length})</p>
            <div className="space-y-2">
              {inactiveWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="font-semibold text-gray-500">{worker.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">{worker.name}</p>
                      <span className="badge badge-gray text-xs">{roleLabels[worker.role as WorkerRole] || worker.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(worker.id, worker.isActive)}
                    disabled={togglingActive === worker.id}
                    className="btn btn-sm btn-ghost text-green-600 hover:bg-green-50"
                    title="Reactivate"
                  >
                    {togglingActive === worker.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Period Selector */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["day", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  period === p
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {p === "day" ? "Daily" : p === "week" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
            <button
              onClick={() => period === "month" ? navigateMonth("prev") : navigateDate("prev")}
              className="btn btn-sm btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg min-w-[200px] justify-center">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">{formatDateRange()}</span>
            </div>

            <button
              onClick={() => period === "month" ? navigateMonth("next") : navigateDate("next")}
              className="btn btn-sm btn-secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading && <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Cars</p>
                <p className="text-xl font-bold text-blue-600">{stats.totals.totalCars}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">{stats.totals.totalRevenue} EGP</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">InstaPay Tips</p>
                <p className="text-xl font-bold text-amber-600">{stats.totals.instapayTips} EGP</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Net Revenue</p>
                <p className="text-xl font-bold text-emerald-600">{stats.totals.netRevenue} EGP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker Stats Table */}
      {stats && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" />
              Worker Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th className="text-center">Cars</th>
                  <th className="text-center">Inner</th>
                  <th className="text-center">Outer</th>
                  <th className="text-center">Full</th>
                  <th className="text-center">Free</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">
                    <span className="flex items-center justify-end gap-1 text-amber-600">
                      <CreditCard className="w-4 h-4" />
                      InstaPay Tips
                    </span>
                  </th>
                  <th className="text-right">
                    <span className="text-emerald-600">Net Revenue</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.workerStats.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">
                      No data for this period
                    </td>
                  </tr>
                ) : (
                  <>
                    {stats.workerStats.map((ws) => (
                      <tr key={ws.worker?.id || "unassigned"}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "w-9 h-9 rounded-full flex items-center justify-center",
                              ws.worker ? "bg-red-100" : "bg-gray-100"
                            )}>
                              <span className={clsx(
                                "font-semibold text-sm",
                                ws.worker ? "text-red-700" : "text-gray-500"
                              )}>
                                {ws.worker ? ws.worker.name.charAt(0).toUpperCase() : "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {ws.worker?.name || "Unassigned"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center font-semibold text-gray-900">{ws.stats.totalCars}</td>
                        <td className="text-center"><span className="badge badge-blue">{ws.stats.byWashType.INNER}</span></td>
                        <td className="text-center"><span className="badge badge-green">{ws.stats.byWashType.OUTER}</span></td>
                        <td className="text-center"><span className="badge badge-purple">{ws.stats.byWashType.FULL}</span></td>
                        <td className="text-center"><span className="badge badge-gray">{ws.stats.byWashType.FREE}</span></td>
                        <td className="text-right font-medium text-gray-900">{ws.stats.totalRevenue} EGP</td>
                        <td className="text-right">
                          {ws.stats.instapayTips > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">
                              {ws.stats.instapayTips} EGP
                            </span>
                          ) : (
                            <span className="text-gray-400">0 EGP</span>
                          )}
                        </td>
                        <td className="text-right font-bold text-emerald-600">{ws.stats.netRevenue} EGP</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="text-gray-900">Total</td>
                      <td className="text-center text-gray-900">{stats.totals.totalCars}</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-right text-gray-900">{stats.totals.totalRevenue} EGP</td>
                      <td className="text-right text-amber-600">{stats.totals.instapayTips} EGP</td>
                      <td className="text-right text-emerald-600">{stats.totals.netRevenue} EGP</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
