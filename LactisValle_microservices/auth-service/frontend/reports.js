const API_BASE_URL = "http://127.0.0.1:5000/api";
let graficoProduccion = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarAnalitica();
});

async function cargarAnalitica() {
    try {
        let response = await fetch(`${API_BASE_URL}/obtener_metricas`);
        let data = await response.json();

        if (response.ok && data.success) {
            actualizarTarjetasKPI(data.metricas);
            renderizarGrafica(data.metricas);
        } else {
            console.warn("No se pudieron cargar las métricas desde el servidor.");
        }
    } catch (error) {
        console.error("Error al conectar con la API de reportes:", error);
        alert("Atención: Necesitas conexión con el servidor Flask para visualizar las gráficas consolidadas.");
    }
}

function actualizarTarjetasKPI(metricas) {
    if (!metricas || metricas.length === 0) return;

    let totalLitros = 0;
    let totalAlertas = 0;

    metricas.forEach(item => {
        totalLitros += parseFloat(item.total_litros || 0);
        if (item.total_alertas) {
            totalAlertas += parseInt(item.total_alertas);
        }
    });

    const promedio = metricas.length > 0 ? (totalLitros / metricas.length).toFixed(1) : 0;

    document.getElementById('kpiTotalLitros').textContent = `${totalLitros.toFixed(1)} L`;
    document.getElementById('kpiPromedio').textContent = `${promedio} L`;
    document.getElementById('kpiTotalAlertas').textContent = totalAlertas;
}

function renderizarGrafica(metricas) {
    const canvas = document.getElementById('chartProduccion');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Obtener fechas únicas ordenadas
    const fechas = [...new Set(metricas.map(item => item.fecha))];
    const bovinos = [...new Set(metricas.map(item => item.id_bovino))];

    // Construir datasets por cada bovino
    const colores = ['#2E7D32', '#1976D2', '#D32F2F', '#F57C00', '#7B1FA2', '#009688'];
    const datasets = bovinos.map((bovino, idx) => {
        const color = colores[idx % colores.length];
        return {
            label: `Bovino: ${bovino}`,
            data: fechas.map(f => {
                const reg = metricas.find(m => m.fecha === f && m.id_bovino === bovino);
                return reg ? reg.total_litros : 0;
            }),
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        };
    });

    if (graficoProduccion) {
        graficoProduccion.destroy();
    }

    graficoProduccion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Litros (L)' }
                },
                x: {
                    title: { display: true, text: 'Fecha de Registro' }
                }
            }
        }
    });
}