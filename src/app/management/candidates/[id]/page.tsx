"use client";
import React from "react";
import { ManagementPageFrame } from "@/app/components/signet/management-shell";
import ManagementPerson from "@/app/components/signet/management-person";

export default function ManagementCandidatePage() {
  return (
    <ManagementPageFrame>
      <ManagementPerson expectedType="candidate" />
    </ManagementPageFrame>
  );
}
