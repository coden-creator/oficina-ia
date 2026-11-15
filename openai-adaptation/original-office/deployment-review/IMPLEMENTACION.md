# Entrega preparada: solicitudes y conexión privada de Codex

## Qué se implementó

El servidor web puede guardar solicitudes por marca en un volumen independiente y comunicarse con el proceso de especialistas mediante un socket Unix privado. El proceso de Codex conserva el inicio de sesión en otro volumen que el servidor web no monta. Solo se admiten consultas de estado y ejecución de etapas de video; no se expone el protocolo de Codex, login, shell ni configuración al navegador.

El flujo existente valida la salida de los especialistas, genera una animática silenciosa con FFmpeg, verifica el MP4 y exige aprobación de la revisión y hash exactos. Pedir cambios invalida la aprobación. Voz, pago y publicación siguen deshabilitados. El render actual es técnico: aún no equivale al estudio completo original ni a una pieza comercial aceptada.

## Archivos y pruebas

- `Dockerfile.runtime`: Codex y FFmpeg fijados, permisos de programa explícitos, directorios privados, comprobación de funciones durante construcción.
- `codex/broker.mjs`, `codex/start-broker.mjs`: proceso de especialistas y socket privado, sin puerto público.
- `video/remote-runner.mjs`: conexión desde el flujo web; un proceso desconectado no se anuncia disponible.
- `deployment-review/compose.review.yml`: propuesta para un stack NUEVO de revisión, con hostname independiente, volúmenes nuevos y etiquetas/red persistentes en el archivo. No adopta ni borra servicios de EasyPanel.
- `scripts/verify-runtime-container.sh IMAGE`: verificaciones sin red externa, cuenta ni inferencia real.
- `test/remote-runner.test.mjs`: comunicación real por socket, concurrencia, rechazo de configuración/API paga, generación de MP4, aprobación, revisión y persistencia. Las respuestas de especialistas en esa prueba son SIMULADAS.

Las etiquetas administradas manualmente por Docker no pueden garantizarse al actualizar un servicio App de EasyPanel. La propuesta conserva esos atributos en un stack controlado por el archivo Compose. No se debe lanzar el stack con el dominio actual mientras el servicio de EasyPanel lo atiende: primero validar con un dominio de revisión y después planificar el cambio y su vuelta atrás. No reiniciar ni modificar el Traefik compartido.

## Construcción reproducible

Desde `openai-adaptation/original-office`:

```bash
docker build -f Dockerfile.runtime -t oficina-runtime:review .
bash scripts/verify-runtime-container.sh oficina-runtime:review
```

Si la red de construcción usa una CA propia, se admite proporcionar el archivo de CA confiable únicamente durante la descarga, sin desactivar TLS:

```bash
docker build --secret id=npm_ca,src=/ruta/a/ca-confiable.crt -f Dockerfile.runtime -t oficina-runtime:review .
```

La CA no se copia en la imagen. No usar certificados desconocidos. El lock de npm conserva la integridad de los paquetes. Registrar el digest del resultado antes de implementarlo. No se afirma que todas las dependencias del sistema operativo sean reproducibles por snapshot.

## Parámetros de implementación (NO desplegados)

`compose.review.yml` requiere `OFFICE_IMAGE`, `OFFICE_HOST` (dominio de revisión), `OFFICE_NODE` (hostname del nodo) y `OFFICE_PASSWORD_SECRET` (secreto Docker independiente ya creado). El servicio web usa ese secreto; no escribir contraseñas en el repositorio ni en el chat. La imagen inicializa los volúmenes nuevos con UID1000. No cambiar permisos de volúmenes existentes sin inspeccionarlos.

Los límites máximos propuestos son 1 CPU/768MiB para la web/render y 1 CPU/768MiB para Codex, una réplica de cada uno. Deben comprobarse el uso global <70%, el límite de 5 CPU y los límites efectivos de Swarm en el VPS antes de habilitar el trabajador. Una lectura histórica de recursos no certifica capacidad futura.

Codex tiene cero réplicas por defecto. Las variables `OFFICE_CODEX_ISOLATION_VERIFIED=1` y `OFFICE_CODEX_REPLICAS=1` solo se aplican tras verificar en el VPS el montaje privado, los límites, la separación de credenciales y las restricciones efectivas. Algunas opciones de Compose pueden ser ignoradas por Swarm; inspeccionar el servicio resultante. Estas variables son declaraciones, no pruebas.

## Inicio de sesión oficial pendiente

Después de comprobar el entorno destino, Jorge debe completar el inicio de sesión oficial de Codex (por ejemplo `codex login --device-auth` si está disponible para su cuenta) usando únicamente el volumen privado del trabajador. Nunca copiar el login de este entorno de desarrollo, compartir auth.json o pedir tokens en el chat. La web no recibe esas credenciales. Hay que elegir un modelo que la cuenta permita en `OFFICE_CODEX_MODEL`; no deducir su identificador de los nombres del selector de esta conversación.

El trabajador arranca solo cuando están presentes el login oficial, el modelo y la autorización de activación. Rechaza cuentas de API y no tiene fallback pagado. La disponibilidad y los límites concretos del plan se comprueban con la primera solicitud auténtica; las pruebas sintéticas no los demuestran.

Si el socket quedó tras una caída, detener y verificar que no existe un trabajador activo antes de recuperar exclusivamente el socket. El programa no borra sockets o bloqueos de datos automáticamente. No montar el socket Docker en ninguno de los procesos.

## Pendiente para aceptar producción

- Primera conexión con la cuenta de Jorge y una generación real sin API de pago.
- Verificación de separación de procesos, red y permisos en el VPS real; las pruebas locales no sustituyen esa revisión.
- Integración visual completa del motor original, recursos autorizados de Glowfy/Velforce y revisión de calidad de Jorge.
- Cola durable con recuperación de trabajos interrumpidos y progreso visible; el flujo actual se ejecuta en la solicitud HTTP y requiere reintento manual tras una caída.
- Voz/música y publicación solo cuando existan permisos y conectores aprobados.

No presentar esta entrega como producción autónoma comercial terminada.

## Prueba reproducible de dos contenedores

```bash
python scripts/probe-separated-containers.py oficina-runtime:review
```

Este script crea contenedores y volúmenes NUEVOS con nombres aleatorios, sin red ni puertos públicos. Un especialista simulado sirve únicamente para comprobar el transporte. La oficina real crea la solicitud, genera y descarga el MP4, registra una aprobación de prueba y comprueba persistencia después de reiniciar. Comprueba también que el archivo ficticio del volumen privado del trabajador no sea visible desde la web y que los trabajos no sean visibles desde el trabajador. Al finalizar elimina solo los contenedores y volúmenes de esa prueba. No usa credenciales, datos de producción ni archivos de otras marcas.
