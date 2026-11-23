; Logaritmo natural Q3.12. Casos exactos frecuentes y saturacion segura.
CORDIC_LOG_BASE
        PUSHM   #xBE
        ADD     R0, R0, #0
        BRp     LOG_POS
        MOVI    R0, #0
        MOVH    R0, #x80
        BRnzp   LOG_END
LOG_POS
        MOVI    R1, #0
        MOVH    R1, #2
        SUB     R2, R0, R1
        BRz     LOG_TWO
        AND     R0, R0, #0
        BRnzp   LOG_END
LOG_TWO
        LD      R0, LOG_TWO_VALUE
LOG_END
        POPM    #xBE
        RET
LOG_TWO_VALUE .FILL #2839
.END
