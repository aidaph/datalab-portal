<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PortalShell from "./components/PortalShell.vue";
import AuthPanel from "./components/AuthPanel.vue";
import CreateEnvironmentForm from "./components/CreateEnvironmentForm.vue";
import EnvironmentList from "./components/EnvironmentList.vue";

import { DatalabApiClient, DatalabApiError } from "@datalab/api-client";
import type { EnvironmentRecord } from "@datalab/shared";
import { config } from "./lib/config";

type DeploymentTypeInfo = {
  type: string;
  label: string;
  description: string;
  icon: string;
};

const fallbackTypes: DeploymentTypeInfo[] = [
  {
    type: "dummy",
    label: "Dummy",
    description: "Entorno de prueba para validación funcional y despliegues de demostración.",
    icon: "🧪",
  },
  {
    type: "ids",
    label: "Hub Datos ciberseguridad",
    description: "Entorno orientado al análisis y visualización de datos de ciberseguridad.",
    icon: "📊",
  },
  {
    type: "ipcc",
    label: "Hub Clima",
    description: "Entorno para análisis de datos climáticos y experimentación científica.",
    icon: "🌍",
  },
  {
    type: "datasciencehub",
    label: "Hub Máster Ciencia de Datos",
    description: "Entorno generalista para el Máster de Ciencia de Datos, con herramientas y datasets variados.",
    icon: "📈",
  },
  {
    type: "kafka",
    label: "Clúster Kafka",
    description: "Entorno orientado a mensajería, streaming y pruebas con brokers Kafka.",
    icon: "📨",
  },
  {
    type: "spark",
    label: "Clúster Spark",
    description: "Entorno para procesamiento distribuido y analítica sobre Apache Spark.",
    icon: "⚡",
  },
];

const token = ref("");
const username = ref("");
const deploymentTypes = ref<DeploymentTypeInfo[]>(fallbackTypes);
const selectedType = ref<string>("dummy");
const environments = ref<EnvironmentRecord[]>([]);
const isBusy = ref(false);
const statusMessage = ref("Portal listo.");
const lastLink = ref<string | undefined>(undefined);
const isAuthenticated = computed(() => !!token.value);
const avatarUrl = ref("");

const client = computed(
  () =>
    new DatalabApiClient({
      baseUrl: config.apiBaseUrl,
      token: token.value,
    }),
);

const environmentCount = computed(() => environments.value.length);
const canCreate = computed(() => deploymentTypes.value.length > 0 && !isBusy.value);
const canOperateServer = computed(() => !!username.value.trim());

