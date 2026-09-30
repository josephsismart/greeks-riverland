import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPeopleGroup, faLocationDot, faBookOpen, faCross, faStore, faFileLines, faArrowRight,
  faUsers, faCamera, faHeart, faChevronDown, faHandHoldingHeart, faDove,
} from "@fortawesome/free-solid-svg-icons";
import { HeroScene, OliveBranch, RiverMap, Vignette } from "@/components/Art";
import Reveal from "@/components/Reveal";
import CtaBand from "@/components/CtaBand";
import { FAMILIES } from "@/data/site";

const CARDS = [
  { href: "/families", title: "Families", text: "Explore the families of the Greek Riverland", icon: faPeopleGroup, art: "gathering", c: "#1F3A5F" },
  { href: "/towns", title: "Towns", text: "Berri, Renmark, Monash, Barmera, Loxton and more", icon: faLocationDot, art: "river", c: "#2F5D62" },
  { href: "/stories", title: "Stories & Photos", text: "Memories, photographs and community life", icon: faBookOpen, art: "school", c: "#5E6B3A" },
  { href: "/in-memoriam", title: "In Memoriam", text: "Remembering those who came before us", icon: faCross, art: "church", c: "#4A4E5A" },
  { href: "/stories#work", title: "Businesses & Workplaces", text: "Farms, shops, packing sheds and more", icon: faStore, art: "shed", c: "#A8742F" },
  { href: "/about", title: "About the Project", text: "Our purpose, how to contribute and contact", icon: faFileLines, art: "vineyard", c: "#3D5A40" },
] as const;

export default function Home() {
  const savaidis = FAMILIES[0];
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <HeroScene />
        <div className="hero-inner container">
          <p className="eyebrow light">A community heritage archive</p>
          <h1>Greeks of the Riverland</h1>
          <p className="sub">Families, stories and memories from South Australia’s Greek community</p>
          <p className="years">1950 – 2020</p>
          <div className="flourish" aria-hidden="true" />
          <div className="hero-cta">
            <Link href="/add-your-family" className="btn btn-gold">
              <FontAwesomeIcon icon={faHeart} /> Add Your Family
            </Link>
            <Link href="/families" className="btn btn-ghost">
              Explore the families <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </div>
        <p className="hero-note">Illustration · archive photographs to come from families</p>
        <a href="#intro" className="scroll-cue" aria-label="Scroll down"><FontAwesomeIcon icon={faChevronDown} /></a>
      </section>

      {/* INTRO */}
      <section id="intro" className="section cream">
        <div className="container intro-grid">
          <Reveal className="intro-copy">
            <h2>
              A community far from home.
              <br />A story worth remembering.
            </h2>
            <p>
              From the 1950s onward, Greek migrants and their families became an important part of life in South Australia’s
              Riverland. They worked in orchards, vineyards, packing sheds, factories, shops and small businesses. They raised
              families, supported one another and created a close-knit community.
            </p>
            <p className="muted">
              This project has been created to record the families, photographs, memories and stories of the Greek community of
              the Riverland, so that their history is not forgotten.
            </p>
          </Reveal>
          <Reveal className="action-list" delay={120}>
            <Link href="/add-your-family" className="action olive">
              <span className="ic"><FontAwesomeIcon icon={faUsers} /></span>
              <span><b>Add your family</b><span>Help us preserve this history</span></span>
              <FontAwesomeIcon icon={faArrowRight} className="go" />
            </Link>
            <Link href="/add-your-family#photos" className="action cream">
              <span className="ic"><FontAwesomeIcon icon={faCamera} /></span>
              <span><b>Share photos</b><span>Upload and identify photographs</span></span>
              <FontAwesomeIcon icon={faArrowRight} className="go" />
            </Link>
            <Link href="/support" className="action navy">
              <span className="ic"><FontAwesomeIcon icon={faHeart} /></span>
              <span><b>Support the project</b><span>Make a contribution</span></span>
              <FontAwesomeIcon icon={faArrowRight} className="go" />
            </Link>
          </Reveal>
          <div className="olive-quote">
            <OliveBranch />
            <p>“Different countries, but the same roots.”</p>
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container">
          <div className="cards">
            {CARDS.map((c, i) => (
              <Reveal key={c.title} delay={i * 70}>
                <Link href={c.href} className="card" style={{ ["--c" as string]: c.c }}>
                  <div className="thumb">
                    <Vignette kind={c.art} />
                    <span className="badge"><FontAwesomeIcon icon={c.icon} /></span>
                  </div>
                  <div className="body">
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                    <FontAwesomeIcon icon={faArrowRight} className="go" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE + ARCHIVE */}
      <section className="section cream">
        <div className="container two-col">
          <Reveal>
            <h2>Explore the Riverland</h2>
            <p className="muted">See which Greek families lived in each town and area.</p>
            <div className="map-wrap">
              <RiverMap />
              <Link href="/towns" className="btn btn-navy">
                View all towns <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="section-head" style={{ marginBottom: 12 }}>
              <div>
                <h2 style={{ marginBottom: 4 }}>From the Archive</h2>
                <p>A glimpse into the lives of Greek families in the Riverland.</p>
              </div>
              <Link href="/stories" className="link-arrow">
                View more <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="archive">
              {(["vineyard", "church", "shed"] as const).map((k, i) => (
                <figure key={k}>
                  <div className="frame">
                    <Vignette kind={k} />
                    <span className="tag">Awaiting photo</span>
                  </div>
                  <figcaption>
                    {["Working in the vineyards", "Weddings & baptisms", "Packing shed days"][i]}
                    <br />
                    <Link href="/add-your-family#photos">Share a photograph</Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* LATEST / MEMORIAM / SUPPORT */}
      <section className="section">
        <div className="container tri">
          <Reveal>
            <h2>Latest Families</h2>
            <div className="mini">
              <div className="ph"><FontAwesomeIcon icon={faPeopleGroup} /></div>
              <div>
                <h3>The {savaidis.surname} Family</h3>
                <p>{savaidis.summary}</p>
                <Link href={`/families/${savaidis.slug}`} className="link-arrow">
                  Read more <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2>In Memoriam</h2>
            <div className="mini">
              <div className="ph"><FontAwesomeIcon icon={faDove} /></div>
              <div>
                <h3>Remembering those who came before us</h3>
                <p>Tributes to members of the Greek Riverland community will appear here once families have shared and approved them.</p>
                <Link href="/in-memoriam" className="link-arrow">
                  Add a tribute <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <h2>Support the Project</h2>
            <div className="mini">
              <div className="ph"><FontAwesomeIcon icon={faHandHoldingHeart} /></div>
              <div>
                <p>Your contribution helps cover website hosting, photo storage, digitisation and future improvements.</p>
                <Link href="/support" className="btn btn-navy">
                  Make a contribution <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section cream" style={{ paddingTop: 0, background: "linear-gradient(var(--paper) 50%, var(--cream) 50%)" }}>
        <div className="container">
          <Reveal>
            <CtaBand />
          </Reveal>
        </div>
      </section>
    </>
  );
}
