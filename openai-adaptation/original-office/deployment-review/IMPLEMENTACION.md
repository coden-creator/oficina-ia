# Entrega preparada: solicitudes y conexión privada de Codex

## Estado verificado y siguiente despliegue — 15 noviembre 2026

**Estado actual comprobado:** trabajador `service/oficina-codex` en `codex/worker-r4` (`fc4e8b99b765aec87ead7988306e90a433e1621b`), saludable después de reiniciar y generar; web Swarm de revisión saludable. La sesión original se conservó. La ficha Glowfy `3c2cd214-41cf-4126-a41f-5d0647a7ad6c`, **versión 2**, completó las cinco etapas con Codex real y quedó en `awaiting_review`, sin aprobación ni publicación. El MP4 descargado tiene 256363 bytes y SHA256 `3cf27039185076ac8e7e36ba7266c6ef3ba18fe5fdc92367468afd15637fabde`; se verificaron hash, decodificación completa y tres fotogramas. Es una animática técnica silenciosa de 9 segundos, 360×640, H.264 a 30 fps. **Jorge rechazó su acabado visual** y fijó dos referencias como mínimo; se registró ese feedback en el repositorio, sin alterar la ficha viva. [Evidencia](../production/evidence/first-real-video.json).

**Cambio preparado, no desplegado:** el contrato HTTP nuevo exige `cresova-reference-v1` para solicitudes normales y no las sustituye por tarjetas mientras el motor audiovisual no esté integrado. La prueba de conexión pide explícitamente `technical-test`. Ver [directrices vigentes](../production/ESTANDAR-AUDIOVISUAL.md). El código de esta rama no cambia por sí solo la imagen fija `oficina-runtime:33a3edc`, los configs Swarm ni el trabajador congelado; no afirmar que ya está activo.

Acceso: `https://service-oficina-review.flb2mp.easypanel.host/#/estudio`, marca Glowfy. La versión 1 se conserva en el historial interno de la ficha; la revisión 2 se pidió explícitamente después de corregir la instrucción del revisor. El flujo normal volvió a ejecutar las etapas para esa nueva versión. No se habilitó un bucle de corrección automática ni se llamó al endpoint de aprobación. La oficina pública anterior, la red y el proxy compartidos permanecen independientes.

Los párrafos siguientes son el registro de diagnóstico y recuperación; sus estados pendientes anteriores no sustituyen el resultado comprobado de arriba.

Recuperación con `worker-r3` comprobada: el trabajador volvió a estar saludable y la web reconoció la cuenta. Se reanudó una vez la ficha original, preservando investigación, estrategia y versión. Codex completó guion y revisión creativa reales; el revisor pidió mover la tarjeta final a `closingScene`, aunque confirmó texto, tiempos y CTA correctos. Esa petición confundía el formato de respuesta del generador con el formato canónico que el trabajador ya había normalizado. `worker-r4` separa las instrucciones por etapa y explica al revisor y al director de arte que los guiones guardados tienen todas las tarjetas en `script.scenes`. No fuerza un veredicto favorable. La versión 1 se conserva; una revisión explícita por el flujo normal permite volver a evaluar con la instrucción corregida. Este cambio todavía necesita comprobar el MP4 real.

Diagnóstico del reinicio confirmado por Jorge: el socket no existe y el HOME contiene `.sandbox_migration` y `.sqlite-maintenance.lock`. Ambos son archivos oficiales de la CLI fijada: `execpolicy/src/sandbox_migration.rs` escribe el marcador `v1\n`, y `state/src/runtime/reclamation.rs` abre el archivo de bloqueo para mantenimiento SQLite. Nuestra lista permitida anterior rechazaba esos dos nombres y reproducía `HOME_NOT_CLEAN` después del primer uso real. `codex/worker-r3` admite únicamente esos nombres como archivos regulares; conserva el rechazo de enlaces, tipos incorrectos, configuraciones, plugins y entradas desconocidas. No elimina ni modifica archivos de sesión y no cambia límites, herramientas o permisos. Incluye la corrección del guion y los códigos seguros de arranque ya preparados. Evidencia: `production/evidence/post-turn-home-regression.json`. La recuperación real se comprobará después de aplicar esta entrega; los registros de incidente que siguen describen lo ocurrido antes de ella.

