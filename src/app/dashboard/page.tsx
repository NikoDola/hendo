"use client";

import { useShopifyAuth } from "@/context/ShopifyAuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "@/components/pages/dashboard.css";

export default function Dashboard() {
  const { customer, isLoading, logout } = useShopifyAuth();
  const { cart, removeFromCart, refreshCart } = useCart();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push("/login");
    } else if (customer) {
      console.log('Customer loaded, refreshing cart');
      refreshCart();
    }
  }, [customer, isLoading, router, refreshCart]);

  if (isLoading) {
    return (
      <section className="section-regular">
        <div className="formWrapper">
          <h1>Loading...</h1>
        </div>
      </section>
    );
  }

  if (!customer) {
    return null; // Will redirect to login
  }

  const renderOverview = () => (
    <div className="contentSection active">
      <h2 className="sectionTitle">Account Overview</h2>

      <div className="infoGrid">
        <div className="infoItem">
          <div className="infoLabel">Email</div>
          <div className="infoValue">{customer.email}</div>
        </div>

        {customer.firstName && (
          <div className="infoItem">
            <div className="infoLabel">Name</div>
            <div className="infoValue">{customer.firstName} {customer.lastName}</div>
          </div>
        )}

        {customer.phone && (
          <div className="infoItem">
            <div className="infoLabel">Phone</div>
            <div className="infoValue">{customer.phone}</div>
          </div>
        )}

        <div className="infoItem">
          <div className="infoLabel">Member Since</div>
          <div className="infoValue">{new Date(customer.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="infoItem">
        <h3 className="sectionTitle">Loyalty Points</h3>
        <div className="pointsDisplay">0</div>
        <div className="pointsDescription">Earn 1 point for every $10 spent</div>
      </div>
    </div>
  );

  const renderCart = () => {
    console.log('Rendering cart, cart state:', cart);
    return (
      <div className={`contentSection ${activeSection === 'cart' ? 'active' : ''}`}>
        <h2 className="sectionTitle">Shopping Cart</h2>

        {cart && cart.lines.edges.length > 0 ? (
          <div>
            <div className="cartSummary">
              <p><strong>Total Items:</strong> {cart.totalQuantity}</p>
              <p><strong>Total:</strong> ${(parseFloat(cart.cost.totalAmount.amount) / 100).toFixed(2)} {cart.cost.totalAmount.currencyCode}</p>
            </div>

            <div className="cartItemsList">
              {cart.lines.edges.map(({ node: item }) => (
                <div key={item.id} className="cartItem">
                  {item.merchandise.product.images.edges[0] && (
                    <img
                      src={item.merchandise.product.images.edges[0].node.url}
                      alt={item.merchandise.product.images.edges[0].node.altText}
                      className="cartItemImage"
                    />
                  )}
                  <div className="cartItemDetails">
                    <p className="cartItemTitle">{item.merchandise.product.title}</p>
                    <p className="cartItemVariant">
                      {item.merchandise.title} - Qty: {item.quantity}
                    </p>
                    <p className="cartItemPrice">
                      ${(parseFloat(item.cost.totalAmount.amount) / 100).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart([item.id])}
                    className="removeButton"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {cart.checkoutUrl && (
              <button
                onClick={() => window.open(cart.checkoutUrl, '_blank')}
                className="checkoutButton"
              >
                Proceed to Checkout
              </button>
            )}
          </div>
        ) : (
          <div className="emptyState">
            <p>Your cart is empty</p>
            <button
              onClick={() => router.push('/shop')}
              className="emptyStateButton"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderOrders = () => (
    <div className={`contentSection ${activeSection === 'orders' ? 'active' : ''}`}>
      <h2 className="sectionTitle">Recent Orders</h2>
      <div className="emptyState">
        <p>No orders yet</p>
        <button
          onClick={() => router.push('/shop')}
          className="emptyStateButton"
        >
          Start Shopping
        </button>
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className={`contentSection ${activeSection === 'favorites' ? 'active' : ''}`}>
      <h2 className="sectionTitle">Favorites</h2>
      <div className="emptyState">
        <p>No favorites yet</p>
        <button
          onClick={() => router.push('/shop')}
          className="emptyStateButton"
        >
          Browse Products
        </button>
      </div>
    </div>
  );

  return (
    <section className="section-regular">
      <div className="formWrapper">
        <div className="dashboardContainer">
          <div className="dashboardSidebar">
            <div className="dashboardHeader">
              <h1 className="dashboardTitle">Dashboard</h1>
              <button onClick={logout} className="logoutButton">
                Logout
              </button>
            </div>

            <ul className="sidebarNav">
              <li className="sidebarNavItem">
                <button
                  className={`sidebarNavButton ${activeSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveSection('overview')}
                >
                  Overview
                </button>
              </li>
              <li className="sidebarNavItem">
                <button
                  className={`sidebarNavButton ${activeSection === 'cart' ? 'active' : ''}`}
                  onClick={() => setActiveSection('cart')}
                >
                  Cart ({cart?.totalQuantity || 0})
                </button>
              </li>
              <li className="sidebarNavItem">
                <button
                  className={`sidebarNavButton ${activeSection === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveSection('orders')}
                >
                  Recent Orders
                </button>
              </li>
              <li className="sidebarNavItem">
                <button
                  className={`sidebarNavButton ${activeSection === 'favorites' ? 'active' : ''}`}
                  onClick={() => setActiveSection('favorites')}
                >
                  Favorites
                </button>
              </li>
            </ul>
          </div>

          <div className="dashboardContent">
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'cart' && renderCart()}
            {activeSection === 'orders' && renderOrders()}
            {activeSection === 'favorites' && renderFavorites()}
          </div>
        </div>
      </div>
    </section>
  );
}