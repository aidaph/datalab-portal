import { useEffect, useRef, useState } from "react";
import type { KafkaCreatePayload } from "@datalab/shared";

interface KafkaCreateDialogProps {
  isBusy: boolean;
  onCreate: (payload: KafkaCreatePayload) => void;
  onClose: () => void;
}

const MIN_PASSWORD_LENGTH = 12;
// Same rules as the API (KafkaCreate): the user and password go into the
// brokers' JAAS configuration.
const DEFAULT_KAFKA_USER = "kafkaclient1";
const KAFKA_USER_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{2,31}$/;
const KAFKA_PASSWORD_FORBIDDEN = /["\\\s]/;
// Brokers are published as kafka0..kafka2.datalab.ifca.es (KAFKA_MAX_BROKERS in the API).
const MAX_KAFKA_BROKERS = 3;

/** Settings of a new Kafka cluster: brokers and the client user. */
export function KafkaCreateDialog({ isBusy, onCreate, onClose }: KafkaCreateDialogProps) {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [replicas, setReplicas] = useState(MAX_KAFKA_BROKERS);
  const [username, setUsername] = useState(DEFAULT_KAFKA_USER);
  const [password, setPassword] = useState("");

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const usernameError = !KAFKA_USER_PATTERN.test(username)
    ? "3–32 characters: letters, digits, '.', '_' or '-', starting with a letter."
    : username.toLowerCase() === "admin"
      ? "'admin' is reserved for the brokers."
      : "";
  const passwordError =
    password && KAFKA_PASSWORD_FORBIDDEN.test(password)
      ? "It cannot contain quotes, backslashes or spaces."
      : password && password.length < MIN_PASSWORD_LENGTH
        ? `At least ${MIN_PASSWORD_LENGTH} characters (or leave it empty to generate one).`
        : "";

  return (
    <div className="dialog-overlay" role="presentation" onKeyDown={(event) => event.key === "Escape" && onClose()}>
      <form
        className="dialog-panel stack"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kafka-create-title"
        onSubmit={(event) => {
          event.preventDefault();
          if (usernameError || passwordError) return;
          onCreate({ replicas, client_username: username, ...(password ? { client_password: password } : {}) });
        }}
      >
        <h3 id="kafka-create-title" className="section-title">
          New Kafka cluster
        </h3>
        <p className="section-text">
          Brokers are published as <code>kafka0</code>–<code>kafka2.datalab.ifca.es</code> over SASL_SSL.
        </p>

        <label className="field">
          <span className="field-label">Brokers</span>
          <input
            ref={firstFieldRef}
            className="field-input"
            type="number"
            min={1}
            max={MAX_KAFKA_BROKERS}
            value={replicas}
            onChange={(event) =>
              setReplicas(Math.min(MAX_KAFKA_BROKERS, Math.max(1, Number(event.target.value) || 1)))
            }
          />
          <span className="field-hint">
            Between 1 and {MAX_KAFKA_BROKERS} (one per public host). Also used as the replication factor.
          </span>
        </label>
        <label className="field">
          <span className="field-label">Client user</span>
          <input
            className="field-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={username}
            aria-invalid={!!usernameError}
            onChange={(event) => setUsername(event.target.value.trim())}
          />
          <span className={`field-hint${usernameError ? " field-error" : ""}`}>
            {usernameError || "SASL/PLAIN user your clients (e.g. Fluent Bit) will log in with."}
          </span>
        </label>
        <label className="field">
          <span className="field-label">Client password (optional)</span>
          <input
            className="field-input"
            type="password"
            autoComplete="new-password"
            value={password}
            aria-invalid={!!passwordError}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span className={`field-hint${passwordError ? " field-error" : ""}`}>
            {passwordError || "Leave it empty to generate a strong one. It is shown only once."}
          </span>
        </label>

        <div className="actions dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isBusy || !!usernameError || !!passwordError}>
            {isBusy ? "Creating…" : "Create Kafka cluster"}
          </button>
        </div>
      </form>
    </div>
  );
}
