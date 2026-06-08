<script setup lang="ts">
import "../styles/datalab-theme.css";

defineProps<{
  username?: string;
  avatarUrl?: string;
}>();

defineEmits<{
  (e: "login"): void;
  (e: "logout"): void;
}>();

function userInitial(name?: string) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}
</script>

<template>
  <div class="app-shell">
    <header class="portal-header">
      <div class="brand">
        <div class="brand-main">
          <img
            src="/logo-datalab.png"
            alt="DataLab"
            class="logo-main"
          />

          <div class="brand-meta">
            <h1 class="brand-title">DataLab Portal</h1>
          </div>
        </div>
      </div>

      <div class="header-right">
        <slot name="headerActions" />

        <template v-if="username">
          <div class="user-chip">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="username || 'GitHub avatar'"
              class="user-avatar-image"
            />

            <div v-else class="user-avatar">
              {{ userInitial(username) }}
            </div>

            <div class="user-name">
              {{ username }}
            </div>
          </div>

          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('logout')"
          >
            Cerrar sesión
          </button>
        </template>
      </div>
    </header>

    <main class="layout-full">
      <section v-if="!username" class="landing-wrapper">
        <div class="landing-panel">
          <span class="landing-badge">Datalab</span>

          <p class="landing-description">
            DataLab Portal centraliza el acceso a entornos interactivos Jupyter
            desplegados sobre la infraestructura del IFCA. Accede a tus entornos interactivos de forma
            segura, reproducible y organizada.
          </p>


          <div class="landing-actions">
            <button
              type="button"
              class="btn btn-primary"
              @click="$emit('login')"
            >
              Entrar con GitHub
            </button>
          </div>
        </div>
      </section>

      <section v-else class="stack">
        <slot />
      </section>
    </main>

    <footer class="portal-footer">
  <div class="footer-inline">
    <div class="footer-text">
      DataLab @ IFCA · © 2026 Instituto de Física de Cantabria (CSIC-UC)
    </div>

    <div class="footer-logos">
      <img src="/logo-ifca.png" alt="IFCA" class="footer-logo" />
      <img src="/logo-csic.png" alt="CSIC" class="footer-logo" />
    </div>
  </div>
</footer>
  
  </div>
</template>