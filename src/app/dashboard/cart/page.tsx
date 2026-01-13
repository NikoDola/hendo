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
  const [hasReachedRightsBottom, setHasReachedRightsBottom] = useState(false);
  const rightsBodyRef = useRef<HTMLDivElement | null>(null);
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

  // Lock page scroll while modal is open (only modal body should scroll)
  useEffect(() => {
    if (!rightsOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [rightsOpen]);

  // Reset "scrolled to bottom" gate when opening the modal
  useEffect(() => {
    if (!rightsOpen) return;
    setHasReachedRightsBottom(false);
    // give layout a tick then check if content already fits (short screens)
    setTimeout(() => {
      const el = rightsBodyRef.current;
      if (!el) return;
      if (el.scrollHeight <= el.clientHeight + 2) {
        setHasReachedRightsBottom(true);
      }
    }, 0);
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
              <h2 className="cartRightsTitle">Read the Rights</h2>
              <button
                type="button"
                className="cartRightsCloseButton"
                onClick={() => setRightsOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="cartRightsBody"
              ref={rightsBodyRef}
              onScroll={() => {
                const el = rightsBodyRef.current;
                if (!el) return;
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
                if (atBottom) setHasReachedRightsBottom(true);
              }}
            >
              <h3 className="cartRightsSectionTitle">Privacy Policy</h3>
              <p><strong>Last Updated:</strong> JAN 1 2026</p>
              <p>
                This Privacy Policy explains how DREAMSTATION (“we,” “us,” or “our”) collects, uses, and protects your
                information when you visit or make a purchase from THELEGENDOFHENDO.com (the “Site”).
              </p>
              <p><strong>1. Information We Collect</strong></p>
              <p>When you visit or use our store, we may collect the following types of information:</p>
              <p><strong>Personal Information</strong></p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Billing and shipping address</li>
                <li>Phone number</li>
                <li>Payment details (processed securely by third-party payment providers)</li>
              </ul>
              <p><strong>Account Information</strong></p>
              <ul>
                <li>Username and password</li>
                <li>Order history</li>
                <li>Saved beats, favorites, and licenses</li>
              </ul>
              <p><strong>Device &amp; Usage Information</strong></p>
              <ul>
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device type</li>
                <li>Pages viewed</li>
                <li>Time spent on the site</li>
                <li>Referral source</li>
              </ul>
              <p><strong>2. How We Use Your Information</strong></p>
              <ul>
                <li>Process beat purchases and license deliveries</li>
                <li>Manage user accounts</li>
                <li>Provide downloads and access to purchased content</li>
                <li>Send order confirmations and updates</li>
                <li>Provide customer support</li>
                <li>Improve website performance and user experience</li>
                <li>Prevent fraud and unauthorized use</li>
                <li>Send promotional emails (if you opt in)</li>
              </ul>
              <p><strong>3. How Payments Are Handled</strong></p>
              <p>
                All payments are processed through secure third-party payment processors (such as Stripe, PayPal, or
                Shopify Payments). We do not store or have access to your full credit card details. These providers
                handle your information according to their own privacy policies and security standards.
              </p>
              <p><strong>4. How We Share Information</strong></p>
              <p>
                We do not sell your personal data. We may share limited data with trusted third parties only when
                necessary, including: payment processors, email services, cloud storage &amp; hosting providers, and
                website analytics. These partners are required to keep your data secure and confidential.
              </p>
              <p><strong>5. Cookies &amp; Tracking</strong></p>
              <p>
                We use cookies and similar technologies to remember your login, save cart and favorite beats, track site
                performance, and understand how users interact with our store. You may disable cookies in your browser,
                but some site features may not work properly.
              </p>
              <p><strong>6. Digital Products &amp; Licensing</strong></p>
              <p>
                When you purchase beats or licenses: your purchase is recorded, your license is tied to your account and
                email, and we may use this data to prevent piracy, abuse, or unauthorized distribution.
              </p>
              <p><strong>7. Data Security</strong></p>
              <p>
                We take security seriously and use encrypted connections (SSL), secure hosting, firewall protection, and
                limited employee access. No system is 100% secure, but we use industry-standard protections to safeguard
                your data.
              </p>
              <p><strong>8. Your Rights</strong></p>
              <p>
                You have the right to access your personal data, request corrections, request deletion of your account,
                and opt out of marketing emails. To exercise these rights, contact us at: levelup@thelegendofhendo.com
              </p>
              <p><strong>9. Children’s Privacy</strong></p>
              <p>Our services are not intended for children under 13. We do not knowingly collect personal data from minors.</p>
              <p><strong>10. Changes to This Policy</strong></p>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with a new
                “Last Updated” date.
              </p>
              <p><strong>11. Contact Us</strong></p>
              <p>
                DREAMSTATION — levelup@thelegendofhendo.com — THELEGENDOFHENDO.COM
              </p>

              <hr className="cartRightsDivider" />

              <h3 className="cartRightsSectionTitle">Terms &amp; Conditions</h3>
              <p><strong>Last Updated:</strong> JAN 1 2026</p>
              <p>
                Welcome to DREAMSTATION (“Company,” “we,” “us,” or “our”). These Terms &amp; Conditions (“Terms”) govern
                your use of thelegendofhendo.com (the “Site”) and the purchase, licensing, and use of any beats, music,
                or digital products sold through the Site. By accessing or using this Site, you agree to be bound by
                these Terms.
              </p>
              <p><strong>1. Digital Products</strong></p>
              <p>
                All products sold on this website are digital music files and licenses. No physical goods are shipped.
                When you purchase a beat, you are purchasing a license to use the beat — not ownership of the music or
                copyrights. All beats remain the intellectual property of DREAMSTATION and/or its producers.
              </p>
              <p><strong>2. Beat Licensing</strong></p>
              <p>
                Each beat purchase comes with a specific license type (e.g., MP3 Lease, WAV Lease, Exclusive, etc.).
                Your rights are defined by the license purchased. Unless explicitly stated in writing:
              </p>
              <ul>
                <li>You do not own the beat</li>
                <li>You do not own the copyright</li>
                <li>You may not resell, redistribute, or give away the beat</li>
                <li>You may only use the beat as allowed in your license agreement</li>
              </ul>
              <p>Any use outside of your license is copyright infringement.</p>
              <p><strong>3. Exclusive Licenses</strong></p>
              <p>If you purchase an exclusive license: you receive exclusive usage rights, the beat will be removed from public sale, and we still retain authorship and credit rights unless otherwise stated in writing.</p>
              <p><strong>4. Refund Policy</strong></p>
              <p>
                All sales are final. Because digital files are instantly delivered and cannot be returned: no refunds,
                no chargebacks, no exchanges. Unauthorized chargebacks will result in account termination and license
                revocation.
              </p>
              <p><strong>5. User Accounts</strong></p>
              <p>
                You agree to provide accurate information, keep your login secure, and not share your account. You are
                responsible for all activity under your account. We reserve the right to suspend or terminate accounts
                that violate these Terms.
              </p>
              <p><strong>6. Prohibited Uses</strong></p>
              <p>You may not: claim ownership of any beat, remove the producer’s beat tag, upload beats to content ID systems unless your license allows, use beats for hate speech/illegal activity/harmful content, attempt to resell or redistribute beats, or reverse engineer/pirate files. Violations will result in immediate license termination.</p>
              <p><strong>7. Copyright &amp; DMCA</strong></p>
              <p>
                All music is protected under U.S. and international copyright laws. We actively monitor piracy and
                copyright violations and will pursue takedowns, account bans, and legal action.
              </p>
              <p><strong>8. Platform Availability</strong></p>
              <p>
                We do not guarantee that the Site will be uninterrupted, error-free, or always available. We are not
                responsible for download issues, file loss, or third-party payment failures. Users are responsible for
                backing up their purchased files.
              </p>
              <p><strong>9. Limitation of Liability</strong></p>
              <p>
                To the fullest extent permitted by law: DREAMSTATION shall not be liable for lost profits, lost data,
                business interruption, or misuse of purchased beats. All products are provided “as is.”
              </p>
              <p><strong>10. Changes to Terms</strong></p>
              <p>We may update these Terms at any time. Continued use of the Site means you accept the new Terms.</p>
              <p><strong>11. Governing Law</strong></p>
              <p>These Terms are governed by the laws of WY, USA.</p>
              <p><strong>12. Contact</strong></p>
              <p>DREAMSTATION — levelup@thelegendofhendo.com — thelegendofhendo.com</p>
            </div>

            <div className="cartRightsFooter">
              <button
                type="button"
                className="cartRightsAgreeButton"
                disabled={!hasReachedRightsBottom}
                onClick={() => {
                  setHasReadRights(true);
                  setRightsOpen(false);
                }}
              >
                {hasReachedRightsBottom ? 'Agree' : 'Scroll to the bottom to Agree'}
              </button>
              <button
                type="button"
                className="cartRightsShopButton"
                onClick={() => {
                  setRightsOpen(false);
                  router.push('/music');
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

