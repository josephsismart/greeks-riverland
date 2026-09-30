import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faLeaf } from "@fortawesome/free-solid-svg-icons";
import { NAV } from "@/data/site";
import { SunsetScene } from "./Art";

export default function Footer() {
  return (
    <footer>
      <section className="sunset-band">
        <SunsetScene />
        <div className="sunset-inner container">
          <p className="script">“Different shores, the same people.”</p>
          <p className="script right">Honouring the past. Preserving it for the future.</p>
        </div>
      </section>
      <div className="footer-main">
        <div className="container footer-grid">
          <div>
            <p className="footer-brand">Greeks of the Riverland</p>
            <p className="muted">
              A volunteer community heritage project recording the Greek families of South Australia’s Riverland, 1950 – 2020.
            </p>
            <p className="muted small">
              <FontAwesomeIcon icon={faLock} /> Every submission is reviewed before publication. Contributors’ contact details are never published.
            </p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="container footer-bottom">
          <FontAwesomeIcon icon={faLeaf} /> Greeks of the Riverland · South Australia
        </div>
      </div>
    </footer>
  );
}
