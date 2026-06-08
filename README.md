# DataLab portal starter

Starter monorepo para construir un portal customizado sobre `IFCA-datalab/datalab-api` con dos frontends paralelos:

- `apps/react-portal`: implementación en React + Vite + TypeScript.
- `apps/vue-portal`: implementación en Vue 3 + Vite + TypeScript.
- `packages/api-client`: cliente TypeScript compartido para la API.
- `packages/shared`: tipos y utilidades comunes.

## Qué cubre este starter

- listado de entornos desplegados
- listado de tipos de despliegue
- creación y borrado de JupyterHub por namespace
- arranque y consulta de servidor Jupyter por usuario
- gestión básica de token Bearer en frontend
- estructura preparada para integrar OIDC/Keycloak

## Requisitos

- Node.js 20+
- npm 10+

## Variables de entorno

### React (`apps/react-portal/.env`)

```bash
VITE_DATALAB_API_BASE_URL=http://localhost:8000
```

### Vue (`apps/vue-portal/.env`)

```bash
VITE_DATALAB_API_BASE_URL=http://localhost:8000
```

## Arranque

### Instalar dependencias

```bash
npm install
```

### Portal React

```bash
npm run dev:react
```

### Portal Vue

```bash
npm run dev:vue
```

## Siguiente paso recomendado

1. sustituir el login manual por OIDC con Keycloak
2. añadir un catálogo real de imágenes/perfiles de notebook
3. incorporar polling y logs del ciclo de vida del despliegue
4. añadir RBAC por rol y permisos de creación/borrado

La documentación funcional del starter está en `docs/FILES.md` y `docs/ARCHITECTURE.md`.
