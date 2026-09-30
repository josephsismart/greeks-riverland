import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faLocationDot, faBookOpen, faCamera, faDove, faLock, faArrowUpRightFromSquare, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import { FORM_EMBED_URL, FORM_URL } from "@/data/site";

export const metadata: Metadata = { title: "Add Your Family" };

const PARTS = [
  { icon: faUsers, t: "Family details", d: "Surname and spellings, family members, origin in Greece, arrival in Australia." },
  { icon: faLocationDot, t: "Riverland connection", d: "Town, address, years, work, farms, businesses, schools, church and clubs." },
  { icon: faBookOpen, t: "Family memories", d: "Community life, celebrations, work, migration and favourite memories." },
  { icon: faCamera, t: "Photographs", d: "Up to five photos, with names, approximate year, place and a short description." },
  { icon: faDove, t: "In Memoriam", d: "Optional details to remember family members who have passed away." },
];

export default function AddYourFamily() {
  return (
    <>
      <PageHero
        eyebrow="Share your story"
        title="Add Your Family"
        intro="Help preserve the history of the Greek community of the Riverland. Share as much or as little as you know — every detail helps."
      />
      <section className="section">
        <div className="container two-col" style={{ gridTemplateColumns: "0.85fr 1.4fr" }}>
          <aside>
            <h2>What the form asks</h2>
            <div className="steps">
              {PARTS.map((p) => (
                <div className="step" key={p.t} id={p.t === "Photographs" ? "photos" : undefined}>
                  <span className="n"><FontAwesomeIcon icon={p.icon} /></span>
                  <div><h3>{p.t}</h3><p>{p.d}</p></div>
                </div>
              ))}
            </div>
            <div className="notice" style={{ marginTop: 24 }}>
              <FontAwesomeIcon icon={faLock} />
              <div>
                <b>Your privacy.</b> Nothing appears on the website automatically. Every submission is reviewed first, and your
                contact details are never published.
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 16 }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ color: "var(--olive)" }} /> Takes about 10–20 minutes. You can leave
              any question blank except your contact details and consent.
            </p>
            <a href={FORM_URL} target="_blank" rel="noopener" className="btn btn-outline">
              Open the form in a new tab <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            </a>
          </aside>
          <iframe className="form-frame" src={FORM_EMBED_URL} title="Add Your Family — Greeks of the Riverland" loading="lazy">
            Loading…
          </iframe>
        </div>
      </section>
    </>
  );
}
