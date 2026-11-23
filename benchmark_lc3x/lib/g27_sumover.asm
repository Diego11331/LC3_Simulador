
; ============================================================================
; Subrutina: SUMOVER  [LC-3X — sin cambios necesarios]
;     Sumador de 16 bits con carry de entrada y salida.
;     Este modulo no usa instrucciones fuera de rango de LC-3X:
;       - Todos los immediatos son imm4 validos (-8..7).
;       - No usa LDR/STR con offset.
;     Se copia identico al original; se incluye en benchmark_lc3x para
;     tener un set de archivos autocontenido.
;
; -> INPUT  [R0] Valor A.
; -> INPUT  [R1] Valor B.
; -> INPUT  [R2] Carry entrada (0 o 1).
; <- OUTPUT [R0] Resultado A+B.
; <- OUTPUT [R2] Carry salida (0 o 1).
; ============================================================================

SUMOVER
    ST R1 sumover_r1
    ST R3 sumover_r3
    ST R4 sumover_r4

    ADD R3 R0 #0                ; [R3] valor_a
    ADD R0 R2 #0                ; [R0] resultado = carry
    AND R2 R2 #0                ; [R2] carry = 0

    ADD R3 R3 #0
    BRzp sumover_test_b
    ADD R2 R2 #1                ; if valor_a & 0x8000: carry++

sumover_test_b
    ADD R1 R1 #0
    BRzp sumover_sum
    ADD R2 R2 #1                ; if valor_b & 0x8000: carry++

sumover_sum
    LD R4 sumover_mask
    AND R3 R3 R4
    AND R1 R1 R4
    ADD R0 R0 R3
    ADD R0 R0 R1

    BRzp sumover_resultant
    ADD R2 R2 #1                ; if resultado & 0x8000: carry++

sumover_resultant
    AND R0 R0 R4

    AND R4 R2 #1
    BRz sumover_test_carry
    LD R4 sumover_msb
    ADD R0 R0 R4

sumover_test_carry
    AND R4 R2 #2
    BRz sumover_test_carry_else
    AND R2 R2 #0
    ADD R2 R2 #1
    BRnzp sumover_ret

sumover_test_carry_else
    AND R2 R2 #0

sumover_ret
    LD R1 sumover_r1
    LD R3 sumover_r3
    LD R4 sumover_r4
    RET

sumover_r1    .FILL #0
sumover_r3    .FILL #0
sumover_r4    .FILL #0
sumover_mask  .FILL x7FFF
sumover_msb   .FILL x8000

.END
