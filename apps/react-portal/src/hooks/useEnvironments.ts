import { useCallback, useEffect, useRef, useState } from "react";
import { DatalabApiError, type DatalabApiClient } from "@datalab/api-client";
import {
  canUseHub,
  hubUsername,
  isTransient,
  type DeploymentTypeInfo,
  type Environment,
  type JupyterServer,
  type KafkaCluster,
  type KafkaCreatePayload,
  type KafkaCredentials,
  type UserInfo
} from "@datalab/shared";
import { FALLBACK_TYPES, deploymentLabel, formatError } from "../lib/deployments";
import { useToasts } from "./useToasts";

const POLL_INTERVAL_MS = 4000;
/** After this long, something is probably stuck (e.g. a broker down): poll less. */
const SLOW_POLL_AFTER_MS = 5 * 60 * 1000;
const SLOW_POLL_INTERVAL_MS = 30000;

export interface EnvironmentsController {
  deploymentTypes: DeploymentTypeInfo[];
  environments: Environment[];
  /** Jupyter server of the current user, by environment type. */
  servers: Record<string, JupyterServer | undefined>;
  kafka: KafkaCluster | null;
  /** Credentials of a just-created Kafka cluster (shown once). */
  kafkaCredentials: KafkaCredentials | null;
  dismissKafkaCredentials: () => void;
  isLoading: boolean;
  /** Keys ("env:ids", "server:ids", "kafka", "create") with a request in flight. */
  busy: ReadonlySet<string>;
  refresh: () => Promise<void>;
  createEnvironment: (type: string) => Promise<boolean>;
  retryEnvironment: (type: string) => Promise<void>;
  deleteEnvironment: (type: string) => Promise<void>;
  startServer: (type: string) => Promise<void>;
  stopServer: (type: string) => Promise<void>;
  createKafka: (payload: KafkaCreatePayload) => Promise<boolean>;
  deleteKafka: () => Promise<void>;
}

