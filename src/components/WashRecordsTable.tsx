"use client";

import { useState } from "react";
import { WashRecord, Worker, WashType, PaymentType, Status } from "@prisma/client";
import { Search, Filter, Clock, CheckCircle, Edit2, Trash2, Loader2, Check, X, DollarSign } from "lucide-react";
import clsx from "clsx";

type WashRecordWithWorker = WashRecord & { worker: Worker | null };

interface WashRecordsTableProps {
  records: WashRecordWithWorker[];
  onFinish: (id: string) => void;
  onEdit: (record: WashRecordWithWorker) => void;
  onDelete: (id: string) => void;
  onTogglePayment: (id: string, received: boolean) => void;
  loading?: boolean;
}

const washTypeColors: Record<WashType, string> = {
  INNER: "badge-blue",
  OUTER: "badge-green",
  FULL: "badge-purple",
  FREE: "badge-gray",
};

const statusColors: Record<Status, string> = {
  IN_PROGRESS: "badge-yellow",
  FINISHED: "badge-green",
};

export default function WashRecordsTable({
  records,
  onFinish,
  onEdit,
  onDelete,
  onTogglePayment,
  loading,
}: WashRecordsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<WashType | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "RECEIVED" | "PENDING">("ALL");
  const [togglingPayment, setTogglingPayment] = useState<string | null>(null);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      (record.carType && record.carType.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || record.status === statusFilter;
    const matchesType = typeFilter === "ALL" || record.washType === typeFilter;
    const matchesPayment =
      paymentFilter === "ALL" ||
      (paymentFilter === "RECEIVED" && record.paymentReceived) ||
      (paymentFilter === "PENDING" && !record.paymentReceived);
    return matchesSearch && matchesStatus && matchesType && matchesPayment;
  });

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTogglePayment = async (id: string, currentStatus: boolean) => {
    setTogglingPayment(id);
    await onTogglePayment(id, !currentStatus);
    setTogglingPayment(null);
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading records...</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plate or car type..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
            >
              <option value="ALL">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FINISHED">Finished</option>
            </select>
            <select
              className="select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as WashType | "ALL")}
            >
              <option value="ALL">All Types</option>
              <option value="INNER">Inner</option>
              <option value="OUTER">Outer</option>
              <option value="FULL">Full</option>
              <option value="FREE">Free</option>
            </select>
            <select
              className="select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as "ALL" | "RECEIVED" | "PENDING")}
            >
              <option value="ALL">All Payments</option>
              <option value="RECEIVED">Received</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">No records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Plate</th>
                <th>Car Type</th>
                <th>Type</th>
                <th>Worker</th>
                <th>Time</th>
                <th>Payment</th>
                <th>Amount</th>
                <th className="text-center">Received</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="animate-fade-in">
                  <td className="font-medium text-gray-900">{record.plateNumber}</td>
                  <td className="text-gray-600">{record.carType || "-"}</td>
                  <td>
                    <span className={`badge ${washTypeColors[record.washType]}`}>
                      {record.washType}
                    </span>
                  </td>
                  <td className="text-gray-600">{record.worker?.name || "-"}</td>
                  <td className="text-gray-600">{formatTime(record.entryTime)}</td>
                  <td>
                    {record.paymentType ? (
                      <span className={`badge ${record.paymentType === "CASH" ? "badge-green" : "badge-blue"}`}>
                        {record.paymentType}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="text-gray-900">
                    {record.amountPaid > 0 ? `${record.amountPaid} EGP` : "-"}
                    {record.tipAmount > 0 && (
                      <span className="text-green-600 text-xs ml-1">(+{record.tipAmount})</span>
                    )}
                  </td>
                  <td className="text-center">
                    {record.washType !== "FREE" && (
                      <button
                        onClick={() => handleTogglePayment(record.id, record.paymentReceived)}
                        disabled={togglingPayment === record.id}
                        className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          record.paymentReceived
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        )}
                        title={record.paymentReceived ? "Payment received" : "Mark as received"}
                      >
                        {togglingPayment === record.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : record.paymentReceived ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <DollarSign className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${statusColors[record.status]}`}>
                      {record.status === "IN_PROGRESS" ? "In Progress" : "Finished"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {record.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => onFinish(record.id)}
                          className="btn btn-sm btn-ghost text-green-600 hover:bg-green-50"
                          title="Finish"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(record)}
                        className="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
