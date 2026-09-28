import PlatformBadge from "./PlatformBadge";
import CopyLinkButton from "./CopyLinkButton";

export default function SkillDetailContent({ skill }) {
  return (
    <>
      <div className="meta-row">
        <span className="category-badge">{skill.category}</span>
        <PlatformBadge platform={skill.platform} />
        {skill.needsVerification && (
          <span className="verify-badge">Not independently verified</span>
        )}
      </div>
      <h1>{skill.name}</h1>
      <p className="subtitle">{skill.shortDescription}</p>

      {skill.bestThing && (
        <div className="detail-block highlight-block">
          <h2>Best thing about it</h2>
          <p>{skill.bestThing}</p>
        </div>
      )}

      {skill.whatItDoes && (
        <div className="detail-block">
          <h2>What it does</h2>
          <p>{skill.whatItDoes}</p>
        </div>
      )}

      <div className="detail-block">
        <h2>When it helps</h2>
        <p>{skill.whenToHelp}</p>
      </div>

      <div className="detail-block">
        <h2>How to install</h2>
        <p>{skill.howToInstall}</p>
      </div>

      <div className="source-actions">
        {skill.author && <span className="author-line">By {skill.author}</span>}
        <a href={skill.sourceUrl} target="_blank" rel="noopener noreferrer">
          View source ↗
        </a>
        <CopyLinkButton url={skill.sourceUrl} />
      </div>

      <div className="tag-list">
        {(skill.tags || []).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      {skill.sourceNote && <div className="source-note">{skill.sourceNote}</div>}
    </>
  );
}
