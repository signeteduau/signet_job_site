"use client";
import React from "react";
import { ManagementPageFrame } from "@/app/components/signet/management-shell";
import ManagementPerson from "@/app/components/signet/management-person";

export default function ManagementEmployerPage() {
  return (
    <ManagementPageFrame>
      <ManagementPerson expectedType="company" />
    </ManagementPageFrame>
  );
}
