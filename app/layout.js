import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata = {
  metadataBase: new URL("https://turkestatelegal.com"),
  title: {
    default: "Turk Estate Legal | Property Guidance for Foreigners in Turkey",
    template: "%s | Turk Estate Legal"
  },
  description:
    "Clear legal and practical guidance in English for foreigners buying property in Turkey.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Turk Estate Legal",
    description:
      "Clear legal and practical guidance in English for foreigners buying property in Turkey.",
    url: "https://turkestatelegal.com",
    siteName: "Turk Estate Legal",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Turk Estate Legal",
    description:
      "Clear legal and practical guidance in English for foreigners buying property in Turkey."
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="site-header">
          <div className="container nav-row">
            <Link href="/" className="brand">
              Turk Estate Legal
            </Link>
            <nav className="nav-links" aria-label="Main navigation">
              <Link href="/">Home</Link>
              <Link href="/articles">Articles</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>
        </header>
        <main className="container main-content">{children}</main>
        <footer className="site-footer">
          <div className="container footer-grid">
            <section>
              <h3>Turk Estate Legal</h3>
              <p className="meta">
                English-only legal and practical guidance for foreigners buying
                property in Turkey.
              </p>
              <p className="meta footer-disclaimer">
                Legal Notice: Website content is for general information and does
                not replace case-specific legal advice.
              </p>
            </section>

            <section>
              <h3>Quick Links</h3>
              <p>
                <Link href="/">Home</Link>
              </p>
              <p>
                <Link href="/articles">Articles</Link>
              </p>
              <p>
                <Link href="/about">About</Link>
              </p>
              <p>
                <Link href="/contact">Contact</Link>
              </p>
            </section>

            <section>
              <h3>Contact</h3>
              <p className="meta">Lawyer Ceren Sumer Cilli, Adana</p>
              <p>
                <a href="tel:+905336342425">+90 533 634 24 25</a>
              </p>
              <p>
                <a
                  href="https://wa.me/905336342425"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </p>
              <div className="social-row" aria-label="Social links">
                <a
                  href="https://wa.me/905336342425"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  wa
                </a>
                <a href="tel:+905336342425" aria-label="Call">
                  call
                </a>
                <Link href="/contact" aria-label="Contact page">
                  go
                </Link>
                <a
                  href="https://www.facebook.com/profile.php?id=61567601773192"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook — Turk Estate Legal"
                >
                  fb
                </a>
                <a
                  href="https://www.instagram.com/turkestatelegal/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram — Turk Estate Legal"
                >
                  ig
                </a>
              </div>
            </section>
          </div>
        </footer>
      </body>
    </html>
  );
}
