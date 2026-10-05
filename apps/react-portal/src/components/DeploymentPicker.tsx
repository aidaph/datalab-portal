import { useState } from "react";
import type { KafkaCreatePayload } from "@datalab/shared";
import { logoFor, type DeploymentTypeInfo } from "../lib/deployments";

interface DeploymentPickerProps {
  deploymentTypes: DeploymentTypeInfo[];
  /** Types that already have an environment (a hub, or the Kafka cluster). */
  existingTypes: ReadonlySet<string>;
  isBusy: boolean;
  onCreate: (type: string) => void;
  onCreateKafka: (payload: KafkaCreatePayload) => void;
}

const MIN_PASSWORD_LENGTH = 12;

export function DeploymentPicker({
  deploymentTypes,
  existingTypes,
  isBusy,
  onCreate,
  onCreateKafka
}: DeploymentPickerProps) {
  const isSelectable = (deployment: DeploymentTypeInfo) =>
    deployment.available && !existingTypes.has(deployment.type);

  const [selectedType, setSelectedType] = useState<string>(
    () => deploymentTypes.find(isSelectable)?.type ?? ""
  );
  const [replicas, setReplicas] = useState(1);
  const [password, setPassword] = useState("");

  const selected = deploymentTypes.find((deployment) => deployment.type === selectedType);
  const nothingToCreate = !deploymentTypes.some(isSelectable);
  const canSubmit = !!selected && isSelectable(selected);
  const isKafka = selectedType === "kafka";
  const passwordError =
    password && password.length < MIN_PASSWORD_LENGTH
      ? `At least ${MIN_PASSWORD_LENGTH} characters (or leave it empty to generate one).`
      : "";

  function submit() {
    if (!canSubmit) return;
    if (isKafka) {
      if (passwordError) return;
      onCreateKafka({ replicas, ...(password ? { client_password: password } : {}) });
    } else {
      onCreate(selectedType);
    }
  }

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="picker-list" role="radiogroup" aria-label="Environment type">
        {deploymentTypes.map((deployment) => {
          const exists = existingTypes.has(deployment.type);
          const disabled = !isSelectable(deployment);
          const isSelected = selectedType === deployment.type;
          return (
            <button
              key={deployment.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={disabled}
              disabled={disabled}
              className={`picker-row${isSelected ? " selected" : ""}${disabled ? " disabled" : ""}`}
              onClick={() => setSelectedType(deployment.type)}
            >
              <img
                src={logoFor(deployment.type)}
                alt=""
                className="picker-icon"
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />
              <span className="picker-text">
                <span className="picker-label">
                  {deployment.label}
                  {exists ? <span className="picker-badge picker-badge-deployed">Already deployed</span> : null}
                  {!deployment.available ? <span className="picker-badge picker-badge-soon">Coming soon</span> : null}
                </span>
                <span className="picker-description">{deployment.description}</span>
              </span>
              <span className="picker-check" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {isKafka ? (
        <fieldset className="form-grid">
          <legend className="section-subtitle">Kafka settings</legend>
          <label className="field">
            <span className="field-label">Brokers</span>
            <input
              className="field-input"
              type="number"
              min={1}
              max={5}
              value={replicas}
              onChange={(event) => setReplicas(Math.min(5, Math.max(1, Number(event.target.value) || 1)))}
            />
            <span className="field-hint">Between 1 and 5. Also used as the replication factor.</span>
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
        </fieldset>
      ) : null}

      {nothingToCreate ? (
        <p className="picker-empty" role="status">
          Every available environment is already deployed. To create one again, delete it first under
          “Active environments”.
        </p>
      ) : !canSubmit ? (
        <p className="picker-empty">Choose an environment type.</p>
      ) : null}

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={isBusy || !canSubmit || !!passwordError}>
          {isBusy ? "Creating…" : "Create environment"}
        </button>
      </div>
    </form>
  );
}
