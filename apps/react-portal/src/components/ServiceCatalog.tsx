import { useState } from "react";
import { canUseHub, type Environment, type KafkaCluster, type UserInfo } from "@datalab/shared";
import { logoFor, type DeploymentTypeInfo } from "../lib/deployments";
import { hubLink } from "../lib/hubLinks";

interface ServiceCatalogProps {
  services: DeploymentTypeInfo[];
  environments: Environment[];
  kafka: KafkaCluster | null;
  user: UserInfo | null;
  busy: ReadonlySet<string>;
  onCreate: (type: string) => void;
  onCreateKafka: () => void;
  /** Scroll to the environment list (details, servers, delete). */
  onShowDetails: () => void;
}

type Kind = NonNullable<DeploymentTypeInfo["kind"]>;

const STATUS_TEXT: Record<Environment["status"], string> = {
  ready: "Running",
  provisioning: "Creating…",
  deleting: "Deleting…",
  failed: "Error"
};

function kindOf(service: DeploymentTypeInfo): Kind {
  return service.kind ?? (service.type === "kafka" ? "kafka" : "jupyterhub");
}

/** The DataLab services the user can use, as large cards with one clear action each. */
export function ServiceCatalog({
  services,
  environments,
  kafka,
  user,
  busy,
  onCreate,
  onCreateKafka,
  onShowDetails
}: ServiceCatalogProps) {
  // Services without a PNG under /env-icons fall back to their emoji.
  const [missingLogos, setMissingLogos] = useState<ReadonlySet<string>>(new Set());
  return (
    <ul className="service-grid">
      {services.map((service) => {
        const kind = kindOf(service);
        const env = kind === "jupyterhub" ? environments.find((item) => item.type === service.type) : undefined;
        const status = kind === "kafka" ? kafka?.status : env?.status;
        return (
          <li key={service.type} className={`service-card${service.available ? "" : " service-card-soon"}`}>
            <div className="service-card-head">
              {missingLogos.has(service.type) ? (
                <span className="service-logo service-logo-emoji" aria-hidden="true">
                  {service.icon}
                </span>
              ) : (
                <img
                  src={logoFor(service.type)}
                  alt=""
                  className="service-logo"
                  onError={() => setMissingLogos((prev) => new Set(prev).add(service.type))}
                />
              )}
              {status ? (
                <span className={`service-status service-status-${status}`}>{STATUS_TEXT[status]}</span>
              ) : !service.available ? (
                <span className="service-status service-status-soon">Coming soon</span>
              ) : null}
            </div>
            <h3 className="service-title">{service.label}</h3>
            <p className="service-description">{service.description}</p>
            <div className="service-actions">
              <ServiceAction
                service={service}
                kind={kind}
                env={env}
                hasKafka={!!kafka}
                user={user}
                busy={busy}
                onCreate={onCreate}
                onCreateKafka={onCreateKafka}
                onShowDetails={onShowDetails}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface ServiceActionProps {
  service: DeploymentTypeInfo;
  kind: Kind;
  env: Environment | undefined;
  hasKafka: boolean;
  user: UserInfo | null;
  busy: ReadonlySet<string>;
  onCreate: (type: string) => void;
  onCreateKafka: () => void;
  onShowDetails: () => void;
}

function ServiceAction({
  service,
  kind,
  env,
  hasKafka,
  user,
  busy,
  onCreate,
  onCreateKafka,
  onShowDetails
}: ServiceActionProps) {
  if (kind === "link") {
    return service.url && service.available ? (
      <a className="btn btn-primary" href={service.url} target="_blank" rel="noreferrer">
        Open ↗
      </a>
    ) : (
      <button type="button" className="btn btn-secondary" disabled>
        Coming soon
      </button>
    );
  }

  if (kind === "kafka") {
    return hasKafka ? (
      <button type="button" className="btn btn-secondary" onClick={onShowDetails}>
        Brokers and connection
      </button>
    ) : (
      <button
        type="button"
        className="btn btn-primary"
        disabled={!service.available || busy.has("kafka")}
        onClick={onCreateKafka}
      >
        {busy.has("kafka") ? "Creating…" : "Create cluster"}
      </button>
    );
  }

  if (env) {
    if (env.status !== "ready") {
      return (
        <button type="button" className="btn btn-secondary" onClick={onShowDetails}>
          View status
        </button>
      );
    }
    if (!canUseHub(user, service)) {
      return (
        <span className="service-note" title="This hub only accepts SSO sign-in">
          Sign in with SSO to use it
        </span>
      );
    }
    return (
      <>
        <a
          className="btn btn-primary"
          href={hubLink(env.hub_url, "/hub/", !!service.keycloak_only)}
          target="_blank"
          rel="noreferrer"
        >
          Open ↗
        </a>
        <button type="button" className="btn btn-secondary" onClick={onShowDetails}>
          My server
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={!service.available || busy.has("create")}
      onClick={() => onCreate(service.type)}
    >
      {service.available ? (busy.has("create") ? "Creating…" : "Create") : "Coming soon"}
    </button>
  );
}
