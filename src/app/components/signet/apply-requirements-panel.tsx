"use client";

import React from "react";
import Link from "next/link";
import { AppUser } from "@/types/firestore";
import { getApplyRequirements } from "@/lib/profile-completion";

export default function ApplyRequirementsPanel({
  profile,
}: {
  profile?: AppUser | null;
}) {
  const items = getApplyRequirements(profile);
  const missing = items.filter((item) => !item.filled);
  if (!missing.length) return null;

  return (
    <div className="signet-apply-block">
      <strong>You can’t apply yet</strong>
      <p>Add these on your profile first:</p>
      <ul>
        {items.map((item) => (
          <li key={item.key} className={item.filled ? "is-done" : "is-todo"}>
            <i
              className={`bi ${
                item.filled ? "bi-check-circle-fill" : "bi-x-circle"
              }`}
              aria-hidden
            />
            <span>{item.label}</span>
            <em>{item.filled ? "Added" : "Required"}</em>
          </li>
        ))}
      </ul>
      <Link href="/candidate/profile" className="signet-btn w-100">
        Complete profile
      </Link>
    </div>
  );
}
