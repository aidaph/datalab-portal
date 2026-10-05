import { useEffect, useRef, useState } from "react";
import type { KafkaCredentials } from "@datalab/shared";

interface KafkaCredentialsDialogProps {
  credentials: KafkaCredentials;
  onClose: () => void;
}

/** Shows the client password of a new Kafka cluster: the API returns it only once. */
export function KafkaCredentialsDialog({ credentials, onClose }: KafkaCredentialsDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const clientConfig = [
    `bootstrap.servers=${credentials.bootstrap_servers}`,
    "security.protocol=SASL_PLAINTEXT",
    "sasl.mechanism=PLAIN",
    `sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="${credentials.client_username}" password="${credentials.client_password}";`
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(clientConfig);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="dialog-overlay" role="presentation">
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="kafka-dialog-title">
        <h3 id="kafka-dialog-title" className="section-title">
          Kafka cluster being created
        </h3>
        <p className="section-text">
          Save this configuration now: <strong>the password will not be shown again</strong>.
        </p>
        <pre className="code-block">{clientConfig}</pre>
        <div className="actions dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={() => void copy()}>
            {copied ? "✓ Copied" : "Copy configuration"}
          </button>
          <button type="button" className="btn btn-primary" ref={closeButtonRef} onClick={onClose}>
            I've saved it
          </button>
        </div>
      </div>
    </div>
  );
}
