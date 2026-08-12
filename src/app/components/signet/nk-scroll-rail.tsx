"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type NkScrollRailProps = {
  children: React.ReactNode;
  railClassName: string;
  wrapClassName?: string;
  ariaLabel?: string;
};

export function NkScrollRail({
  children,
  railClassName,
  wrapClassName = "nk-rail-wrap",
  ariaLabel,
}: NkScrollRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const updateArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && scrollLeft > 4);
    setCanScrollRight(overflow && scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows, children]);

  const scrollBy = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const amount = Math.max(220, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const showArrows = hasOverflow && isHovered;

  return (
    <div
      className={`${wrapClassName} nk-scroll-rail-wrap${showArrows ? " is-active" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className={`nk-rail-arrow nk-rail-arrow-left${canScrollLeft ? " is-available" : ""}`}
        aria-label="Scroll left"
        aria-hidden={!showArrows || !canScrollLeft}
        tabIndex={showArrows && canScrollLeft ? 0 : -1}
        onClick={() => scrollBy(-1)}
      >
        <i className="bi bi-chevron-left" aria-hidden />
      </button>

      <div ref={railRef} className={railClassName} aria-label={ariaLabel}>
        {children}
      </div>

      <button
        type="button"
        className={`nk-rail-arrow nk-rail-arrow-right${canScrollRight ? " is-available" : ""}`}
        aria-label="Scroll right"
        aria-hidden={!showArrows || !canScrollRight}
        tabIndex={showArrows && canScrollRight ? 0 : -1}
        onClick={() => scrollBy(1)}
      >
        <i className="bi bi-chevron-right" aria-hidden />
      </button>
    </div>
  );
}
