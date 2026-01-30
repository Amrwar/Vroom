"use client";

import { useState, useRef } from "react";
import { WashRecord, Worker } from "@prisma/client";
import { Search, Clock, CheckCircle, Edit2, Trash2, Loader2, Check, DollarSign, MessageCircle, ChevronLeft, ChevronRight, XCircle, Camera, Image } from "lucide-react";
import clsx from "clsx";
import ImageProofModal from "./ImageProofModal";

type WashRecordWithWorker = WashRecord & { worker: Worker | null };

interface WashRecordsTableProps {
  records: WashRecordWithWorker[];
  onFinish: (id: string, phoneNumber?: string | null) => void;
  onCancel: (record: WashRecordWithWorker) => void;
  onEdit: (record: WashRecordWithWorker) => void;
  onDelete: (id: string) => void;
  onTogglePayment: (id: string, received: boolean) => void;
  onUpdateRecord: () => void;
  loading?: boolean;
}

const washTypeColors: Record<string, string> = {
  INNER: "badge-blue",
  OUTER: "badge-green",
  FULL: "badge-purple",
  FREE: "badge-gray",
};

const statusColors: Record<string, string> = {
  IN_PROGRESS: "badge-yellow",
  FINISHED: "badge-green",
  CANCELLED: "badge-red",
};

const ITEMS_PER_PAGE = 10;

export default function WashRecordsTable({
  records,
  onFinish,
  onCancel,
  onEdit,
  onDelete,
  onTogglePayment,
  onUpdateRecord,
  loading,
}: WashRecordsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [togglingPayment, setTogglingPayment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<{ url: string; plateNumber: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      (record.carType && record.carType.toLowerCase().includes(search.toLowerCase())) ||
      (record.phoneNumber && record.phoneNumber.includes(search));
    const matchesStatus = statusFilter === "ALL" || record.status === statusFilter;
    const matchesType = typeFilter === "ALL" || record.washType === typeFilter;
    const matchesPayment =
      paymentFilter === "ALL" ||
      (paymentFilter === "RECEIVED" && record.paymentReceived) ||
      (paymentFilter === "PENDING" && !record.paymentReceived);
    return matchesSearch && matchesStatus && matchesType && matchesPayment;
  });

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

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

  const handleUploadClick = (recordId: string) => {
    setSelectedRecordId(recordId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRecordId) return;

    setUploadingProof(selectedRecordId);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch(`/api/wash-records/${selectedRecordId}/proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instapayProof: base64 }),
        });

        if (response.ok) {
          onUpdateRecord();
        }
        setUploadingProof(null);
        setSelectedRecordId(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload proof:", error);
      setUploadingProof(null);
      setSelectedRecordId(null);
    }

    e.target.value = "";
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        
        className="hidden"
      />

      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plate, car type, or phone..."
              className="input pl-10"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FINISHED">Finished</option>
              <option value="CANCELLED">Left/Cancelled</option>
            </select>
            <select
              className="select"
              value={typeFilter}
              onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
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
              onChange={(e) => handleFilterChange(setPaymentFilter, e.target.value)}
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
        <>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Car Type</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Worker</th>
                  <th>Time</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th className="text-center">Proof</th>
                  <th className="text-center">Received</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className={clsx("animate-fade-in", record.status === "CANCELLED" && "bg-red-50")}>
                    <td className="font-medium text-gray-900">
                      <span className="flex items-center gap-2">
                        {record.status === "CANCELLED" && (
                          <span title="Left without completing"><XCircle className="w-4 h-4 text-red-500" /></span>
                        )}
                        {record.plateNumber}
                      </span>
                    </td>
                    <td className="text-gray-600">{record.carType || "-"}</td>
                    <td className="text-gray-600">
                      {record.phoneNumber ? (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-green-600" />
                          {record.phoneNumber}
                        </span>
                      ) : "-"}
                    </td>
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
                      {record.paymentType === "INSTAPAY" && (
                        <>
                          {record.instapayProof ? (
                            <button
                              onClick={() => setViewingProof({ url: record.instapayProof!, plateNumber: record.plateNumber })}
                              className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center mx-auto"
                              title="View proof"
                            >
                              <Image className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUploadClick(record.id)}
                              disabled={uploadingProof === record.id}
                              className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center mx-auto"
                              title="Upload proof"
                            >
                              {uploadingProof === record.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Camera className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td className="text-center">
                      {record.washType !== "FREE" && record.status !== "CANCELLED" && (
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
                        {record.status === "IN_PROGRESS" ? "In Progress" : record.status === "FINISHED" ? "Finished" : "Left"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {record.status === "IN_PROGRESS" && (
                          <>
                            <button
                              onClick={() => onFinish(record.id, record.phoneNumber)}
                              className="btn btn-sm btn-ghost text-green-600 hover:bg-green-50"
                              title="Finish"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onCancel(record)}
                              className="btn btn-sm btn-ghost text-amber-600 hover:bg-amber-50"
                              title="Mark as Left"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredRecords.length)} of {filteredRecords.length} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={clsx(
                        "w-8 h-8 rounded-lg text-sm font-medium",
                        currentPage === page
                          ? "bg-red-600 text-white"
                          : "hover:bg-gray-100 text-gray-600"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {viewingProof && (
        <ImageProofModal
          isOpen={!!viewingProof}
          onClose={() => setViewingProof(null)}
          imageUrl={viewingProof.url}
          plateNumber={viewingProof.plateNumber}
        />
      )}
    </div>
  );
}
