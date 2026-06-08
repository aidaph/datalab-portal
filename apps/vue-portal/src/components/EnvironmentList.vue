<script setup lang="ts">
import type { EnvironmentRecord } from "@datalab/shared";

defineProps<{
  environments: EnvironmentRecord[];
  username: string;
  isBusy: boolean;
  canOperateServer: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "delete-namespace", namespace: string): void;
  (e: "start-server", namespace: string): void;
  (e: "check-server", namespace: string): void;
  (e: "open-link", url: string): void;
}>();

function stateLabel(state: string) {
  if (state === "running") return "Running";
  if (state === "created") return "Created";
  if (state === "error") return "Error";
  return "Unknown";
}

function stateSubtitle(state: string) {
  if (state === "running") return "Servicio disponible";
  if (state === "created") return "Pendiente de arranque";
  if (state === "error") return "Revisar despliegue";
  return "Estado no disponible";
}

function statusCardClass(state: string) {
  if (state === "running") return "status-chip status-chip-running";
  if (state === "created") return "status-chip status-chip-created";
  if (state === "error") return "status-chip status-chip-error";
  return "status-chip status-chip-unknown";
}

function deploymentLabel(type: string) {
  return {
    dummy: "Dummy",
    ids: "Hub ciberseguridad",
    ipcc: "Clima",
    climate: "Clima",
    datasciencehub: "Hub Master Ciencia de Datos",
    dataScienceHub: "Hub Master Ciencia de Datos",
    kafka: "Clúster Kafka",
    spark: "Clúster Spark",
  }[type] ?? type;
}

function logoFor(type: string) {
  return `/env-icons/${type}.png`;
}

function onLogoError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}
</script>

<template>
  <div class="stack">
    <div class="actions">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="isBusy"
        @click="emit('refresh')"
      >
        Actualizar lista
      </button>
    </div>

    <div v-if="environments.length === 0" class="empty-state-box">
      <div class="empty-state-icon">🧪</div>
      <div class="empty-state-title">No hay entornos desplegados</div>
      <div class="empty-state-text">
        Selecciona un tipo de entorno y crea tu primer JupyterHub.
      </div>
    </div>

    <div v-else class="env-active-grid">
      <article
        v-for="env in environments"
        :key="env.namespace"
        class="env-active-card"
      >
        <div class="env-active-top">
          <div :class="statusCardClass(env.state)">
            <span class="status-dot"></span>
            <div class="status-copy">
              <span class="status-title">{{ stateLabel(env.state) }}</span>
              <span class="status-subtitle">{{ stateSubtitle(env.state) }}</span>
            </div>
          </div>
        </div>

        <div class="env-active-hero">
          <div class="env-active-logo-wrap">
            <img
              :src="logoFor(env.type)"
              :alt="deploymentLabel(env.type)"
              class="env-active-logo"
              @error="onLogoError"
            />
          </div>

          <div class="env-active-title-block">
            <div class="env-active-name">
              {{ deploymentLabel(env.type) }}
            </div>

            <div class="env-active-type">
              {{ env.namespace }}
            </div>
          </div>
        </div>

        <div class="env-meta">
          <div><strong>Usuario:</strong> {{ username || "No definido" }}</div>

          <div v-if="env.hubUrl">
            <strong>Hub:</strong>
            <a
              :href="env.hubUrl"
              target="_blank"
              rel="noreferrer"
              class="code-link"
            >
              abrir enlace
            </a>
          </div>
        </div>

        <div class="actions">
          <button
            type="button"
            class="btn btn-success"
            :disabled="isBusy || !canOperateServer"
            @click="emit('start-server', env.namespace)"
          >
            ▶ Iniciar
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isBusy || !canOperateServer"
            @click="emit('check-server', env.namespace)"
          >
            🔍 Consultar
          </button>

          <button
            v-if="env.hubUrl"
            type="button"
            class="btn btn-secondary"
            :disabled="isBusy"
            @click="emit('open-link', env.hubUrl)"
          >
            🌐 Abrir
          </button>

          <button
            type="button"
            class="btn btn-danger"
            :disabled="isBusy"
            @click="emit('delete-namespace', env.namespace)"
          >
            🗑 Eliminar
          </button>
        </div>
      </article>
    </div>
  </div>
</template>