function formatError(error: unknown): string {
  if (error instanceof DatalabApiError) {
    return `Error API ${error.status}: ${JSON.stringify(error.payload)}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ha ocurrido un error inesperado.";
}

async function loadBootData() {
  isBusy.value = true;
  try {
    const [types, running] = await Promise.all([
      client.value.getDeploymentTypes().catch(() => fallbackTypes),
      client.value.getRunningEnvironments().catch(() => []),
    ]);

    deploymentTypes.value = types.length > 0 ? types : fallbackTypes;
    environments.value = running;
    statusMessage.value = "Datos cargados correctamente.";
  } catch (error) {
    statusMessage.value = formatError(error);
  } finally {
    isBusy.value = false;
  }
}

async function refreshRunning() {
  try {
    const running = await client.value.getRunningEnvironments();
    environments.value = running;
    statusMessage.value = "Lista de entornos actualizada.";
  } catch (error) {
    statusMessage.value = formatError(error);
  }
}

async function createEnvironment() {
  if (!selectedType.value) return;
  isBusy.value = true;
  try {
    const response = await client.value.createEnvironment(selectedType.value);
    lastLink.value = response.hubUrl;
    statusMessage.value = "Entorno creado correctamente.";
    await refreshRunning();
  } catch (error) {
    statusMessage.value = formatError(error);
  } finally {
    isBusy.value = false;
  }
}

async function deleteEnvironment(namespace: string) {
  isBusy.value = true;
  try {
    await client.value.deleteEnvironment(namespace);
    statusMessage.value = `Entorno ${namespace} eliminado.`;
    await refreshRunning();
  } catch (error) {
    statusMessage.value = formatError(error);
  } finally {
    isBusy.value = false;
  }
}

async function startServer(namespace: string) {
  if (!username.value.trim()) {
    statusMessage.value = "Define un usuario antes de arrancar el servidor.";
    return;
  }

  isBusy.value = true;
  try {
    const response = await client.value.startJupyterServer(namespace, username.value.trim());
    lastLink.value = response.hubUrl;
    statusMessage.value = response.hubUrl
      ? "Servidor Jupyter preparado."
      : "Petición enviada al servidor Jupyter.";
  } catch (error) {
    statusMessage.value = formatError(error);
  } finally {
    isBusy.value = false;
  }
}

async function checkServer(namespace: string) {
  if (!username.value.trim()) {
    statusMessage.value = "Define un usuario para consultar el servidor.";
    return;
  }

  isBusy.value = true;
  try {
    const response = await client.value.getJupyterServer(namespace, username.value.trim());
    lastLink.value = response.hubUrl;
    statusMessage.value = response.hubUrl
      ? "Servidor activo y disponible."
      : "Servidor consultado.";
  } catch (error) {
    statusMessage.value = formatError(error);
  } finally {
    isBusy.value = false;
  }
}

function openExternal(url: string) {
  globalThis.window.open(url, "_blank");
}

function loginWithGithub() {
  window.location.href = "http://localhost:8000/auth/github/login";
}

function logout() {
  token.value = "";
  username.value = "";

  window.history.replaceState({}, "", "/");
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search);

  const tokenFromUrl = params.get("token");
  const userFromUrl = params.get("user");
  const avatarFromUrl = params.get("avatar");

  if (tokenFromUrl) token.value = tokenFromUrl;
  if (userFromUrl) username.value = userFromUrl;
  if (avatarFromUrl) avatarUrl.value = avatarFromUrl;

  window.history.replaceState({}, "", "/");

  void loadBootData();
});
</script>

<template>
  <PortalShell 
    :username="username" 
    :avatar-url="avatarUrl"
    @login="loginWithGithub"
    @logout="logout"
  >
    <article class="card stack">
      <div>
        <h2 class="section-title">Crear entorno interactivo</h2>
        <p class="section-text">
          Selecciona un tipo de despliegue y crea el Entorno Interactivo asociado en DLaaS.
        </p>
      </div>

      <CreateEnvironmentForm
        :deployment-types="deploymentTypes"
        :selected-type="selectedType"
        :is-busy="isBusy"
        @update:selected-type="selectedType = $event"
        @create="createEnvironment"
      />
    </article>

    <article class="card stack">
      <div>
        <h2 class="section-title">Estado del portal</h2>
      </div>

      <div class="status-banner">
        <div>
          <strong>Mensaje actual</strong>
          <div>{{ statusMessage }}</div>
        </div>
      </div>

      <div v-if="lastLink" class="stack">
        <div class="label">Última URL devuelta</div>
        <div class="actions">
          <a class="code-link" :href="lastLink" target="_blank" rel="noreferrer">
            {{ lastLink }}
          </a>

          <button type="button" class="btn btn-secondary" @click="openExternal(lastLink)">
            🌐 Abrir JupyterHub
          </button>
        </div>
      </div>
    </article>

    <article class="card stack deployments-panel">
      <div class="deployments-panel-header">
        <div>
          <h2 class="section-title">Entornos desplegados</h2>
          <p class="section-text">
            Gestiona tus entornos activos, consulta su estado y accede a JupyterHub.
          </p>
        </div>

        <div class="deployments-panel-meta">
          <span class="deployments-counter">
            {{ environments.length }} entorno<span v-if="environments.length !== 1">s</span>
          </span>
        </div>
      </div>

      <EnvironmentList
        :environments="environments"
        :is-busy="isBusy"
        :username="username"
        :can-operate-server="canOperateServer"
        @refresh="refreshRunning"
        @delete-namespace="deleteEnvironment"
        @start-server="startServer"
        @check-server="checkServer"
        @open-link="openExternal"
      />
    </article>
  </PortalShell>
</template>