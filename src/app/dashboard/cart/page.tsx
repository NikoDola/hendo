'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import '@/components/pages/CartPage.css';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, removeFromCart, cartTotal } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cartItems.map(item => item.id));
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

  const selectedTotal = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const handleContinueToPurchase = () => {
    if (selectedItems.length === 0) {
      alert('Please select items to purchase');
      return;
    }
    // Navigate to checkout or trigger purchase flow
    // For now, let's navigate to music page with selected items
    router.push('/music');
  };

  return (
    <div className="cartPageContainer">
      <div className="cartPageContent">
        <div className="cartPageHeader">
          <Link href="/dashboard" className="cartPageBackButton">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="cartPageTitle">Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="cartPageEmpty glass-effect">
            <ShoppingBag size={64} className="cartPageEmptyIcon" />
            <h2>Your cart is empty</h2>
            <p>Add some tracks to get started!</p>
            <Link href="/music" className="cartPageEmptyButton">
              Browse Music
            </Link>
          </div>
        ) : (
          <>
            <div className="cartPageItems glass-effect">
              <div className="cartPageSelectAll">
                <label className="cartPageCheckboxLabel">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === cartItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="cartPageCheckbox"
                  />
                  <span>Select All ({cartItems.length} items)</span>
                </label>
              </div>

              <div className="cartPageItemsList">
                {cartItems.map((item) => (
                  <div key={item.id} className="cartPageItem">
                    <label className="cartPageItemCheckbox">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="cartPageCheckbox"
                      />
                    </label>

                    <div className="cartPageItemImage">
                      {item.imageFileUrl ? (
                        <Image
                          src={item.imageFileUrl}
                          alt={item.title}
                          width={80}
                          height={80}
                        />
                      ) : (
                        <div className="cartPageItemImagePlaceholder">♪</div>
                      )}
                    </div>

                    <div className="cartPageItemInfo">
                      <h3 className="cartPageItemTitle">{item.title}</h3>
                      <p className="cartPageItemPrice">${item.price.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="cartPageItemRemove"
                      aria-label="Remove from cart"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="cartPageSummary glass-effect">
              <div className="cartPageSummaryRow">
                <span>Total Items:</span>
                <span>{cartItems.length}</span>
              </div>
              <div className="cartPageSummaryRow">
                <span>Selected Items:</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="cartPageSummaryRow cartPageSummaryTotal">
                <span>Selected Total:</span>
                <span className="cartPageSummaryTotalPrice">${selectedTotal.toFixed(2)}</span>
              </div>
              <div className="cartPageSummaryRow">
                <span>Cart Total:</span>
                <span className="cartPageSummaryTotalPrice">${cartTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleContinueToPurchase}
                className="cartPagePurchaseButton"
                disabled={selectedItems.length === 0}
              >
                <ShoppingBag size={20} />
                Continue to Purchase ({selectedItems.length} items)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

