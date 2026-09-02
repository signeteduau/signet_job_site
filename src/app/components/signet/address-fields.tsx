"use client";

import React, { useMemo } from "react";
import {
  ADDRESS_COUNTRIES,
  AddressValue,
  citiesForState,
  lookupPostcode,
  postcodeLabel,
  statesForCountry,
} from "@/lib/address";

type Props = {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
};

export default function AddressFields({ value, onChange }: Props) {
  const states = useMemo(() => statesForCountry(value.country), [value.country]);
  const cities = useMemo(
    () => citiesForState(value.country, value.state),
    [value.country, value.state]
  );
  const cityOptions = useMemo(() => {
    if (!cities.length) return [];
    if (!value.city || cities.includes(value.city)) return cities;
    return [value.city, ...cities];
  }, [cities, value.city]);
  const pinLabel = postcodeLabel(value.country);
  const hasStateOptions = states.length > 0;
  const pinMaxLength =
    value.country === "India" ? 6 : value.country === "Australia" ? 4 : 10;

  const patch = (partial: Partial<AddressValue>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="signet-address-grid">
      <div className="signet-field signet-address-wide">
        <label>Street address</label>
        <input
          value={value.street || ""}
          onChange={(e) => patch({ street: e.target.value })}
          placeholder="Building, street"
          autoComplete="address-line1"
        />
      </div>
      <div className="signet-field">
        <label>Country</label>
        <select
          value={value.country || "Australia"}
          onChange={(e) =>
            patch({
              country: e.target.value,
              state: "",
              city: "",
              postcode: "",
            })
          }
          autoComplete="country-name"
        >
          {ADDRESS_COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      <div className="signet-field">
        <label>State / Territory</label>
        {hasStateOptions ? (
          <select
            value={value.state || ""}
            onChange={(e) => patch({ state: e.target.value, city: "" })}
            autoComplete="address-level1"
          >
            <option value="">Select state</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value.state || ""}
            onChange={(e) => patch({ state: e.target.value })}
            placeholder="State"
            autoComplete="address-level1"
          />
        )}
      </div>
      <div className="signet-field">
        <label>City</label>
        {cityOptions.length ? (
          <select
            value={value.city || ""}
            onChange={(e) => patch({ city: e.target.value })}
            autoComplete="address-level2"
          >
            <option value="">Select city</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value.city || ""}
            onChange={(e) => patch({ city: e.target.value })}
            placeholder="City"
            autoComplete="address-level2"
          />
        )}
      </div>
      <div className="signet-field">
        <label>{pinLabel}</label>
        <input
          value={value.postcode || ""}
          onChange={(e) => {
            const postcode = e.target.value
              .replace(/[^\d]/g, "")
              .slice(0, pinMaxLength);
            const match = lookupPostcode(postcode, value.country);
            if (match) {
              const nextCountry = match.country || value.country;
              const nextState = match.state || value.state;
              const allowed = citiesForState(nextCountry, nextState);
              const nextCity =
                match.city ||
                (value.city && allowed.includes(value.city) ? value.city : "");
              patch({
                postcode,
                country: nextCountry,
                state: nextState,
                city: nextCity,
              });
              return;
            }
            patch({ postcode });
          }}
          placeholder={
            value.country === "India" ? "6-digit pincode" : "Postcode"
          }
          inputMode="numeric"
          maxLength={pinMaxLength}
          autoComplete="postal-code"
        />
      </div>
    </div>
  );
}
