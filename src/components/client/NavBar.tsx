"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import "./NavBar.css";
import Logo from "./Logo";
import { CiShoppingCart } from "react-icons/ci";
import { CiUser } from "react-icons/ci";
import { IoMoonOutline } from "react-icons/io5";
import { IoShirtOutline } from "react-icons/io5";
import { IoLogOutOutline } from "react-icons/io5";
import { useUserAuth } from "@/context/UserAuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";


export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const { user, signOut } = useUserAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const { cartCount } = useCart();

  // Ensure component is hydrated on client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Prevent scroll on both body and html
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Close menus after navigation (covers router.push + links without an onClick handler)
  useEffect(() => {
    setIsOpen(false);
    setDropdown(false);
    setProfileDropdown(false);
  }, [pathname]);

  // Close menu when clicking on a link
  const handleLinkClick = () => {
    if (isOpen) setIsOpen(false);
  };

  const handleDropdown = () => {
    setDropdown(!dropdown);
    // Close profile dropdown when opening store dropdown
    if (!dropdown) {
      setProfileDropdown(false);
    }
  };

  const handleProfileDropdown = () => {
    setProfileDropdown(!profileDropdown);
    // Close store dropdown when opening profile dropdown
    if (!profileDropdown) {
      setDropdown(false);
    }
  };

  const handleViewProfile = () => {
    setProfileDropdown(false);
    router.push('/dashboard');
  };

  const handleAdminDashboard = () => {
    setProfileDropdown(false);
    router.push('/admin/dashboard');
  };

  const handleLogout = async () => {
    setProfileDropdown(false);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleContactLinkClick = (e: React.MouseEvent) => {
    // Close any open menus (especially mobile) before scrolling/navigation.
    setIsOpen(false);
    setDropdown(false);
    setProfileDropdown(false);

    // Always prevent default so we can scroll AFTER the mobile menu unlocks body scroll.
    e.preventDefault();

    const tryScrollOrNavigate = () => {
      const el = typeof document !== 'undefined' ? document.getElementById('contactFr') : null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      router.push('/home#contactFr');
    };

    // Wait a tick so the mobile menu close effect can restore body scroll.
    setTimeout(tryScrollOrNavigate, 50);
  };

  // Toggle menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <header className="headerWrapperDesktop">
        <nav className="navWrapperDesktop">
          <ul className="linksWrapperDesktop">
            <Link className="linkDesktop" href="/home" onClick={handleLinkClick}>
              Home
            </Link>
            <Link
              className="linkDesktop"
              href="/about"
              onClick={handleLinkClick}
            >
              About
            </Link>
            <Link className="linkDesktop" href="/home#contactFr" onClick={handleContactLinkClick}>
              Contact
            </Link>
          </ul>
          <div className="logoDesktop">
            <Logo size="40px" />
          </div>
          <ul className="linksWrapperDesktop">
            <div className="linkDesktop" id="dropdownElement" onClick={handleDropdown}>
              ✨Store
              {dropdown ?
                <div className="dropdownWrapper">
                  <ul className="dropdownLinkWrapper glass-effect">
                    <Link href="/music" className="dropdownLink" onClick={handleLinkClick}>
                      <IoMoonOutline className="dropdownIcon" />
                      Dream Station
                    </Link>
                    <hr className="hrLine" />
                    <li className="dropdownLink">
                      <IoShirtOutline className="dropdownIcon" />
                      Clothing
                    </li>
                  </ul>
                </div> : ""}
            </div>
            {!isHydrated && (
              <div className="profileContainer">
                <div className="profileIconsWrapper">
                  <CiUser className="navIcons navIconsLoading" />
                  <CiShoppingCart className="navIcons navIconsLoading" />
                </div>
              </div>
            )}
            {isHydrated && !user && (
              <>
                <Link className="linkDesktop" href="/login" onClick={handleLinkClick}>
                  Login
                </Link>
                <Link
                  className="linkDesktop"
                  href="/signup"
                  onClick={handleLinkClick}
                >
                  Signup
                </Link>
              </>
            )}
            {isHydrated && user && (
              <div className="profileContainer">
                <div className="profileIconsWrapper">
                  <button
                    type="button"
                    className="profileToggleButton"
                    onClick={handleProfileDropdown}
                    aria-label="Open profile menu"
                    aria-expanded={profileDropdown}
                  >
                    <CiUser className="navIcons" />
                  </button>
                  <Link
                    href="/dashboard/cart"
                    className="navCartIconWrapper"
                    onClick={(e) => {
                      // Prevent bubbling to the profile toggle click handler
                      e.stopPropagation();
                      setProfileDropdown(false);
                    }}
                    aria-label="Open cart"
                  >
                    <CiShoppingCart className="navIcons" />
                    {cartCount > 0 && (
                      <span className="navCartBadge">{cartCount}</span>
                    )}
                  </Link>
                </div>
                {profileDropdown && (
                  <div className="dropdownWrapper">
                    <ul className="dropdownLinkWrapper glass-effect">
                      <li
                      onClick={handleViewProfile}
                        className="dropdownLink"
                    >
                        <CiUser className="dropdownIcon" />
                      View Profile
                      </li>
                      {user?.role === 'admin' && (
                        <>
                          <hr className="hrLine" />
                          <li onClick={handleAdminDashboard} className="dropdownLink">
                            <CiUser className="dropdownIcon" />
                            Admin Dashboard
                          </li>
                        </>
                      )}
                      <hr className="hrLine" />
                      <li
                      onClick={handleLogout}
                        className="dropdownLink"
                    >
                        <IoLogOutOutline className="dropdownIcon" />
                      Logout
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </ul>
        </nav>
      </header>

      {/* Mobile Navigation */}
      <header className="headerWrapperMobile">
        <nav className="navWrapperMobile">
          <div className="logoMobile">
            <Logo size="22px" />
          </div>

          {/* Burger Button */}
          <div
            className={`burgerButton ${isOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="burgerLine"></span>
            <span className="burgerLine"></span>
            <span className="burgerLine"></span>
          </div>

          {/* Mobile Menu Overlay */}
          <div className={`mobileNavOverlay ${isOpen ? "open" : ""}`}>
            <nav className="mobileNavContent">
              <ul className="linksWrapperMobile">
                <li>
                  <Link
                    className="linkMobile"
                    href="/home"
                    onClick={handleLinkClick}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    className="linkMobile"
                    href="/about"
                    onClick={handleLinkClick}
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link className="linkMobile" href="/home#contactFr" onClick={handleContactLinkClick}>
                    Contact
                  </Link>
                </li>
                <li className="mobileStoreContainer">
                  <div className="linkMobile mobileStoreButton" onClick={handleDropdown}>
                    ✨Store
                  </div>
                  {dropdown && (
                    <ul className="mobileStoreDropdown glass-effect">
                      <Link
                        href="/music"
                        className="mobileStoreDropdownItem mobileStoreDropdownItemLink"
                        onClick={handleLinkClick}
                      >
                        <IoMoonOutline className="mobileDropdownIcon" />
                        Dream Station
                      </Link>
                      <hr className="mobileHrLine" />
                      <li className="mobileStoreDropdownItem">
                        <IoShirtOutline className="mobileDropdownIcon" />
                        Clothing
                      </li>
                    </ul>
                  )}
                </li>
                {!isHydrated && (
                  <li>
                    <div className="mobileProfileIconsWrapper">
                      <CiUser className="navIcons navIconsLoading" />
                      <CiShoppingCart className="navIcons navIconsLoading" />
                      <span>Profile</span>
                    </div>
                  </li>
                )}
                {isHydrated && !user && (
                  <>
                    <li>
                      <Link
                        className="linkMobile"
                        href="/login"
                        onClick={handleLinkClick}
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="linkMobile"
                        href="/signup"
                        onClick={handleLinkClick}
                      >
                        Signup
                      </Link>
                    </li>
                  </>
                )}
                {isHydrated && user && (
                  <li>
                    <div className="mobileProfileIconsWrapper">
                      <button
                        type="button"
                        className="profileToggleButton"
                        onClick={handleProfileDropdown}
                        aria-label="Open profile menu"
                        aria-expanded={profileDropdown}
                      >
                        <CiUser className="navIcons" />
                      </button>
                      <Link
                        href="/dashboard/cart"
                        className="navCartIconWrapper"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileDropdown(false);
                          handleLinkClick();
                        }}
                        aria-label="Open cart"
                      >
                        <CiShoppingCart className="navIcons" />
                        {cartCount > 0 && (
                          <span className="navCartBadge">{cartCount}</span>
                        )}
                      </Link>
                      <span>Profile</span>
                    </div>
                    {profileDropdown && (
                      <ul className="mobileStoreDropdown">
                        <li
                          onClick={handleViewProfile}
                          className="mobileStoreDropdownItem"
                        >
                          <CiUser className="mobileDropdownIcon" />
                          View Profile
                        </li>
                        {user?.role === 'admin' && (
                          <>
                            <hr className="mobileHrLine" />
                            <li
                              onClick={handleAdminDashboard}
                              className="mobileStoreDropdownItem"
                            >
                              <CiUser className="mobileDropdownIcon" />
                              Admin Dashboard
                            </li>
                          </>
                        )}
                        <hr className="mobileHrLine" />
                        <li
                          onClick={handleLogout}
                          className="mobileStoreDropdownItem"
                        >
                          <IoLogOutOutline className="mobileDropdownIcon" />
                          Logout
                        </li>
                      </ul>
                    )}
                  </li>
                )}
              </ul>
            </nav>
          </div>

        </nav>

      </header>
    </>
  );
}
