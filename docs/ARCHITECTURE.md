# Arquitectura propuesta

## Objetivo del portal

El portal está pensado para un flujo simple y claro:

1. autenticarse
2. elegir un tipo de entorno
3. desplegar un JupyterHub en un namespace soportado por la API
4. arrancar el servidor Jupyter del usuario
5. abrir el enlace del entorno

## Capas

### 1. Presentación

Dos apps separadas:

- React para equipos que prefieren ecosistema React.
- Vue para equipos que prefieren composición y SFC.

Ambas comparten contrato de API, tipos y convenciones de carpetas.

### 2. Cliente compartido

`packages/api-client` encapsula:

- URL base
- cabeceras
- Bearer token
- parseo seguro de respuestas
- métodos alineados con los endpoints observados en la API

### 3. Dominio compartido

`packages/shared` centraliza:

- tipos de despliegue
- modelos de respuesta del portal
- helpers para normalizar respuestas no homogéneas

## Evolución recomendada

### fase 1
- usar este starter para validar UX
- fijar contrato real con OpenAPI exportado desde FastAPI

### fase 2
- integrar Keycloak/OIDC real
- crear vistas de estado, eventos y errores de despliegue
- añadir selección de perfiles de notebook e imágenes

### fase 3
- incluir observabilidad
- auditoría
- cuotas por usuario/grupo
- soporte multi-clúster
