'use client';

import { useState, useEffect, useCallback } from 'react';
import { WashRecordWithWorker, Worker, DashboardStats, FilterParams } from '@/types';
import { formatCairoDate } from '@/lib/date-utils';
import StatsCard from '@/components/StatsCard';
import WashRecordsTable from '@/components/WashRecordsTable';
import AddCarModal from '@/components/AddCarModal';
import EditCarModal from '@/components/EditCarModal';
import FinishModal from '@/components/FinishModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import {
  Car,
  Clock,
  CheckCircle,
  DollarSign,
  Gift,
  Banknote,
  Smartphone,
  Plus,
  Download,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [records, setRecords] = useState<WashRecordWithWorker[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRecord, setEditRecord] = useState<WashRecordWithWorker | null>(null);
  const [finishRecord, setFinishRecord] = useState<WashRecordWithWorker | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<WashRecordWithWorker | null>(null);

  const today = formatCairoDate(new Date());

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch(`/api/wash-records?date=${today}`);
      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  }, [today]);

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch('/api/workers');
      const data = await response.json();
      if (data.success) {
        setWorkers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRecords(), fetchWorkers()]);
    setLoading(false);
  }, [fetchRecords, fetchWorkers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  };

  const handleAddWorker = async (name: string): Promise<Worker> => {
    const response = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (data.success) {
      setWorkers([...workers, data.data]);
      return data.data;
    }
    throw new Error(data.error || 'Failed to add worker');
  };

  const handleExportDaily = () => {
    window.open(`/api/export/daily?date=${today}`, '_blank');
  };

  // Calculate stats
  const stats: DashboardStats = {
    totalCars: records.length,
    inProgress: records.filter((r) => r.status === 'IN_PROGRESS').length,
    finished: records.filter((r) => r.status === 'FINISHED').length,
    totalRevenue: records.reduce((sum, r) => sum + r.amountPaid, 0),
    totalTips: records.reduce((sum, r) => sum + r.tipAmount, 0),
    totalCash: records.filter((r) => r.paymentType === 'CASH').reduce((sum, r) => sum + r.amountPaid, 0),
    totalInstapay: records.filter((r) => r.paymentType === 'INSTAPAY').reduce((sum, r) => sum + r.amountPaid, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Dashboard</h1>
          <p className="text-gray-500">{formatCairoDate(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={handleExportDaily} className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Car
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatsCard title="Total Cars" value={stats.totalCars} icon={Car} color="blue" />
        <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} color="yellow" />
        <StatsCard title="Finished" value={stats.finished} icon={CheckCircle} color="green" />
        <StatsCard
          title="Revenue"
          value={`${stats.totalRevenue} EGP`}
          icon={DollarSign}
          color="purple"
        />
        <StatsCard title="Tips" value={`${stats.totalTips} EGP`} icon={Gift} color="green" />
        <StatsCard title="Cash" value={`${stats.totalCash} EGP`} icon={Banknote} color="gray" />
        <StatsCard
          title="InstaPay"
          value={`${stats.totalInstapay} EGP`}
          icon={Smartphone}
          color="blue"
        />
      </div>

      {/* Records Table */}
      <div className="card p-5">
        <WashRecordsTable
          records={records}
          workers={workers}
          filters={filters}
          onFiltersChange={setFilters}
          onFinish={setFinishRecord}
          onEdit={setEditRecord}
          onDelete={setDeleteRecord}
        />
      </div>

      {/* Modals */}
      <AddCarModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchRecords}
        workers={workers}
        onAddWorker={handleAddWorker}
      />

      <EditCarModal
        isOpen={!!editRecord}
        onClose={() => setEditRecord(null)}
        onSuccess={fetchRecords}
        record={editRecord}
        workers={workers}
      />

      <FinishModal
        isOpen={!!finishRecord}
        onClose={() => setFinishRecord(null)}
        onSuccess={fetchRecords}
        record={finishRecord}
      />

      <DeleteConfirmModal
        isOpen={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onSuccess={fetchRecords}
        record={deleteRecord}
      />
    </div>
  );
}