Actualización tras ejecutar la entrega web: Jorge verificó HTTPS del origen y la web confirmó `officeConnected:true`. La ficha Glowfy `3c2cd214-41cf-4126-a41f-5d0647a7ad6c`, versión 1, completó **research y strategy con Codex real**, y se detuvo en `script` con `INVALID_SPECIALIST_OUTPUT`. No produjo MP4 ni recibió aprobación. Los datos permanecen en el volumen nuevo; no repetir el instalador para intentar generar otra ficha.

La entrega `codex/worker-r2` ajusta el contrato de salida del especialista: la tarjeta de cierre va en `closingScene` con la CTA exacta impuesta por el esquema, y se ordena después de las tarjetas anteriores para formar el mismo guion canónico. No se recorta, sustituye ni agrega texto generado por fuera de la respuesta del modelo. El esquema también restringe identificadores de evidencia y veredictos por etapa. La validación local conserva sus reglas y devuelve códigos finitos por regla fallida, sin contenido del modelo, rutas o credenciales. La respuesta inválida de la primera prueba no se conservó, por lo que no se afirma cuál de esas reglas específicas había incumplido.

`OFFICE_WORKER_RELEASE=specialist-output-v2` obliga a Compose a recrear únicamente el trabajador al cambiar la referencia fijada. Imagen, volúmenes, aislamiento, modelo y comprobación de uso incluido se conservan. Tras comprobar su salud, reanudar una vez la ficha existente por `/run`; el flujo conserva investigación, estrategia y versión. No hay reparación automática ni nuevos turnos ocultos. La prueba de regresión reproduce un cierre inválido, lo corrige en una segunda solicitud explícita y comprueba MP4 y revisión humana pendiente sin repetir las dos etapas anteriores.

Incidencia de reinicio: EasyPanel aceptó la entrega `worker-r2` (`122aae22498b6fd4b2967b032c2132650b68a0a5`), pero el trabajador no quedó en ejecución. Se intentó recuperar con la referencia previa `worker-r1` y tampoco apareció un contenedor activo; la fuente quedó en `worker-r1`. La web de revisión permanece saludable y la ficha no se reintentó. El MCP de logs devuelve HTTP 400, por lo que se solicitó a Jorge estado/logs del contenedor y únicamente nombres de entradas del volumen privado para diagnosticar, sin leer credenciales ni eliminar el socket. No atribuir aún el fallo a un archivo o al socket sin esa evidencia. Esta rama prepara códigos de arranque explícitos y permitidos; no relaja la validación del HOME ni los límites y todavía no se ha desplegado ese diagnóstico.

Jorge completó el login oficial en `oficina-jorge-codex-auth`. Su diagnóstico real devolvió cuenta ChatGPT, uso incluido permitido y modelo predeterminado `gpt-6.1-sol`, sin inferencia ni créditos canjeados. El trabajador privado `service/oficina-codex` se desplegó mediante EasyPanel desde la referencia fijada `codex/worker-r1` (`4314ffc3b2f918ee84ba1c6e7c123e5e1849965b`); Docker lo reportó **healthy**, con el socket en `oficina-jorge-codex-ipc-r1`. Esto acredita conexión de cuenta y comprobaciones de aislamiento, no un video generado.

La web de revisión necesita **Swarm**: Jorge verificó `CodeNet: driver=overlay scope=swarm attachable=false`. El intento de web mediante Compose nativo no pudo conectar esa red y quedó deshabilitado en EasyPanel, sin contenedores en ejecución. No cambiar la red compartida ni activar otra vez ese intento. La oficina pública `service_oficina-jorge` sigue independiente.

La entrega vigente para conectar la web es `stack.review-web.json` con `scripts/deploy-review-office.py`. Se ejecuta desde la consola del VPS en un checkout fijado:

```bash
python3 scripts/deploy-review-office.py --test-video
```

El script usa únicamente Docker y Python 3 estándar. Crea el stack nuevo `oficina_codex_review_r1`, en el nodo donde existe el trabajador, con el dominio `https://service-oficina-review.flb2mp.easypanel.host`. Conserva las etiquetas del router y `CodeNet` en el manifiesto Swarm. No reconstruye la imagen ni modifica la oficina original, el trabajador, su login o el proxy compartido.

