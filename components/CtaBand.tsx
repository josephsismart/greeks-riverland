import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faHandHoldingHeart, faPenToSquare, faMagnifyingGlass, faBookOpen, faFeatherPointed } from "@fortawesome/free-solid-svg-icons";

export default function CtaBand() {
  return (
    <div className="cta-band">
      <div className="cta-grid">
        <div>
          <p className="eyebrow light">
            <FontAwesomeIcon icon={faFeatherPointed} /> &nbsp;Be part of the story
          </p>
          <h2>
            Do you have a family story, a photograph or a memory to <em>share?</em>
          </h2>
          <p>
            Many of the original migrants have now passed away. Your names, dates, photographs and memories help make sure the
            Greek community of the Riverland is never forgotten.
          </p>
          <div className="hero-cta" style={{ justifyContent: "flex-start" }}>
            <Link href="/add-your-family" className="btn btn-gold">
              <FontAwesomeIcon icon={faHeart} /> Add Your Family
            </Link>
            <Link href="/support" className="btn btn-ghost">
              <FontAwesomeIcon icon={faHandHoldingHeart} /> Support the Project
            </Link>
          </div>
        </div>
        <div className="glass-steps">
          <div>
            <span className="n"><FontAwesomeIcon icon={faPenToSquare} /></span>
            <p style={{ margin: 0 }}><b>1. Share</b><span>Fill in the simple online form: family details, memories and up to five photos.</span></p>
          </div>
          <div>
            <span className="n"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
            <p style={{ margin: 0 }}><b>2. Review</b><span>Every submission is checked by the project team. Nothing is published automatically.</span></p>
          </div>
          <div>
            <span className="n"><FontAwesomeIcon icon={faBookOpen} /></span>
            <p style={{ margin: 0 }}><b>3. Preserve</b><span>Approved stories become part of the family and town pages for future generations.</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
