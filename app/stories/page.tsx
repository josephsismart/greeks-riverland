import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faHeart, faPeopleGroup, faRing, faDroplet, faFutbol, faSchool, faTractor, faCamera } from "@fortawesome/free-solid-svg-icons";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import CtaBand from "@/components/CtaBand";
import { STORY_TOPICS } from "@/data/site";

export const metadata: Metadata = { title: "Stories & Photos" };

const ICONS: Record<string, IconDefinition> = {
  heart: faHeart, people: faPeopleGroup, rings: faRing, water: faDroplet, soccer: faFutbol, school: faSchool, tractor: faTractor, camera: faCamera,
};
const COLORS = ["#A8742F", "#1F3A5F", "#8B2E24", "#2F5D62", "#5E6B3A", "#4A4E5A", "#3D5A40", "#6b5b3e"];

export default function Stories() {
  return (
    <>
      <PageHero
        eyebrow="Memories & photographs"
        title="Stories & Photos"
        intro="Family memories, community stories and historical photographs from the Greek Riverland, shared by the people who lived them."
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>What we are collecting</h2>
              <p>Stories are published here after families have shared them and approved them for publication.</p>
            </div>
          </div>
          <div className="grid-4">
            {STORY_TOPICS.map((t, i) => (
              <Reveal key={t.title} delay={i * 50}>
                <div className="feature" id={t.icon === "tractor" ? "work" : undefined} style={{ ["--c" as string]: COLORS[i] }}>
                  <div className="ic"><FontAwesomeIcon icon={ICONS[t.icon]} /></div>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section cream">
        <div className="container">
          <Reveal><CtaBand /></Reveal>
        </div>
      </section>
    </>
  );
}
