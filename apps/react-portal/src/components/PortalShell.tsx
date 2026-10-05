import type { ReactNode } from "react";
import { useHashView } from "../hooks/useHashView";
import { useTheme } from "../hooks/useTheme";
import { HelpPage } from "./HelpPage";

interface PortalShellProps {
  isAuthenticated: boolean;
  username?: string;
  isAdmin?: boolean;
  avatarUrl?: string;
  onLoginGithub: () => void;
  onLoginSso: () => void;
  onLogout: () => void;
  children: ReactNode;
}

function userInitial(name?: string): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export function PortalShell({
  isAuthenticated,
  username,
  isAdmin = false,
  avatarUrl,
  onLoginGithub,
  onLoginSso,
  onLogout,
  children
}: PortalShellProps) {
  const view = useHashView();
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="app-shell">
      <div className="page-bg" aria-hidden="true">
        <span className="page-bg-blob page-bg-blob-1" />
        <span className="page-bg-blob page-bg-blob-2" />
        <span className="page-bg-blob page-bg-blob-3" />
      </div>

      <header className="portal-header">
        <a href="#" className="brand" aria-label="DataLab Portal home" style={{ textDecoration: "none" }}>
          <img src="/logo-datalab.png" alt="DataLab" className="logo-main" />
          <h1 className="brand-title">DataLab Portal</h1>
        </a>

        <div className="header-right">
          <a href="#help" className="header-link" aria-current={view === "help" ? "page" : undefined}>
            Help
          </a>
          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {isAuthenticated ? (
            <div className="user-chip">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="user-avatar-image" />
              ) : (
                <div className="user-avatar">{userInitial(username)}</div>
              )}
              <span className="user-name">{username || "…"}</span>
              {isAdmin ? <span className="user-role">admin</span> : null}
            </div>
          ) : null}
          {isAuthenticated ? (
            <button type="button" className="btn btn-secondary" onClick={onLogout}>
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main className="layout-full">
        {view === "help" ? (
          <HelpPage />
        ) : isAuthenticated ? (
          <div className="stack">{children}</div>
        ) : (
          <LandingHero onLoginGithub={onLoginGithub} onLoginSso={onLoginSso} />
        )}
      </main>

      <footer className="portal-footer">
        <div className="footer-inline">
          <span className="footer-text">DataLab @ IFCA · © 2026 Institute of Physics of Cantabria (CSIC-UC)</span>
          <div className="footer-logos">
            <img src="/logo-ifca.png" alt="IFCA" className="footer-logo" />
            <img src="/logo-csic.png" alt="CSIC" className="footer-logo" />
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    logo: "/env-icons/dummy.png",
    logoAlt: "Jupyter",
    title: "JupyterHub per project",
    text: "Each group gets its own hub with persistent storage and shared data. Start your Jupyter server in one click."
  },
  {
    logo: "/env-icons/kafka.png",
    logoAlt: "Apache Kafka",
    title: "Kafka on demand",
    text: "Spin up an authenticated Kafka cluster for your data streams and get a ready-to-use client configuration."
  },
  {
    logo: "/env-icons/kubernetes.svg",
    logoAlt: "Kubernetes",
    title: "Built on Kubernetes",
    text: "Resources are provisioned on the IFCA cluster when you need them and released when you are done."
  }
];

const PREVIEW_ROWS = [
  { name: "IDS hub", detail: "JupyterHub", delay: "0s" },
  { name: "Kafka cluster", detail: "3 brokers", delay: "1.2s" },
  { name: "Climate hub", detail: "JupyterHub", delay: "2.4s" }
];

function LandingHero({ onLoginGithub, onLoginSso }: { onLoginGithub: () => void; onLoginSso: () => void }) {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy reveal">
          <span className="hero-eyebrow">DataLab · Institute of Physics of Cantabria</span>
          <h2 className="hero-title">
            Your data analysis environment, <span className="hero-accent">ready in minutes</span>
          </h2>
          <p className="hero-lead">
            DataLab deploys JupyterHub, Kafka and other services on demand on the IFCA Kubernetes infrastructure.
            Pick an environment, start it and work from your browser with your data, with nothing to install.
          </p>

          <div className="login-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={onLoginSso}>
              Sign in with SSO
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={onLoginGithub}>
              Sign in with GitHub
            </button>
          </div>
          <p className="login-hint">
            If you have an IFCA account, sign in with <strong>SSO</strong>: it gives access to every hub. With GitHub
            you can only use the environments that do not require SSO.
          </p>
        </div>

        <div className="hero-preview reveal" aria-hidden="true">
          <div className="hero-preview-bar">
            <span />
            <span />
            <span />
          </div>
          <ul className="hero-preview-list">
            {PREVIEW_ROWS.map((row) => (
              <li key={row.name} className="hero-preview-row">
                <span className="hero-preview-name">
                  {row.name}
                  <small>{row.detail}</small>
                </span>
                <span className="hero-preview-status" style={{ animationDelay: row.delay }}>
                  <span className="status-dot" />
                  <span className="hero-preview-state">
                    <span className="hero-preview-creating">Creating…</span>
                    <span className="hero-preview-ready">Ready</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="features" aria-label="What you can do">
        {FEATURES.map((feature, index) => (
          <article key={feature.title} className="feature-card reveal" style={{ animationDelay: `${0.15 + index * 0.1}s` }}>
            <span className="feature-icon">
              <img src={feature.logo} alt={feature.logoAlt} />
            </span>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-text">{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
