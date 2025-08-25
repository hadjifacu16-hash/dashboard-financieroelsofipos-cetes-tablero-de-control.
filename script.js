document.addEventListener('DOMContentLoaded', () => {
    populateInstrumentDropdown();
    displayGeneralNotes();
    // Realiza un cálculo inicial al cargar la página con valores por defecto
    calculatePerformance();
});

function populateInstrumentDropdown() {
    const selectedInstrument = document.getElementById('selectedInstrument');
    const sofipoOptgroup = selectedInstrument.querySelector('optgroup[label="SOFIPOs"]');
    const cetesOptgroup = selectedInstrument.querySelector('optgroup[label="CETES"]');

    appData.sofipos.forEach(sofipo => {
        const option = document.createElement('option');
        option.value = sofipo.name;
        option.textContent = sofipo.name;
        sofipoOptgroup.appendChild(option);
    });

    const cetesOption = document.createElement('option');
    cetesOption.value = appData.cetes.name;
    cetesOption.textContent = appData.cetes.name;
    cetesOptgroup.appendChild(cetesOption);
}

function displayGeneralNotes() {
    document.getElementById('inflationRate').textContent = (appData.general_info.estimated_annual_inflation_2025 * 100).toFixed(2);
    document.getElementById('isrRate').textContent = (appData.general_info.isr_retention_rate_2025 * 100).toFixed(2);
    document.getElementById('isrExemptAmount').textContent = appData.general_info.isr_exempt_amount_2024_mxn.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    document.getElementById('udiValue').textContent = appData.general_info.udi_value_mxn_aug_2025.toFixed(4);
}

function calculatePerformance() {
    const initialAmount = parseFloat(document.getElementById('initialAmount').value);
    const investmentPeriodDays = parseInt(document.getElementById('investmentPeriodDays').value);
    const selectedInstrumentName = document.getElementById('selectedInstrument').value;

    if (isNaN(initialAmount) || initialAmount <= 0) {
        alert('Por favor, ingresa un monto inicial válido.');
        return;
    }

    let instrumentData;
    let isSofipo = false;

    if (selectedInstrumentName === appData.cetes.name) {
        instrumentData = appData.cetes;
    } else {
        instrumentData = appData.sofipos.find(s => s.name === selectedInstrumentName);
        isSofipo = true;
    }

    if (!instrumentData) {
        alert('Instrumento no encontrado.');
        return;
    }

    let annualRate = instrumentData.annual_rate;
    let gatNominal = instrumentData.gat_nominal;
    let gatReal = instrumentData.gat_real;

    if (selectedInstrumentName === appData.cetes.name && instrumentData.rates_by_term) {
        // Para CETES, busca la tasa más cercana al plazo seleccionado
        const closestTerm = Object.keys(instrumentData.rates_by_term)
                               .map(Number)
                               .reduce((prev, curr) => (Math.abs(curr - investmentPeriodDays) < Math.abs(prev - investmentPeriodDays) ? curr : prev));
        annualRate = instrumentData.rates_by_term[closestTerm];
        // Para CETES, si no hay GAT explícito, se usa la tasa anual como GAT Nominal
        gatNominal = gatNominal || annualRate;
    } else if (isSofipo && instrumentData.name === "Klar" && instrumentData.terms.includes("flexible")) {
        // Klar flexible, use Klar Plus rate if available, otherwise standard
        // This is a simplification, ideally we'd have a way to select Klar Plus
        annualRate = 0.085; // Example: Assuming Klar Plus (highest fixed rate) for calculation
    } else if (isSofipo && instrumentData.name === "Nu bank" && instrumentData.notes.includes("Cajita Turbo")) {
        annualRate = 0.15; // Use Cajita Turbo rate
    }


    // Estimar GAT Nominal si no está proporcionado (usa la tasa anual)
    gatNominal = gatNominal || annualRate;

    // Estimar GAT Real si no está proporcionado
    if (gatReal === null) {
        gatReal = ((1 + gatNominal) / (1 + appData.general_info.estimated_annual_inflation_2025)) - 1;
    }

    // Cálculos de Rendimiento
    const dailyRate = annualRate / 365;
    const monthlyRate = annualRate / 12;
    const investmentPeriodYears = investmentPeriodDays / 365;

    // Rendimientos Brutos
    const grossAnnualYield = initialAmount * annualRate;
    const grossMonthlyYield = (initialAmount * (Math.pow(1 + annualRate, 1/12) - 1)) ; // Compounded monthly approximation
    const grossDailyYield = (initialAmount * (Math.pow(1 + annualRate, 1/365) - 1)) ; // Compounded daily approximation
    const grossYieldAtTerm = initialAmount * (Math.pow(1 + annualRate, investmentPeriodYears) - 1); // Rendimiento total compuesto al plazo

    // Cálculo de ISR (simplificado según nota)
    const isrAnnualRate = appData.general_info.isr_retention_rate_2025;
    const isrDailyRate = isrAnnualRate / 365;

    let totalISRTax = 0;
    // La exención de ISR en SOFIPOs es para intereses ganados hasta 5 UMAS.
    // La retención del 0.5% en inversiones se aplica sobre el capital (principal)
    // Para cumplir con "impuesto total del rendimiento", lo calculamos sobre el rendimiento bruto aquí.
    const isrExemptAmountUDIS = 5 * (appData.general_info.uma_value_2024_annual_mxn / (365/12)) ; // UMA mensual aproximada para comparar con rendimientos

    // Simplificación: Si el rendimiento bruto anual excede el equivalente a 5 UMAS anuales, se aplica el ISR al rendimiento bruto.
    // Esto es para cumplir el prompt de "impuesto total del rendimiento", pero reitera la ambigüedad.
    if (grossYieldAtTerm > (appData.general_info.isr_exempt_amount_2024_mxn * investmentPeriodYears) ) { // Check against annual exempt amount pro-rated for the term
         totalISRTax = grossYieldAtTerm * isrAnnualRate;
    } else if (initialAmount > appData.general_info.isr_exempt_amount_2024_mxn) {
        // If the principal is above the exempt amount, but the yield isn't necessarily, we still apply the 0.5% rate on yield
        // This handles the "retention on principal" aspect by applying it as tax on yield if the principal is large.
        totalISRTax = grossYieldAtTerm * isrAnnualRate;
    }


    const netYieldAtTerm = grossYieldAtTerm - totalISRTax;
    const finalAmount = initialAmount + netYieldAtTerm;

    // Mostrar tabla de simulación
    displaySimulationTable(initialAmount, investmentPeriodDays, instrumentData, annualRate, grossAnnualYield, grossMonthlyYield, grossDailyYield, grossYieldAtTerm, gatNominal, gatReal, isrAnnualRate, isrDailyRate, totalISRTax, netYieldAtTerm, finalAmount);

    // Mostrar tabla comparativa
    displayComparisonTable(instrumentData, annualRate, gatNominal, gatReal);

    // Actualizar nota de protección
    const protectionNoteElement = document.getElementById('protectionNote');
    if (instrumentData.protection_notes) {
        protectionNoteElement.innerHTML = `<strong>Protección:</strong> ${instrumentData.protection_notes}.`;
    } else if (instrumentData.protection_udis) {
        protectionNoteElement.innerHTML = `<strong>Protección:</strong> Hasta ${instrumentData.protection_udis.toLocaleString()} UDIS (${instrumentData.protection_mxn.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}) por persona.`;
    } else {
        protectionNoteElement.textContent = 'Información de protección no disponible.';
    }

    // Actualizar gráfica de historial
    updateHistoricalChart(instrumentData);
}

