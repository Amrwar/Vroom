'use client';

import { WashRecordWithWorker, Worker, FilterParams } from '@/types';
import { formatCairoTime } from '@/lib/date-utils';
import { CheckCircle, Edit2, Trash2, Clock, Timer } from 'lucide-react';
import clsx from 'clsx';

interface WashRecordsTableProps {
  records: WashRecordWithWorker[];
  workers: Worker[];
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onFinish: (record: WashRecordWithWorker) => void;
  onEdit: (record: WashRecordWithWorker) => void;
  onDelete: (record: WashRecordWithWorker) => void;
}

const washTypeBadges: Record<string, string> = {
  INNER: 'badge-blue',
  OUTER: 'badge-green',
  FULL: 'badge-purple',
  FREE: 'badge-gray',
};

const statusBadges: Record<string, { class: string; label: string }> = {
  IN_PROGRESS: { class: 'badge-yellow', label: 'In Progress' },
  FINISHED: { class: 'badge-green', label: 'Finished' },
};

export default function WashRecordsTable({
  records,
  workers,
  filters,
  onFiltersChange,
  onFinish,
  onEdit,
  onDelete,
}: WashRecordsTableProps) {
  const activeWorkers = workers.filter(w => w.isActive);

  const filteredRecords = records.filter((record) => {
    if (filters.status && filters.status !== 'ALL' && record.status !== filters.status) {
      return false;
    }
    if (filters.washType && filters.washType !== 'ALL' && record.washType !== filters.washType) {
      return false;
    }
    if (filters.workerId && filters.workerId !== 'ALL' && record.workerId !== filters.workerId) {
      return false;
    }
    if (filters.paymentType && filters.paymentType !== 'ALL' && record.paymentType !== filters.paymentType) {
      return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return record.plateNumber.toLowerCase().includes(search) || 
             (record.carType && record.carType.toLowerCase().includes(search));
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          className="input w-full sm:w-48"
          placeholder="Search plate or car..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
        <select
          className="select w-full sm:w-36"
          value={filters.status || 'ALL'}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as FilterParams['status'] })}
        >
          <option value="ALL">All Status</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="FINISHED">Finished</option>
        </select>
        <select
          className="select w-full sm:w-36"
          value={filters.washType || 'ALL'}
          onChange={(e) => onFiltersChange({ ...filters, washType: e.target.value as FilterParams['washType'] })}
        >
          <option value="ALL">All Types</option>
          <option value="INNER">Inner</option>
          <option value="OUTER">Outer</option>
          <option value="FULL">Full</option>
          <option value="FREE">Free</option>
        </select>
        <select
          className="select w-full sm:w-40"
          value={filters.workerId || 'ALL'}
          onChange={(e) => onFiltersChange({ ...filters, workerId: e.target.value })}
        >
          <option value="ALL">All Workers</option>
          {activeWorkers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </select>
        <select
          className="select w-full sm:w-36"
          value={filters.paymentType || 'ALL'}
          onChange={(e) => onFiltersChange({ ...filters, paymentType: e.target.value as FilterParams['paymentType'] })}
        >
          <option value="ALL">All Payment</option>
          <option value="CASH">Cash</option>
          <option value="INSTAPAY">InstaPay</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container bg-white">
        <table className="table">
          <thead>
            <tr>
              <th>Plate</th>
              <th>Car</th>
              <th>Type</th>
              <th>Worker</th>
              <th>Entry</th>
              <th>Finish</th>
              <th>Duration</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Tip</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="animate-fade-in">
                  <td>
                    <span className="font-mono font-semibold text-gray-900">{record.plateNumber}</span>
                  </td>
                  <td className="text-gray-700">
                    {record.carType || '-'}
                  </td>
                  <td>
                    <span className={clsx('badge', washTypeBadges[record.washType])}>
                      {record.washType}
                    </span>
                  </td>
                  <td className="text-gray-700">{record.worker?.name || '-'}</td>
                  <td>
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      {formatCairoTime(record.entryTime)}
                    </span>
                  </td>
                  <td>
                    {record.finishTime ? (
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        {formatCairoTime(record.finishTime)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {record.elapsedMinutes !== null ? (
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Timer className="w-3.5 h-3.5" />
                        {record.elapsedMinutes} min
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {record.paymentType ? (
                      <span className={clsx(
                        'badge',
                        record.paymentType === 'CASH' ? 'badge-green' : 'badge-blue'
                      )}>
                        {record.paymentType}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="font-medium text-gray-900">
                    {record.amountPaid > 0 ? `${record.amountPaid} EGP` : '-'}
                  </td>
                  <td className="text-emerald-600 font-medium">
                    {record.tipAmount > 0 ? `${record.tipAmount} EGP` : '-'}
                  </td>
                  <td>
                    <span className={clsx('badge', statusBadges[record.status].class)}>
                      {statusBadges[record.status].label}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {record.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => onFinish(record)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Finish"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(record)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(record)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredRecords.length > 0 && (
        <p className="text-sm text-gray-500 text-right">
          Showing {filteredRecords.length} of {records.length} records
        </p>
      )}
    </div>
  );
}
