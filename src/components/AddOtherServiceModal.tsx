"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { MechanicRecord } from "@prisma/client";
import { Loader2, Settings, Plus } from "lucide-react";

type PaymentType = "CASH" | "INSTAPAY";

interface AddOtherServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: MechanicRecord) => void;
}

interface QuickService {
  name: string;
  price: number;
}

const paymentTypes: { value: PaymentType; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "INSTAPAY", label: "InstaPay" },
];

export default function AddOtherServiceModal({ isOpen, onClose, onSuccess }: AddOtherServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [quickServices, setQuickServices] = useState<QuickService[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mechanicQuickServices");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [formData, setFormData] = useState({
    plateNumber: "",
    carType: "",
    phoneNumber: "",
    serviceName: "",
    servicePrice: "",
    paymentType: "CASH" as PaymentType,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        plateNumber: "",
        carType: "",
        phoneNumber: "",
        serviceName: "",
        servicePrice: "",
        paymentType: "CASH",
        notes: "",
      });
      setErrors({});
      setShowAddService(false);
      setNewServiceName("");
      setNewServicePrice("");
    }
  }, [isOpen]);

  const handleAddQuickService = () => {
    if (!newServiceName.trim() || !newServicePrice) return;
    
    const newService = {
      name: newServiceName.trim(),
      price: parseFloat(newServicePrice),
    };
    
    const updated = [...quickServices, newService];
    setQuickServices(updated);
    localStorage.setItem("mechanicQuickServices", JSON.stringify(updated));
    
    setNewServiceName("");
    setNewServicePrice("");
    setShowAddService(false);
  };

  const handleRemoveQuickService = (index: number) => {
    const updated = quickServices.filter((_, i) => i !== index);
    setQuickServices(updated);
    localStorage.setItem("mechanicQuickServices", JSON.stringify(updated));
  };

  const handleSelectQuickService = (service: QuickService) => {
    setFormData({
      ...formData,
      serviceName: service.name,
      servicePrice: service.price.toString(),
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = "Plate number is required";
    }
    if (!formData.serviceName.trim()) {
      newErrors.serviceName = "Service name is required";
    }
    if (!formData.servicePrice || parseFloat(formData.servicePrice) <= 0) {
      newErrors.servicePrice = "Service price is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const servicePrice = parseFloat(formData.servicePrice) || 0;
      
      const response = await fetch("/api/mechanic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: formData.plateNumber.trim().toUpperCase(),
          carType: formData.carType.trim() || null,
          phoneNumber: formData.phoneNumber.trim() || null,
          category: "OTHER_SERVICE",
          serviceName: formData.serviceName.trim(),
          servicePrice,
          totalAmount: servicePrice,
          paymentType: formData.paymentType,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setErrors({ submit: data.error || "Failed to add service" });
      }
    } catch {
      setErrors({ submit: "Failed to add service" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Other Service" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="label">Car Type</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Hyundai Elantra"
              value={formData.carType}
              onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
            />
          </div>
        </div>

        {/* Quick Services */}
        {quickServices.length > 0 && (
          <div>
            <label className="label">Quick Select Service</label>
            <div className="flex flex-wrap gap-2">
              {quickServices.map((service, index) => (
                <div key={index} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleSelectQuickService(service)}
                    className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.serviceName === service.name && formData.servicePrice === service.price.toString()
                        ? "bg-purple-100 text-purple-700 border-purple-300"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {service.name} ({service.price} EGP)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuickService(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Quick Service */}
        <div>
          {!showAddService ? (
            <button
              type="button"
              onClick={() => setShowAddService(true)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add quick service button
            </button>
          ) : (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">Add New Quick Service</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Service name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
                <input
                  type="number"
                  className="input w-24"
                  placeholder="Price"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddQuickService}
                  className="btn btn-primary btn-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddService(false); setNewServiceName(""); setNewServicePrice(""); }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Service Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Brake Pads, Air Filter..."
              value={formData.serviceName}
              onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
            />
            {errors.serviceName && <p className="text-sm text-red-500 mt-1">{errors.serviceName}</p>}
          </div>
          <div>
            <label className="label">Service Price (EGP) *</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              min="0"
              value={formData.servicePrice}
              onChange={(e) => setFormData({ ...formData, servicePrice: e.target.value })}
            />
            {errors.servicePrice && <p className="text-sm text-red-500 mt-1">{errors.servicePrice}</p>}
          </div>
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
                    ? "bg-primary-50 text-primary-700 border-primary-300"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

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

        {formData.servicePrice && parseFloat(formData.servicePrice) > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-lg text-red-600">{formData.servicePrice} EGP</span>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Add Service
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
