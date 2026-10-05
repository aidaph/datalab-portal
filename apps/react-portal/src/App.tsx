import { useMemo, useState } from "react";
import { PortalShell } from "./components/PortalShell";
import { DeploymentPicker } from "./components/DeploymentPicker";
import { EnvironmentList } from "./components/EnvironmentList";
import { KafkaCredentialsDialog } from "./components/KafkaCredentialsDialog";
import { Toaster } from "./components/Toaster";
import { ToastProvider } from "./hooks/useToasts";
import { useAuthSession } from "./hooks/useAuthSession";
import { useEnvironments } from "./hooks/useEnvironments";

type Tab = "active" | "new";

function Dashboard() {
  const session = useAuthSession();
  const controller = useEnvironments(session.client, session.user);
  const [tab, setTab] = useState<Tab>("active");

  const existingTypes = useMemo(() => {
    const types = new Set(controller.environments.map((env) => env.type));
    if (controller.kafka) types.add("kafka");
    return types;
  }, [controller.environments, controller.kafka]);

  const total = existingTypes.size;
  const readyCount =
    controller.environments.filter((env) => env.status === "ready").length +
    (controller.kafka?.status === "ready" ? 1 : 0);

  return (
    <PortalShell
      isAuthenticated={session.isAuthenticated}
      username={session.username}
      avatarUrl={session.avatarUrl}
      isAdmin={session.user?.is_admin ?? false}
      onLoginGithub={session.loginWithGithub}
      onLoginSso={session.loginWithSSO}
      onLogout={session.logout}
    >
      <div className="dashboard-header">
        <div>
          <h2 className="section-title">Interactive environments</h2>
          <p className="section-text">Create and manage your environments on Kubernetes at the IFCA infrastructure.</p>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{total}</span>
          <span className="stat-pill-label">
            environment{total === 1 ? "" : "s"}
            {readyCount < total ? ` · ${readyCount} ready` : ""}
          </span>
        </div>
      </div>

      <div className="card stack">
        <div className="tabs" role="tablist" aria-label="Portal sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "active"}
            className={`tab${tab === "active" ? " active" : ""}`}
            onClick={() => setTab("active")}
          >
            Active environments
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "new"}
            className={`tab${tab === "new" ? " active" : ""}`}
            onClick={() => setTab("new")}
          >
            New environment
          </button>
        </div>

        {tab === "active" ? (
          <EnvironmentList
            deploymentTypes={controller.deploymentTypes}
            environments={controller.environments}
            servers={controller.servers}
            kafka={controller.kafka}
            user={session.user}
            isLoading={controller.isLoading || session.isResolving}
            busy={controller.busy}
            onRefresh={() => void controller.refresh()}
            onRetry={(type) => void controller.retryEnvironment(type)}
            onDelete={(type) => void controller.deleteEnvironment(type)}
            onStart={(type) => void controller.startServer(type)}
            onStop={(type) => void controller.stopServer(type)}
            onDeleteKafka={() => void controller.deleteKafka()}
          />
        ) : (
          <DeploymentPicker
            deploymentTypes={controller.deploymentTypes}
            existingTypes={existingTypes}
            isBusy={controller.busy.has("create") || controller.busy.has("kafka")}
            onCreate={async (type) => {
              if (await controller.createEnvironment(type)) setTab("active");
            }}
            onCreateKafka={async (payload) => {
              if (await controller.createKafka(payload)) setTab("active");
            }}
          />
        )}
      </div>

      {controller.kafkaCredentials ? (
        <KafkaCredentialsDialog
          credentials={controller.kafkaCredentials}
          onClose={controller.dismissKafkaCredentials}
        />
      ) : null}
    </PortalShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
      <Toaster />
    </ToastProvider>
  );
}
