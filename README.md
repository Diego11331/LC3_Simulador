# Simulador LC-3

Simulador web de la **LC-3 (Little Computer 3)**, la arquitectura educativa de Patt y Patel. Incluye un ensamblador, un depurador y la arquitectura completa con modos de privilegio, excepciones, interrupciones y E/S mapeada en memoria.

Es una única página (`index.html`) sin dependencias ni servidor. Todo se ejecuta en el navegador.

**Demo:** https://diego11331.github.io/LC3_Simulador/

## Características

- **Ensamblador de dos pasadas** con etiquetas, comentarios con `;` y varios segmentos `.ORIG`. Los errores indican el número de línea.
- **Conjunto completo de instrucciones:** `ADD`, `AND`, `NOT`, `BR` (todas las variantes de `nzp`), `JMP`, `RET`, `JSR`, `JSRR`, `LD`, `LDI`, `LDR`, `LEA`, `ST`, `STI`, `STR`, `TRAP`, `RTI` y `NOP`.
- **Directivas:** `.ORIG`, `.END`, `.FILL`, `.BLKW`, `.STRINGZ`.
- **Modos supervisor y usuario**, con registro PSR, prioridad y pilas separadas (SSP y USP).
- **Excepciones:** violación de privilegio (x0100), instrucción ilegal (x0101) y violación de acceso a memoria (x0102). En modo usuario están protegidas las direcciones x0000–x2FFF y xFE00–xFFFF.
- **E/S mapeada en memoria:** KBSR (xFE00), KBDR (xFE02), DSR (xFE04), DDR (xFE06) y MCR (xFFFE).
- **Interrupción de teclado** (vector x0180), que se activa con el bit IE de KBSR.
- **TRAP:** si el vector está definido en memoria se ejecuta tu rutina. Si no, se usa el sistema simulado: `GETC`, `OUT`, `PUTS`, `IN`, `PUTSP` y `HALT`.
- **Depurador:** ejecución paso a paso, «Paso sobre», puntos de parada, tres velocidades y pausa.
- **Edición directa** de registros, PC y memoria.
- **Vista de memoria** en hexadecimal, binario y desensamblada, con las etiquetas y el código fuente junto a cada dirección.
- **Panel de símbolos** clicable para saltar a cualquier etiqueta.
- **Archivos:** abrir `.asm` u `.obj`, y guardar `.asm` y `.obj`.

## Uso

1. Escribe o carga un programa en el editor. Hay cinco ejemplos en el desplegable.
2. Pulsa **Ensamblar**. Esto carga el programa en memoria y reinicia la máquina.
3. Pulsa **Paso** para ejecutar una instrucción, o **Ejecutar** para correr hasta un `HALT` o un punto de parada.
4. Si el programa pide teclado (`GETC`, `IN` o sondeo de KBSR), escribe en el campo de entrada y pulsa **Enviar**. Se añade un salto de línea al final de cada envío.

### Controles

| Control | Función |
|---|---|
| Ensamblar | Ensambla el código, carga la memoria y reinicia registros y consola |
| Paso | Ejecuta una instrucción |
| Paso sobre | Ejecuta una llamada (`JSR`, `JSRR` o `TRAP`) completa y se detiene al volver |
| Ejecutar / Pausar | Ejecución continua |
| Velocidad | Lento, medio o rápido |
| Inicio | Modo de arranque: supervisor o usuario |
| Guardar .asm / .obj | Descarga el código fuente o el binario |
| Abrir | Carga un archivo `.asm`, `.txt` u `.obj` |

### Depuración

- **Punto de parada:** pulsa la primera columna de una fila de la tabla de memoria. Aparece un ●.
- **Editar un registro, el PC o una palabra de memoria:** escribe un valor hexadecimal en su campo.
- **Ir a una dirección:** escribe, por ejemplo, `3000` en «Ir a x». Si lo dejas vacío, la tabla sigue al PC.
- Los registros que cambian en cada paso se resaltan.

## Estado inicial

| Elemento | Valor |
|---|---|
| PC | Origen del primer segmento a partir de x3000 (o el primero, si no hay ninguno) |
| R6 | xFE00 |
| Códigos de condición | Z = 1 |
| Modo | Supervisor (o usuario, si se elige en «Inicio») |
| Prioridad | 0 |
| SSP | x3000 |

Los programas que acceden a los registros de dispositivo (`KBSR`, `DDR`, etc.) deben ejecutarse en **modo supervisor**. En modo usuario provocan una violación de acceso.

## Ejemplo

```asm
; Hola mundo
.ORIG x3000
      LEA R0, MSG
      PUTS
      HALT
MSG   .STRINGZ "Hola, mundo!"
.END
```

Los números pueden escribirse en decimal (`#10`, `#-3`) o en hexadecimal (`x3000`, `x-1`). Las cadenas admiten los escapes `\n`, `\t`, `\0`, `\\` y `\"`.

## Limitaciones

- Solo existe una fuente de interrupción: el teclado.
- El formato `.obj` exportado contiene únicamente el segmento principal (un origen seguido de sus palabras).
- La memoria y los registros no se pueden retroceder (no hay ejecución hacia atrás).
- En la versión publicada como artifact de claude.ai las descargas están bloqueadas. Funcionan al alojar la página por tu cuenta.

## Despliegue en GitHub Pages

1. Sube `index.html` a la raíz del repositorio. El archivo debe llamarse exactamente así, en minúsculas.
2. En **Settings → Pages**, elige *Deploy from a branch*, la rama `main` y la carpeta `/ (root)`.
3. Espera uno o dos minutos. La página queda en `https://USUARIO.github.io/REPOSITORIO/`.

También puede abrirse en local con un doble clic sobre `index.html`, o alojarse en cualquier servidor de archivos estáticos (Netlify, Vercel, Apache, Nginx).

## Estructura

```
.
├── index.html   # Simulador completo (HTML, CSS y JavaScript)
└── README.md
```

## Referencias

- Y. N. Patt y S. J. Patel, *Introduction to Computing Systems: From Bits and Gates to C and Beyond*.
