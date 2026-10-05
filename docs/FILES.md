# Definición de archivos y directorios

## raíz

- `package.json`: workspaces y scripts (`dev`, `build`, `check`).
- `tsconfig.base.json`: configuración TypeScript compartida.
- `README.md`: guía rápida.
- `.vscode/`: configuración sugerida para VS Code.
- `docs/`: documentación funcional.

## apps/react-portal

- `vite.config.ts`: configuración del servidor de desarrollo.
- `src/main.tsx`: punto de entrada.
- `src/App.tsx`: orquestación principal (pestañas, diálogos).
- `src/styles.css`: estilos globales.
- `src/lib/config.ts`: lectura de variables de entorno.
- `src/lib/deployments.ts`: catálogo local de respaldo, etiquetas, iconos y mensajes de error.
- `src/hooks/useAuthSession.ts`: login OAuth, token, `/users/me`, caducidad y logout.
- `src/hooks/useEnvironments.ts`: estado de entornos, servidores y Kafka; polling y acciones.
- `src/hooks/useToasts.tsx`: avisos.
- `src/components/PortalShell.tsx`: layout y pantalla de login.
- `src/components/EnvironmentList.tsx`: lista de hubs y Kafka con sus acciones.
- `src/components/DeploymentPicker.tsx`: selección de tipo y formulario de Kafka.
- `src/components/KafkaCredentialsDialog.tsx`: muestra una única vez la configuración de cliente Kafka.
- `src/components/ConfirmDialog.tsx`, `src/components/Toaster.tsx`: UI común.

## packages/api-client

- `src/index.ts`: cliente tipado de la API (`DatalabApiClient`, `DatalabApiError`).

## packages/shared

- `src/index.ts`: tipos del contrato de la API y helpers (`isTransient`, `canManage`, `hubUsername`).
