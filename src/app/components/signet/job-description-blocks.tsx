import React from "react";
import {
  JobDescriptionSection,
  parseJobDescriptionSections,
} from "@/lib/job-utils";

type Props = {
  text?: string;
  compact?: boolean;
  emptyLabel?: string;
  moreHref?: string;
  onMoreClick?: (e: React.MouseEvent) => void;
};

const PREVIEW_ITEMS = 3;

function SectionView({
  section,
  compact,
  extraCount,
  moreHref,
  onMoreClick,
}: {
  section: JobDescriptionSection;
  compact?: boolean;
  extraCount?: number;
  moreHref?: string;
  onMoreClick?: (e: React.MouseEvent) => void;
}) {
  const items = compact
    ? section.items.slice(0, PREVIEW_ITEMS)
    : section.items;
  return (
    <section className="signet-job-desc-section">
      {section.heading && (
        <h4 className="signet-job-desc-heading">{section.heading}</h4>
      )}
      {section.intro && (
        <p
          className={`signet-job-desc-intro ${compact ? "is-compact" : ""} ${
            /:\s*$/.test(section.intro) ? "is-leadin" : ""
          }`}
        >
          {section.intro}
        </p>
      )}
      {items.length > 0 && (
        <ul className="signet-job-desc-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {compact && extraCount && extraCount > 0 ? (
        moreHref ? (
          <a
            href={moreHref}
            className="signet-job-desc-more"
            onClick={onMoreClick}
          >
            +{extraCount} more on the job page
          </a>
        ) : (
          <p className="signet-job-desc-more">+{extraCount} more on the job page</p>
        )
      ) : null}
    </section>
  );
}

export default function JobDescriptionBlocks({
  text,
  compact = false,
  emptyLabel = "No description provided.",
  moreHref,
  onMoreClick,
}: Props) {
  const sections = parseJobDescriptionSections(text);
  if (!sections.length) {
    return emptyLabel ? (
      <p className="signet-job-desc-intro">{emptyLabel}</p>
    ) : null;
  }

  if (compact) {
    const preview = sections.slice(0, 2);
    const hiddenSections = sections.slice(2).reduce(
      (sum, section) => sum + section.items.length + (section.intro ? 1 : 0),
      0
    );
    const last = preview[preview.length - 1];
    const hiddenInLast = last
      ? Math.max(0, last.items.length - PREVIEW_ITEMS)
      : 0;
    const extraCount = hiddenSections + hiddenInLast;

    return (
      <div className="signet-job-desc-blocks">
        {preview.map((section, index) => (
          <SectionView
            key={`${section.heading || "section"}-${index}`}
            section={section}
            compact
            extraCount={index === preview.length - 1 ? extraCount : 0}
            moreHref={moreHref}
            onMoreClick={onMoreClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="signet-job-desc-blocks">
      {sections.map((section, index) => (
        <SectionView
          key={`${section.heading || "section"}-${index}`}
          section={section}
        />
      ))}
    </div>
  );
}
