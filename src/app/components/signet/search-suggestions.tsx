"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  query: string;
  suggestions: string[];
  onSelect: (value: string) => void;
  onClear?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function matchSuggestion(item: string, query: string) {
  const key = item.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (key.includes(q)) return true;
  if (key.startsWith(q)) return true;
  return q.split(/\s+/).every((part) => part.length > 0 && key.includes(part));
}

export default function SearchSuggestions({
  query,
  suggestions,
  onSelect,
  onClear,
  inputRef,
  className = "",
  id,
  open: openProp,
  onOpenChange,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    return suggestions
      .filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        if (!matchSuggestion(item, q)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [query, suggestions]);

  useEffect(() => {
    if (query.trim()) {
      setOpen(true);
    } else {
      setOpen(false);
    }
    setActiveIndex(0);
  }, [query, setOpen]);

  useEffect(() => {
    const input = inputRef?.current;
    if (!input) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open || !filtered.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && open) {
        e.preventDefault();
        onSelect(filtered[activeIndex]);
        setOpen(false);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    input.addEventListener("keydown", onKeyDown);
    return () => input.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered, inputRef, onSelect, open, setOpen]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        !listRef.current?.contains(e.target as Node) &&
        !inputRef?.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [inputRef, setOpen]);

  if (!open || !filtered.length) return null;

  return (
    <div
      id={id}
      ref={listRef}
      className={`signet-search-suggestions ${className}`.trim()}
      role="listbox"
      aria-label="Search suggestions"
    >
      {filtered.map((item, index) => (
        <button
          key={item}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className={`signet-search-suggestion ${index === activeIndex ? "is-active" : ""}`}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => {
            onSelect(item);
            setOpen(false);
            onClear?.();
          }}
        >
          <i className="bi bi-search" aria-hidden />
          <span>{item}</span>
        </button>
      ))}
    </div>
  );
}