Primero despliega una página sin credenciales ni volúmenes privados. Verifica desde el VPS el certificado del origen y un identificador único de esa revisión mediante HTTPS directo, sin proxy de entorno, redirecciones ni desactivar TLS. Solo después usa la contraseña ya configurada en la oficina existente y crea un secreto Docker independiente por entrada estándar. No imprime la contraseña ni la escribe en Git, argumentos de comandos o archivos temporales. El acceso de la revisión sigue siendo usuario `jorge` y la contraseña que ya tiene la oficina.

La web monta solamente el socket (volumen de solo lectura) y el volumen persistente nuevo `oficina-jorge-videos-review-r1`; **no monta el login de Codex**. Usa raíz de solo lectura, UID1000, ninguna capacidad Linux, máximo 1 CPU/768 MiB, y no publica puertos fuera de Traefik. El trabajador mantiene sus límites propios y Compose nativo, que sí aplica `NoNewPrivs` y el límite de procesos. No convertir el trabajador a Swarm.

Antes de desplegar, el script comprueba recursos, deja margen para web/trabajador bajo el 70% del VPS y exige máximo 5 CPU declaradas entre los servicios de oficina. Es una comprobación de capacidad al ejecutar, no un control continuo del uso global de otros servicios. No adopta recursos ajenos con nombres coincidentes ni borra datos para recuperarse de errores. Si se interrumpe, conserva recursos; al repetir reconoce sus recursos por etiqueta y no vuelve a desplegar una web ya conectada.

Con `--test-video`, solicita una sola animática interna de Glowfy, usando exclusivamente el plan conectado. Verifica la procedencia de las cinco etapas de Codex, QA técnico y descarga autenticada/hash del MP4. **No aprueba, programa ni publica la pieza.** Si la revisión creativa pide cambios o una etapa falla, conserva la ficha y muestra ese estado. Una segunda ejecución identifica la ficha existente y no repite automáticamente inferencia. Sin ese argumento solo verifica la conexión. Si se perdió la respuesta durante la generación, consultar la ficha antes de reintentar desde la interfaz.

Validación local de esta entrega: 15 pruebas Python de despliegue/TLS/idempotencia sin VPS, 9 pruebas Node de HTTP/socket/MP4 con especialistas simulados 7 pruebas de autenticación de la web y validación de ambos manifiestos mediante `docker stack config`. Dos contenedores locales con el socket montado de solo lectura en la web generaron y descargaron un MP4 con especialista simulado y conservaron su ficha tras reiniciar la web. Ver `production/evidence/review-web-checks.json`. La web Swarm real, su certificado, el almacenamiento en el VPS y la primera inferencia quedan pendientes de ejecutar este procedimiento. Un MP4 técnico válido tampoco acredita calidad comercial ni aceptación visual de Jorge.

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

En el VPS compartido, usar un constructor independiente limitado a 1 CPU y 1 GiB, después de comprobar el consumo global. No cambiar el constructor predeterminado ni reconstruir el servicio público de EasyPanel:

```bash
docker buildx create --name oficina-codex-builder --driver docker-container \
  --driver-opt cpu-period=100000 --driver-opt cpu-quota=100000 --driver-opt memory=1g
docker buildx build --builder oficina-codex-builder --load \
  -f Dockerfile.runtime -t oficina-runtime:jorge .
docker buildx stop oficina-codex-builder
bash scripts/verify-runtime-container.sh oficina-runtime:jorge
```

Se necesita Docker Buildx en la consola del VPS (`docker buildx version`). Si ya existe ese constructor, inspeccionarlo y verificar sus límites antes de reutilizarlo. No eliminar constructores ajenos. La construcción y las pruebas no inician sesión ni consumen inferencia.

Si la red de construcción usa una CA propia, se admite proporcionar el archivo de CA confiable únicamente durante la descarga, sin desactivar TLS:

```bash
docker build --secret id=npm_ca,src=/ruta/a/ca-confiable.crt -f Dockerfile.runtime -t oficina-runtime:review .
```

La CA no se copia en la imagen. No usar certificados desconocidos. El lock de npm conserva la integridad de los paquetes. Registrar el digest del resultado antes de implementarlo. No se afirma que todas las dependencias del sistema operativo sean reproducibles por snapshot.

## Parámetros de implementación

### Trabajador privado administrable con EasyPanel

