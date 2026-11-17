# Corrección de movimiento y montaje

Pedido de Jorge: los tres ejemplos con Astra tienen poco movimiento y transiciones deficientes; la mejora no alcanza sus referencias de Claude. La primera corrección se aplica a «La cita, por dentro» v2. El guion y la narración se conservan; no se generan recursos sonoros nuevos.

## Causa comprobada

El compositor anterior elegía una escena a cada instante y cambiaba directamente a la siguiente al comenzar otro segmento narrado. Los grafos podían animar grupos y objetos, pero no existía composición compartida durante la unión de escenas. La inspección interna recibía cuatro muestras por escena: servía para composición, pero era insuficiente para evaluar la continuidad temporal.

En el archivo v2, el muestreo de imagen a 12 fps detectó varias pausas con menos del 0,1% de cambios en el área de la historia, incluido 18,00–21,08 s. Esta medida incluye cámara, luces y sombras; no mide expresividad, no compara calidad con Claude y no implica que cualquier pausa sea incorrecta.

## Implementación

- Superficies originales de vectores/texto con perspectiva proyectada y canto, animación de inclinación y cámara determinista. Se conserva Canvas y sus dependencias actuales.
- Transformaciones y máscaras elegidas por el editor para combinar la escena saliente y la entrante. La transición pertenece al proyecto; no sustituye la acción de los objetos.
- Tres imágenes derivadas de las referencias se guardan en la ficha privada y llegan a dirección, montaje y autoría. No se incorporan al repositorio, al render ni a una biblioteca pública.
- La corrección de imagen guarda la versión anterior y la referencia al máster de voz. La producción exige recuperar esa voz y bloquea una síntesis nueva.
- Revisión separada de composición y de secuencias densas: 16 muestras por escena y ventanas de unión en pasos de 120 ms, además de diagnóstico de imagen a 12 fps. Continúan siendo muestras; no se atribuye escucha ni aprobación humana al modelo.

Cuarenta y siete pruebas pertinentes pasaron: veintiséis de autoría y coreografía, veinte de coordinación/recuperación y una de confinamiento del informe. Cubren proyección, transición, reanudación sin inferencia duplicada, referencias privadas y conservación de guion/voz/archivo. El resultado real y la decisión estética se documentan por versión y hash, por separado de estas pruebas.

Durante la prueba real, el pase de movimiento rechazó cambios de construcción entre planos y una pulsación demasiado sutil. Se detectó que el editor recibía sólo el primer hallazgo por escena y que faltaba el estado final actualizado de la escena anterior durante las correcciones. Se corrigen ambos: todos los hallazgos se transmiten juntos y la geometría anterior se proporciona en su pose final. La corrección temporal admite seis rondas persistidas, sin reiniciar el contador al reanudar; las producciones anteriores conservan el límite de cuatro. La ampliación cubre los hallazgos que se estaban omitiendo y sigue sujeta al uso incluido de la cuenta.

La recuperación del App también espera a que una inferencia anterior libere el trabajador, y las hojas densas reutilizan un lienzo aislado por escena para reducir memoria temporal. El reinicio observado durante la producción no tiene causa confirmada; no se atribuye automáticamente al despliegue ni a un agotamiento de memoria.

## Corrección del compositor de capas
La sexta ronda quedó bloqueada por transparencia incorrecta en el empalme final. Una prueba reproduce el defecto: el azul opaco RGB(0,0,255) se convertía en (111,39,183) al aplicar alpha a cada forma superpuesta. La transición ahora compone escenas completas sobre lienzos reutilizados; un fundido de cuadro completo mantiene el fondo saliente opaco. La prueba conserva el color exacto, y las 23 pruebas de autoría/coreografía/informe pasan.

La revisión `continuity-composite-v2` reutiliza la última geometría guardada de cada escena, conserva su procedencia, genera imágenes nuevas y exige dos inspecciones nuevas. No reutiliza el veredicto del compositor defectuoso. Admite como máximo tres correcciones adicionales persistidas; la tercera corrige ambos lados de un empalme pendiente. Reanudar no repite inferencias completadas. La voz sigue siendo el máster v2. Resultado final pendiente de ejecución real.

El último rechazo de composición se localizó en una varilla que cruza la opción «17:00» al inicio de la escena 4. La ventana densa confirma que el cruce comienza al final de la escena 3. La tercera y última corrección de esta revisión propaga hallazgos de empalme al plano saliente y al entrante, manteniendo intacta la selección de las rondas ya guardadas. No cambia ni fuerza un veredicto. Nueve pruebas de coreografía y quince de autoría/informe pasan; las veinte de coordinación anteriores no cambian.

## Flexión y posición compartida
La revisión posterior aprobó composición, pero volvió a rechazar movimiento: poca resistencia inicial, adelanto/detención del plegado y una tapa poco integrada. Se identifica que la capa entrante mostraba la pose futura antes de llegar a su tiempo. El compositor alinea transformaciones de actores/cámara con IDs, jerarquía y pose de empalme coincidentes, usando la pose del plano activo durante el fundido. Una prueba verifica que el actor futuro no aparece antes de su instante.

Se incorpora deformación de curvas mediante `d2` compatible y `tracks.morph`, con validación acotada de comandos/coordenadas. La prueba verifica flexión real y anclajes fijos. El editor recibe las últimas curvas del plano anterior y la secuencia densa cuando corrige movimiento, en lugar de sólo cuatro imágenes de composición. La revisión `continuity-kinematics-v3` conserva los diseños más recientes y los hallazgos anteriores como contexto, pero exige imágenes y veredictos nuevos. Tres rondas acotadas; no se fuerza aprobación ni se habilita síntesis de voz. Las 27 pruebas de autoría, coreografía e informe pasan; los controles previos de coordinación se conservan. La capacidad nueva requiere actualizar el contrato del trabajador privado y el App; resultado real pendiente.

La revisión cinemática real confirma flexión y continuidad en las tres uniones. La cuarta corrección queda limitada a los hallazgos nuevos del cierre: sostén de la petición y aparición tardía de CTA/logo. Conserva las tres escenas anteriores, la caché y el audio; cuatro correcciones como máximo, sin reiniciar el presupuesto al reanudar. No se cambia ningún veredicto.

## Primera exportación corregida y acabado del logo
La v3 completó composición, movimiento y exportación; SHA256 `66b342f8cce9de37c1843c0c5eb34464705ed3e9d85514a1f26f7cc017e2ed93`. Inspección del MP4 y reproducción/seek en escritorio y móvil comprobados. La música resultó A, una de las cuatro autorizadas, en lugar de la B anterior: no se afirma mezcla idéntica. La voz se recuperó de v2.

La inspección final localizó un logo estirado por el marco 300×100 frente a su proporción oficial 480×128. Se corrige el ajuste proporcional dentro del marco. El nuevo render reutiliza los cuatro grafos de la versión anterior, valida su hash de guion/plan/versión y procedencia, conserva voz y música real, y exige revisiones nuevas con imágenes nuevas. No se vuelve a diseñar la pieza para corregir el compositor. V4 pendiente de ejecutar.
