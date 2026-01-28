'use client';

import { useState } from 'react';
import Modal from './Modal';
import { WashRecordWithWorker } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: WashRecordWithWorker | null;
}

export default function DeleteConfirmModal({ isOpen, onClose, onSuccess, record }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!record) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/wash-records/${record.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete record');
      }
    } catch {
      setError('Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Record" size="sm">
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-700">
            Are you sure you want to delete the record for{' '}
            <strong className="text-gray-900">{record.plateNumber}</strong>?
          </p>
          <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading} className="btn btn-danger flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
