"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ProfileAvatar from "@/app/components/signet/profile-avatar";
import PhoneField from "@/app/components/signet/phone-field";
import AddressFields from "@/app/components/signet/address-fields";
import ProfileCompletionCard from "@/app/components/signet/profile-completion-card";
import { useAuth } from "@/context/auth-context";
import { addressFromProfile, formatAddress } from "@/lib/address";
import { DEFAULT_PHONE_COUNTRY_CODE } from "@/lib/phone-country-codes";
import {
  getStorageErrorMessage,
  uploadProfileImage,
  uploadProfileResume,
} from "@/lib/services/storage";
import { FileUploadField } from "@/app/components/signet/shimmer";
import ProfileSocialLinks from "@/app/components/signet/profile-social-links";
import Wrapper from "@/layouts/wrapper";

function ProfileInner() {
  const { user, profile, saveProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    profile?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [addressValue, setAddressValue] = useState(() =>
    addressFromProfile(profile)
  );
  const [occupation, setOccupation] = useState(profile?.occupation || "");
  const [aboutMe, setAboutMe] = useState(profile?.aboutMe || "");
  const [skills, setSkills] = useState((profile?.skills || []).join(", "));
  const [experienceYears, setExperienceYears] = useState(
    profile?.experienceYears || ""
  );
  const [photoUrl, setPhotoUrl] = useState(profile?.profileImage || "");
  const [uploading, setUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.fullName || "");
    setPhoneCountryCode(profile?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
    setPhone(profile?.phone || "");
    setAddressValue(addressFromProfile(profile));
    setOccupation(profile?.occupation || "");
    setAboutMe(profile?.aboutMe || "");
    setSkills((profile?.skills || []).join(", "));
    setExperienceYears(profile?.experienceYears || "");
    setPhotoUrl(profile?.profileImage || "");
  }, [profile]);

  return (
    <AppShell role="candidate" title="Profile">
      <ProfileCompletionCard profile={profile} />
      <form
        className="signet-panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!user) return;
          setSaving(true);
          try {
            await saveProfile({
              fullName,
              phone,
              phoneCountryCode,
              street: addressValue.street || "",
              city: addressValue.city || "",
              state: addressValue.state || "",
              postcode: addressValue.postcode || "",
              country: addressValue.country || "",
              address: formatAddress(addressValue),
              occupation,
              aboutMe,
              skills: skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              experienceYears,
              profileImage: photoUrl || profile?.profileImage,
            });
            toast.success("Profile updated.");
          } catch {
            toast.error("Could not save profile.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="signet-profile-hero">
          <div className="signet-profile-banner" aria-hidden />
          <div className="signet-profile-hero-body">
            <ProfileAvatar
              src={photoUrl}
              name={fullName}
              size="xl"
              editable
              uploading={uploading}
              hint="Tap photo to update"
              onFileSelect={async (file) => {
                if (!user) return;
                setUploading(true);
                try {
                  const url = await uploadProfileImage(user.uid, file);
                  setPhotoUrl(url);
                  await saveProfile({ profileImage: url });
                  toast.success("Photo updated.");
                } catch (err) {
                  toast.error(getStorageErrorMessage(err));
                } finally {
                  setUploading(false);
                }
              }}
            />
            <div className="signet-profile-copy">
              <h2>{fullName || "Your profile"}</h2>
              <p>{occupation || user?.email}</p>
              <ProfileSocialLinks profile={profile} />
            </div>
          </div>
        </div>

        <div className="signet-field">
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="signet-field">
          <label>Email</label>
          <input value={user?.email || ""} disabled />
        </div>
        <PhoneField
          label="Phone (required to apply)"
          countryCode={phoneCountryCode}
          phone={phone}
          onCountryCodeChange={setPhoneCountryCode}
          onPhoneChange={setPhone}
          required
        />
        <div className="signet-field">
          <label>Occupation</label>
          <input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        </div>
        <div className="signet-field">
          <label>Experience (years)</label>
          <input value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
        </div>
        <div className="signet-field">
          <label>Skills (comma separated)</label>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <p className="signet-complete-hint">
          Address, phone, and resume are required before you can apply for jobs.
        </p>
        <AddressFields value={addressValue} onChange={setAddressValue} />
        <div className="signet-field">
          <label>About me</label>
          <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} />
        </div>
        <FileUploadField
          label="Resume (required to apply)"
          accept=".pdf,.doc,.docx"
          uploading={resumeUploading}
          uploadLabel="Uploading resume…"
          hint="Used automatically when you apply without uploading a new file."
          currentLabel={
            profile?.resumeUrl ? (
              <>
                Saved:{" "}
                <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                  {profile.resumeFileName || "View resume"}
                </a>
              </>
            ) : null
          }
          onFile={async (file) => {
            if (!user) return;
            setResumeUploading(true);
            try {
              const uploaded = await uploadProfileResume(user.uid, file);
              await saveProfile({
                resumeUrl: uploaded.url,
                resumeFileName: uploaded.fileName,
              });
              toast.success("Resume saved to your profile.");
            } catch {
              toast.error("Could not upload resume.");
            } finally {
              setResumeUploading(false);
            }
          }}
        />
        <button
          className="signet-btn w-100"
          disabled={saving || uploading || resumeUploading}
          type="submit"
        >
          {saving || uploading || resumeUploading ? (
            <>
              <span className="signet-spinner sm" />{" "}
              {uploading || resumeUploading ? "Uploading…" : "Saving…"}
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </form>
    </AppShell>
  );
}

export default function CandidateProfilePage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <ProfileInner />
      </AuthGate>
    </Wrapper>
  );
}
