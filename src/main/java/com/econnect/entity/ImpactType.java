package com.econnect.entity;

import java.util.List;

public enum ImpactType {
    WASTE_COLLECTED,   // kilograms
    TREES_PLANTED,     // number of trees
    BENEFICIARIES,     // volunteers / people helped
    CONTRIBUTIONS;     // general contributions completed

    /** Impact types counted towards environmental badges. */
    public static List<ImpactType> environmental() {
        return List.of(WASTE_COLLECTED, TREES_PLANTED);
    }
}
