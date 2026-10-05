# DataLab Portal

Portal web (React + Vite + TypeScript, interfaz en inglés) para [`datalab-api`](https://github.com/IFCA-datalab/datalab-api) **0.2 o superior**.

- `apps/react-portal`: la aplicación.
- `packages/api-client`: cliente tipado de la API.
- `packages/shared`: tipos del contrato de la API y utilidades comunes.

## Qué hace

- Login con GitHub o SSO (Keycloak); cierre de sesión automático al caducar el token o recibir un `401`.
- Catálogo de entornos desde `/deployments/types`, con los no disponibles o ya desplegados deshabilitados.
- Creación asíncrona de JupyterHub: el portal muestra *Creando… → Listo / Error* y se actualiza solo mientras hay cambios en curso.
- Reintentar un despliegue fallido y eliminar entornos (solo quien lo creó o un administrador).
- Arrancar, detener y abrir tu servidor Jupyter en cada hub.
- Crear un clúster Kafka (número de brokers y contraseña opcional); la configuración de cliente se muestra una única vez.

## Requisitos

- Node.js 20+
- Una instancia de `datalab-api` con `CORS_ORIGINS` incluyendo la URL del portal.

## Configuración

`apps/react-portal/.env`:

```bash
VITE_DATALAB_API_BASE_URL=http://localhost:8000
```

En la API, `FRONTEND_URL` debe apuntar a este portal (por defecto `http://localhost:5173`).

## Arranque

```bash
npm install
npm run dev       # http://localhost:5173
npm run check     # typecheck de todos los paquetes
npm run build     # build de producción en apps/react-portal/dist
```

## Notas

- Tras el login la API devuelve el token en el fragmento de la URL (`#token=...`); el portal lo guarda en `localStorage` y limpia la URL. También acepta `?token=...` de versiones antiguas de la API.
- El nombre de usuario en cada hub lo indica la API en `/deployments/types` (`hub_username_claim`: el login de Keycloak en `ids`, el email en `ipcc`). Los hubs con `keycloak_only` solo se pueden usar entrando con SSO: con GitHub se muestran pero no se pueden arrancar servidores.
- Los tipos de `packages/shared` replican `datalab_api/schemas.py` de la API: si cambias uno, cambia el otro.
- `VITE_DATALAB_API_BASE_URL` se fija al construir: haz un `npm run build` por entorno.
