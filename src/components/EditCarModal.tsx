'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Worker, WashRecordWithWorker, WashType, PaymentType } from '@/types';
import { Loader2 } from 'lucide-react';

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: WashRecordWithWorker | null;
  workers: Worker[];
}

const washTypes: { value: WashType; label: string; color: string }[] = [
  { value: 'INNER', label: 'Inner', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'OUTER', label: 'Outer', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'FULL', label: 'Full', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'FREE', label: 'Free', color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const paymentTypes: { value: PaymentType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'INSTAPAY', label: 'InstaPay' },
];

export default function EditCarModal({ isOpen, onClose, onSuccess, record, workers }: EditCarModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    carType: '',
    washType: 'OUTER' as WashType,
    workerId: '',
    paymentType: '' as PaymentType | '',
    amountPaid: '',
    tipAmount: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (record && isOpen) {
      setFormData({
        plateNumber: record.plateNumber,
        carType: record.carType || '',
        washType: record.washType,
        workerId: record.workerId || '',
        paymentType: record.paymentType || '',
        amountPaid: record.amountPaid.toString(),
        tipAmount: record.tipAmount.toString(),
        notes: record.notes || '',
      });
      setErrors({});
    }
  }, [record, isOpen]);

  const isFreeWash = formData.washType === 'FREE';
  const activeWorkers = workers.filter(w => w.isActive);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = 'Plate number is required';
    }

    if (!isFreeWash && formData.amountPaid && parseFloat(formData.amountPaid) > 0) {
      if (!formData.paymentType) {
        newErrors.paymentType = 'Payment type is required when amount > 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !validate()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/wash-records/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plateNumber: formData.plateNumber.trim().toUpperCase(),
          carType: formData.carType.trim() || null,
          washType: formData.washType,
          workerId: formData.workerId || null,
          paymentType: isFreeWash ? null : (formData.paymentType || null),
          amountPaid: isFreeWash ? 0 : parseFloat(formData.amountPaid) || 0,
          tipAmount: parseFloat(formData.tipAmount) || 0,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Failed to update record' });
      }
    } catch {
      setErrors({ submit: 'Failed to update record' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Car Record" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plate Number */}
        <div>
          <label className="label">Plate Number *</label>
          <input
            type="text"
            className="input uppercase"
            value={formData.plateNumber}
            onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
          />
          {errors.plateNumber && <p className="text-sm text-red-500 mt-1">{errors.plateNumber}</p>}
        </div>

        {/* Car Type */}
        <div>
          <label className="label">Car Type</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Hyundai Elantra, Toyota Corolla"
            value={formData.carType}
            onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
          />
        </div>

        {/* Wash Type */}
        <div>
          <label className="label">Wash Type *</label>
          <div className="grid grid-cols-4 gap-2">
            {washTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, washType: type.value })}
                className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.washType === type.value
                    ? type.color + ' border-current'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Worker */}
        <div>
          <label className="label">Worker</label>
          <select
            className="select"
            value={formData.workerId}
            onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
          >
            <option value="">Select worker...</option>
            {activeWorkers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment */}
        {!isFreeWash && (
          <>
            <div>
              <label className="label">Payment Type</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentType: type.value })}
                    className={`py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.paymentType === type.value
                        ? 'bg-primary-50 text-primary-700 border-primary-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {errors.paymentType && <p className="text-sm text-red-500 mt-1">{errors.paymentType}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount (EGP)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Tip (EGP)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="0.01"
                  value={formData.tipAmount}
                  onChange={(e) => setFormData({ ...formData, tipAmount: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {isFreeWash && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Free wash - no payment required.</p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
