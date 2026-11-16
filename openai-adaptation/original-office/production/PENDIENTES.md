# Pendientes de desarrollo de la oficina de Jorge

Lista aportada por Jorge el 16 de noviembre de 2026. El orden siguiente es una propuesta de ejecución; los cuatro frentes siguen pendientes. No representa aprobación de identidades, contratación de servicios ni autorización para publicar.

## 1. Vistas previas en el Estudio

**Base existente:** la ficha reproduce el MP4 y el piloto permite alternar fragmento/completo. Las tarjetas de la grilla todavía usan un ícono genérico (`public/video-panel.js`).

**Entrega:** miniatura extraída del video de la versión actual, vista previa accesible desde la tarjeta y apertura de su ficha para aprobar, pedir cambios o descartar. Carga diferida; reproducción por acción del usuario, pausa al salir de la vista o cambiar de marca; estado claro cuando aún no hay archivo. Conservar un solo selector global de marca y evitar descargas simultáneas de todos los videos.

**Terminado cuando:** los videos existentes se reconocen desde la grilla; funcionan móvil y teclado, la miniatura coincide con la versión y ninguna respuesta tardía muestra contenido de otra marca.

## 2. Identidad visual de Velforce, Purify y GrupoQuiba

**Base existente:** separación de marcas y perfiles; producción audiovisual real verificada en Glowfy. No equivale a tener una dirección visual implementada para las otras marcas. GrupoQuiba figura actualmente en la interfaz como QUIBA (`quiba` internamente); conservar el identificador para no perder historial.

**Entrega por marca:** revisar logos/materiales existentes y fuentes autorizadas; desarrollar paleta, tipografía, composición, materiales, lenguaje de movimiento, cierres y guía audiovisual propios. Preparar un tablero visual y un fragmento representativo para revisión de Jorge. Reutilizar el motor y las bibliotecas compatibles, manteniendo una identidad diferenciada de Glowfy.

**Terminado cuando:** Jorge revisa la dirección propuesta y queda aplicada a un ejemplo real de esa marca, con recursos y procedencia registrados. Las nuevas generaciones pagadas requieren el alcance autorizado correspondiente.

## 3. Animaciones de los agentes

**Base existente:** equipo actualizado en `video/office-team.mjs`; `public/office-panel.js` y `public/officehq.js` reciben estados reales de la coordinación. Existen sprites heredados; el movimiento base no resuelve la actuación específica de cada rol.

**Entrega:** animaciones y accesorios por función: investigación, guion, selección creativa, tres puestos de edición, calidad y coordinación. Distinguir trabajando, esperando, bloqueado y pendiente de Jorge; mostrar de forma comprensible el traspaso de tareas. Respetar pausa, movimiento reducido y presupuesto de rendimiento.

**Terminado cuando:** una tarea real cambia la actuación del agente correcto y su inspector; sin movimiento que sugiera trabajo inexistente. Tres editores visuales no deben sugerir tres inferencias simultáneas si el trabajador las serializa.

## 4. Conexión con Metricool o Upload-Post

**Base existente:** el repositorio original contiene `../../../publicador.mjs`, configuración MCP de Upload-Post y lectura de agenda/métricas. En la adaptación, `../connectors/README.md` documenta contratos de publicación, todavía sin transporte conectado. No se encontró una integración Metricool equivalente en el código inspeccionado.

**Decisión pendiente:** comparar las cuentas/planes disponibles, acceso API, redes necesarias, programación, métricas y costos. Upload-Post es el primer candidato a evaluar por el código existente; la elección de proveedor sigue abierta. No heredar el perfil de Cresova ni las reglas originales de publicación automática.

**Entrega:** conexión segura desde la oficina, cuentas asociadas a cada marca, calendario y seguimiento de envíos. Jorge revisa el video exacto, texto, destino y horario antes de programar/publicar. Conservar el estado del envío y consultar al proveedor tras un resultado incierto para evitar duplicados.

**Terminado cuando:** una conexión real identifica la cuenta correcta; el flujo prepara una propuesta revisable y, únicamente con autorización específica de Jorge, una prueba confirma su estado en el proveedor. Aprobar el video no autoriza por sí solo su publicación.

## Referencias del estado actual

- [Piloto Glowfy y validación real](evidence/glowfy-cinematic-pilot-campaign.json).
- [Avance audiovisual de Glowfy](glowfy/PROGRESS.md).
- [Estándar audiovisual](ESTANDAR-AUDIOVISUAL.md).
- [Contratos de conexiones](../connectors/README.md).

Esta lista complementa los límites técnicos registrados: investigación externa, escenas nuevas por concepto y métricas aún requieren desarrollo; Junie y las funciones comerciales/administrativas siguen como etapas posteriores.
