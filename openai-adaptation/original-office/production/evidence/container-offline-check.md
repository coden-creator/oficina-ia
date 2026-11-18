# Evidencia de implementación local — 15 noviembre 2026

## Imagen

`Dockerfile.runtime` se construyó desde el lock oficial y las versiones fijadas, con la CA confiable del entorno proporcionada como secreto temporal de BuildKit (no se desactivó TLS ni se incluyó esa CA en la imagen).

Imagen de revisión final: `oficina-runtime:implementation-r1`, ID `sha256:da248f4a392dbc43ffa2ee565db92de679b7381eccf51c68034a7a3b1552d96a`. Este es un ID local, no un digest publicado en un registro. El VPS no se modificó.

Se corrigieron los permisos del directorio del programa para UID1000 y los directorios de volúmenes nuevos. La comprobación de las 23 funciones desactivadas pasó durante el build. Las bases y algunas dependencias del SO no están fijadas por snapshot; no se promete reproducibilidad bit a bit.

## Aislamiento: alcance de las pruebas

Contenedores locales con rootfs de solo lectura, red externa desactivada, 1 CPU, 512MiB, capacidades eliminadas y no-new-privileges. El app-server inicializó con `account:null`, sin login ni inferencia auténtica.

El modelo sintético en loopback permitió inspeccionar la lista de herramientas y enviar seis llamadas deliberadas: `request_user_input`, `view_image`, `shell`, `exec_command`, `apply_patch`, `unknown_tool`. Las llamadas fueron rechazadas y no revelaron el canario ni crearon el archivo de control. El endpoint simulado y las respuestas de prueba no se incluyen en la imagen de producción.

La prueba inicial de inventario exigía cero herramientas anunciadas. Se reemplazó ese criterio por comprobar ausencia de capacidades de lectura/ejecución y rechazo efectivo: `request_user_input` todavía aparece, pero Codex responde que no está disponible en modo Default, sin solicitar datos al usuario. Además, el transporte de la oficina rechaza solicitudes entrantes de herramientas/aprobación. La herramienta `view_image` fue desactivada explícitamente tras detectarla en la primera prueba.

Estos casos son evidencia limitada y reproducible, no una certificación universal del binario ni prueba del aislamiento del VPS. Se conserva `adversarialIsolationVerified:false` en la salida para evitar activar el trabajador automáticamente. No se realizó inferencia con cuenta real, no se midió cuota y no se probó el tráfico externo de autenticación. Los montajes, permisos y límites del destino deben verificarse antes de activar Codex.

## Flujo y servidor

La batería del proyecto pasó 91 pruebas, incluyendo conexión por socket, rechazo de configuración arbitraria y cuenta API, concurrencia, pérdida de conexión, MP4 real, aprobación por versión/hash y persistencia.

Una prueba adicional ejecutó la web y un trabajador simulado en contenedores separados, sin red. Se creó una solicitud, se produjo y descargó un MP4, se aprobó como dato de prueba y se conservó después de reiniciar el contenedor web. Las comprobaciones de volúmenes verifican que la web no ve el canario privado del trabajador y este no ve los trabajos de la web. Todo el contenido del modelo y la aprobación de esa prueba son sintéticos; no constituyen contenido o aprobación de Jorge.

Los resultados JSON de los controles de la imagen se guardan junto a este documento. Los scripts permiten repetir las pruebas en otro host. Falta el inicio de sesión oficial de Jorge, validar el modelo habilitado para su cuenta y el primer trabajo auténtico. El render es una animática técnica silenciosa, no la equivalencia comercial del estudio original.
