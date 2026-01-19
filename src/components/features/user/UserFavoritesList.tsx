'use client';

import { Heart, Music, ShoppingCart, Star, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import './UserFavoritesList.css';
import { useMemo } from 'react';

type UserFavoritesListProps = {
  embedded?: boolean;
};

export default function UserFavoritesList({ embedded = false }: UserFavoritesListProps) {
  const { favoriteItems, removeFavorite, addToCart, isInCart } = useCart();
  const uniqueFavoriteItems = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof favoriteItems = [];
    for (const it of favoriteItems) {
      if (!it?.id) continue;
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  }, [favoriteItems]);

  return (
    <div className={`${embedded ? '' : 'userProfileCard '}userFavoritesListContainer`}>
      <div className="userFavoritesListHeader">
        <div>
          <h2 className="userProfileTitle userFavoritesListTitle userListTitleWithIcon" data-text="My Favorite Tracks">
            <Star size={20} className="userListTitleIcon" />
            My Favorite Tracks
          </h2>
          <p className="bold">total {uniqueFavoriteItems.length} tracks</p>
        </div>
      </div>

      {uniqueFavoriteItems.length === 0 ? (
        <div className="userFavoritesEmpty">
          <Heart size={48} className="userFavoritesEmptyIcon" />
          <p>You haven&apos;t favorited any tracks yet.</p>
          <a href="/music" className="userFavoritesEmptyLink">
            Browse Music
          </a>
        </div>
      ) : (
        <div className="userPurchasesGrid">
          {uniqueFavoriteItems.map((track) => (
            <div key={track.id} className="userPurchaseCard">
              <div className="userPurchaseHeader">
                <Music size={24} className="userPurchaseIcon" />
                <div className="userPurchaseInfo">
                  <h3 className="userPurchaseTitle">{track.title}</h3>
                  <p className="userPurchaseDate">Favorite</p>
                </div>
              </div>

              <div className="userPurchaseActions">
                <button
                  className="userPurchaseButton userPurchaseButtonPrimary"
                  onClick={() => {
                    if (isInCart(track.id)) return;
                    addToCart(track);
                  }}
                  disabled={isInCart(track.id)}
                >
                  <ShoppingCart size={18} />
                  {isInCart(track.id) ? 'In Cart' : 'Add to Cart'}
                </button>

                <button
                  className="userPurchaseButton userPurchaseButtonSecondary"
                  onClick={() => removeFavorite(track.id)}
                >
                  <Trash2 size={18} />
                  Remove Favorite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


