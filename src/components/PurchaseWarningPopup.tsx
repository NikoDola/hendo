'use client';

import { X, Mail } from 'lucide-react';
import './PurchaseWarningPopup.css';

interface PurchaseWarningPopupProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
}

export default function PurchaseWarningPopup({
  isOpen,
  onClose,
  trackTitle
}: PurchaseWarningPopupProps) {
  if (!isOpen) return null;

  const handleContactSeller = () => {
    // Link to contact form - you can update this to point to your contact page
    window.location.href = '/about';
  };

  return (
    <div className="purchaseWarningOverlay" onClick={onClose}>
      <div className="purchaseWarningPopup" onClick={(e) => e.stopPropagation()}>
        <button className="purchaseWarningClose" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="purchaseWarningContent">
          <h2 className="purchaseWarningTitle">Already Purchased</h2>
          <p className="purchaseWarningMessage">
            You already have this track: <strong>{trackTitle}</strong>
          </p>
          <p className="purchaseWarningSubtext">
            Would you like to contact the seller for extending the rights?
          </p>
          
          <div className="purchaseWarningActions">
            <button
              onClick={handleContactSeller}
              className="purchaseWarningButton purchaseWarningButtonPrimary"
            >
              <Mail size={18} />
              Contact Seller
            </button>
            <button
              onClick={onClose}
              className="purchaseWarningButton purchaseWarningButtonSecondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

