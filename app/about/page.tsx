import Link from "next/link";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faShieldHeart, faHandsHoldingCircle, faEnvelope, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import { FORM_URL } from "@/data/site";

export const metadata: Metadata = { title: "About & Contact" };

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About the project"
        title="About & Contact"
        intro="Why this archive exists, how it works and how to get in touch."
      />
      <section className="section">
        <div className="narrow">
          <h2>Why this project?</h2>
          <p>
            From the 1950s, Greek migrants made new lives in South Australia’s Riverland — in Berri, Renmark, Barmera, Monash,
            Loxton, Paringa and the surrounding districts. They worked the orchards and vineyards, packing sheds and factories,
            opened shops and businesses, and built a close community around family, church and friendship.
          </p>
          <p>
            Many of the original migrants have now passed away, and much of the next generation has moved away from the area.
            Greeks of the Riverland is a volunteer effort to create a lasting digital archive of their families, photographs and
            memories before this history is lost.
          </p>
        </div>
        <div className="container grid-3" style={{ marginTop: 40 }}>
          <div className="feature" style={{ ["--c" as string]: "#1F3A5F" }}>
            <div className="ic"><FontAwesomeIcon icon={faBullseye} /></div>
            <h3>Our purpose</h3>
            <p>To record and share the story of the Greek community of the Riverland, 1950 – 2020.</p>
          </div>
          <div className="feature" style={{ ["--c" as string]: "#5E6B3A" }}>
            <div className="ic"><FontAwesomeIcon icon={faShieldHeart} /></div>
            <h3>Respect & privacy</h3>
            <p>Every submission is reviewed before publication. Contributors’ contact details are never published.</p>
          </div>
          <div className="feature" style={{ ["--c" as string]: "#A8742F" }}>
            <div className="ic"><FontAwesomeIcon icon={faHandsHoldingCircle} /></div>
            <h3>How to help</h3>
            <p>Share your family’s story, identify people in old photos, or support the project’s running costs.</p>
          </div>
        </div>
        <div className="narrow" style={{ marginTop: 48 }}>
          <div className="panel">
            <h2><FontAwesomeIcon icon={faEnvelope} style={{ color: "var(--gold)" }} /> Contact</h2>
            <p>
              The safest way to reach the project is through our online form — your details go only to the project team and are
              never published.
            </p>
            <div className="hero-cta" style={{ justifyContent: "flex-start" }}>
              <a href={FORM_URL} target="_blank" rel="noopener" className="btn btn-navy">
                Contact us via the form <FontAwesomeIcon icon={faArrowRight} />
              </a>
              <Link href="/add-your-family" className="btn btn-outline">Add your family</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
