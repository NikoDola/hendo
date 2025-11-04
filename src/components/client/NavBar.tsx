"use client";
import Link from "next/link";
import { useState } from "react";
import "./NavBar.css";
import Logo from "./Logo";
import { ColorProvider } from "./ColorProvider";
import { CiShoppingCart } from "react-icons/ci";
import { CiUser } from "react-icons/ci";
import { IoMoonOutline } from "react-icons/io5";
import { IoShirtOutline } from "react-icons/io5";
import { Music } from "lucide-react";
import { useUserAuth } from "@/context/UserAuthContext";
import { useRouter } from "next/navigation";


export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const { user, loading: isLoading, signOut } = useUserAuth();
  const router = useRouter();

  // Close menu when clicking on a link
  const handleLinkClick = () => {
    if (isOpen) setIsOpen(false);
  };

  const handleDropdown = () => {
    setDropdown(!dropdown);
    console.log(dropdown);
  };

  const handleProfileDropdown = () => {
    setProfileDropdown(!profileDropdown);
  };

  const handleViewProfile = () => {
    setProfileDropdown(false);
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
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

  // Toggle menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <ColorProvider>
      {/* Desktop Navigation */}
      <header className="headerWrapperDesktop">
        <nav className="navWrapperDesktop">
          <ul className="linksWrapperDesktop">
            <Link className="linkDesktop" href="/" onClick={handleLinkClick}>
              Home
            </Link>
            <Link
              className="linkDesktop"
              href="/about"
              onClick={handleLinkClick}
            >
              About
            </Link>
            <Link
              className="linkDesktop"
              href="/Contact"
              onClick={handleLinkClick}
            >
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
                  <ul className="dropdownLinkWrapper">
                    <li className="dropdownLink">
                      <IoMoonOutline className="dropdownIcon" />
                      Dream Station
                    </li>
                    <hr className="hrLine" />
                    <li className="dropdownLink">
                      <IoShirtOutline className="dropdownIcon" />
                      Clothing
                    </li>
                    <hr className="hrLine" />
                    <Link href="/music" className="dropdownLink" onClick={handleLinkClick}>
                      <Music className="dropdownIcon" size={20} />
                      Music
                    </Link>
                  </ul>
                </div> : ""}
            </div>
            {!user && (
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
            {user && (
              <div className="linkDesktop" style={{ position: 'relative' }}>
                <div 
                  onClick={handleProfileDropdown}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <CiUser className="navIcons" />
                  <CiShoppingCart className="navIcons" />
                </div>
                {profileDropdown && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      background: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '0.5rem 0',
                      minWidth: '150px',
                      zIndex: 1000
                    }}
                  >
                    <button
                      onClick={handleViewProfile}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Logout
                    </button>
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
                    href="/"
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
                  <Link
                    className="linkMobile"
                    href="/Contact"
                    onClick={handleLinkClick}
                  >
                    Contact
                  </Link>
                </li>
                <li className="mobileStoreContainer">
                  <div className="linkMobile mobileStoreButton" onClick={handleDropdown}>
                    ✨Store
                  </div>
                  {dropdown && (
                    <ul className="mobileStoreDropdown">
                      <li className="mobileStoreDropdownItem">
                        <IoMoonOutline className="mobileDropdownIcon" />
                        Dream Station
                      </li>
                      <hr className="mobileHrLine" />
                      <li className="mobileStoreDropdownItem">
                        <IoShirtOutline className="mobileDropdownIcon" />
                        Clothing
                      </li>
                      <hr className="mobileHrLine" />
                      <Link 
                        href="/music" 
                        className="mobileStoreDropdownItem" 
                        onClick={handleLinkClick}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Music className="mobileDropdownIcon" size={18} />
                        Music
                      </Link>
                    </ul>
                  )}
                </li>
                {!user && (
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
                {user && (
                  <li>
                    <div 
                      onClick={handleProfileDropdown}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.75rem 1rem',
                        color: 'white'
                      }}
                    >
                      <CiUser className="navIcons" />
                      <CiShoppingCart className="navIcons" />
                      <span>Profile</span>
                    </div>
                    {profileDropdown && (
                      <div 
                        style={{
                          background: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          margin: '0.5rem 0',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={handleViewProfile}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          View Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </li>
                )}
              </ul>
            </nav>
          </div>

        </nav>

      </header>
    </ColorProvider>
  );
}
