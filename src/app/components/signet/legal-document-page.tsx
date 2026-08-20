"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Wrapper from "@/layouts/wrapper";
import { SIGNET_LOGO as signetLogo, SIGNET_LOGO_ALT } from "@/lib/brand";
import type {
  LegalBlock,
  LegalDocument,
  LegalSection,
  LegalSubsection,
} from "@/content/legal/types";

type Props = {
  document: LegalDocument;
};

function linkifyText(text: string) {
  const parts = text.split(
    /((?:https?:\/\/[^\s]+)|(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))/g
  );
  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
      return (
        <a key={index} href={`mailto:${part}`}>
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={index} className="signet-legal-p">
              {linkifyText(block.text)}
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="signet-legal-ul">
              {block.items.map((item) => (
                <li key={item}>{linkifyText(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "table") {
          return (
            <div key={index} className="signet-legal-table-wrap">
              <table className="signet-legal-table">
                <thead>
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{linkifyText(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "dl") {
          return (
            <dl key={index} className="signet-legal-dl">
              {block.items.map(([label, value]) => (
                <div key={label} className="signet-legal-dl-row">
                  <dt>{label}</dt>
                  <dd>{linkifyText(value)}</dd>
                </div>
              ))}
            </dl>
          );
        }
        return null;
      })}
    </>
  );
}

function LegalSubsectionView({ subsection }: { subsection: LegalSubsection }) {
  return (
    <div className="signet-legal-subsection">
      <h3>{subsection.title}</h3>
      <LegalBlocks blocks={subsection.blocks} />
    </div>
  );
}

function LegalSectionView({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} className="signet-legal-section">
      <h2>
        <span className="signet-legal-section-num">{section.number}.</span>
        {section.title}
      </h2>
      <LegalBlocks blocks={section.blocks} />
      {section.subsections.map((subsection) => (
        <LegalSubsectionView key={subsection.id} subsection={subsection} />
      ))}
    </section>
  );
}

export default function LegalDocumentPage({ document }: Props) {
  const searchParams = useSearchParams();
  const embed =
    searchParams.get("embed") === "1" || searchParams.get("webview") === "1";

  const toc = useMemo(
    () =>
      document.sections.map((section) => ({
        id: section.id,
        label: `${section.number}. ${section.title}`,
      })),
    [document.sections]
  );

  const content = (
    <article className={`signet-legal-doc ${embed ? "is-embed" : ""}`}>
      <header className="signet-legal-header">
        {!embed && (
          <div className="signet-legal-brand">
            <Image
              src={signetLogo}
              alt={SIGNET_LOGO_ALT}
              width={40}
              height={40}
            />
            <div>
              <p className="signet-legal-brand-name">Signet Employment Hub</p>
              <p className="signet-legal-brand-entity">{document.meta.entity.legalName}</p>
            </div>
          </div>
        )}
        <p className="signet-legal-kicker">{document.meta.product}</p>
        <h1>{document.meta.title}</h1>
        <div className="signet-legal-meta">
          <span>Effective date: {document.meta.effectiveDate}</span>
          <span>Version {document.meta.version}</span>
        </div>
        {document.meta.notice ? (
          <p className="signet-legal-notice">{document.meta.notice}</p>
        ) : null}
      </header>

      {!embed && (
        <nav className="signet-legal-toc" aria-label="Table of contents">
          <strong>Contents</strong>
          <ol>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="signet-legal-body-wrap">
        {document.sections.map((section) => (
          <LegalSectionView key={section.id} section={section} />
        ))}
      </div>

      {!embed && (
        <footer className="signet-legal-footer">
          <Link href="/" className="signet-btn">
            Back to site
          </Link>
        </footer>
      )}
    </article>
  );

  if (embed) {
    return <div className="signet-legal-shell is-embed">{content}</div>;
  }

  return (
    <Wrapper>
      <div className="signet-legal-shell">{content}</div>
    </Wrapper>
  );
}
