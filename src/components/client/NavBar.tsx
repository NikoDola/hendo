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
import { useShopifyAuth } from "@/context/ShopifyAuthContext";


export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { customer, logout } = useShopifyAuth();
  const [dropdown, setDropdown] = useState(false);

  // Check if we're on mobile to conditionally render

  // Close menu when clicking on a link
  const handleLinkClick = () => {
    if (isOpen) setIsOpen(false);
  };

  const handleDropdown = () => {
    setDropdown(!dropdown);
    console.log(dropdown);
  };

  // Toggle menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <ColorProvider>
      {/* Desktop Navigation */}
      <header className="headerWrapperDesktop">
        <div className="cardProfileWrapper">
          <CiUser className="navIcons" />
          <CiShoppingCart className="navIcons" />
        </div>
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
                  </ul>
                </div> : ""}
            </div>
            {customer ? (
              <>
                <Link className="linkDesktop" href="/dashboard" onClick={handleLinkClick}>
                  Dashboard
                </Link>
                <button
                  className="linkDesktop"
                  onClick={() => {
                    logout();
                    handleLinkClick();
                  }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="linkDesktop" href="/login" onClick={handleLinkClick}>
                  Login
                </Link>
                <Link className="linkDesktop" href="/signup" onClick={handleLinkClick}>
                  Signup
                </Link>
              </>
            )}
          </ul>
        </nav>
      </header>

      {/* Mobile Navigation */}
      <header className="headerWrapperMobile">
        <nav className="navWrapperMobile">
          <div className="cardProfileWrapperMobile">
            <CiUser className="navIcons" />
            <CiShoppingCart className="navIcons" />
          </div>
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
                    </ul>
                  )}
                </li>
                {customer ? (
                  <>
                    <li>
                      <Link
                        className="linkMobile"
                        href="/dashboard"
                        onClick={handleLinkClick}
                      >
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <button
                        className="linkMobile"
                        onClick={() => {
                          logout();
                          handleLinkClick();
                        }}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                      >
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
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
              </ul>
            </nav>
          </div>

        </nav>

      </header>
    </ColorProvider>
  );
}
