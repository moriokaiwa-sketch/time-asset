"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const AnalysisClient = dynamic(() => import("./AnalysisClient"), { ssr: false });

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading...</div>}>
      <AnalysisClient />
    </Suspense>
  );
}
