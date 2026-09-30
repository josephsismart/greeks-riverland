import Link from "next/link";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faServer, faImages, faFilm, faScrewdriverWrench, faSeedling, faHandHoldingHeart, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = { title: "Support the Project" };

const COSTS = [
  { icon: faGlobe, t: "Domain", d: "Keeping the website address registered." },
  { icon: faServer, t: "Hosting", d: "Keeping the website online and fast." },
  { icon: faImages, t: "Photo storage", d: "Safely storing family photographs." },
  { icon: faFilm, t: "Digitisation", d: "Scanning old photos, slides and documents." },
  { icon: faScrewdriverWrench, t: "Maintenance", d: "Updates, backups and adding new families." },
  { icon: faSeedling, t: "Future improvements", d: "New features, maps and ways to explore." },
];
const COLORS = ["#1F3A5F", "#2F5D62", "#5E6B3A", "#A8742F", "#4A4E5A", "#3D5A40"];

export default function Support() {
  return (
    <>
      <PageHero
        eyebrow="Volunteer project"
        title="Support the Project"
        intro="Greeks of the Riverland is a volunteer community project. Voluntary contributions help keep this archive online for future generations."
      />
      <section className="section">
        <div className="container">
          <h2 className="center">Your contribution helps cover</h2>
          <div className="ornament center">✦</div>
          <div className="grid-3">
            {COSTS.map((c, i) => (
              <Reveal key={c.t} delay={i * 60}>
                <div className="feature" style={{ ["--c" as string]: COLORS[i] }}>
                  <div className="ic"><FontAwesomeIcon icon={c.icon} /></div>
                  <h3>{c.t}</h3>
                  <p>{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="panel center" style={{ marginTop: 40 }}>
            <FontAwesomeIcon icon={faHandHoldingHeart} style={{ fontSize: "2.2rem", color: "var(--gold)" }} />
            <h3 style={{ marginTop: 12 }}>How to contribute</h3>
            <p className="muted">Contribution options are being set up and will be listed here soon. Thank you for your support.</p>
            <Link href="/about" className="btn btn-navy"><FontAwesomeIcon icon={faEnvelope} /> Get in touch</Link>
          </div>
        </div>
      </section>
    </>
  );
}
