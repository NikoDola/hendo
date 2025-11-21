import { X } from 'lucide-react';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName: string;
  userEmail: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  userName,
  userEmail
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="deleteModalOverlay" onClick={onCancel}>
      <div className="deleteModalContent glass-effect" onClick={(e) => e.stopPropagation()}>
        <button
          className="deleteModalClose"
          onClick={onCancel}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="deleteModalHeader">
          <div className="deleteModalIcon">⚠️</div>
          <h2 className="deleteModalTitle">Delete User?</h2>
        </div>

        <div className="deleteModalBody">
          <p className="deleteModalMessage">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <div className="deleteModalUserInfo">
            <div className="deleteModalUserField">
              <span className="deleteModalUserLabel">Name:</span>
              <span className="deleteModalUserValue">{userName}</span>
            </div>
            <div className="deleteModalUserField">
              <span className="deleteModalUserLabel">Email:</span>
              <span className="deleteModalUserValue">{userEmail}</span>
            </div>
          </div>
        </div>

        <div className="deleteModalActions">
          <button
            onClick={onCancel}
            className="deleteModalButton deleteModalCancelButton"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="deleteModalButton deleteModalConfirmButton"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

