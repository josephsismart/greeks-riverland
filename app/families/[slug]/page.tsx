import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faLocationDot, faEarthEurope, faShip, faCalendar, faBriefcase, faChildren, faSchool, faChurch,
  faHandshake, faBookOpen, faCamera, faDove, faHouse, faUsers, faArrowLeft, faPen, faImage,
} from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import { FAMILIES, TOWNS, type Family } from "@/data/site";

export function generateStaticParams() {
  return FAMILIES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = FAMILIES.find((x) => x.slug === slug);
  return { title: f ? `The ${f.surname} Family` : "Family" };
}

function Missing() {
  return (
    <p className="missing">
      Not yet recorded. <Link href="/add-your-family">Can you help?</Link>
    </p>
  );
}

const FIELDS: { key: keyof Family; label: string; icon: IconDefinition }[] = [
  { key: "occupation", label: "Occupation", icon: faBriefcase },
  { key: "children", label: "Children", icon: faChildren },
  { key: "schools", label: "Schools", icon: faSchool },
  { key: "community", label: "Community involvement", icon: faChurch },
  { key: "friends", label: "Family friends", icon: faHandshake },
  { key: "memories", label: "Memories", icon: faBookOpen },
  { key: "laterSettled", label: "Where the family later settled", icon: faHouse },
];

export default async function FamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FAMILIES.find((x) => x.slug === slug);
  if (!f) notFound();
  const town = TOWNS.find((t) => t.slug === f.town);
  return (
    <>
      <PageHero eyebrow={`Family · ${town?.name ?? "Riverland"}`} title={`The ${f.surname} Family`} intro={f.summary} />
      <section className="section">
        <div className="container">
          <p className="crumbs">
            <Link href="/families"><FontAwesomeIcon icon={faArrowLeft} /> All families</Link>
          </p>
          <div className="profile">
            <aside className="panel">
              <h3>At a glance</h3>
              <ul className="facts">
                <li><FontAwesomeIcon icon={faUsers} /><span><b>Main family members</b>{f.members.join(", ")}</span></li>
                <li><FontAwesomeIcon icon={faLocationDot} /><span><b>Riverland location</b>{f.location}{town && <> · <Link href={`/towns/${town.slug}`}>{town.name}</Link></>}</span></li>
                <li><FontAwesomeIcon icon={faCalendar} /><span><b>Riverland years</b>{f.riverlandYears ?? "—"}</span></li>
                <li><FontAwesomeIcon icon={faEarthEurope} /><span><b>Origin in Greece</b>{f.origin ?? "—"}</span></li>
                <li><FontAwesomeIcon icon={faShip} /><span><b>Arrival in Australia</b>{f.arrival ?? "—"}</span></li>
              </ul>
              <Link href="/add-your-family" className="btn btn-navy" style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
                <FontAwesomeIcon icon={faPen} /> Add to this page
              </Link>
            </aside>
            <div>
              {FIELDS.map((fd) => (
                <div className="field" key={fd.key}>
                  <h3><FontAwesomeIcon icon={fd.icon} /> {fd.label}</h3>
                  {f[fd.key] ? <p>{f[fd.key] as string}</p> : <Missing />}
                </div>
              ))}
              <div className="field">
                <h3><FontAwesomeIcon icon={faCamera} /> Photographs</h3>
                <p className="missing">No photographs yet. <Link href="/add-your-family#photos">Share a family photograph</Link></p>
                <div className="placeholder-photos">
                  {[0, 1, 2].map((i) => (
                    <div key={i}><FontAwesomeIcon icon={faImage} /></div>
                  ))}
                </div>
              </div>
              <div className="field" style={{ borderBottom: 0 }}>
                <h3><FontAwesomeIcon icon={faDove} /> In Memoriam</h3>
                <Missing />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
