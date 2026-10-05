import type {
  ApiClientOptions,
  DeploymentTypeInfo,
  Environment,
  JupyterServer,
  KafkaCluster,
  KafkaCreatePayload,
  KafkaCredentials,
  UserInfo
} from "@datalab/shared";

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function detailOf(payload: unknown): string | undefined {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    // FastAPI validation errors: [{ loc, msg, type }]
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : ""))
        .filter(Boolean)
        .join("; ");
    }
  }
  return undefined;
}

export class DatalabApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(detailOf(payload) ?? `API request failed: ${status}`);
    this.name = "DatalabApiError";
  }

  /** Human-readable reason sent by the API, if any. */
  get detail(): string | undefined {
    return detailOf(this.payload);
  }
}

const enc = encodeURIComponent;

export class DatalabApiClient {
  private readonly baseUrl: string;
  private token?: string;
  private readonly onUnauthorized?: () => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.onUnauthorized = options.onUnauthorized;
  }

  setToken(token?: string): void {
    this.token = token;
  }

  /** Absolute URL of an API path, e.g. for full-page OAuth redirects. */
  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<T> {
    const headers = new Headers(init?.headers ?? {});
    headers.set("Accept", "application/json");

    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(this.url(path), { ...init, headers });
    const payload = await parseJsonSafely(response);

    if (!response.ok) {
      if (response.status === 401) this.onUnauthorized?.();
      throw new DatalabApiError(response.status, payload);
    }

    return payload as T;
  }

  // --- Identity ------------------------------------------------------------

  getMe(signal?: AbortSignal): Promise<UserInfo> {
    return this.request("/users/me", { signal });
  }

  // --- JupyterHub environments ----------------------------------------------

  getDeploymentTypes(signal?: AbortSignal): Promise<DeploymentTypeInfo[]> {
    return this.request("/deployments/types", { signal });
  }

  getEnvironments(signal?: AbortSignal): Promise<Environment[]> {
    return this.request("/deployments", { signal });
  }

  getEnvironment(type: string, signal?: AbortSignal): Promise<Environment> {
    return this.request(`/deployments/${enc(type)}/jupyterhub`, { signal });
  }

  /** Starts provisioning (202). Poll `getEnvironment` until it is `ready`. */
  createEnvironment(type: string): Promise<Environment> {
    return this.request(`/deployments/${enc(type)}/jupyterhub`, { method: "POST" });
  }

  retryEnvironment(type: string): Promise<Environment> {
    return this.request(`/deployments/${enc(type)}/jupyterhub/retry`, { method: "POST" });
  }

  async deleteEnvironment(type: string): Promise<void> {
    await this.request(`/deployments/${enc(type)}/jupyterhub`, { method: "DELETE" });
  }

  // --- Single-user Jupyter servers ------------------------------------------

  getJupyterServer(type: string, username: string, signal?: AbortSignal): Promise<JupyterServer> {
    return this.request(`/deployments/${enc(type)}/jupyters/${enc(username)}`, { signal });
  }

  startJupyterServer(type: string, username: string): Promise<JupyterServer> {
    return this.request(`/deployments/${enc(type)}/jupyters/${enc(username)}`, { method: "POST" });
  }

  async stopJupyterServer(type: string, username: string): Promise<void> {
    await this.request(`/deployments/${enc(type)}/jupyters/${enc(username)}`, { method: "DELETE" });
  }

  // --- Kafka -------------------------------------------------------------------

  /** Resolves to `null` when there is no cluster. */
  async getKafka(signal?: AbortSignal): Promise<KafkaCluster | null> {
    try {
      return await this.request<KafkaCluster>("/deployments/kafka", { signal });
    } catch (error) {
      if (error instanceof DatalabApiError && error.status === 404) return null;
      throw error;
    }
  }

  createKafka(payload: KafkaCreatePayload): Promise<KafkaCredentials> {
    return this.request("/deployments/kafka", { method: "POST", body: JSON.stringify(payload) });
  }

  async deleteKafka(): Promise<void> {
    await this.request("/deployments/kafka", { method: "DELETE" });
  }
}
