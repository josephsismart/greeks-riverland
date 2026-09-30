import Link from "next/link";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDove, faUser, faCakeCandles, faEarthEurope, faLocationDot, faCalendar, faMonument, faImage, faFeather } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import { OliveBranch } from "@/components/Art";

export const metadata: Metadata = { title: "In Memoriam" };

const ITEMS = [
  { icon: faUser, t: "Full name" },
  { icon: faCakeCandles, t: "Year of birth" },
  { icon: faEarthEurope, t: "Place of birth" },
  { icon: faLocationDot, t: "Riverland connection" },
  { icon: faCalendar, t: "Year of death" },
  { icon: faMonument, t: "Cemetery details" },
  { icon: faImage, t: "Photograph" },
  { icon: faFeather, t: "A short family tribute" },
];

export default function InMemoriam() {
  return (
    <>
      <PageHero
        eyebrow="Remembering"
        title="In Memoriam"
        intro="A respectful place to remember members of the Greek Riverland community who have passed away."
      />
      <section className="section">
        <div className="narrow center">
          <OliveBranch className="memoriam-branch" />
          <h2>Αιωνία η μνήμη — May their memory be eternal</h2>
          <p className="lead">
            Tributes are added only with the family’s permission and after review. If you would like to remember a parent,
            grandparent or relative, you can include an In Memoriam entry when you add your family.
          </p>
        </div>
        <div className="container" style={{ marginTop: 36 }}>
          <div className="panel">
            <h3><FontAwesomeIcon icon={faDove} style={{ color: "var(--gold)" }} /> Each tribute may include</h3>
            <div className="grid-4" style={{ marginTop: 16 }}>
              {ITEMS.map((i) => (
                <p key={i.t} style={{ margin: 0 }}>
                  <FontAwesomeIcon icon={i.icon} style={{ color: "var(--olive)", width: 18 }} /> &nbsp;{i.t}
                </p>
              ))}
            </div>
          </div>
          <div className="center" style={{ marginTop: 30 }}>
            <p className="missing">No tributes have been published yet.</p>
            <Link href="/add-your-family" className="btn btn-navy">
              <FontAwesomeIcon icon={faDove} /> Add an In Memoriam entry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
