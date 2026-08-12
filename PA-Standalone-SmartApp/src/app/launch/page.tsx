/**
 * /launch — SMART App Launch entry point.
 *
 * The EHR redirects here with ?iss=<fhirBaseUrl>&launch=<token>.
 * We redirect the browser to the EHR's authorize endpoint so the
 * OAuth dance can complete and the EHR hands us back an access token
 * at /app (our redirect_uri).
 *
 * In mock-data mode we skip OAuth entirely and go straight to /app.
 *
 * Next.js 15: useSearchParams() requires a Suspense boundary.
 */
"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildAuthorizationUrl } from "@/lib/smart/smartLaunch";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center text-gray-500 text-sm">
        <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 mx-auto" />
        Initiating SMART launch…
      </div>
    </div>
  );
}

function LaunchInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
    if (useMock) {
      router.replace("/app");
      return;
    }

    const iss = params.get("iss");
    const launch = params.get("launch");

    if (!iss || !launch) {
      router.replace("/app?error=missing_launch_params");
      return;
    }

    // Store iss for token exchange later
    sessionStorage.setItem("pa_iss", iss);

    buildAuthorizationUrl(iss, launch).then((url) => {
      window.location.href = url;
    });
  }, [params, router]);

  return <Spinner />;
}

export default function LaunchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LaunchInner />
    </Suspense>
  );
}
