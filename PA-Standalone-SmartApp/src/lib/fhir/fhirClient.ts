/**
 * Lightweight FHIR R4 client.
 *
 * Wraps fetch with:
 *  - Bearer token injection from SmartContext
 *  - Configurable base URL (EMR vs payer)
 *  - Timeout + retry
 *  - FHIR application/fhir+json content negotiation
 */

import type { SmartContext } from "@/lib/smart/smartLaunch";

const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_FHIR_TIMEOUT ?? 30000);

export class FhirClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = accessToken;
  }

  /** Build a client scoped to the EMR FHIR endpoint. */
  static fromContext(ctx: SmartContext): FhirClient {
    return new FhirClient(ctx.fhirBaseUrl, ctx.accessToken);
  }

  /** Build a client scoped to the payer FHIR endpoint. */
  static forPayer(ctx: SmartContext): FhirClient {
    const payerBase =
      ctx.payerFhirBaseUrl ??
      process.env.NEXT_PUBLIC_PAYER_FHIR_BASE_URL ??
      ctx.fhirBaseUrl;
    return new FhirClient(payerBase, ctx.accessToken);
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/fhir+json",
      "Content-Type": "application/fhir+json",
    };
  }

  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, "")}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: this.headers(),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new FhirError(res.status, await res.text(), url);
      }
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timer);
    }
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, "")}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new FhirError(res.status, await res.text(), url);
      }
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Convenience: GET a FHIR resource by type + id. */
  read<T>(resourceType: string, id: string): Promise<T> {
    return this.get<T>(`${resourceType}/${id}`);
  }

  /** Convenience: search with URLSearchParams. */
  search<T>(resourceType: string, params: Record<string, string>): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    return this.get<T>(`${resourceType}?${qs}`);
  }

  /** Execute a FHIR operation (e.g. Claim/$submit). */
  operation<T>(resourceType: string, op: string, body: unknown): Promise<T> {
    return this.post<T>(`${resourceType}/$${op}`, body);
  }
}

export class FhirError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly url: string
  ) {
    super(`FHIR ${status} at ${url}`);
    this.name = "FhirError";
  }
}
