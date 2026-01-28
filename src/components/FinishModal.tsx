'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { WashRecordWithWorker, PaymentType } from '@/types';
import { Loader2, CheckCircle } from 'lucide-react';

interface FinishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: WashRecordWithWorker | null;
}

const paymentTypes: { value: PaymentType; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'INSTAPAY', label: 'InstaPay' },
];

export default function FinishModal({ isOpen, onClose, onSuccess, record }: FinishModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paymentType: 'CASH' as PaymentType,
    amountPaid: '',
    tipAmount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFreeWash = record?.washType === 'FREE';
  const needsPaymentInfo = !isFreeWash && (!record?.paymentType || record.amountPaid === 0);

  useEffect(() => {
    if (record && isOpen) {
      setFormData({
        paymentType: record.paymentType || 'CASH',
        amountPaid: record.amountPaid > 0 ? record.amountPaid.toString() : '',
        tipAmount: record.tipAmount > 0 ? record.tipAmount.toString() : '',
      });
      setErrors({});
    }
  }, [record, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (needsPaymentInfo) {
      if (!formData.amountPaid || parseFloat(formData.amountPaid) <= 0) {
        newErrors.amountPaid = 'Amount must be greater than 0';
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
      const body: Record<string, unknown> = {};
      
      if (!isFreeWash) {
        body.paymentType = formData.paymentType;
        body.amountPaid = parseFloat(formData.amountPaid) || record.amountPaid;
        body.tipAmount = parseFloat(formData.tipAmount) || record.tipAmount;
      }

      const response = await fetch(`/api/wash-records/${record.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Failed to finish record' });
      }
    } catch {
      setErrors({ submit: 'Failed to finish record' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFinish = async () => {
    if (!record) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/wash-records/${record.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Failed to finish record' });
      }
    } catch {
      setErrors({ submit: 'Failed to finish record' });
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finish Car Wash" size="md">
      {needsPaymentInfo ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>{record.plateNumber}</strong> - Payment information required to finish.
            </p>
          </div>

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
                autoFocus
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

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-success flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finishing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Finish
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-emerald-800 font-medium">
              Ready to finish <strong>{record.plateNumber}</strong>?
            </p>
            {!isFreeWash && (
              <p className="text-sm text-emerald-600 mt-1">
                {record.paymentType} - {record.amountPaid} EGP
                {record.tipAmount > 0 && ` + ${record.tipAmount} EGP tip`}
              </p>
            )}
            {isFreeWash && (
              <p className="text-sm text-emerald-600 mt-1">Free wash</p>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleQuickFinish}
              disabled={loading}
              className="btn btn-success flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finishing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Finish
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
