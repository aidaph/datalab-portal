<script setup lang="ts">
const props = defineProps<{
  username: string;
  token: string;
}>();

const emit = defineEmits<{
  (e: "login"): void;
  (e: "logout"): void;
}>();
</script>

<template>
  <div class="stack">
    <div>
      <h2 class="section-title">Acceso</h2>
      <p class="section-text">
        Autenticación con GitHub.
      </p>
    </div>

    <div v-if="!token" class="actions">
      <button
        type="button"
        class="btn btn-primary"
        @click="$emit('login')"
      >
        Entrar con GitHub
      </button>
    </div>

    <div v-else class="card stack">
      <div>
        <strong>Usuario autenticado:</strong>
      </div>

      <div class="user-chip">
        {{ username }}
      </div>

      <button
        type="button"
        class="btn btn-secondary"
        @click="$emit('logout')"
      >
        Cerrar sesión
      </button>
    </div>
  </div>
</template>