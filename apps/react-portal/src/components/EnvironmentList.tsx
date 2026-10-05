import { useState } from "react";
import {
  canManage,
  canUseHub,
  type DeploymentTypeInfo,
  type Environment,
  type EnvironmentStatus,
  type JupyterServer,
  type KafkaCluster,
  type SharedVolume,
  type UserInfo
} from "@datalab/shared";
import { deploymentLabel, logoFor } from "../lib/deployments";
import { ConfirmDialog } from "./ConfirmDialog";

interface EnvironmentListProps {
  deploymentTypes: DeploymentTypeInfo[];
  environments: Environment[];
  servers: Record<string, JupyterServer | undefined>;
  kafka: KafkaCluster | null;
  user: UserInfo | null;
  isLoading: boolean;
  busy: ReadonlySet<string>;
  onRefresh: () => void;
  onRetry: (type: string) => void;
  onDelete: (type: string) => void;
  onStart: (type: string) => void;
  onStop: (type: string) => void;
  onDeleteKafka: () => void;
}

const STATUS_META: Record<EnvironmentStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "status-chip-running" },
  provisioning: { label: "Creating…", className: "status-chip-created" },
  deleting: { label: "Deleting…", className: "status-chip-unknown" },
  failed: { label: "Error", className: "status-chip-error" }
};

const SERVER_LABEL: Record<JupyterServer["status"], string> = {
  running: "Your server is running",
  pending: "Starting your server…",
  stopped: "Your server is stopped"
};

type PendingDelete = { kind: "hub"; type: string } | { kind: "kafka" };

