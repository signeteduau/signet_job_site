"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PanelShimmer } from "@/app/components/signet/shimmer";
import ProfileSocialLinks from "@/app/components/signet/profile-social-links";
import { formatAppliedDate } from "@/lib/job-utils";
import { formatFullPhone } from "@/lib/phone-country-codes";
import { fetchCompanyJobs } from "@/lib/services/jobs";
import { getUserProfile } from "@/lib/services/users";
import { AppUser, UserType } from "@/types/firestore";

function Fact({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: React.ReactNode;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="signet-people-fact">
      <i className={`bi ${icon}`} aria-hidden />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function ManagementPerson({
  expectedType,
}: {
  expectedType: UserType;
}) {
  const params = useParams();
  const id = String(params?.id || "");
  const [person, setPerson] = useState<AppUser | null>(null);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const profile = await getUserProfile(id);
        if (!alive) return;
        if (!profile || profile.userType !== expectedType) {
          setPerson(null);
          return;
        }
        setPerson(profile);
        if (expectedType === "company") {
          const jobs = await fetchCompanyJobs(id);
          if (alive) setJobCount(jobs.length);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, expectedType]);

  if (loading) {
    return (
      <div className="signet-people">
        <PanelShimmer rows={6} />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="signet-people">
        <Link href="/management" className="signet-people-back">
          <i className="bi bi-arrow-left" aria-hidden /> People
        </Link>
        <div className="signet-people-empty">
          <h4>{expectedType === "company" ? "Employer" : "Candidate"} not found</h4>
          <p>This profile is missing or was removed.</p>
        </div>
      </div>
    );
  }

  const isCompany = expectedType === "company";
  const name = isCompany
    ? person.companyName || person.fullName || "Company"
    : person.fullName || person.email || "Candidate";
  const photo = person.logoUrl || person.profileImage || "";
  const phone = formatFullPhone(person.phoneCountryCode, person.phone);
  const location =
    person.companyLocation ||
    person.address ||
    [person.street, person.city, person.state, person.postcode, person.country]
      .filter(Boolean)
      .join(", ");
  const joined = formatAppliedDate(person.createdAt);
  const roleLabel = isCompany
    ? person.industry || "Employer"
    : person.occupation || "Candidate";
  const skills = (person.skills || []).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="signet-people">
      <Link href="/management" className="signet-people-back d-none d-lg-inline-flex">
        <i className="bi bi-arrow-left" aria-hidden /> People
      </Link>

      <section className="signet-people-profile">
        <div className="signet-people-banner" aria-hidden />
        <div className="signet-people-profile-body">
          <div className={`signet-people-avatar xl${isCompany ? "" : " is-round"}`}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="signet-people-profile-copy">
            <p className="signet-eyebrow">{isCompany ? "Employer" : "Candidate"}</p>
            <h1>{name}</h1>
            <p className="signet-people-role">{roleLabel}</p>
            <div className="signet-people-actions">
              {person.email && (
                <a className="signet-people-action" href={`mailto:${person.email}`}>
                  <i className="bi bi-envelope" aria-hidden /> Email
                </a>
              )}
              {phone && (
                <a className="signet-people-action" href={`tel:${phone.replace(/\s+/g, "")}`}>
                  <i className="bi bi-telephone" aria-hidden /> Call
                </a>
              )}
              {!isCompany && person.resumeUrl && (
                <a
                  className="signet-people-action"
                  href={person.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="bi bi-file-earmark-text" aria-hidden /> Resume
                </a>
              )}
              {person.website && (
                <a
                  className="signet-people-action"
                  href={person.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="bi bi-globe" aria-hidden /> Website
                </a>
              )}
            </div>
            <ProfileSocialLinks profile={person} />
          </div>
        </div>
      </section>

      <div className="signet-people-facts">
        {isCompany && person.fullName && person.fullName !== name && (
          <Fact icon="bi-person" label="Contact" value={person.fullName} />
        )}
        <Fact
          icon="bi-envelope"
          label="Email"
          value={
            person.email ? (
              <a href={`mailto:${person.email}`}>{person.email}</a>
            ) : null
          }
        />
        <Fact
          icon="bi-telephone"
          label="Phone"
          value={
            phone ? <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a> : null
          }
        />
        <Fact icon="bi-geo-alt" label="Location" value={location} />
        {isCompany && <Fact icon="bi-people" label="Company size" value={person.companySize} />}
        {isCompany && <Fact icon="bi-calendar3" label="Founded" value={person.foundedYear} />}
        {isCompany && (
          <Fact
            icon="bi-briefcase"
            label="Posted jobs"
            value={jobCount === null ? "…" : String(jobCount)}
          />
        )}
        {!isCompany && (
          <Fact icon="bi-hourglass-split" label="Experience" value={person.experienceYears} />
        )}
        {!isCompany && person.isStudent && (
          <Fact
            icon="bi-mortarboard"
            label="Student"
            value={person.usid ? person.usid : "Yes"}
          />
        )}
        <Fact icon="bi-clock" label="Joined" value={joined} />
      </div>

      {skills.length > 0 && (
        <section className="signet-people-panel">
          <h2>Skills</h2>
          <div className="signet-people-chips">
            {skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </section>
      )}

      {(person.about || person.aboutMe) && (
        <section className="signet-people-panel">
          <h2>About</h2>
          <p className="signet-people-about">{person.about || person.aboutMe}</p>
        </section>
      )}
    </div>
  );
}
