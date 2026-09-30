import { HeroScene } from "./Art";

export default function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="page-hero">
      <HeroScene />
      <div className="page-hero-inner container">
        <p className="eyebrow light">{eyebrow}</p>
        <h1>{title}</h1>
        {intro && <p className="lead light">{intro}</p>}
        <div className="flourish" aria-hidden="true" />
      </div>
    </section>
  );
}