export function EnvironmentList({
  deploymentTypes,
  environments,
  servers,
  kafka,
  user,
  isLoading,
  busy,
  onRefresh,
  onRetry,
  onDelete,
  onStart,
  onStop,
  onDeleteKafka
}: EnvironmentListProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const isEmpty = environments.length === 0 && !kafka;

  return (
    <div className="stack">
      <div className="actions list-toolbar">
        <button type="button" className="btn btn-secondary" disabled={isLoading} onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>

      {isLoading ? (
        <EnvironmentListSkeleton />
      ) : isEmpty ? (
        <div className="empty-state-box">
          <div className="empty-state-icon">🧪</div>
          <div className="empty-state-title">No environments deployed</div>
          <div className="empty-state-text">Go to the "New environment" tab and create your first JupyterHub.</div>
        </div>
      ) : (
        <ul className="env-list">
          {environments.map((env) => (
            <HubRow
              key={env.namespace}
              env={env}
              label={deploymentLabel(env.type, deploymentTypes)}
              server={servers[env.type]}
              manageable={canManage(user, env.created_by)}
              canUse={canUseHub(user, deploymentTypes.find((item) => item.type === env.type))}
              envBusy={busy.has(`env:${env.type}`)}
              serverBusy={busy.has(`server:${env.type}`)}
              onRetry={() => onRetry(env.type)}
              onDelete={() => setPendingDelete({ kind: "hub", type: env.type })}
              onStart={() => onStart(env.type)}
              onStop={() => onStop(env.type)}
            />
          ))}
          {kafka ? (
            <KafkaRow
              kafka={kafka}
              label={deploymentLabel("kafka", deploymentTypes)}
              // Older APIs do not report the creator: let the API decide (403).
              manageable={kafka.created_by === undefined || canManage(user, kafka.created_by)}
              busy={busy.has("kafka")}
              onDelete={() => setPendingDelete({ kind: "kafka" })}
            />
          ) : null}
        </ul>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete environment"
          description={
            pendingDelete.kind === "kafka"
              ? "This deletes the Kafka cluster and all its data. This cannot be undone."
              : `This deletes ${deploymentLabel(pendingDelete.type, deploymentTypes)}, its JupyterHub and the servers of all its users. This cannot be undone.`
          }
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            if (pendingDelete.kind === "kafka") onDeleteKafka();
            else onDelete(pendingDelete.type);
            setPendingDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}

interface HubRowProps {
  env: Environment;
  label: string;
  server: JupyterServer | undefined;
  manageable: boolean;
  /** False when the hub does not accept the user's login (e.g. SSO-only hub, GitHub user). */
  canUse: boolean;
  envBusy: boolean;
  serverBusy: boolean;
  onRetry: () => void;
  onDelete: () => void;
  onStart: () => void;
  onStop: () => void;
}

function HubRow({
  env,
  label,
  server,
  manageable,
  canUse,
  envBusy,
  serverBusy,
  onRetry,
  onDelete,
  onStart,
  onStop
}: HubRowProps) {
  const meta = STATUS_META[env.status];
  const ready = env.status === "ready";
  const usable = ready && canUse;
  const serverStatus = server?.status ?? "stopped";
  const notOwnerHint = "Only the creator of this environment or an administrator can do this";

  return (
    <li className="env-row">
      <Logo type={env.type} />

      <div className="env-row-identity">
        <span className="env-row-name">{label}</span>
        <span className="env-row-namespace">{env.namespace}</span>
      </div>

      <div className={`status-chip ${meta.className}`} title={env.error ?? undefined}>
        <span className="status-dot" aria-hidden="true" />
        <span className="status-title">{meta.label}</span>
      </div>

      <div className="env-row-link">
        {env.status === "failed" ? (
          <span className="env-row-error">{env.error ?? "Unknown error"}</span>
        ) : usable ? (
          <span className="env-row-server">{SERVER_LABEL[serverStatus]}</span>
        ) : ready ? (
          <span className="env-row-server">This hub requires signing in with SSO</span>
        ) : (
          <span className="env-row-link-empty">{env.hub_url}</span>
        )}
      </div>

      <div className="actions env-row-actions">
        {usable && serverStatus === "stopped" ? (
          <button type="button" className="btn btn-success btn-sm" disabled={serverBusy} onClick={onStart}>
            {serverBusy ? "Starting…" : "▶ Start"}
          </button>
        ) : null}
        {usable && serverStatus !== "stopped" ? (
          <button type="button" className="btn btn-secondary btn-sm" disabled={serverBusy} onClick={onStop}>
            ■ Stop
          </button>
        ) : null}
        {usable && server && serverStatus === "running" ? (
          <a className="btn btn-primary btn-sm" href={server.url} target="_blank" rel="noreferrer">
            Open Jupyter
          </a>
        ) : ready ? (
          <a className="btn btn-secondary btn-sm" href={env.hub_url} target="_blank" rel="noreferrer">
            Open hub
          </a>
        ) : null}
        {env.status === "failed" ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={envBusy || !manageable}
            title={manageable ? undefined : notOwnerHint}
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={envBusy || !manageable || env.status === "deleting"}
          title={manageable ? undefined : notOwnerHint}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>

      {env.shared_volume ? <SharedVolumeInfo volume={env.shared_volume} /> : null}
    </li>
  );
}

function formatBytes(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** Whether the shared data volume is on Longhorn, ready, and how big it is. */
function SharedVolumeInfo({ volume }: { volume: SharedVolume }) {
  if (!volume.created) {
    return (
      <div className="shared-vol">
        <span className="shared-vol-label">Shared data</span>
        <span className="vol-chip vol-chip-info">Not created yet</span>
      </div>
    );
  }

  return (
    <div className="shared-vol" title={`${volume.name}${volume.status ? ` — ${volume.status}` : ""}`}>
      <span className="shared-vol-label">Shared data</span>
      <span className={`vol-chip ${volume.on_longhorn ? "vol-chip-ok" : "vol-chip-warn"}`}>
        {volume.on_longhorn ? "On Longhorn" : `Not on Longhorn (${volume.storage_class ?? "unknown"})`}
      </span>
      <span className={`vol-chip ${volume.ready ? "vol-chip-ok" : "vol-chip-bad"}`}>
        {volume.ready ? "Ready" : "Not ready"}
      </span>
      {volume.size ? (
        <span className="shared-vol-size">
          {volume.size}
          {volume.used_bytes !== null ? ` · ${formatBytes(volume.used_bytes)} used` : ""}
        </span>
      ) : null}
    </div>
  );
}

interface KafkaRowProps {
  kafka: KafkaCluster;
  label: string;
  manageable: boolean;
  busy: boolean;
  onDelete: () => void;
}

function KafkaRow({ kafka, label, manageable, busy, onDelete }: KafkaRowProps) {
  const meta = STATUS_META[kafka.status];
  return (
    <li className="env-row">
      <Logo type="kafka" />

      <div className="env-row-identity">
        <span className="env-row-name">{label}</span>
        <span className="env-row-namespace">{kafka.namespace}</span>
      </div>

      <div className={`status-chip ${meta.className}`}>
        <span className="status-dot" aria-hidden="true" />
        <span className="status-title">
          {meta.label} · {kafka.ready_replicas}/{kafka.replicas}
        </span>
      </div>

      <div className="env-row-link">
        <code className="code-link" title="Bootstrap servers (SASL/PLAIN)">
          {kafka.bootstrap_servers}
        </code>
        <CopyButton text={kafka.bootstrap_servers} label="Copy bootstrap servers" />
      </div>

      <div className="actions env-row-actions">
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={busy || !manageable || kafka.status === "deleting"}
          title={manageable ? undefined : "Only the creator of the cluster or an administrator can do this"}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>

    </li>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="btn btn-secondary btn-sm copy-btn" aria-label={label} onClick={() => void copy()}>
      {copied ? "✓" : "Copy"}
    </button>
  );
}

function Logo({ type }: { type: string }) {
  return (
    <img
      src={logoFor(type)}
      alt=""
      className="env-row-logo"
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

function EnvironmentListSkeleton() {
  return (
    <ul className="env-list" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <li key={key} className="env-row env-row-skeleton">
          <div className="skeleton skeleton-logo" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-chip" />
          <div className="skeleton skeleton-link" />
          <div className="skeleton skeleton-actions" />
        </li>
      ))}
    </ul>
  );
}
