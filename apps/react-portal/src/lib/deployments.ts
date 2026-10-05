import { DatalabApiError } from "@datalab/api-client";
import type { DeploymentTypeInfo } from "@datalab/shared";

export type { DeploymentTypeInfo };

/** Used only if /deployments/types cannot be reached; mirrors the API catalog. */
export const FALLBACK_TYPES: DeploymentTypeInfo[] = [
  {
    type: "dummy",
    label: "Dummy",
    description: "Test environment for functional validation and demo deployments.",
    icon: "🧪",
    available: true,
    hub_username_claim: "email"
  },
  {
    type: "ids",
    label: "IDS",
    description: "Environment for cybersecurity data analysis and visualisation.",
    icon: "📊",
    available: true,
    hub_username_claim: "login",
    keycloak_only: true
  },
  {
    type: "ipcc",
    label: "Climate",
    description: "Environment for climate data analysis and scientific experimentation.",
    icon: "🌍",
    available: true,
    hub_username_claim: "email",
    keycloak_only: true
  },
  {
    type: "datasciencehub",
    label: "Data Science Hub",
    description: "General-purpose environment for the Master in Data Science, with a variety of tools and datasets.",
    icon: "📈",
    available: false,
    hub_username_claim: "login",
    keycloak_only: true
  },
  {
    type: "kafka",
    label: "Kafka",
    description: "Environment for messaging, streaming and testing with Kafka brokers.",
    icon: "📨",
    available: true
  },
  {
    type: "spark",
    label: "Spark",
    description: "Environment for distributed processing and analytics on Apache Spark.",
    icon: "⚡",
    available: false
  }
];

/** Display name of a type, from the API catalog (the single source of labels). */
export function deploymentLabel(type: string, types: DeploymentTypeInfo[] = FALLBACK_TYPES): string {
  return (
    types.find((item) => item.type === type)?.label ??
    FALLBACK_TYPES.find((item) => item.type === type)?.label ??
    type
  );
}

export function logoFor(type: string): string {
  return `/env-icons/${type}.png`;
}

const STATUS_HINTS: Record<number, string> = {
  401: "Your session has expired. Please sign in again.",
  403: "You are not allowed to do this.",
  502: "The cluster or JupyterHub is not responding. Try again in a few minutes.",
  503: "The API cannot reach the Kubernetes cluster."
};

export function formatError(error: unknown): string {
  if (error instanceof DatalabApiError) {
    const hint = STATUS_HINTS[error.status];
    if (error.status === 401) return hint;
    // Keep the API's reason (e.g. "JupyterHub rejected the API credentials").
    const detail = error.detail;
    if (detail) return hint ? `${hint} (${detail})` : `${detail} (${error.status})`;
    return hint ?? `API error (${error.status})`;
  }
  if (error instanceof TypeError) {
    return "Cannot reach the API. Check that it is running.";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
