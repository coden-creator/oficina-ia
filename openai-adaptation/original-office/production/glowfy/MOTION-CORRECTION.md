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

Veintiuna pruebas pertinentes pasaron, incluidas proyección, transición, reanudación sin inferencia duplicada, referencias privadas y conservación de guion/voz/archivo. El resultado real y la decisión estética se documentan por versión y hash, por separado de estas pruebas.

Durante la prueba real, el pase de movimiento rechazó cambios de construcción entre planos y una pulsación demasiado sutil. Se detectó que el editor recibía sólo el primer hallazgo por escena y que faltaba el estado final actualizado de la escena anterior durante las correcciones. Se corrigen ambos: todos los hallazgos se transmiten juntos y la geometría anterior se proporciona en su pose final. La corrección temporal admite seis rondas persistidas, sin reiniciar el contador al reanudar; las producciones anteriores conservan el límite de cuatro. La ampliación cubre los hallazgos que se estaban omitiendo y sigue sujeta al uso incluido de la cuenta.
