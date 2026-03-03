/**
 * main.js - App Orchestrator
 * 
 * Ties components together, handles simulation flow, and data persistence.
 */

(function (App) {
    const UI = App.UI;
    const Logic = App.Logic;
    const Chart = App.Chart;

    // --- Core Simulation Entry Point ---
    window.runSimulation = function () {
        UI.clearError();

        // --- 1. Comprehensive Validation ---
        const errors = [];
        const getEl = (id) => document.getElementById(id);
        const getChecked = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;

        const maritalStatus = getChecked('marital-status');
        const childCount = parseInt(getChecked('child-count')) || 0;
        const housingStrategy = getChecked('housing-strategy');

        const requiredFields = [
            { id: 'age-self', label: '本人の年齢' },
            { id: 'income-self', label: '本人の年収' },
            { id: 'annual-expenses', label: '年間支出' },
            { id: 'initial-cash', label: '現在の現預金' },
            { id: 'initial-investment', label: '現在の投資資産' },
            { id: 'retirement-age', label: '本人の退職年齢' },
            { id: 'emergency-fund-months', label: '生活防衛資金' }
        ];

        if (maritalStatus === 'married') {
            requiredFields.push({ id: 'age-spouse', label: '配偶者の年齢' });
            requiredFields.push({ id: 'income-spouse', label: '配偶者の年収' });
            requiredFields.push({ id: 'retirement-age-spouse', label: '配偶者の退職年齢' });
        }
        if (childCount >= 1) requiredFields.push({ id: 'birth-year-child-1', label: '第1子の誕生年' });
        if (childCount >= 2) requiredFields.push({ id: 'birth-year-child-2', label: '第2子の誕生年' });
        if (childCount >= 3) requiredFields.push({ id: 'birth-year-child-3', label: '第3子の誕生年' });

        if (housingStrategy === 'buy_future') {
            requiredFields.push({ id: 'buy-age', label: '購入年齢' });
            requiredFields.push({ id: 'buy-price', label: '購入価格' });
            requiredFields.push({ id: 'buy-loan-rate', label: 'ローン金利' });
        }

        // Clear previous invalid states
        document.querySelectorAll('.m-input-wrapper').forEach(el => el.classList.remove('is-invalid'));

        requiredFields.forEach(field => {
            const el = getEl(field.id);
            if (!el) return;
            const val = el.value.trim();
            const wrapper = el.closest('.m-input-wrapper');

            if (val === '') {
                errors.push(`${field.label}を入力してください`);
                if (wrapper) wrapper.classList.add('is-invalid');
            } else if (isNaN(parseFloat(val))) {
                errors.push(`${field.label}には数値を入力してください`);
                if (wrapper) wrapper.classList.add('is-invalid');
            }
        });

        if (errors.length > 0) {
            UI.showError(`修正が必要です：\n・${errors.join('\n・')}`);
            const firstErr = document.querySelector('.is-invalid');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const data = gatherFormData();
        if (!data) return;

        const params = {
            ...data,
            pensionSelf: Logic.calculatePension(data.ageSelf, data.retirementAge, data.incomeSelf),
            pensionSpouse: Logic.calculatePension(data.ageSpouse, data.retirementAgeSpouse, data.incomeSpouse),
            allowanceSelf: parseInt(getEl('retirement-allowance')?.value || 0),
            allowanceSpouse: parseInt(getEl('retirement-allowance-spouse')?.value || 0),
            activeEvents: gatherEvents(),
            useGlidePath: data.useGlidePath,
            simulationEndAge: parseInt(getEl('simulation-end-age')?.value || 100),
            currentYear: new Date().getFullYear(),
            formData: data
        };

        const yieldMode = data.yieldMode;
        let mcResult;

        if (yieldMode === 'variable') {
            mcResult = Logic.runMonteCarlo(params, 1000);
        } else {
            mcResult = Logic.runMonteCarlo({ ...params, returnVolatility: 0 }, 1);
        }

        App.state.lastSimulationData = formatMCResultForChart(mcResult);
        updateSummaryUI(mcResult);
        Chart.applyZoomAndRender();

        UI.updateSimulateButtonState(false);
        console.log('Simulation complete', mcResult);
    };

    function gatherFormData() {
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : null;
        };
        const getNum = (id) => parseFloat(getVal(id)) || 0;
        const getChecked = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;

        return {
            ageSelf: getNum('age-self'),
            ageSpouse: getNum('age-spouse'),
            maritalStatus: getChecked('marital-status'),
            incomeSelf: getNum('income-self'),
            incomeSpouse: getNum('income-spouse'),
            retirementAge: getNum('retirement-age'),
            retirementAgeSpouse: getNum('retirement-age-spouse'),
            childCount: parseInt(getChecked('child-count')) || 0,
            birthYear1: getNum('birth-year-child-1'),
            courseChild1: getVal('course-child-1'),
            birthYear2: getNum('birth-year-child-2'),
            courseChild2: getVal('course-child-2'),
            birthYear3: getNum('birth-year-child-3'),
            courseChild3: getVal('course-child-3'),
            initialCash: getNum('initial-cash'),
            initialInvestment: getNum('initial-investment'),
            annualInvestmentCap: getNum('annual-investment-cap') * 12,
            returnRate: getNum('return-rate'),
            annualExpenses: getNum('annual-expenses'),
            emergencyFundMonths: getNum('emergency-fund-months'),
            inflationRate: getNum('inflation-rate'),
            returnVolatility: getNum('return-volatility'),
            housingStrategy: getChecked('housing-strategy'),
            rentMonthly: getNum('rent-monthly'),
            mortgageMonthly: getNum('mortgage-monthly'),
            mortgageEndAge: getNum('mortgage-end-age'),
            houseMaintenanceAnnual: getNum('house-maintenance-annual'),
            buyAge: getNum('buy-age'),
            buyPrice: getNum('buy-price'),
            buyDownpayment: getNum('buy-downpayment'),
            buyLoanTerm: getNum('buy-loan-term'),
            buyLoanRate: getNum('buy-loan-rate'),
            buyRentCurrent: getNum('buy-rent-current'),
            useGlidePath: document.getElementById('glide-path')?.checked || false,
            glideTargetAmount: getNum('glide-target-amount'),
            glideStartAge: getNum('glide-start-age'),
            glideDuration: getNum('glide-duration'),
            carCount: getChecked('car-count'),
            car1Price: getNum('car-1-price'),
            car1NextAge: getNum('car-1-next-age'),
            car1Cycle: getNum('car-1-cycle'),
            car1EndAge: getNum('car-1-end-age'),
            yieldMode: getChecked('yield-mode-radio') || 'fixed',
            car2Price: getNum('car-2-price'),
            car2NextAge: getNum('car-2-next-age'),
            car2Cycle: getNum('car-2-cycle'),
            car2EndAge: getNum('car-2-end-age')
        };
    }

    function gatherEvents() {
        const events = [];
        document.querySelectorAll('.event-row').forEach(row => {
            const name = row.querySelector('.event-name').value;
            const age = parseInt(row.querySelector('.event-age').value);
            const amount = parseFloat(row.querySelector('.event-amount').value);
            if (name && !isNaN(age) && !isNaN(amount)) {
                events.push({
                    name, age, amount,
                    type: row.querySelector('.event-type').value,
                    mode: row.querySelector('.event-mode').value,
                    endAge: parseInt(row.querySelector('.event-age-end').value) || null
                });
            }
        });
        return events;
    }

    function formatMCResultForChart(res) {
        const labels = [];
        for (let a = res.ageSelf; a < res.ageSelf + res.medianPath.length; a++) labels.push(a.toString());

        const b = res.breakdown;

        return {
            labels,
            dataCash: b.cashPath,
            dataInvestment: b.investmentPath,
            dataTotal: res.medianPath,
            dataIncomeTrend: b.incomePath,
            dataExpenseTrend: b.expensePath,
            familyAgesTrend: b.familyAgesPath
        };
    }

    function updateSummaryUI(res) {
        const finalAssets = res.medianPath[res.medianPath.length - 1];
        const endAge = (res.ageSelf + res.medianPath.length - 1);

        document.getElementById('summary-end-age-label').textContent = endAge;
        const finalEl = document.getElementById('summary-final-assets');
        if (finalEl) {
            finalEl.textContent = Math.round(finalAssets).toLocaleString();
            finalEl.style.color = finalAssets < 0 ? '#ef4444' : '#10b981';
        }

        const emptyEl = document.getElementById('summary-empty-year');
        if (emptyEl) {
            emptyEl.textContent = res.medianPathBankruptAge || '--';
            const card = document.getElementById('empty-year-card');
            if (card) {
                if (res.medianPathBankruptAge) card.classList.add('danger');
                else card.classList.remove('danger');
            }
        }

        displayDiagnosis(res);
    }

    function displayDiagnosis(res) {
        if (App.UI && App.UI.renderDiagnosis) {
            App.UI.renderDiagnosis(res, gatherFormData());
        }
    }

    // --- Persistence ---
    function saveToLocal() {
        const pin = window.prompt('顧客データを暗号化するための4桁のPINコードを設定してください:');
        if (!pin) return;

        const data = {
            profile: gatherFormData(),
            events: gatherEvents(),
            meta: { version: App.APP_VERSION, savedAt: new Date().toISOString() }
        };

        try {
            const jsonStr = JSON.stringify(data);
            const encrypted = CryptoJS.AES.encrypt(jsonStr, pin).toString();
            localStorage.setItem('lifePlanData', encrypted);
            alert('暗号化して保存しました');
        } catch (e) {
            console.error('Encryption failed', e);
            alert('保存に失敗しました');
        }
    }

    function loadFromLocal() {
        const encrypted = localStorage.getItem('lifePlanData');
        if (!encrypted) return;

        const pin = window.prompt('データを復元するためのPINコードを入力してください:');
        if (!pin) return;

        try {
            const bytes = CryptoJS.AES.decrypt(encrypted, pin);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) {
                throw new Error('Invalid PIN');
            }

            const data = JSON.parse(decryptedData);
            restoreData(data);
            alert('データを復元しました');
        } catch (e) {
            console.error('Decryption failed', e);
            alert('PINコードが違います。データの復元に失敗しました。');
        }
    }

    function restoreData(data) {
        if (!data || !data.profile) return;
        const p = data.profile;
        const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val; };
        const setChecked = (name, val) => {
            const rad = document.querySelector(`input[name = "${name}"][value = "${val}"]`);
            if (rad) { rad.checked = true; rad.dispatchEvent(new Event('change')); }
        };

        setVal('age-self', p.ageSelf);
        setVal('age-spouse', p.ageSpouse);
        setChecked('marital-status', p.maritalStatus);
        setVal('income-self', p.incomeSelf);
        setVal('income-spouse', p.incomeSpouse);
        setVal('retirement-age', p.retirementAge);
        setVal('retirement-age-spouse', p.retirementAgeSpouse);
        setChecked('child-count', p.childCount);
        setVal('birth-year-child-1', p.birthYear1);
        setVal('course-child-1', p.courseChild1);
        setVal('birth-year-child-2', p.birthYear2);
        setVal('course-child-2', p.courseChild2);
        setVal('birth-year-child-3', p.birthYear3);
        setVal('course-child-3', p.courseChild3);

        setVal('initial-cash', p.initialCash);
        setVal('initial-investment', p.initialInvestment);
        setVal('annual-investment-cap', p.annualInvestmentCap / 12);
        setVal('annual-expenses', p.annualExpenses);
        setVal('return-rate', p.returnRate);
        setVal('return-volatility', p.returnVolatility || 15.0);
        setVal('inflation-rate', p.inflationRate || 0.0);
        setVal('emergency-fund-months', p.emergencyFundMonths || 6);

        setChecked('housing-strategy', p.housingStrategy);
        setVal('rent-monthly', p.rentMonthly);
        setVal('mortgage-monthly', p.mortgageMonthly);
        setVal('mortgage-end-age', p.mortgageEndAge);
        setVal('house-maintenance-annual', p.houseMaintenanceAnnual);
        setVal('buy-age', p.buyAge);
        setVal('buy-price', p.buyPrice);
        setVal('buy-downpayment', p.buyDownpayment);
        setVal('buy-loan-term', p.buyLoanTerm);
        setVal('buy-loan-rate', p.buyLoanRate);
        setVal('buy-rent-current', p.buyRentCurrent);

        setChecked('yield-mode-radio', p.yieldMode || 'fixed');

        setVal('car-1-price', p.car1Price);
        setVal('car-1-next-age', p.car1NextAge);
        setVal('car-1-cycle', p.car1Cycle);
        setVal('car-1-end-age', p.car1EndAge);
        setVal('car-2-price', p.car2Price);
        setVal('car-2-next-age', p.car2NextAge);
        setVal('car-2-cycle', p.car2Cycle);
        setVal('car-2-end-age', p.car2EndAge);

        setVal('glide-target-amount', p.glideTargetAmount || 1000);
        setVal('glide-start-age', p.glideStartAge || 60);
        setVal('glide-duration', p.glideDuration || 5);
        const glideCheck = document.getElementById('glide-path');
        if (glideCheck) {
            glideCheck.checked = p.useGlidePath || false;
            glideCheck.dispatchEvent(new Event('change'));
        }

        const container = document.getElementById('life-events-container');
        if (container && data.events) {
            container.innerHTML = '';
            data.events.forEach(evt => UI.addEventRow(evt));
        }
        UI.updateSimulateButtonState(true);
    }



    // --- Init ---
    document.addEventListener('DOMContentLoaded', () => {
        // Init UI States
        UI.applyVersionRestrictions();
        UI.sortEvents();
        UI.initHelpModal();
        UI.initTabs();
        UI.initToggles(); // Use centralized toggle initialization

        // Generic Listeners for dirty state
        document.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('change', () => UI.updateSimulateButtonState(true));
        });

        // Save/Load Buttons
        document.getElementById('save-local-btn')?.addEventListener('click', saveToLocal);
        document.getElementById('load-local-btn')?.addEventListener('click', loadFromLocal);

        // Initial UI state setup - trigger all toggles on load to set initial visibility
        UI.toggleMarriageInputs(document.querySelector('input[name="marital-status"]:checked')?.value || 'married');
        UI.toggleChildInputs(document.querySelector('input[name="child-count"]:checked')?.value || '1');
        UI.toggleCarInputs(document.querySelector('input[name="car-count"]:checked')?.value || '1');
        UI.toggleHousingDetails(document.querySelector('input[name="housing-strategy"]:checked')?.value || 'rental');

        // Initial Yield Mode UI setup (triggering manually since initToggles only adds listeners)
        const initialYieldMode = document.querySelector('input[name="yield-mode-radio"]:checked')?.value || 'fixed';
        const volRow = document.getElementById('volatility-row');
        if (volRow) volRow.style.display = (initialYieldMode === 'variable') ? 'grid' : 'none';

        // Add Event Button
        document.getElementById('add-event-btn')?.addEventListener('click', () => UI.addEventRow());

        // Global click listener to hide tooltips
        document.addEventListener('click', (e) => {
            const tooltip = document.getElementById('chartjs-tooltip');
            if (tooltip && tooltip.style.opacity !== '0' && !e.target.closest('.chart-box')) {
                window.hideAllTooltips();
            }
        }, { capture: true });

        // Initial Run
        window.runSimulation();
    });

})(window.LifePlanApp);
