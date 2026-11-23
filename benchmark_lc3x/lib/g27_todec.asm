; ============================================================================
; Subrutina: TODEC  [LC-3X — adaptada]
;     Convierte un valor Q (entero + fraccion) a cadena decimal ASCII.
;     El buffer recibe 1 caracter por BYTE.
; ============================================================================

.EXTERNAL SUMOVER-SUMOVER

TODEC
    PUSHM #xBB                  ; Guarda R0, R1, R3, R4, R5, R7 en pila
    ADD R6 R6 #-2
    STR R2 R6 #0                ; Guarda cursor_beg en stack

    ST R0 todec_entero
    ST R1 todec_fraccion
    ST R2 todec_cursor_beg
    ST R2 todec_cursor_wr
    ST R3 todec_format

; ==- Signo ==================================================================
    LD R0 todec_entero
    BRzp todec_sig_elif         ; if entero < 0:
    LD R0 todec_chr_minus
    LD R1 todec_cursor_wr
    STBL R0 R1 #0               ;   buf[cursor] = '-'
    ADD R1 R1 #1
    ST R1 todec_cursor_wr

    LD R0 todec_entero
    NOT R0 R0
    LD R1 todec_fraccion
    BRnp todec_sig_sk1
    ADD R0 R0 #1
todec_sig_sk1
    NOT R1 R1
    ADD R1 R1 #1
    ST R0 todec_entero
    ST R1 todec_fraccion        ; [entero, fraccion] = -[entero, fraccion]
    BRnzp todec_int

todec_sig_elif
    LD R0 todec_format
    AND R0 R0 #1
    BRz todec_int               ; elif format & SHOW_PLUS:
    LD R0 todec_chr_plus
    LD R1 todec_cursor_wr
    STBL R0 R1 #0               ;   buf[cursor] = '+'
    ADD R1 R1 #1
    ST R1 todec_cursor_wr

; ==- Entero =================================================================
todec_int
    LEA R5 todec_expr_vec
    ADD R5 R5 #4                ; saltar 4 pares de 4 bytes = +16 bytes (10^4)
    ADD R5 R5 #4
    ADD R5 R5 #4
    ADD R5 R5 #4
    LDR R4 R5 #2                ; -expr_actual = par[1] (palabra baja)
    LD R3 todec_entero
    AND R2 R2 #0                ; contador = 0

todec_int_loop
    ADD R0 R3 R4                ; aux = entero + (-expr_actual)
    BRn todec_int_format_chk    ; if aux >= 0:
    ADD R2 R2 #1                ;   contador++
    ADD R3 R0 #0                ;   entero = aux
    BR todec_int_loop

todec_int_format_chk
    LD R0 todec_format
    AND R0 R0 #2
    BRnp todec_int_append
    ADD R0 R2 #0
    BRnp todec_int_append
    BR todec_int_sk1

todec_int_append                ; if SHOW_LEADZ or contador != 0:
    LD R0 todec_format
    NOT R0 R0
    AND R0 R0 #-3
    NOT R0 R0
    ST R0 todec_format          ;   formato |= SHOW_LEADZ
    LD R0 todec_chr_zero
    LD R1 todec_cursor_wr
    ADD R0 R0 R2
    STBL R0 R1 #0               ;   buf[cursor] = '0' + contador
    ADD R1 R1 #1
    ST R1 todec_cursor_wr

todec_int_sk1
    AND R2 R2 #0                ; contador = 0
    ADD R5 R5 #4                ; avanzar al siguiente par (4 bytes)
    LDR R4 R5 #2                ; -expr_actual = par[1]

    BRz todec_int_break
    BR todec_int_loop

todec_int_break
    LD R0 todec_format
    AND R0 R0 #2
    BRnp todec_early
    LD R0 todec_chr_zero
    LD R1 todec_cursor_wr
    STBL R0 R1 #0               ; buf[cursor] = '0'
    ADD R1 R1 #1
    ST R1 todec_cursor_wr

; ==- Pool de variables central ==============================================
    BR todec_early

sub_sumover         .FILL SUMOVER-SUMOVER
todec_entero        .FILL #0
todec_fraccion      .FILL #0
todec_cursor_beg    .FILL #0
todec_cursor_wr     .FILL #0
todec_format        .FILL #0
todec_fraccion_h    .FILL #0
todec_fraccion_l    .FILL #0
todec_aux_0         .FILL #0
todec_aux_1         .FILL #0
todec_aux_2         .FILL #0

todec_chr_plus      .FILL #43           ; ord('+')
todec_chr_minus     .FILL #45           ; ord('-')
todec_chr_dot       .FILL #46           ; ord('.')
todec_chr_zero      .FILL #48           ; ord('0')

todec_frac_expr_h   .FILL x3B9A
todec_frac_expr_l   .FILL xCA00         ; 1_000_000_000

todec_expr_vec      .FILL xfa0a
                    .FILL x1f00         ; -10^8   (9no digito)
                    .FILL xff67
                    .FILL x6980         ; -10^7   (8vo digito)
                    .FILL xfff0
                    .FILL xbdc0         ; -10^6   (7mo digito)
                    .FILL xfffe
                    .FILL x7960         ; -10^5   (6to digito)
                    .FILL xffff
                    .FILL xd8f0         ; -10^4   (5to digito)
                    .FILL xffff
                    .FILL xfc18         ; -10^3   (4to digito)
                    .FILL xffff
                    .FILL xff9c         ; -10^2   (3er digito)
                    .FILL xffff
                    .FILL xfff6         ; -10^1   (2do digito)
                    .FILL xffff
                    .FILL xffff         ; -10^0   (1er digito)
                    .FILL x0000
                    .FILL x0000         ; NULL32  (terminacion)

