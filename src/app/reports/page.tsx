"use client";

import { useState, useEffect, useCallback } from "react";
import { WashRecord, Worker } from "@prisma/client";
import StatsCard from "@/components/StatsCard";
import {
  Car,
  CheckCircle,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Download,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

type WashRecordWithWorker = WashRecord & { worker: Worker | null };

const washTypeBadges: Record<string, string> = {
  INNER: "badge-blue",
  OUTER: "badge-green",
  FULL: "badge-purple",
  FREE: "badge-gray",
};

const formatDate = (date: Date | string, format: string) => {
  const d = new Date(date);
  if (format === "yyyy-MM") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (format === "MMM d") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString();
};

const formatTime = (date: Date | string) => {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export default function ReportsPage() {
  const [records, setRecords] = useState<WashRecordWithWorker[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => formatDate(new Date(), "yyyy-MM"));

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wash-records?month=${selectedMonth}`);
      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch("/api/workers");
      const data = await response.json();
      if (data.success) {
        setWorkers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchWorkers();
  }, [fetchRecords, fetchWorkers]);

  const handlePreviousMonth = () => {
    const date = new Date(`${selectedMonth}-01`);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(formatDate(date, "yyyy-MM"));
  };

  const handleNextMonth = () => {
    const date = new Date(`${selectedMonth}-01`);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(formatDate(date, "yyyy-MM"));
  };

  const handleExportMonthly = () => {
    window.open(`/api/export/monthly?month=${selectedMonth}`, "_blank");
  };

  // Calculate stats - only InstaPay tips
  const instapayTips = records
    .filter((r) => r.paymentType === "INSTAPAY")
    .reduce((sum, r) => sum + r.tipAmount, 0);

  const totalRevenue = records.reduce((sum, r) => sum + r.amountPaid, 0);
  const netRevenue = totalRevenue - instapayTips;

  const stats = {
    totalCars: records.length,
    inProgress: records.filter((r) => r.status === "IN_PROGRESS").length,
    finished: records.filter((r) => r.status === "FINISHED").length,
    totalRevenue,
    instapayTips,
    netRevenue,
    totalCash: records.filter((r) => r.paymentType === "CASH").reduce((sum, r) => sum + r.amountPaid, 0),
    totalInstapay: records.filter((r) => r.paymentType === "INSTAPAY").reduce((sum, r) => sum + r.amountPaid, 0),
  };

  // Calculate breakdown by wash type
  const byWashType = records.reduce((acc, r) => {
    if (!acc[r.washType]) {
      acc[r.washType] = { count: 0, revenue: 0 };
    }
    acc[r.washType].count++;
    acc[r.washType].revenue += r.amountPaid;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  // Calculate breakdown by worker - only InstaPay tips
  const byWorker = records.reduce((acc, r) => {
    const name = r.worker?.name || "Unassigned";
    if (!acc[name]) {
      acc[name] = { count: 0, revenue: 0, instapayTips: 0 };
    }
    acc[name].count++;
    acc[name].revenue += r.amountPaid;
    if (r.paymentType === "INSTAPAY") {
      acc[name].instapayTips += r.tipAmount;
    }
    return acc;
  }, {} as Record<string, { count: number; revenue: number; instapayTips: number }>);

  const monthDisplay = new Date(`${selectedMonth}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reports</h1>
          <p className="text-gray-500">View and export monthly data</p>
        </div>
        <button onClick={handleExportMonthly} className="btn btn-primary">
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            <span className="text-lg font-semibold text-gray-900">{monthDisplay}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input w-40 ml-4"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <StatsCard title="Total Cars" value={stats.totalCars} icon={Car} color="blue" />
            <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} color="yellow" />
            <StatsCard title="Finished" value={stats.finished} icon={CheckCircle} color="green" />
            <StatsCard title="Revenue" value={`${stats.totalRevenue} EGP`} icon={DollarSign} color="purple" />
            <StatsCard title="InstaPay Tips" value={`${stats.instapayTips} EGP`} icon={CreditCard} color="yellow" />
            <StatsCard title="Net Revenue" value={`${stats.netRevenue} EGP`} icon={TrendingUp} color="green" />
            <StatsCard title="Cash" value={`${stats.totalCash} EGP`} icon={Banknote} color="gray" />
            <StatsCard title="InstaPay" value={`${stats.totalInstapay} EGP`} icon={Smartphone} color="blue" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">By Wash Type</h3>
              <div className="space-y-3">
                {Object.entries(byWashType).map(([type, data]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={clsx("badge", washTypeBadges[type])}>{type}</span>
                      <span className="text-gray-600">{data.count} cars</span>
                    </div>
                    <span className="font-semibold text-gray-900">{data.revenue} EGP</span>
                  </div>
                ))}
                {Object.keys(byWashType).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data</p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">By Worker</h3>
              <div className="space-y-3">
                {Object.entries(byWorker)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([name, data]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-gray-500">
                          {data.count} cars
                          {data.instapayTips > 0 && (
                            <span className="text-amber-600"> ? InstaPay Tips: {data.instapayTips} EGP</span>
                          )}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">{data.revenue} EGP</span>
                    </div>
                  ))}
                {Object.keys(byWorker).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              All Records ({records.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Plate</th>
                    <th>Type</th>
                    <th>Worker</th>
                    <th>Entry</th>
                    <th>Duration</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>InstaPay Tip</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-gray-500">
                        No records for this month
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id}>
                        <td className="text-gray-600">
                          {formatDate(record.entryTime, "MMM d")}
                        </td>
                        <td>
                          <span className="font-mono font-semibold text-gray-900">
                            {record.plateNumber}
                          </span>
                        </td>
                        <td>
                          <span className={clsx("badge", washTypeBadges[record.washType])}>
                            {record.washType}
                          </span>
                        </td>
                        <td className="text-gray-700">{record.worker?.name || "-"}</td>
                        <td className="text-gray-600">{formatTime(record.entryTime)}</td>
                        <td className="text-gray-600">
                          {record.elapsedMinutes !== null ? `${record.elapsedMinutes} min` : "-"}
                        </td>
                        <td>
                          {record.paymentType ? (
                            <span
                              className={clsx(
                                "badge",
                                record.paymentType === "CASH" ? "badge-green" : "badge-blue"
                              )}
                            >
                              {record.paymentType}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="font-medium text-gray-900">
                          {record.amountPaid > 0 ? `${record.amountPaid} EGP` : "-"}
                        </td>
                        <td className="text-amber-600 font-medium">
                          {record.paymentType === "INSTAPAY" && record.tipAmount > 0
                            ? `${record.tipAmount} EGP`
                            : "-"}
                        </td>
                        <td>
                          <span
                            className={clsx(
                              "badge",
                              record.status === "FINISHED" ? "badge-green" : "badge-yellow"
                            )}
                          >
                            {record.status === "FINISHED" ? "Done" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
