/**
 * chart.js - Chart Management
 * 
 * Handles Chart.js initialization, rendering, and zoom for both main and fullscreen views.
 */

(function (App) {
    const C = {};

    C.applyZoomAndRender = () => {
        const data = App.state.lastSimulationData;
        if (!data) return;

        const startAge = parseInt(document.getElementById('zoom-start').value);
        const endAge = parseInt(document.getElementById('zoom-end').value);
        const labelEl = document.getElementById('zoom-range-label');
        if (labelEl) labelEl.textContent = `${startAge}歳 〜 ${endAge}歳`;

        const simStartAge = parseInt(data.labels[0]);
        const startIndex = Math.max(0, startAge - simStartAge);
        const endIndex = Math.min(data.labels.length - 1, endAge - simStartAge) + 1;

        const fLabels = data.labels.slice(startIndex, endIndex);
        const fCash = data.dataCash.slice(startIndex, endIndex);
        const fInv = data.dataInvestment.slice(startIndex, endIndex);
        const fTot = data.dataTotal.slice(startIndex, endIndex);
        const fInc = data.dataIncomeTrend.slice(startIndex, endIndex);
        const fExp = data.dataExpenseTrend.slice(startIndex, endIndex);
        const fFamily = data.familyAgesTrend.slice(startIndex, endIndex);

        C.renderChart(fLabels, fCash, fInv, fTot, fInc, fExp, fFamily);
    };

    C.renderChart = (labels, dataCash, dataInvestment, dataTotal, dataIncomeTrend, dataExpenseTrend, familyAgesTrend) => {
        const canvas = document.getElementById('assetChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (App.state.chartInstance) App.state.chartInstance.destroy();

        if (typeof ChartZoom !== 'undefined') Chart.register(ChartZoom);

        // Ensure standard components are registered for v4 UMD core
        if (typeof Chart !== 'undefined' && Chart.register) {
            try {
                // Try registering common components just in case they aren't auto-registered
                // In full UMD this may be redundant but harmless.
                Chart.register(
                    Chart.BarController,
                    Chart.LineController,
                    Chart.BarElement,
                    Chart.PointElement,
                    Chart.LineElement,
                    Chart.CategoryScale,
                    Chart.LinearScale,
                    Chart.Tooltip,
                    Chart.Legend,
                    Chart.Filler
                );
            } catch (e) {
                // Already registered or not available - ignore
            }
        }

        App.state.chartInstance = new Chart(ctx, {
            data: {
                labels: labels,
                datasets: [
                    { type: 'line', label: '収入', data: dataIncomeTrend, borderColor: '#5DB08B', backgroundColor: 'rgba(93, 176, 139, 0.1)', borderWidth: 2.5, pointRadius: 0, tension: 0.4, yAxisID: 'y' },
                    { type: 'line', label: '支出', data: dataExpenseTrend, borderColor: '#E67E6E', backgroundColor: 'rgba(230, 126, 110, 0.1)', borderWidth: 2.5, pointRadius: 0, tension: 0.4, yAxisID: 'y' },
                    { type: 'bar', label: '預金', data: dataCash, backgroundColor: 'rgba(100, 160, 210, 0.6)', borderColor: 'rgba(100, 160, 210, 0.8)', borderWidth: 1, borderRadius: 4, yAxisID: 'y', stack: 'assets' },
                    { type: 'bar', label: '投資資産', data: dataInvestment, backgroundColor: 'rgba(230, 175, 60, 0.6)', borderColor: 'rgba(230, 175, 60, 0.8)', borderWidth: 1, borderRadius: 4, yAxisID: 'y', stack: 'assets' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 2000, easing: 'easeInOutQuart' },
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, weight: '800' } } },
                    tooltip: {
                        enabled: false,
                        external: (context) => C.customTooltip(context, familyAgesTrend, dataIncomeTrend, dataExpenseTrend, dataCash, dataInvestment, dataTotal)
                    },
                    zoom: {
                        pan: { enabled: true, mode: 'x', threshold: 0 },
                        zoom: { pinch: { enabled: true }, wheel: { enabled: true }, mode: 'x', speed: 0.05 },
                        limits: { x: { min: 'original', max: 'original', minRange: 10 } }
                    }
                },
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: '金額 (万円)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    C.customTooltip = (context, familyAgesTrend, dataIncomeTrend, dataExpenseTrend, dataCash, dataInvestment, dataTotal) => {
        let tooltipEl = document.getElementById('chartjs-tooltip');
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            document.body.appendChild(tooltipEl);
        }
        const tooltipModel = context.tooltip;
        if (tooltipModel.opacity === 0) { tooltipEl.style.opacity = 0; return; }

        if (tooltipModel.body) {
            const dataIndex = tooltipModel.dataPoints[0].dataIndex;
            const ages = familyAgesTrend[dataIndex];
            const currentYear = new Date().getFullYear();
            const actualYear = currentYear + dataIndex;

            let familyParts = [];
            if (ages.self !== undefined) familyParts.push(`<svg class='svg-icon' viewBox='0 0 24 24'><path d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg>${ages.self}歳`);
            if (ages.spouse !== undefined) familyParts.push(`<svg class='svg-icon sm' viewBox='0 0 24 24'><path d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg>${ages.spouse}歳`);

            tooltipEl.innerHTML = `
                <div class="tooltip-header"><span>📅 ${actualYear}年</span><span>${familyParts.join(' ')}</span></div>
                <div class="m-tooltip-body">
                    <div class="m-tooltip-row"><div>預金</div><div>¥${dataCash[dataIndex].toLocaleString()}万</div></div>
                    <div class="m-tooltip-row"><div>投資</div><div>¥${dataInvestment[dataIndex].toLocaleString()}万</div></div>
                    <div class="m-tooltip-row"><strong>合計</strong><strong>¥${dataTotal[dataIndex].toLocaleString()}万</strong></div>
                    <div class="m-tooltip-divider"></div>
                    <div class="m-tooltip-row"><span>収入</span><span style="color:#10b981;">+¥${dataIncomeTrend[dataIndex].toLocaleString()}万</span></div>
                    <div class="m-tooltip-row"><span>支出</span><span style="color:#ef4444;">-¥${dataExpenseTrend[dataIndex].toLocaleString()}万</span></div>
                </div>
            `;
        }
        const pos = context.chart.canvas.getBoundingClientRect();
        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = (pos.left + window.pageXOffset + tooltipModel.caretX - 90) + 'px';
        tooltipEl.style.top = (pos.top + window.pageYOffset + tooltipModel.caretY - 200) + 'px';
    };

    // --- Fullscreen Chart Logic ---
    C.toggleFullscreenChart = () => {
        const modal = document.getElementById('chart-modal');
        const isOpening = !modal.classList.contains('active');
        if (isOpening) {
            modal.classList.add('active');
            // Initial HUD state
            C.updateFullscreenHUD(30);
            setTimeout(() => {
                C.renderFullscreenChart();
                // Attach reset zoom listener after render
                const resetBtn = document.getElementById('reset-zoom-btn');
                if (resetBtn) {
                    resetBtn.onclick = () => {
                        if (App.state.fullscreenChartInstance) {
                            App.state.fullscreenChartInstance.resetZoom();
                            C.updateFullscreenHUD(Math.round(App.state.lastSimulationData.labels.length / 2));
                        }
                    };
                }
            }, 300);
        } else {
            modal.classList.remove('active');
            if (App.state.fullscreenChartInstance) {
                App.state.fullscreenChartInstance.destroy();
                App.state.fullscreenChartInstance = null;
            }
        }
    };

    C.updateFullscreenHUD = (dataIndex) => {
        if (dataIndex === App.state.lastHudIndex) return;
        App.state.lastHudIndex = dataIndex;
        const data = App.state.lastSimulationData;
        if (!data) return;

        const currentYear = new Date().getFullYear();
        const actualYear = currentYear + dataIndex;
        const ages = data.familyAgesTrend[dataIndex];

        // Update Year & Ages
        let familyStr = "";
        if (ages) {
            let parts = [];
            if (ages.self !== undefined) parts.push(`<svg class='svg-icon' viewBox='0 0 24 24'><path d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg>本人:${ages.self}歳`);
            if (ages.spouse !== undefined) parts.push(`<svg class='svg-icon sm' viewBox='0 0 24 24'><path d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg>配偶者:${ages.spouse}歳`);

            // Add Children Ages with Labels
            if (ages.child1 !== undefined) parts.push(`<span style="margin-left:8px;">子1:${ages.child1}歳</span>`);
            if (ages.child2 !== undefined) parts.push(`<span style="margin-left:4px;">子2:${ages.child2}歳</span>`);
            if (ages.child3 !== undefined) parts.push(`<span style="margin-left:4px;">子3:${ages.child3}歳</span>`);

            familyStr = parts.join(' ');
        }
        const timeHud = document.getElementById('fullscreen-year-hud');
        if (timeHud) timeHud.innerHTML = `📅 ${actualYear}年  ${familyStr}`;

        // Update Grid Values
        const updateVal = (id, val, prefix = "") => {
            const el = document.getElementById(id);
            if (el) el.textContent = `${prefix}${Math.round(val).toLocaleString()}万`;
        };

        updateVal('hud-val-income', data.dataIncomeTrend[dataIndex], "+");
        updateVal('hud-val-expense', data.dataExpenseTrend[dataIndex], "-");
        updateVal('hud-val-cash', data.dataCash[dataIndex]);
        updateVal('hud-val-inv', data.dataInvestment[dataIndex]);
        updateVal('hud-val-total', data.dataTotal[dataIndex]);
    };

    C.renderFullscreenChart = () => {
        const data = App.state.lastSimulationData;
        if (!data) return;
        const canvas = document.getElementById('assetChart-fullscreen');
        const ctx = canvas.getContext('2d');
        if (App.state.fullscreenChartInstance) App.state.fullscreenChartInstance.destroy();

        App.state.fullscreenChartInstance = new Chart(ctx, {
            data: {
                labels: data.labels,
                datasets: [
                    { type: 'line', label: '収入', data: data.dataIncomeTrend, borderColor: '#5DB08B', borderWidth: 3, pointRadius: 0, tension: 0.4, yAxisID: 'y' },
                    { type: 'line', label: '支出', data: data.dataExpenseTrend, borderColor: '#E67E6E', borderWidth: 3, pointRadius: 0, tension: 0.4, yAxisID: 'y' },
                    { type: 'bar', label: '預金', data: data.dataCash, backgroundColor: 'rgba(100, 160, 210, 0.6)', yAxisID: 'y', stack: 'assets' },
                    { type: 'bar', label: '投資資産', data: data.dataInvestment, backgroundColor: 'rgba(230, 175, 60, 0.6)', yAxisID: 'y', stack: 'assets' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                plugins: {
                    legend: { display: true, position: 'bottom' },
                    tooltip: {
                        enabled: false, external: (ctx) => {
                            const model = ctx.tooltip;
                            if (model.opacity !== 0 && model.body) C.updateFullscreenHUD(model.dataPoints[0].dataIndex);
                        }
                    },
                    zoom: {
                        pan: { enabled: true, mode: 'x', onPan: ({ chart }) => C.updateFullscreenHUD(Math.round((chart.scales.x.min + chart.scales.x.max) / 2)) },
                        zoom: { pinch: { enabled: true }, wheel: { enabled: true }, mode: 'x', onZoom: ({ chart }) => C.updateFullscreenHUD(Math.round((chart.scales.x.min + chart.scales.x.max) / 2)) }
                    }
                },
                scales: { y: { beginAtZero: true }, x: { ticks: { maxRotation: 0 } } }
            }
        });
    };

    window.hideAllTooltips = () => {
        const tooltip = document.getElementById('chartjs-tooltip');
        if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.pointerEvents = 'none'; }
    };
    window.toggleFullscreenChart = C.toggleFullscreenChart;

    App.Chart = C;
})(window.LifePlanApp);
