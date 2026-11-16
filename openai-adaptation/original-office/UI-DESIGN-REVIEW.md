# Revisión de interfaz de la oficina

## Segunda intervención: estructura visual del sistema

Jorge amplió el alcance: mejorar la estructura visual de las pantallas existentes y después revisar su publicación. Esta intervención no despliega por sí sola.

Plan previo: conservar la identidad oscura de la oficina y el selector global. Usar fondo `#0d0e12`, superficies `#171a22`, divisores `#303644`, texto `#eef0f5`, secundario `#aeb7c7` y acento `#b7a3ff`. Tipografía del sistema existente; títulos de 30/24 px, texto de 15 px y metadatos de 13 px. Espaciado de 8/16/24/32 px. El énfasis visual se dedica a la pieza y su decisión; sin hero de marketing, cifras de rendimiento inventadas ni tarjetas idénticas para todo.

```text
Cabecera: oficina / marca                                  menú móvil
Navegación lateral       Estudio                    Nueva solicitud
                         Para revisar | En proceso | Archivo
                         Fichas reales de la marca / estado vacío

Ficha:                   vista del video | decisión y comentario
                         proceso y evidencia, desplegables
```

Inicio muestra los trabajos que necesitan una decisión y un resumen del circuito real. Estudio prioriza las piezas; el formulario pasa a un diálogo con contexto opcional. Marcas muestra el perfil que ya devuelve el backend. Calendario explica la conexión pendiente y no inventa publicaciones. Oficina conserva el escenario original con indicación de su carácter visual. Conexiones reúne los servicios con una misma estructura, destacando la configuración de ElevenLabs.

Revisión del plan: reemplazar seis pantallas por seis paneles decorativos no resolvería el problema. Por eso cada vista mantiene una tarea distinta, mientras comparte títulos, acciones, estados, espacios y tratamiento de errores. Los detalles técnicos se muestran al abrirlos; los límites que afectan una decisión siguen visibles.


## Resultado y validación de la segunda intervención

- Inicio prioriza la siguiente decisión y los trabajos recientes de la marca actual. Los nombres del circuito original se muestran como roles previstos, no como trabajadores ejecutándose.
- Estudio ofrece Para revisar / En proceso / Archivo / Todos, con cantidades de trabajos reales. La solicitud se abre aparte; objetivo y llamada a la acción primero, contexto y archivo de texto como opciones.
- La ficha reúne reproducción del archivo existente, aceptación por versión, comentario, cambios y descarte con motivo. Las pruebas técnicas mantienen su advertencia y no se presentan como videos comerciales. Proceso y procedencia se consultan en un desplegable.
- Marcas usa los perfiles del backend; Conexiones reúne la configuración de voz y el estado comprobado de Codex. Si falla la consulta, muestra Sin verificar. Calendario conserva su estado pendiente.
- Cabecera y navegación consistentes, un selector global, menú móvil, foco visible y enlace para saltar al contenido. El escenario original conserva sus archivos; se ocultan globos repetidos de chats inactivos y se añade pausa de animación.
- La carga compartida elimina consultas duplicadas entre Inicio y Estudio, descarta respuestas antiguas y rechaza resultados de otra marca. Los enlaces de ficha y filtro se pueden abrir directamente.

Verificación: 37 pruebas Node aprobadas para navegación, datos compartidos, shell, empaquetado, conexiones, importación y flujo HTTP. Las 18 pruebas de shell/navegación/datos se repitieron tras los últimos ajustes, también aprobadas. Pruebas Python del actualizador y del despliegue: 20 aprobadas; todo Docker/proveedor simulado. SHA256SUMS actualizado y verificado.

Chromium local autenticado, a 1440×1000, 390×844 y 320×844: seis rutas, selector único, protección de borrador, cambio de marca y recarga, nueva solicitud, aceptación de prueba, revisión que crea otra versión y descarte persistidos por el backend real de la adaptación. También se comprobó reproducción MP4, historial Atrás/Adelante de la ficha, cierre con Escape, salto al título por teclado, pausa con movimiento reducido, estado vacío y ausencia de desbordamiento horizontal. Sin errores JavaScript.

Las capturas contienen datos sintéticos identificados como prueba. El especialista y la verificación ElevenLabs se simularon localmente; no se consultaron proveedores ni se generó voz. Esto valida la interfaz y sus operaciones locales, no una producción audiovisual autónoma.

Revisión visual: se corrigieron filtros recortados a 320 px, nombre accesible del menú, foco en títulos ocultos del DOM original y una carrera al cerrar una ficha y abrir la siguiente durante la actualización. No se certifica accesibilidad completa del escenario canvas original. La gestión de recursos de marca y el departamento orgánico siguen pendientes de integración.

Publicación: código preparado en la rama recuperable de revisión. El actualizador incluye los nuevos módulos del navegador. Esta intervención no ejecuta el despliegue del VPS, conforme al pedido de mejorar primero la estructura y luego revisar su publicación. Las capturas son una vista local; la URL del VPS sigue mostrando su versión anterior.

## Historial: primera intervención, selección de marca

