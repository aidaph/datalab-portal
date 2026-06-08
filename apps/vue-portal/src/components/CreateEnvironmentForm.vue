<script setup lang="ts">
type DeploymentTypeInfo = {
  type: string;
  label: string;
  description: string;
  icon: string;
};

const props = defineProps<{
  deploymentTypes: DeploymentTypeInfo[];
  selectedType: string | "";
  isBusy: boolean;
}>();

const emit = defineEmits<{
  (e: "update:selected-type", value: string): void;
  (e: "create"): void;
}>();
</script>

<template>
  <div class="env-grid">
    <div
      v-for="deployment in deploymentTypes"
      :key="deployment.type"
      class="env-card"
      :class="{ selected: selectedType === deployment.type }"
      @click="emit('update:selected-type', deployment.type)"
    >
      <div class="env-icon">
        <img
          :src="`/env-icons/${deployment.type}.png`"
          :alt="deployment.label"
          class="env-icon-img"
        />
      </div>

      <div class="env-name">
        {{ deployment.label }}
      </div>

      <div class="env-description">
        {{ deployment.description }}
      </div>
    </div>
  </div>

  <div class="actions">
    <button
      class="btn btn-primary"
      :disabled="isBusy || !selectedType"
      @click="emit('create')"
    >
      Crear JupyterHub
    </button>
  </div>
</template>