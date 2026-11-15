# Clave de ElevenLabs desde Conexiones

La oficina incorpora un campo de contraseña y los botones **Guardar clave** y **Verificar conexión**. La clave se envía únicamente al backend autenticado de la oficina. Nunca se devuelve al navegador ni se guarda en localStorage/sessionStorage. Una clave guardada se representa mediante una máscara fija.

El backend guarda un registro AES-256-GCM en un volumen privado, usando una llave maestra de 32 bytes suministrada por un secreto separado de Docker Swarm. Exige directorio privado y archivos del usuario del servicio; rechaza enlaces simbólicos y registros alterados. Las actualizaciones son atómicas. El volumen y el secreto deben conservarse juntos para recuperar la configuración; el secreto nunca se rota automáticamente.

La verificación hace solamente `GET https://api.elevenlabs.io/v1/user`, con tiempo y respuesta acotados, sin seguir redirecciones. Solo devuelve verificada / rechazada / permisos insuficientes / fallo temporal; no devuelve datos personales del proveedor. La clave necesita `User: Read` para esa comprobación. Guardar no llama al proveedor. Verificar no sintetiza audio.

## Estado de integración

- Código y pruebas locales: guardar, reemplazar, verificar, persistencia, protección de rutas y revisión en navegador.
- Proveedor simulado en pruebas; no se ha probado una clave real ni generado voz.
- Generación de voz, autorización de créditos y conexión al montaje audiovisual siguen pendientes. Una clave verificada no equivale a video listo.
- Este cambio no modifica el login de Codex ni su volumen privado.

## Activación en la web de revisión existente

Desde un checkout fijado y verificado, en el VPS:

```bash
cd openai-adaptation/original-office
sha256sum --check --quiet SHA256SUMS
python3 -u scripts/update-review-connections.py
```

El actualizador se limita a `oficina_codex_review_r1_office`. Verifica la propiedad, aislamiento, recursos y HTTPS del servicio existente; guarda una copia privada de su especificación; conserva red, etiquetas del proxy, acceso, videos y socket. Crea únicamente el volumen `oficina-jorge-connections-r1` y el secreto `oficina-jorge-connections-key-r1`, más configs inmutables del código web. No reconstruye la imagen, reinicia el trabajador, ejecuta inferencia ni introduce una API key. La actualización es `stop-first` con reversión de Swarm si falla la tarea; puede haber una breve interrupción de la web de revisión.

Al finalizar, entrar en `https://service-oficina-review.flb2mp.easypanel.host/#/conexiones` y guardar la API key allí. No ponerla en comandos, Git ni mensajes.

Variables del backend: `OFFICE_ENABLE_CONNECTION_SETTINGS=1`, `OFFICE_CONNECTIONS_DIR=/data/connections`, `OFFICE_CONNECTIONS_KEY_FILE=/run/secrets/office_connections_key`. Sin habilitación explícita, el formulario informa que el almacenamiento no está disponible.

Se permite una réplica y no se elimina automáticamente un bloqueo de escritura que haya quedado tras una caída durante una operación. La recuperación requiere comprobar que no haya ningún escritor activo antes de retirar ese bloqueo; la configuración cifrada se conserva. No borrar el volumen ni crear otra llave para intentar resolverlo.

El actualizador está preparado para revisión, con pruebas de precondiciones y argumentos Docker; la ejecución en el VPS debe comprobarse por su salida. No se declara desplegado solo por haber pasado pruebas locales.