Pedido de Jorge: corregir duplicación y mal diseño en la interfaz existente. No sustituirlo por una propuesta de navegación nueva.

## Hallazgos

- `public/navigation.js`: selector global, tarjetas de marcas que también seleccionan y repetición del contexto en la barra lateral.
- `public/video-panel.js`: segundo selector independiente dentro del formulario; sincronización manual entre dos estados.
- `public/compat.css`: estilos separados para presentar la misma decisión de varias formas y reglas duplicadas para móvil.

## Plan visual antes de implementar

Se conserva la identidad oscura y la navegación actual. La intervención se concentra en un control reconocible, a la derecha de la identidad de la oficina. El formulario hereda ese contexto.

```text
Escritorio: [Oficina]  [Marca / Glowfy ▾]                    [fecha]
            navegación       contenido de la sección

Móvil:      [Oficina]  [Marca / Glowfy ▾]
            navegación y contenido
```

Paleta tomada de la interfaz: fondo `#0d0e12`, superficie `#15171d`, borde `#3b4150`, texto `#eef0f5`, secundario `#adb4c3`, foco `#b7a3ff`. Una tipografía heredada del sistema existente; etiqueta de 12 px, valor de 15 px, área táctil mayor de 44 px. Alineación izquierda, separación 8/16/24 px. No se descargan fuentes ni se añaden logos, gradientes, tarjetas de selección o animaciones.

Revisión del plan: inicialmente se planteó una maqueta más amplia. Se descarta ese alcance tras la aclaración de Jorge. El cambio útil es eliminar decisiones duplicadas y definir un contexto único, no decorar tres controles existentes.

## Comportamiento requerido

- Un único control visible y accesible para cambiar marca en cualquier ruta.
- El Estudio usa esa marca sin pedir seleccionarla de nuevo.
- Marcas conserva su función informativa; no ofrece otro selector.
- La selección se conserva entre rutas y al recargar mediante `?brand=...`.
- Con un borrador, cancelar el cambio conserva selección y campos. Aceptarlo limpia el borrador antes de cargar la nueva marca.
- Durante una operación, el selector queda temporalmente deshabilitado.
- Respuestas atrasadas y carga de archivos no pueden cruzar marcas, incluso si se vuelve rápidamente a la marca anterior.

## Skills incorporadas

- Anthropic `frontend-design`: dirección visual, jerarquía y autocrítica.
- Vercel `web-design-guidelines`: accesibilidad, interacción, formularios y revisión de código.

Instaladas para Codex dentro de `.agents/skills/`, con procedencia en `skills-lock.json`. Las instrucciones locales de `public/AGENTS.md` indican su aplicación en futuras modificaciones. No se han activado servicios de pago.

## Validación de esta revisión

- 32 pruebas Node aprobadas: navegación y estado compartido, empaquetado, shell autenticado, flujo HTTP, importación de material y Conexiones.
- Chromium a 1440, 390 y 320 px: un solo selector, sin desbordamiento horizontal, control de 56 px de alto y operación por teclado.
- Navegar y recargar conserva marca; cancelar el cambio conserva borrador; aceptarlo lo limpia. Una respuesta atrasada no cambia la marca visible. Guardar bloquea temporalmente el selector y envía la solicitud a la marca correcta.
- Capturas de escritorio y móvil inspeccionadas. Proveedores sin conexión en el entorno de prueba; no hubo inferencia, voz ni publicación.
- Cambios preparados en la rama de revisión, pendientes de desplegar.

## Pendientes detectados en la primera revisión

- Resuelto en la segunda intervención: disponibilidad compacta, etiquetas de estado en español y proceso técnico desplegable en `public/video-panel.js`.
- `public/navigation.js:11` y `public/compat.css:75` — selector unificado, nombre accesible, foco visible, estado deshabilitado y presentación móvil revisados.

## Tercera intervención: escritorio de Jorge y equipo operativo

Plan previo (16 noviembre): conservar la cabecera y el selector único. Inicio se organiza en decisiones, trabajo en marcha y asuntos que requieren atención. La oficina pasa a ser un estudio de contenido con Dirección, investigación/guion/comité, tres puestos de edición y QA; Comercial, Sistemas y Administración aparecen como departamentos previstos. El inspector de un agente explica responsabilidad y tarea, sin ofrecer chats inexistentes.

Paleta: tinta #0d0e12, superficie #171a22, borde #303644, texto #eef0f5, acento #b7a3ff y actividad #61c6ae. Tipografía del sistema: 30/24/16/13 px. La escena conserva personajes pixel art, con puestos y estados derivados de fichas reales. Solo el trabajo confirmado activa la animación de actividad; espera, pausa y bloqueo tienen señales distintas. El listado HTML equivalente funciona por teclado y en móvil.

```
Inicio        Necesita tu decisión | En marcha | Requiere atención
Oficina       Dirección / recorrido de contenido / tres editores / QA
              Departamentos previstos / inspector de rol y tarea
```

