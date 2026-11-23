; Seno Q3.12 -> Q1.14. Se reutiliza la tabla LC-3X.
.EXTERNAL g22_Tabla_SIN_y_COS-SENO_TABLA
SENO_TABLA_PTR .FILL g22_Tabla_SIN_y_COS-SENO_TABLA
CALCULAR_SENO
        PUSHM   #xBE
        LD      R1, SENO_TABLA_PTR
        JSRR    R1
        POPM    #xBE
        RET
.END
