import { FALLBACK_TYPES, logoFor } from "../lib/deployments";

const SECTIONS = [
  { id: "getting-started", title: "Getting started" },
  { id: "environments", title: "Environments" },
  { id: "your-data", title: "Your data" },
  { id: "volumes", title: "Shared data" },
  { id: "kafka", title: "Connecting to Kafka" },
  { id: "faq", title: "FAQ" }
];

const KAFKA_EXAMPLE = `from confluent_kafka import Producer

producer = Producer({
    "bootstrap.servers": "<bootstrap servers shown in the portal>",
    "security.protocol": "SASL_SSL",
    "sasl.mechanisms": "PLAIN",
    "sasl.username": "<user chosen when the cluster was created>",
    "sasl.password": "<password shown when the cluster was created>",
})
producer.produce("my-topic", b"hello from DataLab")
producer.flush()`;

/** Getting started guide and FAQ. Public: readable before signing in. */
export function HelpPage() {
  return (
    <div className="help">
      <nav className="help-nav" aria-label="Help sections">
        <a href="#" className="help-back">
          ← Back to the portal
        </a>
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#help`}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {section.title}
          </a>
        ))}
      </nav>

      <div className="help-content">
        <header className="help-intro reveal">
          <span className="hero-eyebrow">Help</span>
          <h2 className="hero-title">
            How to use <span className="hero-accent">DataLab</span>
          </h2>
          <p className="hero-lead">
            DataLab gives you ready-to-use data analysis environments on the IFCA Kubernetes infrastructure. This
            guide covers the first steps, where your data lives and how to connect to the services.
          </p>
        </header>

        <section id="getting-started" className="help-section reveal">
          <h3>Getting started</h3>
          <ol className="help-steps">
            <li>
              <strong>Sign in</strong>
              Use <em>Sign in with SSO</em> if you have an IFCA account: it gives access to every hub. GitHub works
              only for the environments that do not require SSO.
            </li>
            <li>
              <strong>Pick an environment</strong>
              Under <em>New environment</em>, choose a type and create it. It takes a few minutes; the portal shows
              its progress.
            </li>
            <li>
              <strong>Start your server</strong>
              Once the hub is <em>Ready</em>, press <em>Start</em> to launch your personal Jupyter server.
            </li>
            <li>
              <strong>Open Jupyter</strong>
              Press <em>Open Jupyter</em> and work from your browser. Stop the server when you finish; your files are
              kept.
            </li>
          </ol>
        </section>

        <section id="environments" className="help-section reveal">
          <h3>Environments</h3>
          <p>Each environment is created once and shared by everyone who uses it.</p>
          <ul className="help-types">
            {FALLBACK_TYPES.map((type) => (
              <li key={type.type}>
                <img
                  src={logoFor(type.type)}
                  alt=""
                  className="picker-icon"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span>
                  <strong>{type.label}</strong>
                  {type.keycloak_only ? <span className="picker-badge">SSO only</span> : null}
                  {!type.available ? <span className="picker-badge picker-badge-soon">Coming soon</span> : null}
                  <br />
                  <span className="picker-description">{type.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section id="your-data" className="help-section reveal">
          <h3>Your data</h3>
          <p>
            Your home folder (<code>/home/jovyan</code>) lives on a persistent volume: it survives when you stop your
            server or when the hub restarts. Some hubs also mount a folder shared by the whole group, for example{" "}
            <code>/home/jovyan/ids-shared</code> in the IDS hub.
          </p>
          <p>
            <strong>Deleting an environment deletes all its volumes</strong>, including every user&apos;s home. Only the
            person who created it or an administrator can delete it, and the portal asks for confirmation.
          </p>
        </section>

        <section id="volumes" className="help-section reveal">
          <h3>Shared data volume</h3>
          <p>
            Environments with a shared data folder show a <em>Shared data</em> line with the state of that volume:
          </p>
          <ul>
            <li>
              <strong>On Longhorn</strong> or <strong>Not on Longhorn</strong>: whether the volume is stored on the
              Longhorn distributed storage (replicated across nodes) or on another storage class.
            </li>
            <li>
              <strong>Ready</strong>: the volume exists and can be used. On Longhorn this means it is not faulted;
              a <em>degraded</em> volume is still ready while Longhorn rebuilds a missing replica.
            </li>
            <li>
              <strong>Size</strong>: its capacity and, on Longhorn, the space actually used.
            </li>
          </ul>
          <p>Hover over the line to see the volume name and its detailed state. If it is not ready, contact the DataLab administrators.</p>
        </section>

        <section id="kafka" className="help-section reveal">
          <h3>Connecting to Kafka</h3>
          <p>
            When you create a Kafka cluster, the portal shows its client configuration <strong>once</strong>: save
            the password at that moment. The bootstrap servers (<code>kafka0</code>–<code>kafka2.datalab.ifca.es</code>)
            are always visible in the environment list. Connections are encrypted with TLS and clients authenticate
            with SASL/PLAIN as the user chosen when the cluster was created (<code>kafkaclient1</code> by
            default). For example, with Python:
          </p>
          <pre className="code-block">
            <code>{KAFKA_EXAMPLE}</code>
          </pre>
        </section>

        <section id="faq" className="help-section help-faq reveal">
          <h3>FAQ</h3>
          <details>
            <summary>A hub says “This hub requires signing in with SSO”.</summary>
            <p>You signed in with GitHub. Sign out and sign in again with SSO using your IFCA account.</p>
          </details>
          <details>
            <summary>I cannot delete or retry an environment.</summary>
            <p>Only the person who created it or an administrator can. Ask them, or contact the DataLab team.</p>
          </details>
          <details>
            <summary>“The cluster or JupyterHub is not responding”.</summary>
            <p>
              The hub may still be starting or under heavy load. Wait a couple of minutes and try again; if it keeps
              failing, contact the DataLab administrators with the message shown in the portal.
            </p>
          </details>
          <details>
            <summary>I lost the Kafka password.</summary>
            <p>
              The password is only shown when the cluster is created. Today the only way to get a new one is to
              delete the cluster and create it again, which also deletes its data.
            </p>
          </details>
          <details>
            <summary>My session expired.</summary>
            <p>For security, sessions last a few hours. Sign in again; your environments and files are not affected.</p>
          </details>
        </section>
      </div>
    </div>
  );
}
