"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import AuthShell from "@/app/components/signet/auth-shell";
import { PageLoader } from "@/app/components/signet/shimmer";
import ProfileAvatar from "@/app/components/signet/profile-avatar";
import PhoneField from "@/app/components/signet/phone-field";
import AddressFields from "@/app/components/signet/address-fields";
import { useAuth } from "@/context/auth-context";
import { resolvePostLoginPath } from "@/lib/auth-flow";
import { addressFromProfile, formatAddress } from "@/lib/address";
import { DEFAULT_PHONE_COUNTRY_CODE } from "@/lib/phone-country-codes";
import { uploadProfileImage } from "@/lib/services/storage";
import Wrapper from "@/layouts/wrapper";

function ProfileSetupInner() {
  const { user, profile, finishProfileSetup, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const returnUrl = search?.get("returnUrl");
  const isCompany = profile?.userType === "company";
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    profile?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [addressValue, setAddressValue] = useState(() =>
    addressFromProfile(profile)
  );
  const [occupation, setOccupation] = useState("");
  const [companyName, setCompanyName] = useState(profile?.companyName || "");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [photoUrl, setPhotoUrl] = useState(
    profile?.profileImage || profile?.logoUrl || ""
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!loading && !user) {
    router.replace("/login");
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl = photoUrl;
      if (photoFile) {
        setUploading(true);
        imageUrl = await uploadProfileImage(user.uid, photoFile);
        setPhotoUrl(imageUrl);
        setUploading(false);
      }

      const formattedAddress = formatAddress(addressValue);
      const locationFields = {
        street: addressValue.street || "",
        city: addressValue.city || "",
        state: addressValue.state || "",
        postcode: addressValue.postcode || "",
        country: addressValue.country || "",
        address: formattedAddress,
      };

      if (isCompany) {
        await finishProfileSetup({
          fullName: fullName || companyName,
          companyName,
          industry,
          website,
          phone,
          phoneCountryCode,
          ...locationFields,
          companyLocation: formattedAddress,
          logoUrl: imageUrl || "",
          profileImage: imageUrl || "",
        });
        toast.success("Company profile ready!");
        const updated = await refreshProfile();
        router.push(resolvePostLoginPath(updated, user, returnUrl));
      } else {
        await finishProfileSetup({
          fullName,
          phone,
          phoneCountryCode,
          ...locationFields,
          occupation,
          profileImage: imageUrl || "",
        });
        toast.success("Profile ready!");
        const updated = await refreshProfile();
        router.push(resolvePostLoginPath(updated, user, returnUrl));
      }
    } catch {
      toast.error("Could not save profile.");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <Wrapper>
      <AuthShell
        showTabs={false}
        title="Make it yours"
        subtitle={
          isCompany
            ? "A sharp logo helps candidates trust your roles instantly."
            : "A clear photo makes your applications stand out."
        }
      >
        <div className="d-flex justify-content-center mb-3">
          <ProfileAvatar
            src={photoUrl}
            name={isCompany ? companyName : fullName}
            size="xl"
            rounded={isCompany ? "tile" : "circle"}
            editable
            uploading={uploading}
            hint={isCompany ? "Upload company logo" : "Upload profile photo"}
            onFileSelect={async (file) => {
              setPhotoFile(file);
              setPhotoUrl(URL.createObjectURL(file));
            }}
          />
        </div>

        <form onSubmit={onSubmit} className="signet-auth-form">
          {isCompany ? (
            <>
              <div className="signet-field">
                <label>Company name</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="signet-field">
                <label>Contact name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="signet-field">
                <label>Industry</label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Technology"
                />
              </div>
              <div className="signet-field">
                <label>Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </>
          ) : (
            <>
              <div className="signet-field">
                <label>Full name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="signet-field">
                <label>Occupation</label>
                <input
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Designer"
                />
              </div>
            </>
          )}
          <PhoneField
            countryCode={phoneCountryCode}
            phone={phone}
            onCountryCodeChange={setPhoneCountryCode}
            onPhoneChange={setPhone}
          />
          <AddressFields value={addressValue} onChange={setAddressValue} />
          <button
            className="signet-btn w-100"
            disabled={saving || uploading}
            type="submit"
          >
            {saving || uploading ? (
              <span className="d-inline-flex align-items-center gap-2">
                <span className="signet-spinner sm" />
                {uploading ? "Uploading…" : "Saving…"}
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </AuthShell>
    </Wrapper>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <ProfileSetupInner />
    </Suspense>
  );
}
