"use client";

import { useState, useEffect, useCallback } from "react";
import { WashRecord, Worker } from "@prisma/client";
import AddCarModal from "@/components/AddCarModal";
import EditCarModal from "@/components/EditCarModal";
import FinishModal from "@/components/FinishModal";
import CancelModal from "@/components/CancelModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import WashRecordsTable from "@/components/WashRecordsTable";
import StatsCard from "@/components/StatsCard";
import { Plus, FileSpreadsheet, Car, Clock, CheckCircle, DollarSign, ChevronLeft, ChevronRight, Calendar, Banknote, CreditCard, XCircle } from "lucide-react";

type WashRecordWithWorker = WashRecord & { worker: Worker | null };

export default function DashboardPage() {
  const [records, setRecords] = useState<WashRecordWithWorker[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WashRecordWithWorker | null>(null);
  const [finishingRecord, setFinishingRecord] = useState<WashRecordWithWorker | null>(null);
  const [cancellingRecord, setCancellingRecord] = useState<WashRecordWithWorker | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<WashRecordWithWorker | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, workersRes] = await Promise.all([
        fetch(`/api/wash-records?date=${selectedDate}`),
        fetch("/api/workers"),
      ]);

      const recordsData = await recordsRes.json();
      const workersData = await workersRes.json();

      if (recordsData.success) setRecords(recordsData.data);
      if (workersData.success) setWorkers(workersData.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddWorker = async (name: string): Promise<Worker> => {
    const response = await fetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (data.success) {
      setWorkers((prev) => [...prev, data.data]);
      return data.data;
    }
    throw new Error(data.error);
  };

  const sendWhatsAppMessage = (phoneNumber: string) => {
    let formattedPhone = phoneNumber.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "2" + formattedPhone;
    }
    if (!formattedPhone.startsWith("20")) {
      formattedPhone = "20" + formattedPhone;
    }
    
    const message = encodeURIComponent("Hello! Your car is ready for pickup. Thank you for choosing VRoom CarWash!");
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleFinish = async (id: string, phoneNumber?: string | null) => {
    const record = records.find((r) => r.id === id);
    if (record) {
      setFinishingRecord(record);
    }
  };

  const handleFinishSuccess = () => {
    if (finishingRecord?.phoneNumber) {
      sendWhatsAppMessage(finishingRecord.phoneNumber);
    }
    fetchData();
  };

  const handleCancel = (record: WashRecordWithWorker) => {
    setCancellingRecord(record);
  };

  const handleDelete = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (record) setDeletingRecord(record);
  };

  const handleTogglePayment = async (id: string, received: boolean) => {
    try {
      const response = await fetch(`/api/wash-records/${id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReceived: received }),
      });

      if (response.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, paymentReceived: received } : r))
        );
      }
    } catch (error) {
      console.error("Failed to toggle payment:", error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/export/daily?date=${selectedDate}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carwash-${selectedDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
    } finally {
      setExporting(false);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const stats = {
    total: records.length,
    inProgress: records.filter((r) => r.status === "IN_PROGRESS").length,
    finished: records.filter((r) => r.status === "FINISHED").length,
    cancelled: records.filter((r) => r.status === "CANCELLED").length,
    revenue: records.reduce((sum, r) => sum + r.amountPaid, 0),
    cashReceived: records
      .filter((r) => r.paymentType === "CASH" && r.paymentReceived)
      .reduce((sum, r) => sum + r.amountPaid, 0),
    instapayReceived: records
      .filter((r) => r.paymentType === "INSTAPAY" && r.paymentReceived)
      .reduce((sum, r) => sum + r.amountPaid, 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isToday ? "Today's Dashboard" : "Dashboard"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => navigateDate("prev")}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-gray-600 border-none bg-transparent cursor-pointer hover:text-gray-900"
              />
            </div>
            <button
              onClick={() => navigateDate("next")}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium ml-2"
              >
                Go to Today
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting} className="btn btn-secondary">
            <FileSpreadsheet className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export"}
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Car
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatsCard title="Total Cars" value={stats.total} icon={Car} color="blue" />
        <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} color="yellow" />
        <StatsCard title="Finished" value={stats.finished} icon={CheckCircle} color="green" />
        <StatsCard title="Left" value={stats.cancelled} icon={XCircle} color="red" />
        <StatsCard title="Total Revenue" value={`${stats.revenue} EGP`} icon={DollarSign} color="purple" />
        <StatsCard title="Cash Received" value={`${stats.cashReceived} EGP`} icon={Banknote} color="green" />
        <StatsCard title="InstaPay Received" value={`${stats.instapayReceived} EGP`} icon={CreditCard} color="blue" />
      </div>

      <WashRecordsTable
        records={records}
        onFinish={handleFinish}
        onCancel={handleCancel}
        onEdit={setEditingRecord}
        onDelete={handleDelete}
        onTogglePayment={handleTogglePayment}
        onUpdateRecord={fetchData}
        loading={loading}
      />

      <AddCarModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
        workers={workers}
        onAddWorker={handleAddWorker}
      />

      {editingRecord && (
        <EditCarModal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={fetchData}
          record={editingRecord}
          workers={workers}
        />
      )}

      <FinishModal
        isOpen={!!finishingRecord}
        onClose={() => setFinishingRecord(null)}
        onSuccess={handleFinishSuccess}
        record={finishingRecord}
      />

      <CancelModal
        isOpen={!!cancellingRecord}
        onClose={() => setCancellingRecord(null)}
        onSuccess={fetchData}
        record={cancellingRecord}
      />

      <DeleteConfirmModal
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onSuccess={fetchData}
        record={deletingRecord}
      />
    </div>
  );
}
