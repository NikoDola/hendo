import { useEffect } from 'react';
import { X, Star, ShoppingCart } from 'lucide-react';
import './AdminTrackStatsModal.css';

type StatsKind = 'favorites' | 'carts';

export interface StatsUserRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  lastActionAtMs: number;
}

interface AdminTrackStatsModalProps {
  isOpen: boolean;
  kind: StatsKind;
  trackTitle: string;
  users: StatsUserRow[];
  loading?: boolean;
  onClose: () => void;
}

export default function AdminTrackStatsModal({
  isOpen,
  kind,
  trackTitle,
  users,
  loading = false,
  onClose
}: AdminTrackStatsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const Icon = kind === 'favorites' ? Star : ShoppingCart;
  const title = kind === 'favorites' ? 'Favorites' : 'Added to Cart';

  return (
    <div className="statsModalOverlay" onClick={onClose}>
      <div className="statsModalContent glass-effect" onClick={(e) => e.stopPropagation()}>
        <button className="statsModalClose" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="statsModalHeader">
          <div className="statsModalHeaderIcon">
            <Icon size={22} />
          </div>
          <div className="statsModalHeaderText">
            <h2 className="statsModalTitle">{title}</h2>
            <p className="statsModalSubtitle">{trackTitle}</p>
          </div>
        </div>

        <div className="statsModalBody">
          {loading ? (
            <div className="statsModalLoading">Loading...</div>
          ) : users.length === 0 ? (
            <div className="statsModalEmpty">No users yet.</div>
          ) : (
            <div className="statsModalList">
              {users.map((u) => (
                <div key={u.id} className="statsModalRow">
                  <div className="statsModalRowMain">
                    <div className="statsModalRowName">{u.name || 'Unknown'}</div>
                    <div className="statsModalRowEmail">{u.email}</div>
                  </div>
                  <div className="statsModalRowMeta">
                    {u.lastActionAtMs ? new Date(u.lastActionAtMs).toLocaleString() : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


