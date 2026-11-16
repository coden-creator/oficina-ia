# Activación de propuestas de contenido

`deliverable: "idea"` usa los especialistas existentes: investigación con evidencia aportada, estrategia, guion, comité editorial (hasta dos correcciones) y dirección visual. Al terminar entra a revisión sin invocar narración, render ni QA de un video inexistente. No hay aprobación ni publicación automática.

El propietario puede crear una solicitud autenticada con `POST /api/video-workflows/:brand` y `deliverable: "idea"`, y activarla con el `POST /api/video-workflows/:brand/:id/run` ya existente. El coordinador debe estar habilitado. Ese activador guarda una autorización específica para esa idea; no habilita solicitudes históricas ni la producción de videos. Se recupera después de reiniciar. Una inferencia interrumpida conserva el bloqueo y no se repite por sí sola.

El historial compartido por marca incluye propuestas con estrategia aunque aún no tengan MP4, para que las siguientes puedan evitar repetir conceptos. La cuenta Codex existente realiza los textos. El activador solo aporta el pedido y hechos/recursos de marca ya disponibles; no introduce guiones ni sustituye resultados de especialistas.

La ficha muestra gancho, narración, storyboard, dirección de arte y evaluación. Permite pedir cambios o descartar. No se ofrece aprobar un archivo inexistente. Los conceptos nuevos todavía requieren resolver su producción audiovisual antes de generar un video.

Validación: 26 pruebas Node aprobadas; incluyen autorización puntual, recuperación, aislamiento por marca, no invocación de producción en modo idea y protección de videos normales. Chromium local: tres propuestas sintéticas, teclado, revisión en escritorio/móvil, cero errores JS. Las pruebas no acreditan ejecución real; el lote solicitado se registra por separado después de activarlo.


Primera ejecución real: las tres fichas se activaron. La primera completó investigación, estrategia y guion; después las solicitudes recibieron `ORGANIC_STAGE_FAILED`. El trabajador tenía un corte de 60 s y ocultaba el tipo de error. Se amplía a 180 s, con espera del socket de 210 s, y se exponen únicamente códigos locales permitidos. No se atribuye una causa definitiva a los primeros errores genéricos. El trabajador sigue limitado a 1 CPU/768 MiB, cuenta ChatGPT existente y sin herramientas externas.

Ajuste de presentación: los enfoques extensos se leen en «Enfoque elegido por la oficina»; el título conserva la identificación de la solicitud. No se reescriben resultados de los especialistas.
