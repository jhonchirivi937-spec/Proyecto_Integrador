const API_URL = "http://127.0.0.1:5000/api";
let chartProduccionInstance = null;
let datosGlobalesGrafica = [];

// Paleta de colores vibrantes para identificar cada bovino
const PALETA_COLORES = [
    { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.25)' },   // Azul
    { border: '#16a34a', bg: 'rgba(22, 163, 74, 0.25)' },   // Verde
    { border: '#e11d48', bg: 'rgba(225, 29, 72, 0.25)' },   // Rojo / Rosa
    { border: '#d97706', bg: 'rgba(217, 119, 6, 0.25)' },   // Naranja
    { border: '#9333ea', bg: 'rgba(147, 51, 234, 0.25)' },  // Morado
    { border: '#0891b2', bg: 'rgba(8, 145, 178, 0.25)' }    // Cyan
];

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosReportes();
    
    const btnUpdate = document.getElementById('btnActualizar') || document.querySelector('.btn-success');
    if (btnUpdate) {
        btnUpdate.addEventListener('click', cargarDatosReportes);
    }
});

async function cargarDatosReportes() {
    try {
        const response = await fetch(`${API_URL}/obtener_reportes`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();

        if (data.success) {
            actualizarKPIs(data.kpis);
            if (data.graficas && data.graficas.length > 0) {
                datosGlobalesGrafica = data.graficas;
                
                // 1. Construir barra de navegación/filtro por bovino
                generarSelectorBovinos(datosGlobalesGrafica);

                // 2. Cargar vista general consolidada
                renderizarGraficaConsolidada(datosGlobalesGrafica);
            }
        }
    } catch (error) {
        console.error('Error al conectar con Flask:', error);
    }
}

function actualizarKPIs(kpis) {
    if (!kpis) return;
    const kpiTotal = document.getElementById('kpiTotalLitros');
    const kpiAlertas = document.getElementById('kpiTotalAlertas');
    const kpiProm = document.getElementById('kpiPromedio');

    if (kpiTotal) kpiTotal.textContent = `${kpis.total_litros} L`;
    if (kpiAlertas) kpiAlertas.textContent = kpis.total_alertas;
    if (kpiProm) kpiProm.textContent = `${kpis.promedio_general} L`;
}

// ==========================================
// 1. PANEL DE BOTONES INTERACTIVOS (UX)
// ==========================================
function generarSelectorBovinos(datos) {
    let contenedorSelector = document.getElementById('selectorBovinosContainer');

    if (!contenedorSelector) {
        const chartCanvas = document.getElementById('chartProduccion');
        if (!chartCanvas) return;

        contenedorSelector = document.createElement('div');
        contenedorSelector.id = 'selectorBovinosContainer';
        contenedorSelector.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; justify-content: center;';

        chartCanvas.parentNode.insertBefore(contenedorSelector, chartCanvas);
    }

    contenedorSelector.innerHTML = '';

    const bovinosUnicos = [...new Set(datos.map(d => d.bovino))];

    // Botón Vista General
    const btnTodos = document.createElement('button');
    btnTodos.className = 'btn-bovino active';
    btnTodos.innerHTML = '📊 Vista Consolidada';
    btnTodos.style.cssText = 'padding: 8px 16px; border-radius: 20px; border: None; background: #2563eb; color: white; cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;';
    
    btnTodos.onclick = () => {
        marcarBotonActivo(btnTodos);
        renderizarGraficaConsolidada(datosGlobalesGrafica);
    };
    contenedorSelector.appendChild(btnTodos);

    // Botón Individual por Bovino
    bovinosUnicos.forEach((bovino, index) => {
        const color = PALETA_COLORES[index % PALETA_COLORES.length];
        const btn = document.createElement('button');
        btn.className = 'btn-bovino';
        btn.innerHTML = `🐄 ${bovino}`;
        btn.style.cssText = `padding: 8px 16px; border-radius: 20px; border: 1px solid ${color.border}; background: #ffffff; color: ${color.border}; cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;`;

        btn.onclick = () => {
            marcarBotonActivo(btn, color.border);
            const datosFiltrados = datosGlobalesGrafica.filter(d => d.bovino === bovino);
            renderizarGraficaIndividual(bovino, datosFiltrados, color);
        };

        contenedorSelector.appendChild(btn);
    });
}

function marcarBotonActivo(botonSeleccionado, colorBorde = '#2563eb') {
    document.querySelectorAll('.btn-bovino').forEach(btn => {
        btn.style.background = '#ffffff';
        btn.style.color = '#64748b';
        btn.style.border = '1px solid #cbd5e1';
    });
    botonSeleccionado.style.background = colorBorde;
    botonSeleccionado.style.color = 'white';
    botonSeleccionado.style.border = `1px solid ${colorBorde}`;
}

// ==========================================
// 2. VISTA GENERAL: BARRAS COMPARATIVAS LIMPIAS
// ==========================================
function renderizarGraficaConsolidada(datos) {
    const ctx = document.getElementById('chartProduccion');
    if (!ctx || !window.Chart) return;

    // Calcular litros acumulados y promedio por bovino
    const bovinosMap = {};
    datos.forEach(reg => {
        if (!bovinosMap[reg.bovino]) {
            bovinosMap[reg.bovino] = { suma: 0, cuenta: 0 };
        }
        bovinosMap[reg.bovino].suma += reg.litros;
        bovinosMap[reg.bovino].cuenta += 1;
    });

    const etiquetas = Object.keys(bovinosMap);
    const valoresPromedio = etiquetas.map(b => (bovinosMap[b].suma / bovinosMap[b].cuenta).toFixed(1));
    const coloresBackground = etiquetas.map((_, i) => PALETA_COLORES[i % PALETA_COLORES.length].bg);
    const coloresBorder = etiquetas.map((_, i) => PALETA_COLORES[i % PALETA_COLORES.length].border);

    if (chartProduccionInstance) {
        chartProduccionInstance.destroy();
    }

    chartProduccionInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Promedio de Producción (Litros)',
                data: valoresPromedio,
                backgroundColor: coloresBackground,
                borderColor: coloresBorder,
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 45
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` Promedio: ${ctx.raw} Litros`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    title: { display: true, text: 'Litros (L)' }
                },
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Bovinos Registrados' }
                }
            }
        }
    });
}

// ==========================================
// 3. VISTA INDIVIDUAL: LÍNEA SUAVE CRONOLÓGICA
// ==========================================
function renderizarGraficaIndividual(nombreBovino, datos, color) {
    const ctx = document.getElementById('chartProduccion');
    if (!ctx || !window.Chart) return;

    // Ordenar por fecha cronológicamente
    datos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const etiquetasFechas = datos.map(reg => {
        const f = new Date(reg.fecha);
        return isNaN(f.getTime()) 
            ? `${reg.jornada}` 
            : `${f.getDate()}/${f.getMonth() + 1} (${reg.jornada})`;
    });

    const valoresLitros = datos.map(d => d.litros);

    if (chartProduccionInstance) {
        chartProduccionInstance.destroy();
    }

    chartProduccionInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetasFechas,
            datasets: [{
                label: `Histórico de ${nombreBovino}`,
                data: valoresLitros,
                borderColor: color.border,
                backgroundColor: color.bg,
                pointBackgroundColor: color.border,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 7,
                pointHoverRadius: 10,
                borderWidth: 3,
                tension: 0.35, // Curva suave
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { usePointStyle: true, boxWidth: 8 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` Producción: ${ctx.raw} L`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    title: { display: true, text: 'Litros (L)' }
                },
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Evolución de Pesajes' }
                }
            }
        }
    });
}