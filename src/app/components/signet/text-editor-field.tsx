"use client";

import React, { useRef } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  minHeight?: number;
};

function applyLinePrefix(text: string, selectionStart: number, selectionEnd: number, prefix: string) {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const block = selected || "";
  const lines = block ? block.split("\n") : [""];
  const prefixed = lines.map((line, index) => {
    const numbered = prefix === "numbered";
    if (numbered) return `${index + 1}. ${line.replace(/^\d+[.)]\s*/, "")}`;
    const bulletPrefix = prefix === "bullet" ? "- " : prefix;
    return line.startsWith(bulletPrefix.trim()) ? line : `${bulletPrefix}${line}`;
  });
  const insertion = prefixed.join("\n");
  const next = `${before}${insertion}${after}`;
  const cursor = before.length + insertion.length;
  return { next, cursorStart: cursor, cursorEnd: cursor };
}

export default function SignetTextEditorField({
  label,
  value,
  onChange,
  required,
  placeholder,
  minHeight = 140,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runFormat = (kind: "bullet" | "numbered" | "break") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (kind === "break") {
      const next = `${value.slice(0, start)}\n\n${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + 2;
        el.setSelectionRange(pos, pos);
      });
      return;
    }

    const result = applyLinePrefix(value, start, end, kind);
    onChange(result.next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.cursorStart, result.cursorEnd);
    });
  };

  return (
    <div className="signet-field signet-text-editor">
      <label>{label}</label>
      <div className="signet-text-editor-shell">
        <div className="signet-text-editor-toolbar" role="toolbar" aria-label={`${label} formatting`}>
          <button
            type="button"
            className="signet-text-editor-btn"
            title="Bullet list"
            aria-label="Add bullet points"
            onClick={() => runFormat("bullet")}
          >
            <i className="bi bi-list-ul" aria-hidden />
          </button>
          <button
            type="button"
            className="signet-text-editor-btn"
            title="Numbered list"
            aria-label="Add numbered list"
            onClick={() => runFormat("numbered")}
          >
            <i className="bi bi-list-ol" aria-hidden />
          </button>
          <button
            type="button"
            className="signet-text-editor-btn"
            title="New paragraph"
            aria-label="Insert paragraph break"
            onClick={() => runFormat("break")}
          >
            <i className="bi bi-text-paragraph" aria-hidden />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
