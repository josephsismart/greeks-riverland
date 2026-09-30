import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPeopleGroup, faStore, faTractor, faLandmark, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import { FAMILIES, TOWNS } from "@/data/site";

export function generateStaticParams() {
  return TOWNS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: TOWNS.find((t) => t.slug === slug)?.name ?? "Town" };
}

export default async function TownPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const town = TOWNS.find((t) => t.slug === slug);
  if (!town) notFound();
  const families = FAMILIES.filter((f) => f.town === town.slug);
  const sections = [
    { icon: faStore, title: "Businesses", text: `Shops, cafés and businesses run by Greek families in ${town.name}.` },
    { icon: faTractor, title: "Farms & blocks", text: "Orchards, vineyards and blocks worked by Greek families." },
    { icon: faLandmark, title: "History", text: "Churches, clubs, events and places that mattered to the community." },
  ];
  return (
    <>
      <PageHero eyebrow="Riverland town" title={town.name} intro={town.blurb} />
      <section className="section">
        <div className="container">
          <p className="crumbs"><Link href="/towns"><FontAwesomeIcon icon={faArrowLeft} /> All towns</Link></p>
          <h2><FontAwesomeIcon icon={faPeopleGroup} style={{ color: "var(--gold)" }} /> Greek families of {town.name}</h2>
          {families.length ? (
            <div className="grid-2" style={{ marginBottom: 40 }}>
              {families.map((f) => (
                <Link key={f.slug} href={`/families/${f.slug}`} className="panel family-card">
                  <span className="mono">{f.surname[0]}</span>
                  <span>
                    <h3>The {f.surname} Family</h3>
                    <p>{f.location} · {f.riverlandYears}</p>
                  </span>
                  <FontAwesomeIcon icon={faArrowRight} className="go" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="missing" style={{ marginBottom: 40 }}>
              No families recorded here yet. <Link href="/add-your-family">Add your family</Link>
            </p>
          )}
          <div className="grid-3">
            {sections.map((s, i) => (
              <div className="feature" key={s.title} style={{ ["--c" as string]: ["#A8742F", "#5E6B3A", "#1F3A5F"][i] }}>
                <div className="ic"><FontAwesomeIcon icon={s.icon} /></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <p className="missing" style={{ marginTop: 10 }}>To be added from family submissions.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