`compose.codex-worker.yml` activa solamente el trabajador, sin dominio ni puertos publicados. Reutiliza `oficina-runtime:33a3edc` y el volumen de login externo `oficina-jorge-codex-auth`. El adaptador, la validación del HOME, el arranque, la comprobación del contenedor y el especialista se montan como archivos de código de solo lectura desde una revisión fijada del repositorio. Así incorpora la comprobación de uso incluido sin otra construcción de la imagen.

El modelo inicial es `gpt-6.1-sol`. El socket queda en el volumen `oficina-jorge-codex-ipc-r1`; la oficina deberá montar ese mismo volumen para conectarse. El trabajador no monta el almacén de videos ni publica HTTP. Su comprobación de salud consulta la cuenta a través del socket privado, sin generar contenido. `healthy` acredita que arrancó y reconoce la cuenta, no una inferencia completada.

Antes de leer las credenciales, `codex/worker-isolation.mjs` comprueba el UID, raíz de solo lectura, ausencia de capacidades, `NoNewPrivs` y los límites efectivos de cgroups: máximo 1 CPU, 768 MiB y 128 procesos. Después comprueba permisos de los directorios privados y del archivo de sesión. La declaración `OFFICE_CODEX_ISOLATION_VERIFIED=1` no evita estas comprobaciones. El despliegue requiere Docker Compose; no convertirlo a Swarm ignorando opciones de seguridad.

En EasyPanel, usar un servicio Compose nuevo, proyecto `service`, nombre `oficina-codex`, origen Git del repositorio, una referencia de entrega fijada, raíz `/openai-adaptation/original-office` y archivo `deployment-review/compose.codex-worker.yml`. Verificar recursos globales antes de crearlo. No reutilizar ese nombre si ya pertenece a otro servicio. La oficina pública anterior sigue siendo un despliegue independiente.

### Stack de revisión original — propuesta histórica, no ejecutar

`compose.review.yml` es la propuesta anterior con ambos procesos. Fue sustituida por el trabajador Compose independiente y `stack.review-web.json`, que reutiliza su socket. `compose.review-bootstrap.yml` también es histórico: Compose nativo no puede adjuntarse a la red CodeNet actual. No ejecutar estas propuestas junto con la entrega vigente ni duplicar trabajadores.

`compose.review.yml` requiere `OFFICE_IMAGE`, `OFFICE_HOST` (dominio de revisión), `OFFICE_NODE` (hostname del nodo), `OFFICE_PASSWORD_SECRET` (secreto Docker independiente ya creado) y `OFFICE_AUTH_VOLUME` (volumen privado creado por el login oficial). El servicio web usa el secreto de acceso, pero no monta el volumen de Codex. No escribir contraseñas en el repositorio ni en el chat. La imagen inicializa los volúmenes nuevos con UID1000. No cambiar permisos de volúmenes existentes sin inspeccionarlos.

Los límites máximos propuestos son 1 CPU/768MiB para la web/render y 1 CPU/768MiB para Codex, una réplica de cada uno. Deben comprobarse el uso global <70%, el límite de 5 CPU y los límites efectivos de Swarm en el VPS antes de habilitar el trabajador. Una lectura histórica de recursos no certifica capacidad futura.

Codex tiene cero réplicas por defecto. Las variables `OFFICE_CODEX_ISOLATION_VERIFIED=1` y `OFFICE_CODEX_REPLICAS=1` solo se aplican tras verificar en el VPS el montaje privado, los límites, la separación de credenciales y las restricciones efectivas. Algunas opciones de Compose pueden ser ignoradas por Swarm; inspeccionar el servicio resultante. Estas variables son declaraciones, no pruebas.

## Inicio de sesión oficial y verificación posterior

En la inspección del 15/11/2026, la oficina visual instalada en EasyPanel usaba el Dockerfile básico y no tenía un trabajador ni un volumen privado de Codex. No ejecutar el login dentro de ese contenedor. Después de construir y verificar `Dockerfile.runtime` en el VPS, desde `openai-adaptation/original-office` ejecutar:

```bash
bash scripts/login-codex.sh oficina-runtime:jorge oficina-jorge-codex-auth
```

