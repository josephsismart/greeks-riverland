"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark, faLeaf } from "@fortawesome/free-solid-svg-icons";
import { NAV } from "@/data/site";

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container header-row">
        <Link href="/" className="brand" aria-label="Greeks of the Riverland, home">
          <span className="brand-name">Greeks of the Riverland</span>
          <span className="brand-tag">
            <FontAwesomeIcon icon={faLeaf} /> Families · Stories · Memories
          </span>
        </Link>
        <nav className={`nav ${open ? "open" : ""}`} aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? "active" : ""}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          <FontAwesomeIcon icon={open ? faXmark : faBars} />
        </button>
      </div>
    </header>
  );
}
