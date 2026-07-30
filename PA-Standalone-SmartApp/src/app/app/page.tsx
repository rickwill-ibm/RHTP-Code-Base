/**
 * /app — Post-OAuth redirect_uri + main app shell.
 *
 * After the EHR's authorization server redirects here with ?code=&state=
 * we exchange the code for an access token, then render the PA app shell.
 *
 * In mock mode we skip token exchange and load mock context directly.
 *
 * Next.js 15: useSearchParams() requires a Suspense boundary.
 */
"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSmartContext } from "@/lib/smart/SmartContext";
import { exchangeCodeForToken } from "@/lib/smart/smartLaunch";
import AppShell from "@/components/shell/AppShell";

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center text-gray-500 text-sm">
        <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 mx-auto" />
        {label ?? "Loading patient context…"}
      </div>
    </div>
  );
}

function AppInner() {
  const params = useSearchParams();
  const { setContext } = useSmartContext();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

    if (useMock) {
      // Load mock SMART context — no token exchange needed
      import("@/lib/smart/mockSmartContext").then(({ MOCK_SMART_CONTEXT }) => {
        setContext(MOCK_SMART_CONTEXT);
        setReady(true);
      });
      return;
    }

    const code = params.get("code");
    const state = params.get("state");
    const err = params.get("error");

    if (err) {
      setError(err);
      return;
    }

    if (!code || !state) {
      setError("Missing authorization code.");
      return;
    }

    exchangeCodeForToken(code, state)
      .then((ctx) => {
        setContext(ctx);
        setReady(true);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Token exchange failed.");
      });
  }, [params, setContext]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center max-w-sm">
          <p className="text-red-800 font-semibold text-sm">Launch Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <Spinner />;
  }

  return <AppShell />;
}

export default function AppPage() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <AppInner />
    </Suspense>
  );
}
