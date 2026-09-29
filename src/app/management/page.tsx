"use client";
import React from "react";
import { ManagementPageFrame } from "@/app/components/signet/management-shell";
import ManagementDirectory from "@/app/components/signet/management-directory";

export default function ManagementPeoplePage() {
  return (
    <ManagementPageFrame>
      <ManagementDirectory />
    </ManagementPageFrame>
  );
}
