# syntax=docker/dockerfile:1

# --- Build: Vite bakes the API URL into the bundle at build time -------------
FROM node:22-alpine AS build
WORKDIR /src

# Workspace manifests first, so `npm ci` is cached across source changes.
COPY package.json package-lock.json ./
COPY apps/react-portal/package.json apps/react-portal/
COPY packages/api-client/package.json packages/api-client/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY tsconfig.base.json ./
COPY apps/react-portal apps/react-portal
COPY packages packages

ARG VITE_DATALAB_API_BASE_URL=https://api.datalab.ifca.es
ENV VITE_DATALAB_API_BASE_URL=${VITE_DATALAB_API_BASE_URL}
RUN npm run build

# --- Runtime: static files on unprivileged nginx (port 8080) ----------------
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/react-portal/dist /usr/share/nginx/html
EXPOSE 8080