El script crea un contenedor temporal de esa imagen, con UID1000, 1 CPU y 512 MiB, sin puertos publicados. Monta únicamente el volumen de autenticación en `/home/node/codex-isolated` y ejecuta el login oficial `codex login --device-auth`. Jorge abre el enlace oficial mostrado en su navegador y autoriza su cuenta. Si el flujo de dispositivo no está habilitado para su cuenta, resolver esa opción en la configuración oficial de Codex; no sustituirlo por una API de pago. La sesión queda en el volumen al terminar y eliminarse el contenedor temporal. `codex login status` comprueba el resultado sin ejecutar un modelo. El script se detiene ante un volumen existente que no tenga su etiqueta `office.purpose=jorge-codex-auth`.

Para el despliegue posterior, configurar `OFFICE_AUTH_VOLUME=oficina-jorge-codex-auth` y fijar el trabajador al mismo nodo del VPS. El volumen es externo: Compose no crea silenciosamente otro volumen vacío para la sesión. Completar el login no conecta por sí solo la oficina pública ni activa el trabajador.

Nunca copiar el login de este entorno de desarrollo, compartir códigos, auth.json o pedir tokens en el chat. La web no recibe esas credenciales. Hay que elegir un modelo que la cuenta permita en `OFFICE_CODEX_MODEL`; no deducir su identificador de los nombres del selector de esta conversación.

El trabajador arranca solo cuando están presentes el login oficial, el modelo y la autorización de activación. Rechaza cuentas de API y no tiene fallback pagado. La disponibilidad y los límites concretos del plan se comprueban con la primera solicitud auténtica; las pruebas sintéticas no los demuestran.

Después del login, se puede consultar la cuenta y el catálogo sin generar contenido ni reconstruir la imagen existente:

```bash
bash scripts/check-codex-account.sh oficina-runtime:33a3edc oficina-jorge-codex-auth
```

El diagnóstico usa `account/read`, `model/list` y `account/rateLimits/read` del protocolo oficial. Devuelve únicamente el tipo de cuenta, plan, identificadores públicos de modelos y campos seleccionados de uso. No devuelve correo, identificador de cuenta, tokens, saldo ni datos de créditos de reinicio. No llama `thread/start`, `turn/start` ni operaciones de canje. Usa el volumen existente identificado por su etiqueta y monta el diagnóstico y su validación actualizada como código de solo lectura. No conecta la oficina ni cambia el servicio público.

Corrección de `HOME_NOT_CLEAN`: el login oficial fijado crea `auth.lock`, `auth.json.lock` y las carpetas `log` y `tmp`, comprobado con un contenedor sin red y sin credenciales. La validación anterior solo se había contrastado con el arranque sin login del app-server y rechazaba esos archivos. Ahora admite esos nombres y el archivo oficial `models_cache.json`; conserva el rechazo de enlaces simbólicos, tipos incorrectos, configuraciones, plugins y entradas desconocidas. No se eliminan archivos ni se copia la sesión. Para que el diagnóstico funcione con la imagen anterior, su script monta también `codex/chatgpt-runtime.mjs` actualizado como código de solo lectura. El trabajador incorpora la misma corrección mediante una imagen reconstruida o los archivos versionados de `compose.codex-worker.yml`.

El adaptador actualizado comprueba `ordinaryUsageAllowed === true` antes de cada turno. Si el backend no confirma el uso incluido, o la consulta falla, no envía el turno. Un saldo de créditos o un porcentaje bajo no sustituye esa confirmación. Esta señal está documentada en el esquema generado por la CLI fijada; no habilitamos recuperación automática por otro modelo ni canje de créditos. El control depende de la respuesta del proveedor y no configura la facturación de la cuenta. Este cambio no está en la imagen anterior `oficina-runtime:33a3edc`; necesita una imagen reconstruida o el montaje explícito del adaptador actualizado previsto en `compose.codex-worker.yml`.

Las pruebas del control de uso y del filtrado del diagnóstico están en `../test/included-usage.test.mjs`. Son pruebas de protocolo simuladas; el diagnóstico ejecutado por Jorge en el VPS aporta la comprobación de su sesión real.

Si el socket quedó tras una caída, detener y verificar que no existe un trabajador activo antes de recuperar exclusivamente el socket. El programa no borra sockets o bloqueos de datos automáticamente. No montar el socket Docker en ninguno de los procesos.

## Pendiente para aceptar producción

- Revisión visual y aceptación de Jorge de la primera animática real; ampliar la prueba a contenido autorizado de Glowfy/Velforce.
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
