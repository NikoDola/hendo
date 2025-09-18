"use client";
import Link from "next/link";
import { useState } from "react";
import "./NavBar.css";
import Logo from "./Logo";
import { ColorProvider } from "./ColorProvider";
import { CiShoppingCart } from "react-icons/ci";
import { CiUser } from "react-icons/ci";

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Check if we're on mobile to conditionally render

  // Close menu when clicking on a link
  const handleLinkClick = () => {
    if (isOpen) setIsOpen(false);
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
            <Link className="linkDesktop" href="/shop" onClick={handleLinkClick}>
              ✨Store
            </Link>
            <Link className="linkDesktop" href="/login" onClick={handleLinkClick}>
              Login
            </Link>
            <Link className="linkDesktop" href="/signup" onClick={handleLinkClick}>
              Signup
            </Link>
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
                <li>
                  <Link
                    className="linkMobile"
                    href="/shop"
                    onClick={handleLinkClick}
                  >
                    ✨Store
                  </Link>
                </li>
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
              </ul>
            </nav>
          </div>

        </nav>

      </header>
    </ColorProvider>
  );
}
