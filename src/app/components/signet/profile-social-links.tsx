import React from "react";
import { AppUser } from "@/types/firestore";

type SocialProfile = Pick<
  AppUser,
  "linkedinUrl" | "instagramUrl" | "facebookUrl" | "twitterUrl" | "website"
>;

const X_PATH =
  "M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L4.9 22H1.64l8.02-9.16L1.5 2h6.76l4.66 6.17L18.244 2Zm-1.16 18.08h1.83L7.01 3.83H5.05l12.03 16.25Z";

const SOCIAL_ITEMS = [
  { key: "linkedinUrl", label: "LinkedIn", className: "is-linkedin", icon: "bi-linkedin" },
  { key: "instagramUrl", label: "Instagram", className: "is-instagram", icon: "bi-instagram" },
  { key: "facebookUrl", label: "Facebook", className: "is-facebook", icon: "bi-facebook" },
  { key: "twitterUrl", label: "X", className: "is-x", icon: "" },
  { key: "website", label: "Website", className: "is-web", icon: "bi-globe" },
] as const;

export default function ProfileSocialLinks({
  profile,
}: {
  profile?: SocialProfile | null;
}) {
  if (!profile) return null;
  const items = SOCIAL_ITEMS.filter((item) => Boolean(profile[item.key]?.trim()));
  if (!items.length) return null;

  return (
    <div className="signet-profile-social">
      {items.map((item) => (
        <a
          key={item.key}
          href={profile[item.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className={item.className}
        >
          {item.key === "twitterUrl" ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d={X_PATH} />
            </svg>
          ) : (
            <i className={`bi ${item.icon}`} aria-hidden />
          )}
        </a>
      ))}
    </div>
  );
}