; ==- Prueba para retorno temprano ===========================================
todec_early
    LD R0 todec_fraccion
    BRnp todec_dec              ; if fraccion == 0:
    LD R1 todec_cursor_wr
    LD R0 todec_format
    AND R0 R0 #4
    BRz todec_early_chk         ;   if SHOW_ENDZ:
    LD R0 todec_chr_dot
    STBL R0 R1 #0               ;     buf[cursor] = '.'
    ADD R1 R1 #1
    LD R0 todec_chr_zero
    MOVI R2 #9                  ;     contador = 9
todec_early_chk_loop
    ADD R2 R2 #0
    BRnz todec_early_chk
    STBL R0 R1 #0               ;     buf[cursor] = '0'
    ADD R1 R1 #1
    ADD R2 R2 #-1
    BRnzp todec_early_chk_loop

todec_early_chk
    AND R0 R0 #0
    STBL R0 R1 #0               ; buf[cursor] = '\0'
    ST R1 todec_cursor_wr
    BRnzp todec_ret

; ==- Decimal ================================================================
todec_dec
    LD R0 todec_chr_dot
    LD R1 todec_cursor_wr
    STBL R0 R1 #0               ; buf[cursor] = '.'
    ADD R1 R1 #1
    ST R1 todec_cursor_wr

    AND R0 R0 #0
    ST R0 todec_fraccion_h
    ST R0 todec_fraccion_l
    ST R0 todec_aux_0
    LD R0 todec_frac_expr_h
    ST R0 todec_aux_1
    LD R0 todec_frac_expr_l
    ST R0 todec_aux_2           ; [aux_0,1,2] = [0, 1_000_000_000]

    AND R5 R5 #0
    ADD R5 R5 #1                ; mascara = 1

todec_dec_loop1
    ADD R5 R5 #0
    BRz todec_dec_break1        ; while mascara:

    LD R0 todec_fraccion
    AND R0 R0 R5
    BRz todec_dec_continue1     ; if fraccion & mascara:

    LD R0 todec_fraccion_l
    LD R1 todec_aux_1
    AND R2 R2 #0
    LD R3 sub_sumover
    JSRR R3
    ST R0 todec_fraccion_l
    LD R0 todec_fraccion_h
    LD R1 todec_aux_0
    ADD R0 R0 R1
    ADD R0 R0 R2
    ST R0 todec_fraccion_h      ; [fraccion_h,l] += [aux_0,1]

todec_dec_continue1
    LD R0 todec_aux_0
    ADD R0 R0 R0
    LD R1 todec_aux_1
    BRzp todec_dec_cont1_sk1
    ADD R0 R0 #1
todec_dec_cont1_sk1
    ADD R1 R1 R1
    LD R2 todec_aux_2
    BRzp todec_dec_cont1_sk2
    ADD R1 R1 #1
todec_dec_cont1_sk2
    ADD R2 R2 R2
    ST R0 todec_aux_0
    ST R1 todec_aux_1
    ST R2 todec_aux_2           ; [aux_0,1,2] <<= 1

    ADD R5 R5 R5                ; mascara <<= 1
    BRnzp todec_dec_loop1

todec_dec_break1
    LEA R5 todec_expr_vec
    AND R4 R4 #0                ; contador = 0

todec_dec_loop2
    LD R0 todec_fraccion_l
    LDR R1 R5 #2                ; par[1]: -expr (palabra baja del par)
    AND R2 R2 #0
    LD R3 sub_sumover
    JSRR R3

    LD R1 todec_fraccion_h
    ADD R1 R1 R2
    LDR R2 R5 #0                ; par[0]: -expr (palabra alta del par)
    ADD R1 R1 R2                ; [R1,R0] = [fraccion_h,l] + par

    BRn todec_dec_append        ; if resultado >= 0:
    ST R1 todec_fraccion_h
    ST R0 todec_fraccion_l
    ADD R4 R4 #1
    BR todec_dec_loop2

todec_dec_append
    LD R0 todec_chr_zero
    LD R1 todec_cursor_wr
    ADD R0 R0 R4
    STBL R0 R1 #0               ; buf[cursor] = '0' + contador
    ADD R1 R1 #1
    ST R1 todec_cursor_wr

todec_dec_format_chk
    LD R0 todec_format
    AND R0 R0 #4
    BRnp todec_dec_continue2
    LD R0 todec_fraccion_l
    BRnp todec_dec_continue2
    LD R0 todec_fraccion_h
    BRnp todec_dec_continue2    ; if not SHOW_ENDZ and [h,l]==0: break
    BR todec_dec_break2

todec_dec_continue2
    AND R4 R4 #0                ; contador = 0
    ADD R5 R5 #4                ; siguiente par (4 bytes)
    LDR R0 R5 #2
    BRnp todec_dec_loop2
    LDR R0 R5 #0
    BRnp todec_dec_loop2        ; if par == 0: break

todec_p_cursor_wr   .FILL todec_cursor_wr

todec_dec_break2
    LD R1 todec_p_cursor_wr
    LDR R1 R1 #0
    AND R0 R0 #0
    STBL R0 R1 #0               ; buf[cursor] = '\0'

; ==- Return =================================================================
todec_ret
    LDR R2 R6 #0                ; Retorna R2 con el inicio del buffer
    ADD R6 R6 #2
    POPM #xBB                   ; Restaura R0, R1, R3, R4, R5, R7
    RET

.END
