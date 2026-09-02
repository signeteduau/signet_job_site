"use client";

import React from "react";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  PHONE_COUNTRY_CODES,
} from "@/lib/phone-country-codes";

type PhoneFieldProps = {
  label?: string;
  countryCode: string;
  phone: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
  placeholder?: string;
};

export default function PhoneField({
  label = "Phone",
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  required,
  placeholder = "Phone number",
}: PhoneFieldProps) {
  return (
    <div className="signet-field">
      <label>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </label>
      <div className="signet-phone-field">
        <select
          value={countryCode || DEFAULT_PHONE_COUNTRY_CODE}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          aria-label="Country code"
        >
          {PHONE_COUNTRY_CODES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          aria-label={label}
        />
      </div>
    </div>
  );
}
