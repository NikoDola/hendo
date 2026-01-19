'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Trash2, ShoppingBag, Heart, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import '@/components/pages/FavoritesPage.css';

export default function FavoritesPage() {
  const router = useRouter();
  const { favoriteItems, removeFavorite, addToCart, isInCart } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(favoriteItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const selectedTotal = favoriteItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const totalPrice = favoriteItems.reduce((sum, item) => sum + item.price, 0);

  const handlePurchaseSelected = () => {
    if (selectedItems.length === 0) {
      alert('Please select items to purchase');
      return;
    }
    
    // Add selected items to cart
    selectedItems.forEach(itemId => {
      const item = favoriteItems.find(i => i.id === itemId);
      if (item && !isInCart(item.id)) {
        addToCart(item);
      }
    });

    // Navigate to cart
    router.push('/dashboard/cart');
  };

  const handlePurchaseAll = () => {
    // Add all favorites to cart
    favoriteItems.forEach(item => {
      if (!isInCart(item.id)) {
        addToCart(item);
      }
    });

    // Navigate to cart
    router.push('/dashboard/cart');
  };

  return (
    <div className="favoritesPageContainer">
      <div className="favoritesPageContent">
        <div className="favoritesPageHeader">
          <Link href="/dashboard" className="favoritesPageBackButton">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="favoritesPageTitle" data-text="Favorites">Favorites</h1>
        </div>

        {favoriteItems.length === 0 ? (
          <div className="favoritesPageEmpty glass-effect">
            <Heart size={64} className="favoritesPageEmptyIcon" />
            <h2 data-text="No favorites yet">No favorites yet</h2>
            <p>Add tracks to your favorites to see them here!</p>
            <Link href="/music" className="favoritesPageEmptyButton">
              Browse Music
            </Link>
          </div>
        ) : (
          <>
            <div className="favoritesPageItems glass-effect">
              <div className="favoritesPageSelectAll">
                <label className="favoritesPageCheckboxLabel">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === favoriteItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="favoritesPageCheckbox"
                  />
                  <span>Select All ({favoriteItems.length} items)</span>
                </label>
              </div>

              <div className="favoritesPageItemsList">
                {favoriteItems.map((item) => (
                  <div key={item.id} className="favoritesPageItem">
                    <label className="favoritesPageItemCheckbox">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="favoritesPageCheckbox"
                      />
                    </label>

                    <div className="favoritesPageItemImage">
                      {item.imageFileUrl ? (
                        <Image
                          src={item.imageFileUrl}
                          alt={item.title}
                          width={80}
                          height={80}
                        />
                      ) : (
                        <div className="favoritesPageItemImagePlaceholder">♪</div>
                      )}
                    </div>

                    <div className="favoritesPageItemInfo">
                      <h3 className="favoritesPageItemTitle">{item.title}</h3>
                      <p className="favoritesPageItemPrice">${item.price.toFixed(2)}</p>
                      {isInCart(item.id) && (
                        <span className="favoritesPageItemInCart">In Cart</span>
                      )}
                    </div>

                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="favoritesPageItemRemove"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="favoritesPageSummary glass-effect">
              <div className="favoritesPageSummaryRow">
                <span>Total Items:</span>
                <span>{favoriteItems.length}</span>
              </div>
              <div className="favoritesPageSummaryRow">
                <span>Selected Items:</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="favoritesPageSummaryRow favoritesPageSummaryTotal">
                <span>Selected Total:</span>
                <span className="favoritesPageSummaryTotalPrice">${selectedTotal.toFixed(2)}</span>
              </div>
              <div className="favoritesPageSummaryRow">
                <span>Total Price:</span>
                <span className="favoritesPageSummaryTotalPrice">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                onClick={handlePurchaseSelected}
                className="favoritesPagePurchaseButton"
                disabled={selectedItems.length === 0}
              >
                <ShoppingBag size={20} />
                Purchase Selected ({selectedItems.length} items)
              </button>

              <button
                onClick={handlePurchaseAll}
                className="favoritesPagePurchaseAllButton"
              >
                <ShoppingBag size={20} />
                Purchase All Favorites
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

