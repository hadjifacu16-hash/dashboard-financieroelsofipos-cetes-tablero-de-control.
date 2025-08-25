const appData = {
    "sofipos": [
        {
            "name": "DiDi Cuenta",
            "annual_rate": 0.15,
            "gat_nominal": null, // Se calculará o usará la tasa anual
            "gat_real": null,    // Se calculará
            "protection_udis": 25000,
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": ["flexible"],
            "notes": "Rendimientos diarios. Tasa del 15% anual."
        },
        {
            "name": "Stori",
            "annual_rate": 0.08,
            "gat_nominal": 0.08, // Proporcionado directamente
            "gat_real": null,    // Se calculará
            "protection_udis": 25000,
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": ["flexible", 180, 360],
            "notes": "GAT Nominal 8.00% (Sin plazo)."
        },
        {
            "name": "Klar",
            "annual_rate": 0.085,
            "gat_nominal": null,
            "gat_real": null,
            "protection_udis": 25000,
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": ["flexible", 7, 30, 90, 180, 365],
            "notes": "Hasta 8.5% anual con Klar Plus en inversión fija a 365 días."
        },
        {
            "name": "Nu bank",
            "annual_rate": 0.15,
            "gat_nominal": null,
            "gat_real": null,
            "protection_udis": 25000,
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": ["flexible", 7, 28, 90, 180],
            "notes": "Cajita Turbo 15% anual."
        },
        {
            "name": "Mercado Pago",
            "annual_rate": 0.14,
            "gat_nominal": null,
            "gat_real": null,
            "protection_udis": 25000, // Asumido ya que está regulado y no especifica otro
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": ["flexible"],
            "notes": "Hasta 14% anual. "
        },
        {
            "name": "Finsus",
            "annual_rate": 0.1009,
            "gat_nominal": null,
            "gat_real": null,
            "protection_udis": 25000,
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": [7, 30, 90, 180, 360, 600, 720, 1080, 1440, 1800],
            "notes": "Hasta 10.09% anual en inversiones a plazo."
        },
        {
            "name": "Supertasas",
            "annual_rate": 0.095,
            "gat_nominal": null,
            "gat_real": null,
            "protection_udis": 25000,
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": ["flexible", 364],
            "notes": "Rendimiento potencial máximo anual hasta 9.50%."
        },
        {
            "name": "Kubo Financiero",
            "annual_rate": 0.115, // Tasa máxima
            "gat_nominal": 0.095, // GAT Nominal para 365 días
            "gat_real": 0.0537,    // GAT Real para 365 días
            "protection_udis": 25000,
            "protection_mxn": 212783.4, // 25,000 UDIS * 8.511336
            "terms": [28, 90, 180, 365, 547],
            "notes": "Hasta 11.50% anual. GATs proporcionados para plazo de 365 días."
        },
        {
            "name": "Ualá",
            "annual_rate": 0.16,
            "gat_nominal": 0.1735,
            "gat_real": 0.1306,
            "protection_udis": 400000,
            "protection_mxn": 3404534.4, // 400,000 UDIS * 8.511336
            "terms": ["flexible"],
            "notes": "Tasa Plus 16.00% anual, protegido por IPAB (400,000 UDIS)."
        }
    ],
    "cetes": {
        "name": "CETES",
        "annual_rate": 0.0791, // Tasa a 364 días como referencia general
        "rates_by_term": {
            "28": 0.074,
            "91": 0.0766,
            "182": 0.0781,
            "364": 0.0791
        },
        "protection_notes": "Respaldo del Gobierno Federal",
        "protection_udis": null,
        "protection_mxn": null,
        "notes": "Tasas de la semana del 20 de agosto de 2025."
    },
    "cetes_expectations_28day_2025": { // Tasas de interés de Cete a 28 días al cierre del año (media)
        "Ene": 0.0846,
        "Feb": 0.0828,
        "Mar": 0.0807,
        "Abr": 0.0783,
        "May": 0.0763,
        "Jun": 0.0753,
        "Jul": 0.0741
        // Agosto se usará la tasa actual
    },
    "general_info": {
        "isr_retention_rate_2025": 0.005,
        "isr_exempt_amount_2024_mxn": 198031.80, // 5 UMAS anuales de 2024
        "uma_value_2024_annual_mxn": 39606.36,
        "estimated_annual_inflation_2025": 0.035, // 3.5%
        "plazos_dias": {
            "1_mes": 28,
            "3_meses": 91,
            "6_meses": 182,
            "1_ano": 365
        },
        "udi_value_mxn_aug_2025": 8.511336 // Valor de UDI para agosto de 2025
    }
};
