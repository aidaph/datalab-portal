# Definición de archivos y directorios

## raíz

- `package.json`: workspaces y scripts globales.
- `tsconfig.base.json`: configuración TypeScript compartida.
- `README.md`: guía rápida.
- `.vscode/`: configuración sugerida para VS Code.
- `docs/`: documentación funcional.

## apps/react-portal

- `package.json`: dependencias de React.
- `vite.config.ts`: configuración del servidor de desarrollo.
- `src/main.tsx`: punto de entrada.
- `src/App.tsx`: orquestación principal.
- `src/styles.css`: estilos globales.
- `src/components/PortalShell.tsx`: layout principal.
- `src/components/AuthPanel.tsx`: captura del token y sesión.
- `src/components/CreateEnvironmentForm.tsx`: formulario de creación.
- `src/components/EnvironmentList.tsx`: tabla y acciones.
- `src/lib/config.ts`: lectura de variables de entorno.

## apps/vue-portal

- `package.json`: dependencias de Vue.
- `vite.config.ts`: configuración del servidor de desarrollo.
- `src/main.ts`: punto de entrada.
- `src/App.vue`: contenedor principal.
- `src/styles.css`: estilos globales.
- `src/components/PortalShell.vue`: layout principal.
- `src/components/AuthPanel.vue`: captura del token y sesión.
- `src/components/CreateEnvironmentForm.vue`: formulario de creación.
- `src/components/EnvironmentList.vue`: tabla y acciones.
- `src/lib/config.ts`: lectura de variables de entorno.

## packages/api-client

- `src/index.ts`: cliente compartido de la API.

## packages/shared

- `src/index.ts`: tipos y normalizadores compartidos.
