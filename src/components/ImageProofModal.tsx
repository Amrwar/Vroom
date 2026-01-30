"use client";

import { useState } from "react";
import Modal from "./Modal";
import { X, ZoomIn } from "lucide-react";

interface ImageProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  plateNumber: string;
}

export default function ImageProofModal({ isOpen, onClose, imageUrl, plateNumber }: ImageProofModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`InstaPay Proof - ${plateNumber}`} size="lg">
      <div className="flex flex-col items-center">
        <img 
          src={imageUrl} 
          alt="InstaPay Payment Proof" 
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
        <button onClick={onClose} className="btn btn-secondary mt-4">
          Close
        </button>
      </div>
    </Modal>
  );
}
