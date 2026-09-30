import Link from "next/link";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faPlus, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import { FAMILIES, TOWNS } from "@/data/site";

export const metadata: Metadata = { title: "Families" };

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Families() {
  const sorted = [...FAMILIES].sort((a, b) => a.surname.localeCompare(b.surname));
  const byLetter = new Map<string, typeof sorted>();
  sorted.forEach((f) => {
    const L = f.surname[0].toUpperCase();
    byLetter.set(L, [...(byLetter.get(L) || []), f]);
  });
  return (
    <>
      <PageHero
        eyebrow="Family register"
        title="Families A – Z"
        intro="The Greek families of the Riverland, listed by surname. Each family has its own page, built from what relatives share with the project."
      />
      <section className="section">
        <div className="container">
          <nav className="az" aria-label="Jump to letter">
            {LETTERS.map((L) => (byLetter.has(L) ? <a key={L} href={`#${L}`}>{L}</a> : <span key={L}>{L}</span>))}
          </nav>
          {[...byLetter.entries()].map(([L, fams]) => (
            <div className="letter-block" id={L} key={L}>
              <h2>{L}</h2>
              <div className="grid-2">
                {fams.map((f) => (
                  <Link key={f.slug} href={`/families/${f.slug}`} className="panel family-card">
                    <span className="mono">{f.surname[0]}</span>
                    <span>
                      <h3>The {f.surname} Family</h3>
                      <p>
                        <FontAwesomeIcon icon={faLocationDot} /> {TOWNS.find((t) => t.slug === f.town)?.name} · {f.riverlandYears}
                      </p>
                    </span>
                    <FontAwesomeIcon icon={faArrowRight} className="go" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="notice" style={{ marginTop: 30 }}>
            <FontAwesomeIcon icon={faPlus} />
            <div>
              <b>Is your family missing?</b> The register grows as families share their stories. Every submission is reviewed before
              anything is published. <Link href="/add-your-family">Add your family →</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
