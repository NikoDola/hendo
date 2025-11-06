import { Music, Download, FileText } from 'lucide-react';
import type { Purchase } from '@/hooks/usePurchases';
import './UserPurchasesList.css';

interface UserPurchasesListProps {
  purchases: Purchase[];
  loading: boolean;
  onRefresh: () => void;
  onDownload: (url: string, filename: string) => void;
}

export default function UserPurchasesList({
  purchases,
  loading,
  onRefresh,
  onDownload
}: UserPurchasesListProps) {
  return (
    <div className="userProfileCard userPurchasesListContainer">
      <div className="userPurchasesListHeader">
        <h2 className="userProfileTitle userPurchasesListTitle">My Purchased Tracks</h2>
        <button
          onClick={onRefresh}
          className="userPurchasesRefreshButton"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {loading ? (
        <div className="userPurchasesLoading">
          Loading your tracks...
        </div>
      ) : purchases.length === 0 ? (
        <div className="userPurchasesEmpty">
          <Music size={48} className="userPurchasesEmptyIcon" />
          <p>You haven&apos;t purchased any tracks yet.</p>
          <a href="/music" className="userPurchasesEmptyLink">
            Browse Music Store
          </a>
        </div>
      ) : (
        <div className="userPurchasesGrid">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="userPurchaseCard">
              <div className="userPurchaseHeader">
                <Music size={24} className="userPurchaseIcon" />
                <div className="userPurchaseInfo">
                  <h3 className="userPurchaseTitle">{purchase.trackTitle}</h3>
                  <p className="userPurchaseDate">
                    Purchased: {new Date(purchase.purchasedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="userPurchaseActions">
                <button
                  onClick={() => onDownload(purchase.zipUrl, `${purchase.trackTitle}.zip`)}
                  className="userPurchaseButton userPurchaseButtonPrimary"
                >
                  <Download size={18} />
                  Download Track
                </button>
                <button
                  onClick={() => onDownload(purchase.pdfUrl, `${purchase.trackTitle}_rights.pdf`)}
                  className="userPurchaseButton userPurchaseButtonSecondary"
                >
                  <FileText size={18} />
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

