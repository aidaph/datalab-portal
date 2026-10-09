/**
 * Contract of datalab-api >= 0.2 (see its /openapi.json).
 * Keep these types in sync with `datalab_api/schemas.py`.
 */

export type DeploymentType = "ids" | "ipcc" | "datasciencehub" | "dummy" | "kafka" | "spark";

export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
  /** Called when the API answers 401 (expired or invalid token). */
  onUnauthorized?: () => void;
}

export interface DeploymentTypeInfo {
  type: string;
  label: string;
  description: string;
  icon: string;
  /** False when the API cannot deploy this type yet. */
  available: boolean;
  /** User field the hub uses as username; null for types that are not hubs. */
  hub_username_claim?: "login" | "email" | null;
  /** The hub only accepts Keycloak (SSO) logins. */
  keycloak_only?: boolean;
  /**
   * What the service is. Absent in the current API: "kafka" for the Kafka type
   * and "jupyterhub" for the rest. "link" entries just open `url`.
   */
  kind?: "jupyterhub" | "kafka" | "link";
  /** For "link" services: where they live (e.g. Open OnDemand). */
  url?: string;
}

export type EnvironmentStatus = "provisioning" | "ready" | "failed" | "deleting";

export interface Environment {
  type: string;
  namespace: string;
  status: EnvironmentStatus;
  hub_url: string;
  created_by: string | null;
  error: string | null;
  /** Only for types with shared storage (absent in older APIs). */
  shared_volume?: SharedVolume | null;
}

export type ServerStatus = "running" | "pending" | "stopped";

export interface JupyterServer {
  username: string;
  status: ServerStatus;
  url: string;
}

export interface KafkaCreatePayload {
  replicas: number;
  /** SASL/PLAIN user for clients; the API uses "kafkaclient1" if omitted. */
  client_username?: string;
  client_password?: string;
}

export interface KafkaCluster {
  namespace: string;
  status: EnvironmentStatus;
  replicas: number;
  ready_replicas: number;
  bootstrap_servers: string;
  /** Absent in API versions before SASL_SSL (they used SASL_PLAINTEXT). */
  security_protocol?: string;
  sasl_mechanism?: string;
  client_username: string;
  /** Absent in API versions that do not report it. */
  created_by?: string | null;
}

export interface KafkaCredentials extends KafkaCluster {
  /** Only returned once, when the cluster is created. */
  client_password: string;
}

/** The volume with the data shared by everyone in an environment. */
export interface SharedVolume {
  name: string;
  /** Whether the PersistentVolumeClaim exists. */
  created: boolean;
  on_longhorn: boolean;
  /** Bound and usable (on Longhorn: not faulted). */
  ready: boolean;
  storage_class: string | null;
  /** Capacity, e.g. "100Gi". */
  size: string | null;
  /** Space used on disk (Longhorn only). */
  used_bytes: number | null;
  /** Longhorn state/robustness, or the PVC phase otherwise. */
  status: string | null;
}

export interface UserInfo {
  sub: string;
  login: string;
  name: string | null;
  email: string | null;
  provider: "github" | "keycloak" | string;
  is_admin: boolean;
}

/** Statuses that will change on their own: worth polling. */
export function isTransient(status: EnvironmentStatus | ServerStatus): boolean {
  return status === "provisioning" || status === "deleting" || status === "pending";
}

/** Whether `user` may retry/delete a resource created by `createdBy`. */
export function canManage(user: UserInfo | null, createdBy: string | null): boolean {
  if (!user) return false;
  return user.is_admin || (createdBy !== null && createdBy === user.sub);
}

/**
 * Username of `user` inside the hub of `type`: each hub names its users after a
 * different claim (ids: Keycloak login, ipcc: email), reported by the API.
 */
export function hubUsername(user: UserInfo | null, type?: DeploymentTypeInfo): string {
  if (!user) return "";
  if (type?.hub_username_claim === "login") return user.login;
  return user.email || user.login;
}

/** Whether `user` can log into the hub of `type` (some hubs only accept SSO). */
export function canUseHub(user: UserInfo | null, type?: DeploymentTypeInfo): boolean {
  if (!user) return false;
  return !type?.keycloak_only || user.provider === "keycloak";
}
