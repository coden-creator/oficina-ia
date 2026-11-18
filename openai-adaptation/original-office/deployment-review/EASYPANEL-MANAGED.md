# Volver al App existente de EasyPanel

Jorge autorizó usar `service/oficina-jorge` y desplegarlo por MCP. Jorge pidió expresamente no hacer respaldos: el procedimiento reutiliza los datos existentes sin copiarlos. Esta entrega prepara la corrección del despliegue separado; no agrega permisos administrativos al trabajador de Codex.

## Resultado previsto

```text
Traefik existente → ruta fija pequeña → service/oficina-jorge (EasyPanel App)
                                             ├─ videos persistentes existentes
                                             ├─ conexiones cifradas
                                             └─ socket privado → trabajador Codex existente
```

La ruta fija conserva los dominios y se une a CodeNet y a `easypanel-service`. No depende de etiquetas ni de la conexión a CodeNet del App: EasyPanel puede reconstruir ese App sin perder su entrada HTTPS. No modifica el Traefik compartido ni la configuración de las redes. El dominio de revisión redirige las lecturas al dominio original; rechaza escrituras antiguas para no repetir acciones al trasladarlas.

El App mantiene el mismo nombre en EasyPanel. Se prepara `Dockerfile.easypanel`, que reutiliza la imagen local verificada `oficina-runtime:33a3edc` y copia el código web actual. No instala dependencias ni inicia sesión. El trabajador y su volumen de autenticación permanecen intactos. El antiguo servidor de revisión queda pausado, con configuración y datos conservados.

## Único paso inicial en el VPS

Desde un checkout fijado y verificado con `sha256sum --check --quiet SHA256SUMS`, ejecutar:

```bash
python3 -u scripts/prepare-easypanel-app.py
```

El procedimiento está limitado a recursos identificados por nombre y etiquetas. Comprueba límites, salud del trabajador, red y montajes; rechaza una migración si hay fichas en ejecución. Crea la ruta fija y verifica el certificado del origen conectando directamente al nodo con el hostname como SNI. Luego pausa el único escritor anterior para reutilizar el mismo volumen de videos. Prepara el almacenamiento de Conexiones y una llave privada; si existe una llave de la instalación anterior, la conserva, sin imprimirla ni rotarla.

La ruta tiene 0,1 CPU y 64 MiB, raíz de solo lectura, usuario 1000, capacidades retiradas, sin puertos publicados, credenciales, volúmenes privados ni socket Docker. El trabajo temporal de copia de llave usa como máximo 0,1 CPU y 64 MiB. El preflight cuenta ambos dentro del máximo total de 5 CPU y comprueba margen bajo el 70% del VPS. Son comprobaciones al ejecutar, no límites sobre el consumo de todos los otros servicios del servidor.

Durante la transición, la URL de revisión conduce a la oficina original; sus fichas quedan preservadas y se vuelven a mostrar al terminar el despliegue del App por MCP. Si falla la preparación y el App no cambió simultáneamente, se reactiva el servidor anterior y se retira únicamente la ruta nueva creada por esa transacción. Si el propietario cambió el App durante el proceso, se conserva el estado para evitar dos escritores. No borra servicios previos ni volúmenes. Un archivo privado `~/oficina-easypanel-handoff-r1.json` permite reconocer una preparación completada.

La salida final es JSON sin claves. Incluye los cuatro montajes reales que debe configurar el MCP y `readyForEasyPanel: true`. Ejecutar este procedimiento no termina por sí solo el despliegue de la nueva interfaz.

## Pasos siguientes por MCP, ya autorizados

