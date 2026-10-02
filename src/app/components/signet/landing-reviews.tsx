"use client";

import React, { useEffect, useRef, useState } from "react";

type Review = {
  quote: string;
  name: string;
  title: string;
  place: string;
  kind: "Candidate" | "Employer";
  accent: string;
  rating: number;
};

const REVIEWS: Review[] = [
  {
    quote:
      "I applied to three roles on a Sunday night and had an interview booked by Tuesday. Signet made the whole process feel simple — profile, apply, chat, done.",
    name: "Priya Sharma",
    title: "Registered Nurse",
    place: "Melbourne",
    kind: "Candidate",
    accent: "#2550eb",
    rating: 5,
  },
  {
    quote:
      "We posted a site supervisor role and shortlisted strong candidates in days, not weeks. The in-app chat saved us from a messy email trail.",
    name: "James O’Connor",
    title: "Hiring Manager",
    place: "Brisbane",
    kind: "Employer",
    accent: "#ff7555",
    rating: 4,
  },
  {
    quote:
      "Clear job details, real companies, and I could track every application. It felt built for people actually looking for work — not just browsing ads.",
    name: "Aisha Khan",
    title: "Business Administrator",
    place: "Sydney",
    kind: "Candidate",
    accent: "#0ea5a4",
    rating: 5,
  },
  {
    quote:
      "Finding qualified trade talent used to take forever. Signet brought us applicants who already had the right tickets and experience.",
    name: "Daniel Reeves",
    title: "Workshop Supervisor",
    place: "Perth",
    kind: "Employer",
    accent: "#7c5cfc",
    rating: 5,
  },
  {
    quote:
      "The career tips and job alerts kept me moving. I landed a community support role that actually matched what I wanted to do.",
    name: "Mei Lin",
    title: "Community Support Worker",
    place: "Adelaide",
    kind: "Candidate",
    accent: "#e11d74",
    rating: 5,
  },
];

const AVERAGE_RATING = Number(
  (REVIEWS.reduce((sum, item) => sum + item.rating, 0) / REVIEWS.length).toFixed(1)
);

const ROTATE_MS = 7000;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function Stars({ value = 5 }: { value?: number }) {
  return (
    <span className="nk-review-stars" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        if (fill >= 1) {
          return <i key={i} className="bi bi-star-fill" aria-hidden />;
        }
        if (fill <= 0) {
          return <i key={i} className="bi bi-star" aria-hidden />;
        }
        return (
          <span
            key={i}
            className="nk-review-star-partial"
            style={{ ["--fill" as string]: `${fill * 100}%` }}
          >
            <i className="bi bi-star" aria-hidden />
            <span className="nk-review-star-fill">
              <i className="bi bi-star-fill" aria-hidden />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function LandingReviews() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const review = REVIEWS[index];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % REVIEWS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, index]);

  const goTo = (next: number) => {
    const length = REVIEWS.length;
    setIndex(((next % length) + length) % length);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start == null || end == null) return;
    const delta = start - end;
    if (Math.abs(delta) < 48) return;
    goTo(index + (delta > 0 ? 1 : -1));
  };

  return (
    <section className="nk-reviews" aria-labelledby="nk-reviews-title">
      <div className="nk-container">
        <header className="nk-reviews-head">
          <div>
            <p className="nk-reviews-kicker">Testimonials</p>
            <h2 id="nk-reviews-title">What people say</h2>
            <p className="nk-reviews-lead">
              Real notes from candidates and employers using Signet.
            </p>
          </div>
          <div className="nk-reviews-score">
            <span className="nk-reviews-score-value">{AVERAGE_RATING.toFixed(1)}</span>
            <span className="nk-reviews-score-meta">
              <Stars value={AVERAGE_RATING} />
              <small>Average rating</small>
            </span>
          </div>
        </header>

        <div
          className="nk-review-board"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <article
            className="nk-review-stage"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-live="polite"
          >
            <span className="nk-review-ornament" aria-hidden>
              “
            </span>
            <div key={review.name} className="nk-review-stage-copy">
              <div className="nk-review-stage-meta">
                <span className="nk-review-rating">
                  <strong>{review.rating.toFixed(1)}</strong>
                  <Stars value={review.rating} />
                </span>
                <span className={`nk-review-kind is-${review.kind.toLowerCase()}`}>
                  {review.kind}
                </span>
              </div>
              <blockquote className="nk-review-quote">{review.quote}</blockquote>
              <footer className="nk-review-person">
                <span
                  className="nk-review-avatar is-lg"
                  style={{ background: review.accent }}
                  aria-hidden
                >
                  {initials(review.name)}
                </span>
                <span>
                  <strong>{review.name}</strong>
                  <em>
                    {review.title} · {review.place}
                  </em>
                </span>
              </footer>
            </div>

            <div className="nk-review-controls">
              <button
                type="button"
                className="nk-review-nav"
                aria-label="Previous review"
                onClick={() => goTo(index - 1)}
              >
                <i className="bi bi-arrow-left" aria-hidden />
              </button>
              <span className="nk-review-count">
                {String(index + 1).padStart(2, "0")}
                <em>/</em>
                {String(REVIEWS.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                className="nk-review-nav"
                aria-label="Next review"
                onClick={() => goTo(index + 1)}
              >
                <i className="bi bi-arrow-right" aria-hidden />
              </button>
            </div>
          </article>

          <div className="nk-review-stepper" role="tablist" aria-label="Choose a review">
            {REVIEWS.map((item, itemIndex) => {
              const active = itemIndex === index;
              return (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`nk-review-step${active ? " is-active" : ""}`}
                  onClick={() => goTo(itemIndex)}
                >
                  <span
                    className="nk-review-avatar"
                    style={{ background: item.accent }}
                    aria-hidden
                  >
                    {initials(item.name)}
                  </span>
                  <span className="nk-review-step-copy">
                    <strong>{item.name}</strong>
                    <em>
                      {item.title} · {item.place}
                    </em>
                    <Stars value={item.rating} />
                  </span>
                  {active && !paused && !reduceMotion ? (
                    <span className="nk-review-step-progress" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
