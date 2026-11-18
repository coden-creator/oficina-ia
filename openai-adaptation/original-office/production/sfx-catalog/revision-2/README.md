# Siete efectos regenerados para Glowfy

Jorge señaló estos efectos del catálogo original y pidió regenerarlos:

| Número | Archivo | Dirección de la nueva propuesta |
|---|---|---|
| 13 | clic-boton-02 | Presión y liberación de un botón físico, contacto seco de plástico. |
| 16 | destello-particulas-01 | Campanilla breve de cristal con caída brillante. |
| 17 | destello-particulas-02 | Barrido ascendente breve de pequeñas campanillas de vidrio. |
| 22 | golpe-grave-02 | Un golpe redondo de bombo grave, seco y corto. |
| 31 | teclas-suaves-01 | Ráfaga breve de tecleo suave de laptop. |
| 33 | tick-cursor-01 | Contacto pequeño de madera, acortado a 160 ms. |
| 34 | tick-cursor-02 | Contacto pequeño de vidrio, acortado a 160 ms. |

Una nueva generación completada por efecto, con `eleven_text_to_sound_v2`, influencia 0,8 y sin loop. Se usó el conector ElevenLabs ya autorizado; solo se enviaron descripciones de sonidos. No se subieron referencias ni se generó voz o música. Estimación del proveedor: 66,55 créditos; suma reportada por las siete generaciones completadas: 20,16465 créditos. La primera ejecución de tick-cursor-01 falló por una transacción del proveedor, sin sesión ni generación; se inspeccionó el nodo vacío y se ejecutó solo ese pendiente. No se repitieron los otros seis.

`originals/` conserva los MP3 obtenidos y su procedencia. `prepared/` contiene WAV estéreo float32 a 48 kHz derivados de esos MP3; no se afirma que la conversión los vuelva fuentes sin pérdida. Se retiró el desplazamiento DC, se recortaron márgenes casi silenciosos con relleno, se aplicaron fades de 1 ms/8 ms y pico real de −6 dBTP. Los ticks llegaron muy bajos: se les aplicó paso alto de 150 Hz, paso bajo de 6,5/9 kHz respectivamente, duración de 160 ms y fade de salida de 12 ms. El manifiesto conserva hashes y parámetros exactos. Estos ajustes locales no consumen créditos.

El video de comparación dura **55,75 s**: A usa el WAV anterior del estudio y B usa la propuesta nueva preparada. Cada versión se escucha dos veces; el montaje solo iguala picos aproximadamente a −10 dBTP y codifica AAC. Mantiene los números del catálogo original. La oficina abre esta revisión primero y permite volver al catálogo completo de 36 efectos. **Las propuestas siguen pendientes de la escucha de Jorge; no se han conectado a la producción automática ni reemplazan las fuentes anteriores.** Los otros 29 efectos no se modificaron ni se dieron por aprobados.

Reproducir el video desde la carpeta de la oficina:

```bash
python3 production/sfx-catalog/render.py --comparison --catalog production/sfx-catalog/revision-2/catalog.json --output /tmp/glowfy-sfx-revision-2
```

Verificación: 28 reproducciones comparadas con sus fuentes, correlación mínima 0,96839 tras AAC; decodificación completa, siete capítulos, 720×1280/24 fps, −20,81 LUFS integrados, −9,77 dBTP. Inspeccionados 14 cuadros, uno por versión y efecto. Estas mediciones no demuestran que el resultado sea estéticamente adecuado: falta la selección del dueño.

Sugerencias para una siguiente ampliación (no generadas): confirmación propia de reserva, deslizamiento suave de tarjeta y firma sonora de cierre de Glowfy. Conviene evaluar primero los dings y whooshes existentes para evitar duplicar la biblioteca.
