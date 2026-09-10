"use client";

import React, { use } from "react";
import CandidateInterviewPage from "../page";

export default function CandidateDirectCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = use(params);
  const code = resolvedParams?.code || "";

  // Render CandidateInterviewPage with the direct URL code pre-filled
  return <CandidateInterviewPage initialCode={code} />;
}
