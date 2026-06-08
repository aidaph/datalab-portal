export type DeploymentType = "ids" | "ipcc" | "dataScienceHub" | "dummy" | "FACE";

export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
}

export interface EnvironmentRecord {
  namespace: string;
  type: string;
  hubUrl?: string;
  state: "running" | "created" | "unknown" | "error";
}

export interface CreateEnvironmentPayload {
  namespace: DeploymentType;
}

export interface StartUserServerPayload {
  namespace: string;
  username: string;
}

export interface JupyterLinkResponse {
  hubUrl?: string;
  raw: unknown;
}

export function normalizeStringList(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  return payload.filter((item): item is string => typeof item === "string");
}

export function readUrlFromUnknown(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const record = payload as Record<string, unknown>;
  for (const value of Object.values(record)) {
    if (typeof value === "string" && /^https?:\/\//.test(value)) {
      return value;
    }
  }

  return undefined;
}

export function toEnvironmentRecords(namespaces: string[]): EnvironmentRecord[] {
  return namespaces.map((namespace) => ({
    namespace,
    type: namespace,
    state: "running"
  }));
}