1. Confirmar `readyForEasyPanel`, HTTPS de `/office-route-health`, revisión pausada, trabajador saludable y recursos actuales. Inspeccionar de nuevo `service/oficina-jorge`; reutilizar su configuración y variables actuales sin generar respaldos ni imprimirlas. No aplicar a otro App ni sustituir montajes desconocidos.
2. Establecer fuente GitHub `coden-creator/oficina-ia`, rama `codex/revision-visual`, raíz `/openai-adaptation/original-office`, y build Dockerfile `Dockerfile.easypanel`. Verificar antes que el HEAD de esa rama corresponde a la entrega probada. Mantener autoDeploy deshabilitado: cada despliegue por MCP lleva verificación de recursos.
3. Agregar exclusivamente los cuatro `bindMounts` de la salida del VPS, evitando duplicados. Reutilizan los videos y el socket; el cuarto monta solo el archivo de llave en `/run/secrets/office_connections_key`. El esquema actual de montajes App del MCP no expone la opción de solo lectura; no afirmar que los bind del App tienen esa protección. La sesión de Codex y el socket Docker nunca se montan en el App.
4. Conservar la contraseña y las variables existentes, agregando o reemplazando únicamente:

```dotenv
OFFICE_ORIGIN=https://service-oficina-jorge.flb2mp.easypanel.host
OFFICE_ENABLE_VIDEO_WORKFLOW=1
OFFICE_ENABLE_LOCAL_RENDER=1
OFFICE_VIDEO_DATA_DIR=/data/video
OFFICE_CODEX_SOCKET=/run/office/codex.sock
OFFICE_ENABLE_CONNECTION_SETTINGS=1
OFFICE_CONNECTIONS_DIR=/data/connections
OFFICE_CONNECTIONS_KEY_FILE=/run/secrets/office_connections_key
OFFICE_DEPLOYMENT_MARKER=<identificador de la entrega verificada>
```

5. Configurar una réplica, `zeroDowntime: false`, `capDrop: [ALL]`, comando por defecto de la imagen, 1 CPU/768 MiB y reservas 0,1 CPU/128 MiB. Conservar otros ajustes conocidos; no añadir capacidades. Desplegar con `deployAppService`, `forceRebuild: true`, mediante `execute_destructive` del MCP.
6. Confirmar el commit reportado por EasyPanel y el marcador de `/health`; revisar la interfaz autenticada, `/api/config`, las fichas de las cinco marcas y `/api/connections`. Codex debe aparecer conectado, las fichas deben conservar sus versiones y las conexiones deben indicar generación deshabilitada. No generar videos, verificar una API key externa, aprobar ni publicar como parte de esta migración.
7. Comprobar que el dominio original sigue funcionando después de ese Rebuild, y que la URL de revisión redirige al original. El servicio de revisión antiguo permanece pausado y recuperable; no eliminarlo en esta entrega.

Las operaciones de reemplazo/despliegue deben usar `execute_destructive`; `createMount` usa su operación no destructiva correspondiente. No usar un Box, scripts de contenedor, montajes del host o permisos de Docker como atajo para ejecutar operaciones administrativas que el MCP no expone.

## Publicaciones posteriores de código

Preparar y probar el cambio → guardar el commit recuperable → verificar recursos y fuente → ejecutar Deploy/Rebuild del mismo App mediante MCP → comprobar HTTPS, versión y funciones. La ruta fija no se reconstruye con cada cambio del producto. No se necesita repetir el login de Codex ni reponer etiquetas del App después de cada despliegue.

## Validación y límites

Validación local realizada:

- Ocho pruebas Node de ruta y empaquetado: autenticación, cuerpo y cabeceras, redirección, rechazo de destinos ajenos, caída del backend y transmisión de video.
- Diez pruebas Python de transición: límites, montajes, TLS directo al origen, reutilización de datos sin respaldos, conservación de llaves, reanudación y recuperación ante fallos. Simulan las respuestas de Docker; no prueban un Swarm remoto.
- Dos contenedores reales, en una red local sin salida externa: petición a través de la ruta, reinicio del App y recuperación del acceso, ficha persistente y almacenamiento cifrado de una clave sintética. No hubo inferencia, verificación de proveedor ni publicación.

Para la prueba local se sustituyó únicamente la imagen base por el runtime disponible `oficina-runtime:implementation-r1`; la ruta usó una imagen Node de prueba. El Dockerfile entregado conserva la imagen ya verificada en el VPS, `oficina-runtime:33a3edc`. La copia opcional de un secreto Swarm, la migración real y el Rebuild de EasyPanel requieren su comprobación en el VPS después del paso inicial. No presentar esta entrega preparada como despliegue terminado ni como producción audiovisual autónoma.
