
; ============================================================================
; Subrutina: CIRCLSH  [LC-3X — sin cambios necesarios]
;     Rotacion circular de 32 bits (R0||R1) hacia la izquierda n veces.
;     Todos los immediatos estan en rango imm4 (-8..7) -> OK sin cambios.
;
; -> INPUT  [R0] Registro A (palabra alta).
; -> INPUT  [R1] Registro B (palabra baja).
; -> INPUT  [R2] n: numero de rotaciones.
; <- OUTPUT [R0] A rotado.
; <- OUTPUT [R1] B rotado.
; ============================================================================

CIRCLSH
    ST R2 circlsh_r2
    ST R3 circlsh_r3

circlsh_loop
    AND R3 R3 #0                ; carry = 0
    ADD R2 R2 #0
    BRnz circlsh_ret            ; while n > 0:
    ADD R0 R0 #0
    BRzp circlsh_sk1
    ADD R3 R3 #1                ;   if R0 & 0x8000: carry++
circlsh_sk1
    ADD R0 R0 R0                ;   R0 <<= 1
    ADD R1 R1 #0
    BRzp circlsh_sk2
    ADD R0 R0 #1                ;   if R1 & 0x8000: R0 |= 1
circlsh_sk2
    ADD R1 R1 R1                ;   R1 <<= 1
    ADD R1 R1 R3                ;   R1 |= carry
    ADD R2 R2 #-1               ;   n--
    BRnzp circlsh_loop

circlsh_ret
    LD R2 circlsh_r2
    LD R3 circlsh_r3
    RET

circlsh_r2  .FILL #0
circlsh_r3  .FILL #0

.END
