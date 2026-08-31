"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ProfileAvatar from "@/app/components/signet/profile-avatar";
import PhoneField from "@/app/components/signet/phone-field";
import { useAuth } from "@/context/auth-context";
import { DEFAULT_PHONE_COUNTRY_CODE } from "@/lib/phone-country-codes";
import {
  getStorageErrorMessage,
  uploadProfileImage,
} from "@/lib/services/storage";
import Wrapper from "@/layouts/wrapper";

function CompanyProfileInner() {
  const { user, profile, saveProfile } = useAuth();
  const [companyName, setCompanyName] = useState(profile?.companyName || "");
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [industry, setIndustry] = useState(profile?.industry || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [companySize, setCompanySize] = useState(profile?.companySize || "");
  const [foundedYear, setFoundedYear] = useState(profile?.foundedYear || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    profile?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [companyLocation, setCompanyLocation] = useState(
    profile?.companyLocation || profile?.address || ""
  );
  const [about, setAbout] = useState(profile?.about || "");
  const [logoUrl, setLogoUrl] = useState(
    profile?.logoUrl || profile?.profileImage || ""
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompanyName(profile?.companyName || "");
    setFullName(profile?.fullName || "");
    setIndustry(profile?.industry || "");
    setWebsite(profile?.website || "");
    setCompanySize(profile?.companySize || "");
    setFoundedYear(profile?.foundedYear || "");
    setPhoneCountryCode(profile?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
    setPhone(profile?.phone || "");
    setCompanyLocation(profile?.companyLocation || profile?.address || "");
    setAbout(profile?.about || "");
    setLogoUrl(profile?.logoUrl || profile?.profileImage || "");
  }, [profile]);

  return (
    <AppShell role="company" title="Company profile">
      <form
        className="signet-panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await saveProfile({
              companyName,
              fullName,
              industry,
              website,
              companySize,
              foundedYear,
              phone,
              phoneCountryCode,
              companyLocation,
              address: companyLocation,
              about,
              logoUrl: logoUrl || profile?.logoUrl,
              profileImage: logoUrl || profile?.profileImage,
            });
            toast.success("Company profile updated.");
          } catch {
            toast.error("Could not save profile.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="signet-profile-hero">
          <div className="signet-profile-banner company" aria-hidden />
          <div className="signet-profile-hero-body">
            <ProfileAvatar
              src={logoUrl}
              name={companyName}
              size="xl"
              rounded="tile"
              editable
              uploading={uploading}
              hint="Tap logo to update"
              onFileSelect={async (file) => {
                if (!user) return;
                setUploading(true);
                try {
                  const url = await uploadProfileImage(user.uid, file);
                  setLogoUrl(url);
                  await saveProfile({ logoUrl: url, profileImage: url });
                  toast.success("Logo updated.");
                } catch (err) {
                  toast.error(getStorageErrorMessage(err));
                } finally {
                  setUploading(false);
                }
              }}
            />
            <div className="signet-profile-copy">
              <h2>{companyName || "Your company"}</h2>
              <p>{industry || user?.email}</p>
            </div>
          </div>
        </div>

        <div className="signet-field">
          <label>Company name</label>
          <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="signet-field">
          <label>Contact name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="signet-field">
          <label>Industry</label>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div className="signet-field">
          <label>Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="signet-field">
              <label>Company size</label>
              <input value={companySize} onChange={(e) => setCompanySize(e.target.value)} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="signet-field">
              <label>Founded year</label>
              <input value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} />
            </div>
          </div>
        </div>
        <PhoneField
          countryCode={phoneCountryCode}
          phone={phone}
          onCountryCodeChange={setPhoneCountryCode}
          onPhoneChange={setPhone}
        />
        <div className="signet-field">
          <label>Location</label>
          <input value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} />
        </div>
        <div className="signet-field">
          <label>About</label>
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} />
        </div>
        <button
          className="signet-btn w-100"
          disabled={saving || uploading}
          type="submit"
        >
          {saving || uploading ? (
            <>
              <span className="signet-spinner sm" />
              {uploading ? "Uploading logo…" : "Saving…"}
            </>
          ) : (
            "Save changes"
          )}
        </button>
        <Link href="/company/settings" className="signet-btn secondary w-100 mt-2">
          Account settings
        </Link>
      </form>
    </AppShell>
  );
}

export default function CompanyProfilePage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <CompanyProfileInner />
      </AuthGate>
    </Wrapper>
  );
}
