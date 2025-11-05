"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import "./NavBar.css";
import Logo from "./Logo";
import { ColorProvider } from "./ColorProvider";
import { CiShoppingCart } from "react-icons/ci";
import { CiUser } from "react-icons/ci";
import { IoMoonOutline } from "react-icons/io5";
import { IoShirtOutline } from "react-icons/io5";
import { useUserAuth } from "@/context/UserAuthContext";
import { useRouter } from "next/navigation";


export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const { user, signOut } = useUserAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure component is hydrated on client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
                    <Link href="/" className="dropdownLink" onClick={handleLinkClick}>
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
                <div 
                  onClick={handleProfileDropdown}
                  className="profileIconsWrapper"
                >
                  <CiUser className="navIcons" />
                  <CiShoppingCart className="navIcons" />
                </div>
                {profileDropdown && (
                  <div className="profileDropdownMenu">
                    <button
                      onClick={handleViewProfile}
                      className="profileDropdownButton"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="profileDropdownButton"
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
                      <Link 
                        href="/" 
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
                    <div 
                      onClick={handleProfileDropdown}
                      className="mobileProfileIconsWrapper"
                    >
                      <CiUser className="navIcons" />
                      <CiShoppingCart className="navIcons" />
                      <span>Profile</span>
                    </div>
                    {profileDropdown && (
                      <div className="mobileProfileDropdownMenu">
                        <button
                          onClick={handleViewProfile}
                          className="profileDropdownButton"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="profileDropdownButton"
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