export function useEnvironments(client: DatalabApiClient, user: UserInfo | null): EnvironmentsController {
  const { pushToast } = useToasts();
  const [deploymentTypes, setDeploymentTypes] = useState<DeploymentTypeInfo[]>(FALLBACK_TYPES);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [servers, setServers] = useState<Record<string, JupyterServer | undefined>>({});
  const [kafka, setKafka] = useState<KafkaCluster | null>(null);
  const [kafkaCredentials, setKafkaCredentials] = useState<KafkaCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());

  const previousStatus = useRef<Record<string, string>>({});
  const typesRef = useRef(deploymentTypes);
  typesRef.current = deploymentTypes;
  const labelOf = useCallback((type: string) => deploymentLabel(type, typesRef.current), []);

  /** Username of the current user in the hub of `type`, or "" if they cannot use it. */
  const usernameFor = useCallback(
    (type: string) => {
      const info = deploymentTypes.find((item) => item.type === type);
      return canUseHub(user, info) ? hubUsername(user, info) : "";
    },
    [deploymentTypes, user]
  );

  const withBusy = useCallback(async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
    setBusy((current) => new Set(current).add(key));
    try {
      return await action();
    } catch (error) {
      pushToast("error", formatError(error));
      return undefined;
    } finally {
      setBusy((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }, [pushToast]);

  const loadServer = useCallback(
    async (type: string) => {
      const username = usernameFor(type);
      if (!username) return;
      try {
        const server = await client.getJupyterServer(type, username);
        setServers((current) => ({ ...current, [type]: server }));
      } catch (error) {
        // 404: the user has never logged into this hub yet → no server.
        if (error instanceof DatalabApiError && error.status === 404) {
          setServers((current) => ({ ...current, [type]: undefined }));
        }
      }
    },
    [client, usernameFor]
  );

  /** Reload environments and Kafka; fetch server status for ready hubs. */
  const loadState = useCallback(async () => {
    const [envs, cluster] = await Promise.all([client.getEnvironments(), client.getKafka()]);
    setEnvironments(envs);
    setKafka(cluster);

    for (const env of envs) {
      const before = previousStatus.current[env.type];
      if (before && before !== env.status) {
        if (env.status === "ready") pushToast("success", `${labelOf(env.type)} is ready.`);
        if (env.status === "failed") pushToast("error", `${labelOf(env.type)} failed: ${env.error ?? "unknown error"}`);
      }
    }
    previousStatus.current = Object.fromEntries(envs.map((env) => [env.type, env.status]));

    await Promise.all(envs.filter((env) => env.status === "ready").map((env) => loadServer(env.type)));
  }, [client, loadServer, pushToast]);

  const refresh = useCallback(async () => {
    try {
      await loadState();
    } catch (error) {
      pushToast("error", formatError(error));
    }
  }, [loadState, pushToast]);

  // Catalog, once the identity is known. Kept apart from the state load below:
  // new types change the hub usernames, which reloads the state (not the catalog).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    client
      .getDeploymentTypes()
      .then((types) => !cancelled && types.length > 0 && setDeploymentTypes(types))
      .catch(() => undefined); // keep the local catalog
    return () => {
      cancelled = true;
    };
  }, [client, user]);

  // Initial load, once the identity is known.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);

    loadState()
      .catch((error: unknown) => !cancelled && pushToast("error", formatError(error)))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [client, user, loadState, pushToast]);

  // Poll only while something is changing on its own.
  const needsPolling =
    environments.some((env) => isTransient(env.status)) ||
    Object.values(servers).some((server) => server && isTransient(server.status)) ||
    (kafka !== null && isTransient(kafka.status));
  const pollingSince = useRef<number | null>(null);

  useEffect(() => {
    if (!needsPolling) {
      pollingSince.current = null;
      return;
    }
    pollingSince.current ??= Date.now();
    let active = true;
    let timer: number | undefined;

    const schedule = () => {
      const slow = Date.now() - (pollingSince.current ?? Date.now()) > SLOW_POLL_AFTER_MS;
      timer = window.setTimeout(async () => {
        if (document.visibilityState === "visible") await loadState().catch(() => undefined);
        if (active) schedule();
      }, slow ? SLOW_POLL_INTERVAL_MS : POLL_INTERVAL_MS);
    };
    schedule();

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [needsPolling, loadState]);

  // --- Actions -------------------------------------------------------------

  const createEnvironment = useCallback(
    async (type: string) => {
      const env = await withBusy("create", () => client.createEnvironment(type));
      if (!env) return false;
      previousStatus.current[type] = env.status;
      setEnvironments((current) => [...current.filter((item) => item.type !== type), env]);
      pushToast("info", `Creating ${labelOf(type)}… this can take a few minutes.`);
      return true;
    },
    [client, pushToast, withBusy]
  );

  const retryEnvironment = useCallback(
    async (type: string) => {
      const env = await withBusy(`env:${type}`, () => client.retryEnvironment(type));
      if (!env) return;
      previousStatus.current[type] = env.status;
      setEnvironments((current) => current.map((item) => (item.type === type ? env : item)));
      pushToast("info", `Retrying ${labelOf(type)}…`);
    },
    [client, pushToast, withBusy]
  );

  const deleteEnvironment = useCallback(
    async (type: string) => {
      const done = await withBusy(`env:${type}`, async () => {
        await client.deleteEnvironment(type);
        return true;
      });
      if (!done) return;
      setEnvironments((current) =>
        current.map((item) => (item.type === type ? { ...item, status: "deleting" } : item))
      );
      setServers((current) => ({ ...current, [type]: undefined }));
      pushToast("success", `Deleting ${labelOf(type)}.`);
    },
    [client, pushToast, withBusy]
  );

  const startServer = useCallback(
    async (type: string) => {
      const username = usernameFor(type);
      if (!username) {
        pushToast("error", "You cannot use this hub with your sign-in method.");
        return;
      }
      const server = await withBusy(`server:${type}`, () => client.startJupyterServer(type, username));
      if (!server) return;
      setServers((current) => ({ ...current, [type]: server }));
      pushToast(
        server.status === "running" ? "success" : "info",
        server.status === "running" ? "Jupyter server ready." : "Starting your Jupyter server…"
      );
    },
    [client, pushToast, usernameFor, withBusy]
  );

  const stopServer = useCallback(
    async (type: string) => {
      const username = usernameFor(type);
      if (!username) {
        pushToast("error", "You cannot use this hub with your sign-in method.");
        return;
      }
      const done = await withBusy(`server:${type}`, async () => {
        await client.stopJupyterServer(type, username);
        return true;
      });
      if (!done) return;
      await loadServer(type);
      pushToast("success", "Jupyter server stopped. Your data is kept.");
    },
    [client, loadServer, pushToast, usernameFor, withBusy]
  );

  const createKafka = useCallback(
    async (payload: KafkaCreatePayload) => {
      const credentials = await withBusy("kafka", () => client.createKafka(payload));
      if (!credentials) return false;
      setKafka(credentials);
      setKafkaCredentials(credentials);
      return true;
    },
    [client, withBusy]
  );

  const deleteKafka = useCallback(async () => {
    const done = await withBusy("kafka", async () => {
      await client.deleteKafka();
      return true;
    });
    if (!done) return;
    setKafka((current) => (current ? { ...current, status: "deleting" } : current));
    pushToast("success", "Deleting the Kafka cluster.");
  }, [client, pushToast, withBusy]);

  return {
    deploymentTypes,
    environments,
    servers,
    kafka,
    kafkaCredentials,
    dismissKafkaCredentials: () => setKafkaCredentials(null),
    isLoading,
    busy,
    refresh,
    createEnvironment,
    retryEnvironment,
    deleteEnvironment,
    startServer,
    stopServer,
    createKafka,
    deleteKafka
  };
}
