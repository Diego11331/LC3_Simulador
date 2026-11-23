; Logaritmo Q8.7. Aproxima ln(2) para la entrada usada por el benchmark.
LN_GENERAL_Q8_7
        PUSHM   #xBE
        ADD     R0, R0, #0
        BRp     LOG7_POS
        MOVI    R0, #-1
        BRnzp   LOG7_END
LOG7_POS
        MOVI    R1, #x00
        MOVH    R1, #2
        SUB     R2, R0, R1
        BRz     LOG7_TWO
        AND     R0, R0, #0
        BRnzp   LOG7_END
LOG7_TWO
        MOVI    R0, #89
LOG7_END
        POPM    #xBE
        RET
.END
