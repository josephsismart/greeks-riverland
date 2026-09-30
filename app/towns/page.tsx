import Link from "next/link";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import { RiverMap, Vignette } from "@/components/Art";
import Reveal from "@/components/Reveal";
import { TOWNS } from "@/data/site";

export const metadata: Metadata = { title: "Towns" };

const ART = ["river", "vineyard", "shed", "gathering", "school", "church", "vineyard"] as const;

export default function Towns() {
  return (
    <>
      <PageHero
        eyebrow="Along the Murray"
        title="Riverland Towns"
        intro="Each town page lists the Greek families, businesses, farms and history connected with that place."
      />
      <section className="section cream">
        <div className="container two-col">
          <Reveal>
            <RiverMap />
            <p className="small muted center" style={{ marginTop: 10 }}>Tap a town on the map to open its page.</p>
          </Reveal>
          <div className="grid-2">
            {TOWNS.map((t, i) => (
              <Reveal key={t.slug} delay={i * 60}>
                <Link href={`/towns/${t.slug}`} className="town-card">
                  <Vignette kind={ART[i]} />
                  <div className="t">
                    <h3><FontAwesomeIcon icon={faLocationDot} className="pin" />{t.name}</h3>
                    <p>{t.blurb}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
