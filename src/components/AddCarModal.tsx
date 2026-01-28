'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Worker, WashType, PaymentType } from '@/types';
import { Plus, Loader2 } from 'lucide-react';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workers: Worker[];
  onAddWorker: (name: string) => Promise<Worker>;
}

// Fixed prices for each wash type
const WASH_PRICES: Record<WashType, number> = {
  INNER: 90,
  OUTER: 90,
  FULL: 170,
  FREE: 0,
};

const washTypes: { value: WashType; label: string; price: number; color: string }[] = [
  { value: 'INNER', label: 'Inner', price: 90, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'OUTER', label: 'Outer', price: 90, color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'FULL', label: 'Full', price: 170, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'FREE', label: 'Free', price: 0, color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const paymentTypes: { value: PaymentType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'INSTAPAY', label: 'InstaPay' },
];

export default function AddCarModal({ isOpen, onClose, onSuccess, workers, onAddWorker }: AddCarModalProps) {
  const [loading, setLoading] = useState(false);
  const [showNewWorker, setShowNewWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [addingWorker, setAddingWorker] = useState(false);

  const [formData, setFormData] = useState({
    plateNumber: '',
    carType: '',
    washType: 'OUTER' as WashType,
    workerId: '',
    paymentType: 'CASH' as PaymentType | '',
    amountPaid: '90',
    tipAmount: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        plateNumber: '',
        carType: '',
        washType: 'OUTER',
        workerId: '',
        paymentType: 'CASH',
        amountPaid: '90',
        tipAmount: '',
        notes: '',
      });
      setErrors({});
      setShowNewWorker(false);
      setNewWorkerName('');
    }
  }, [isOpen]);

  // Auto-update price when wash type changes
  const handleWashTypeChange = (washType: WashType) => {
    const price = WASH_PRICES[washType];
    setFormData({
      ...formData,
      washType,
      amountPaid: price.toString(),
      paymentType: washType === 'FREE' ? '' : formData.paymentType || 'CASH',
    });
  };

  const isFreeWash = formData.washType === 'FREE';

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = 'Plate number is required';
    }

    if (!isFreeWash) {
      if (!formData.paymentType) {
        newErrors.paymentType = 'Payment type is required';
      }
      if (!formData.amountPaid || parseFloat(formData.amountPaid) <= 0) {
        newErrors.amountPaid = 'Amount must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/wash-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plateNumber: formData.plateNumber.trim().toUpperCase(),
          carType: formData.carType.trim() || null,
          washType: formData.washType,
          workerId: formData.workerId || null,
          paymentType: isFreeWash ? null : formData.paymentType,
          amountPaid: isFreeWash ? 0 : parseFloat(formData.amountPaid) || 0,
          tipAmount: parseFloat(formData.tipAmount) || 0,
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Failed to add car' });
      }
    } catch {
      setErrors({ submit: 'Failed to add car' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async () => {
    if (!newWorkerName.trim()) return;

    setAddingWorker(true);
    try {
      const worker = await onAddWorker(newWorkerName.trim());
      setFormData({ ...formData, workerId: worker.id });
      setShowNewWorker(false);
      setNewWorkerName('');
    } catch {
      setErrors({ worker: 'Failed to add worker' });
    } finally {
      setAddingWorker(false);
    }
  };

  const activeWorkers = workers.filter(w => w.isActive);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Car" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plate Number */}
        <div>
          <label className="label">Plate Number *</label>
          <input
            type="text"
            className="input uppercase"
            placeholder="ABC 1234"
            value={formData.plateNumber}
            onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
            autoFocus
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
                onClick={() => handleWashTypeChange(type.value)}
                className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.washType === type.value
                    ? type.color + ' border-current'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block">{type.label}</span>
                <span className="block text-xs opacity-75">
                  {type.price > 0 ? `${type.price} EGP` : 'Free'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Worker */}
        <div>
          <label className="label">Worker</label>
          {!showNewWorker ? (
            <div className="flex gap-2">
              <select
                className="select flex-1"
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
              <button
                type="button"
                onClick={() => setShowNewWorker(true)}
                className="btn btn-secondary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Worker name"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddWorker}
                disabled={addingWorker || !newWorkerName.trim()}
                className="btn btn-primary"
              >
                {addingWorker ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewWorker(false); setNewWorkerName(''); }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          )}
          {errors.worker && <p className="text-sm text-red-500 mt-1">{errors.worker}</p>}
        </div>

        {/* Payment (disabled for FREE) */}
        {!isFreeWash && (
          <>
            <div>
              <label className="label">Payment Type *</label>
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
                <label className="label">Amount (EGP) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
                {errors.amountPaid && <p className="text-sm text-red-500 mt-1">{errors.amountPaid}</p>}
              </div>
              <div>
                <label className="label">Tip (EGP)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
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
            <p className="text-sm text-gray-600">
              Free wash selected - no payment required.
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Optional notes..."
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
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Car'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
