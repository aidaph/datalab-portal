import { useRef, useState } from "react";
import { PortalShell } from "./components/PortalShell";
import { ServiceCatalog } from "./components/ServiceCatalog";
import { EnvironmentList } from "./components/EnvironmentList";
import { KafkaCreateDialog } from "./components/KafkaCreateDialog";
import { KafkaCredentialsDialog } from "./components/KafkaCredentialsDialog";
import { Toaster } from "./components/Toaster";
import { ToastProvider } from "./hooks/useToasts";
import { useAuthSession } from "./hooks/useAuthSession";
import { useEnvironments } from "./hooks/useEnvironments";

function Dashboard() {
  const session = useAuthSession();
  const controller = useEnvironments(session.client, session.user);
  const [creatingKafka, setCreatingKafka] = useState(false);
  const activeRef = useRef<HTMLElement>(null);

  const total = controller.environments.length + (controller.kafka ? 1 : 0);
  const readyCount =
    controller.environments.filter((env) => env.status === "ready").length +
    (controller.kafka?.status === "ready" ? 1 : 0);
  const showDetails = () => activeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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
      <section className="stack" aria-labelledby="services-title">
        <div className="dashboard-header">
          <div>
            <h2 id="services-title" className="section-title section-title-lg">
              What you can do in the DataLab
            </h2>
            <p className="section-text">
              Launch an environment, open the ones you already have, or connect to the platform services.
            </p>
          </div>
        </div>
        <ServiceCatalog
          services={controller.deploymentTypes}
          environments={controller.environments}
          kafka={controller.kafka}
          user={session.user}
          busy={controller.busy}
          onCreate={(type) => void controller.createEnvironment(type)}
          onCreateKafka={() => setCreatingKafka(true)}
          onShowDetails={showDetails}
        />
      </section>

      <section ref={activeRef} className="stack dashboard-active" aria-labelledby="active-title">
        <div className="dashboard-header">
          <div>
            <h2 id="active-title" className="section-title">
              Your environments
            </h2>
            <p className="section-text">Servers, status and connection details of what is running.</p>
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
        </div>
      </section>

      {creatingKafka ? (
        <KafkaCreateDialog
          isBusy={controller.busy.has("kafka")}
          onClose={() => setCreatingKafka(false)}
          onCreate={async (payload) => {
            if (await controller.createKafka(payload)) setCreatingKafka(false);
          }}
        />
      ) : null}

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
