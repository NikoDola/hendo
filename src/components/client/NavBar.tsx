"use client";
import Link from "next/link";
import { useState } from "react";
import "./NavBar.css";
import Logo from "./Logo";
import { ColorProvider } from "./ColorProvider";

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
        <nav className="navWrapperDesktop">
          <ul className="linksWrapperDesktop">
            <Link className="linkDesktop" href="/" onClick={handleLinkClick}>
              Home
            </Link>
            <Link className="linkDesktop" href="/about" onClick={handleLinkClick}>
              About
            </Link>
            <Link className="linkDesktop" href="/Contact" onClick={handleLinkClick}>
              Contact
            </Link>
          </ul>
          <div className="logoDesktop">
            <Logo size="40px"/>
          </div>
          <ul className="linksWrapperDesktop">
            <Link className="linkDesktop" href="/" onClick={handleLinkClick}>
              Store
            </Link>
            <Link className="linkDesktop" href="/" onClick={handleLinkClick}>
              Login
            </Link>
            <Link className="linkDesktop" href="/" onClick={handleLinkClick}>
              Signup
            </Link>
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
          <button 
            className={`burgerButton ${isOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="burgerLine"></span>
            <span className="burgerLine"></span>
            <span className="burgerLine"></span>
          </button>
          
          {/* Mobile Menu Overlay */}
          <div className={`mobileNavOverlay ${isOpen ? "open" : ""}`}>
            <nav className="mobileNavContent">
              <ul className="linksWrapperMobile">
                <li>
                  <Link className="linkMobile" href="/" onClick={handleLinkClick}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link className="linkMobile" href="/about" onClick={handleLinkClick}>
                    About
                  </Link>
                </li>
                <li>
                  <Link className="linkMobile" href="/Contact" onClick={handleLinkClick}>
                    Contact
                  </Link>
                </li>
                <li>
                  <Link className="linkMobile" href="/" onClick={handleLinkClick}>
                    Store
                  </Link>
                </li>
                <li>
                  <Link className="linkMobile" href="/" onClick={handleLinkClick}>
                    Login
                  </Link>
                </li>
                <li>
                  <Link className="linkMobile" href="/" onClick={handleLinkClick}>
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