function displaySimulationTable(initialAmount, periodDays, instrument, annualRate, grossAnnualYield, grossMonthlyYield, grossDailyYield, grossYieldAtTerm, gatNominal, gatReal, isrAnnualRate, isrDailyRate, totalISRTax, netYieldAtTerm, finalAmount) {
    const tableContainer = document.getElementById('simulationTableContainer');
    tableContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th colspan="2">Detalles de la Inversión</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Instrumento Seleccionado</td><td>${instrument.name}</td></tr>
                <tr><td>Monto Inicial</td><td>${initialAmount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td>Plazo de Inversión</td><td>${periodDays} días</td></tr>
                <tr><td>Tasa Anual (Bruta)</td><td>${(annualRate * 100).toFixed(2)}%</td></tr>
                <tr><td>Protección</td><td>${instrument.protection_udis ? instrument.protection_udis.toLocaleString() + ' UDIS (' + instrument.protection_mxn.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) + ')' : instrument.protection_notes || 'N/A'}</td></tr>
                <tr class="separator"><td colspan="2"></td></tr>
                <tr><th colspan="2">Rendimiento Bruto (Antes de Impuestos)</th></tr>
                <tr><td>Rendimiento Anual Bruto</td><td>${grossAnnualYield.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td>Rendimiento Mensual Bruto</td><td>${grossMonthlyYield.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td>Rendimiento Diario Bruto</td><td>${grossDailyYield.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td>Rendimiento Total Bruto a Plazo</td><td>${grossYieldAtTerm.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr class="separator"><td colspan="2"></td></tr>
                <tr><th colspan="2">Rendimiento Neto (Después de Impuestos e Inflación)</th></tr>
                <tr><td>GAT Nominal</td><td>${(gatNominal * 100).toFixed(2)}%</td></tr>
                <tr><td>GAT Real</td><td>${(gatReal * 100).toFixed(2)}%</td></tr>
                <tr class="separator"><td colspan="2"></td></tr>
                <tr><th colspan="2">Cálculo de ISR</th></tr>
                <tr><td>Tasa ISR Anual</td><td>${(isrAnnualRate * 100).toFixed(2)}%</td></tr>
                <tr><td>Tasa ISR Diaria</td><td>${(isrDailyRate * 100).toFixed(4)}%</td></tr>
                <tr><td>Impuesto Total del Rendimiento</td><td>${totalISRTax.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr class="separator"><td colspan="2"></td></tr>
                <tr><th colspan="2">Resumen Final</th></tr>
                <tr><td>Rendimiento Neto a Plazo</td><td>${netYieldAtTerm.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td>Monto Final (Monto Inicial + Rendimiento Neto)</td><td><strong>${finalAmount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></td></tr>
            </tbody>
        </table>
    `;
}

function displayComparisonTable(selectedInstrument, selectedAnnualRate, selectedGATNominal, selectedGATReal) {
    const tableContainer = document.getElementById('comparisonTableContainer');
    let sofipoData, cetesData;

    if (selectedInstrument.name === appData.cetes.name) {
        cetesData = {
            name: appData.cetes.name,
            annual_rate: selectedAnnualRate,
            gat_nominal: selectedGATNominal,
            gat_real: selectedGATReal,
            protection: appData.cetes.protection_notes
        };
        // Encuentra una SOFIPO representativa para comparar, por ejemplo, la primera con una tasa alta
        const representativeSofipo = appData.sofipos.reduce((max, sofipo) => (sofipo.annual_rate > max.annual_rate ? sofipo : max), appData.sofipos[0]);
        sofipoData = {
            name: representativeSofipo.name,
            annual_rate: representativeSofipo.annual_rate,
            gat_nominal: representativeSofipo.gat_nominal || representativeSofipo.annual_rate,
            gat_real: representativeSofipo.gat_real || ((1 + (representativeSofipo.gat_nominal || representativeSofipo.annual_rate)) / (1 + appData.general_info.estimated_annual_inflation_2025)) - 1,
            protection: representativeSofipo.protection_udis ? representativeSofipo.protection_udis.toLocaleString() + ' UDIS' : representativeSofipo.protection_notes || 'N/A'
        };

    } else {
        sofipoData = {
            name: selectedInstrument.name,
            annual_rate: selectedAnnualRate,
            gat_nominal: selectedGATNominal,
            gat_real: selectedGATReal,
            protection: selectedInstrument.protection_udis ? selectedInstrument.protection_udis.toLocaleString() + ' UDIS' : selectedInstrument.protection_notes || 'N/A'
        };
        // Usa la tasa a 364 días de CETES para la comparación
        const cetes364Rate = appData.cetes.rates_by_term["364"];
        cetesData = {
            name: appData.cetes.name,
            annual_rate: cetes364Rate,
            gat_nominal: cetes364Rate,
            gat_real: ((1 + cetes364Rate) / (1 + appData.general_info.estimated_annual_inflation_2025)) - 1,
            protection: appData.cetes.protection_notes
        };
    }

    tableContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Característica</th>
                    <th>${sofipoData.name}</th>
                    <th>${cetesData.name}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Tasa de Interés Anual (Bruta)</td>
                    <td>${(sofipoData.annual_rate * 100).toFixed(2)}%</td>
                    <td>${(cetesData.annual_rate * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>GAT Nominal</td>
                    <td>${(sofipoData.gat_nominal * 100).toFixed(2)}%</td>
                    <td>${(cetesData.gat_nominal * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>GAT Real</td>
                    <td>${(sofipoData.gat_real * 100).toFixed(2)}%</td>
                    <td>${(cetesData.gat_real * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>Protección</td>
                    <td>${sofipoData.protection}</td>
                    <td>${cetesData.protection}</td>
                </tr>
            </tbody>
        </table>
    `;
}

let historicalChart;

function updateHistoricalChart(selectedInstrument) {
    const ctx = document.getElementById('historicalPerformanceChart').getContext('2d');

    const labels = ["Ene 2025", "Feb 2025", "Mar 2025", "Abr 2025", "May 2025", "Jun 2025", "Jul 2025", "Ago 2025"];
    let selectedInstrumentRates = [];
    let cetesHistoricalRates = [];

    // Para el instrumento seleccionado, proyectamos su tasa anual actual a lo largo del año
    for (let i = 0; i < labels.length; i++) {
        selectedInstrumentRates.push(selectedInstrument.annual_rate * 100);
    }

    // Para CETES, usamos las expectativas de 28 días de Banxico para meses anteriores y la tasa actual para agosto
    for (let i = 0; i < labels.length -1 ; i++) { // Ene-Jul
        const monthKey = labels[i].substring(0, 3);
        if (appData.cetes_expectations_28day_2025[monthKey]) {
            cetesHistoricalRates.push(appData.cetes_expectations_28day_2025[monthKey] * 100);
        } else {
            cetesHistoricalRates.push(null);
        }
    }
    // Agrega la tasa actual de CETES 28 días para el mes actual (Agosto)
    cetesHistoricalRates.push(appData.cetes.rates_by_term["28"] * 100);


    // Destruye el gráfico existente si lo hay
    if (historicalChart) {
        historicalChart.destroy();
    }

    historicalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `${selectedInstrument.name} (Tasa Anual Bruta)`,
                    data: selectedInstrumentRates,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: `CETES 28 días (Tasa Anual Bruta)`,
                    data: cetesHistoricalRates,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Historial de Rendimiento Anual (2025) - Tasa Bruta'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(context.parsed.y / 100);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tasa Anual (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mes'
                    }
                }
            }
        }
    });
}
