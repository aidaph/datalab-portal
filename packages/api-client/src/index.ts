import {
  normalizeStringList,
  readUrlFromUnknown,
  toEnvironmentRecords,
  type ApiClientOptions,
  type DeploymentType,
  type EnvironmentRecord,
  type JupyterLinkResponse
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

export class DatalabApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message);
    this.name = "DatalabApiError";
  }
}

export class DatalabApiClient {
  private readonly baseUrl: string;
  private token?: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
  }

  setToken(token?: string): void {
    this.token = token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers ?? {});
    headers.set("Accept", "application/json");

    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    const payload = await parseJsonSafely(response);
    if (!response.ok) {
      throw new DatalabApiError(`API request failed: ${response.status}`, response.status, payload);
    }

    return payload as T;
  }

  async getDeploymentTypes(): Promise<DeploymentType[]> {
    const payload = await this.request<unknown>("/deployments/types");
    const values = normalizeStringList(payload);
    return values as DeploymentType[];
  }

  async getRunningEnvironments(): Promise<EnvironmentRecord[]> {
    const payload = await this.request<unknown>("/deployments/running");
    return toEnvironmentRecords(normalizeStringList(payload));
  }

  async createEnvironment(namespace: DeploymentType): Promise<JupyterLinkResponse> {
    const payload = await this.request<unknown>(`/deployments/${namespace}/jupyterhub`, {
      method: "POST"
    });

    return {
      hubUrl: readUrlFromUnknown(payload),
      raw: payload
    };
  }

  async deleteEnvironment(namespace: string): Promise<unknown> {
    return this.request<unknown>(`/deployments/${namespace}/jupyterhub`, {
      method: "DELETE"
    });
  }

  async getEnvironment(namespace: string): Promise<JupyterLinkResponse> {
    const payload = await this.request<unknown>(`/deployments/${namespace}/jupyterhub`);
    return {
      hubUrl: readUrlFromUnknown(payload),
      raw: payload
    };
  }

  async startJupyterServer(namespace: string, username: string): Promise<JupyterLinkResponse> {
    const payload = await this.request<unknown>(`/deployments/${namespace}/jupyters/${username}`, {
      method: "POST"
    });

    return {
      hubUrl: readUrlFromUnknown(payload),
      raw: payload
    };
  }

  async getJupyterServer(namespace: string, username: string): Promise<JupyterLinkResponse> {
    const payload = await this.request<unknown>(`/deployments/${namespace}/jupyters/${username}`);
    return {
      hubUrl: readUrlFromUnknown(payload),
      raw: payload
    };
  }
}