Revisión del plan: cinco oficinas iguales no comunican prioridades. El estudio de contenido recibe el espacio principal; los departamentos futuros se muestran con su alcance y sin actividad ficticia. No se habilita la prueba de producción ni se llama a ElevenLabs hasta el aviso de Jorge.

Resultado de la tercera intervención: escena nueva con ocho responsables y tres editores; se retiraron las salas antiguas de Ads, Prospección y chats ficticios. Las personas en espera permanecen en su puesto; monitores activos indican trabajo registrado. Un inspector accesible muestra rol, estado y enlace a la pieza. En móvil se usa el listado de roles en lugar de reducir el plano hasta hacerlo ilegible. Los departamentos futuros muestran su alcance, sin personajes simulando actividad.

Validación: Chromium autenticado local a 1440/390/320 px, seis rutas, decisiones de prueba, selector único, aislamiento de marca, borradores, reproducción de MP4 sintético, inspector de agente, trabajo simulado registrado, teclado, movimiento reducido y cero errores JavaScript. Se inspeccionaron capturas de Inicio, Oficina y móvil. Se evitó reconstruir las vistas en cada consulta cuando los datos no cambiaron, y el estado visual sigue actualizándose con la animación pausada. Los proveedores son simulados; no se usó ElevenLabs ni inferencia real. Ver `production/OFICINA-Y-AUTONOMIA.md` para límites de la coordinación y producción.

2026-11-16: la ficha muestra el paso observado de narración, animación o QA mientras se produce la primera prueba. El encabezado reconoce la prueba de Glowfy sin declarar disponibles las otras marcas. Sin nuevos selectores ni cambio de estructura. Pendiente comprobación del despliegue y reproducción de la primera pieza narrada.


## Biblioteca musical aprobada de Glowfy

Se incorpora un bloque desplegable en el Estudio, antes de los filtros de trabajos. Usa la paleta existente (#0d0e12, #171a22, #303644, #eef0f5, #aeb7c7, #c3afff), tipografía de la oficina y cuatro filas con nombre, reproductor y descarga; en móvil cada fila se apila. Se conserva la selección global de marca. No agrega tarjetas promocionales, animaciones ni nuevas conexiones.

La apertura directa utiliza `musica=1`. La biblioteca detiene el audio al cerrar, salir del Estudio o cambiar de marca; ignora respuestas tardías y conserva la vista durante el sondeo de trabajos. Los controles nativos tienen etiquetas y navegación por teclado. La selección de Jorge ya está registrada: no se vuelve a pedir elegir una sola favorita.

## Revisión de efectos por video

Bloque «Revisar los efectos de sonido» contiguo a la música. Conserva paleta, tipografía y selector global. Un video vertical y un índice desplazable de 36 botones ocupan dos columnas en escritorio y una en móvil; el efecto actual se destaca con color y `aria-current`. Controles nativos, foco visible, descarga y explicación A/B. No se reproduce automáticamente. La ruta `efectos=1` abre el bloque; cerrar, salir o cambiar de marca detiene el video, y las respuestas tardías se descartan.

Chromium local: 1440×1100 y 390×844, reproducción real, saltos a 1/12/36, descarga comprobada por SHA, teclado, cero errores JavaScript y sin desborde horizontal. Capturas de escritorio/móvil y 72 cuadros del MP4 revisados. El catálogo no afirma que los sonidos estén aprobados ni reparados; sirve para recibir la selección de Jorge.

Comprobación real posterior al despliegue: mismas pruebas y capturas de escritorio/móvil aprobadas técnicamente, 36 entradas, descarga íntegra y sin errores JavaScript. No hubo modificación de la pieza en revisión ni aprobación automática.

## Siete efectos regenerados

Se conserva la estructura de revisión existente: tinta #0d0e12, superficie #171a22, borde #303644, texto #eef0f5, acento #c3afff y tipografía del sistema. La comparación nueva abre primero, con título, A anterior/B nueva propuesta y siete entradas usando los números originales. Un enlace permite volver al catálogo completo de 36; la selección queda en la URL y no agrega otro selector de marca. Los controles, descarga y distribución móvil se reutilizan. Comprobación local: siete capítulos y vuelta al catálogo original, reproducción, descarga por SHA, teclado, marca única y móvil; capturas inspeccionadas. Despliegue real verificado: mismas comprobaciones y capturas inspeccionadas en escritorio y móvil; siete propuestas y catálogo original accesibles, sin errores JavaScript.

## Cuatro propuestas con SFX v3 y tres aprobadas

El mismo bloque abre la revisión 3, con los cuatro números pendientes y la comparación explícita v2/v3. Una línea conserva las tres aprobaciones de Jorge. Se mantienen video e índice, tipografía, paleta y único selector de marca. Dos enlaces de historial permiten abrir la revisión de siete y el catálogo original; la URL refleja cuál está abierto. Sin reproducción automática ni botón que consuma créditos. Comprobación local a 1440/390 px: capturas inspeccionadas, cuatro capítulos, descarga íntegra, historial de siete y 36, tres aprobaciones visibles, teclado, aislamiento de marca y cero errores JavaScript. Pendiente de comprobación real tras desplegar esta revisión.
