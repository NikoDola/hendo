'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Trash2, ShoppingBag, ArrowLeft, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import '@/components/pages/CartPage.css';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, removeFromCart, cartTotal } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [hasReadRights, setHasReadRights] = useState(false);
  const [rightsOpen, setRightsOpen] = useState(false);
  const hasInitializedSelection = useRef(false);

  // Select all items by default on first load (after cartItems hydrate from localStorage)
  useEffect(() => {
    if (!hasInitializedSelection.current && cartItems.length > 0) {
      setSelectedItems(cartItems.map(item => item.id));
      hasInitializedSelection.current = true;
    }

    if (cartItems.length === 0) {
      hasInitializedSelection.current = false;
      setSelectedItems([]);
    }
  }, [cartItems]);

  // Keep selectedItems in sync if items are removed from the cart
  useEffect(() => {
    setSelectedItems(prev => prev.filter(id => cartItems.some(item => item.id === id)));
  }, [cartItems]);

  // Close rights modal with Esc
  useEffect(() => {
    if (!rightsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRightsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rightsOpen]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cartItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => (prev.includes(itemId) ? prev : [...prev, itemId]));
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const selectedTotal = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const handleContinueToPurchase = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to purchase');
      return;
    }
    if (!hasReadRights) {
      alert('Please read and accept the rights before continuing.');
      return;
    }

    const selected = cartItems.filter(item => selectedItems.includes(item.id));
    if (selected.length === 0) {
      alert('Please select items to purchase');
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selected.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Backup cart in sessionStorage so Browser Back / Stripe Cancel won't "lose" it in this tab.
          // (localStorage should persist, but some browsers can behave oddly across Stripe redirects)
          try {
            window.sessionStorage.setItem('hendo_cart_backup', JSON.stringify(cartItems));
          } catch {
            // ignore
          }
          window.location.href = data.url;
          return;
        }
        alert('Failed to get checkout URL');
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      alert(errorData.error || 'Failed to start checkout process. Please try again.');
    } catch (error) {
      console.error('Cart checkout error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
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
                    checked={cartItems.length > 0 && selectedItems.length === cartItems.length}
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

              <div className="cartPageRightsSection">
                <div className="cartPageRightsLinks">
                  <Link href="/faq" className="cartPageFaqLink">FAQ</Link>
                  <button
                    type="button"
                    className="cartPageRightsOpenButton"
                    onClick={() => setRightsOpen(true)}
                  >
                    Read the rights
                  </button>
                </div>

                <div className="cartPageRightsRow">
                  <input
                    type="checkbox"
                    className="cartPageCheckbox"
                    checked={hasReadRights}
                    onChange={(e) => setHasReadRights(e.target.checked)}
                  />
                  <span className="cartPageRightsCheckboxText">I have read the rights</span>
                </div>
              </div>

              <button
                onClick={handleContinueToPurchase}
                className="cartPagePurchaseButton"
                disabled={selectedItems.length === 0 || isPurchasing || !hasReadRights}
              >
                <ShoppingBag size={20} />
                {isPurchasing
                  ? 'Starting checkout...'
                  : `Continue to Purchase (${selectedItems.length} items)`}
              </button>
            </div>
          </>
        )}
      </div>

      {rightsOpen && (
        <div
          className="cartRightsOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Rights and license terms"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRightsOpen(false);
          }}
        >
          <div className="cartRightsModal glass-effect" onMouseDown={(e) => e.stopPropagation()}>
            <div className="cartRightsHeader">
              <h2 className="cartRightsTitle">Demo Rights</h2>
              <button
                type="button"
                className="cartRightsCloseButton"
                onClick={() => setRightsOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="cartRightsBody">
              <p><strong>What you are buying:</strong> You are purchasing a license to use the beat — not ownership of the beat.</p>
              <p><strong>Distribution/monetization:</strong> Allowed only if your license includes distribution/monetization rights. Always check the license terms.</p>
              <p><strong>No reselling:</strong> Reselling, sharing, redistributing, or giving away files is prohibited.</p>
              <p><strong>Refunds:</strong> All digital sales are final. No refunds, no exchanges.</p>
              <p><strong>Content ID:</strong> Do not upload to YouTube Content ID unless your license explicitly allows it.</p>
              <p>
                Full details are available on the <Link href="/faq" className="cartPageFaqLink">FAQ</Link> page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

