"use client";

import { useState } from "react";
import Link from "next/link";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`site-header${isMenuOpen ? " is-open" : ""}`}>
      <div className="container nav-row">
        <div className="nav-top">
          <Link href="/" className="brand" onClick={closeMenu}>
            Turk Estate Legal
          </Link>
          <button
            type="button"
            className={`menu-toggle${isMenuOpen ? " is-open" : ""}`}
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav
          id="main-navigation"
          className="nav-links"
          aria-label="Main navigation"
        >
          <Link href="/" onClick={closeMenu}>
            Home
          </Link>
          <Link href="/articles" onClick={closeMenu}>
            Articles
          </Link>
          <Link href="/about" onClick={closeMenu}>
            About
          </Link>
          <Link href="/contact" onClick={closeMenu}>
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
