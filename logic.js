/**
 * logic.js - Pure Calculation Logic
 * 
 * Contains financial engines and math helpers without DOM dependency.
 */

(function (App) {
    const L = {};

    // Helper to check version permission
    L.isUnlocked = (required) => {
        const ranks = { 'LITE': 0, 'PRO': 1, 'PREMIUM': 2 };
        const currentRank = ranks[App.APP_VERSION] || 0;
        const requiredRank = ranks[required] || 0;
        return currentRank >= requiredRank;
    };

    L.getSpouseIncomeContribution = (year, data, ageSelf, ageSpouse) => {
        if (!L.isUnlocked('PRO')) return 0;
        let income = 0;
        const currentYear = new Date().getFullYear();
        if (data.maritalStatus === 'married' && data.incomeSpouse > 0) {
            const currentAgeSpouse = parseInt(data.ageSpouse) + (year - currentYear);
            if (currentAgeSpouse < parseInt(data.retirementAgeSpouse)) {
                income = parseInt(data.incomeSpouse);
            } else if (currentAgeSpouse === parseInt(data.retirementAgeSpouse)) {
                income = parseInt(data.retirementAllowanceSpouse || 0);
            }
        }
        return income;
    };

    L.getHousingExpenseContribution = (year, data, ageSelf) => {
        let exp = 0;
        const strategy = data.housingStrategy;

        if (strategy === 'rental') {
            exp = (parseInt(data.rentMonthly) || 0) * 12;
        } else if (L.isUnlocked('PRO')) {
            if (strategy === 'already_owned') {
                if (ageSelf < parseInt(data.mortgageEndAge)) {
                    exp += (parseInt(data.mortgageMonthly) || 0) * 12;
                }
                exp += (parseInt(data.houseMaintenanceAnnual) || 0);
            } else if (strategy === 'buy_future') {
                if (ageSelf < parseInt(data.buyAge)) {
                    exp = (parseInt(data.buyRentCurrent) || 0) * 12;
                } else {
                    const buyAge = parseInt(data.buyAge);
                    const loanAmount = parseInt(data.buyPrice) - parseInt(data.buyDownpayment);
                    const loanTerm = parseInt(data.buyLoanTerm) || 35;
                    const loanRate = parseFloat(data.buyLoanRate) || 0;

                    if (ageSelf === buyAge) exp += parseInt(data.buyDownpayment);
                    if (ageSelf >= buyAge && ageSelf < (buyAge + loanTerm)) {
                        exp += L.calculateAnnualMortgage(loanAmount, loanRate, loanTerm);
                    }
                    exp += (parseInt(data.houseMaintenanceAnnual) || 0);
                }
            }
        }
        return exp;
    };

    L.getCarExpenseContribution = (year, data, ageSelf) => {
        if (!L.isUnlocked('PRO')) return 0;
        let exp = 0;
        const carCount = parseInt(data.carCount) || 0;
        for (let i = 1; i <= carCount; i++) {
            const price = parseInt(data[`car${i}Price`]);
            if (!price) continue;
            const nextAge = parseInt(data[`car${i}NextAge`]);
            const cycle = parseInt(data[`car${i}Cycle`]);
            const endAge = parseInt(data[`car${i}EndAge`]);
            if (ageSelf >= nextAge && ageSelf <= endAge) {
                if ((ageSelf - nextAge) % cycle === 0) exp += price;
            }
        }
        return exp;
    };

    L.getEducationCost = (age, course) => {
        if (!L.isUnlocked('PRO')) return 0;
        let cost = 0;
        if (age < 0) return 0;

        const base = App.EDUCATION_BASE_COSTS;
        if (age >= 3 && age <= 5) cost = base.preschool;
        else if (age >= 6 && age <= 11) cost = (course === 'all_private') ? base.elementary_private : base.elementary;
        else if (age >= 12 && age <= 14) cost = (course === 'all_private') ? base.juniorHigh_private : base.juniorHigh;
        else if (age >= 15 && age <= 17) cost = (course === 'all_public') ? base.highSchool_public : base.highSchool_private;
        else if (age >= 18 && age <= 21) {
            if (course === 'all_public') cost = base.university_public;
            else if (course === 'all_private_science') cost = base.university_private_science;
            else if (course === 'all_private_medical') cost = base.university_medical;
            else cost = base.university_private_arts;
        }
        // 仕様書：表の数値（base）に既に1.2倍が含まれているため、再乗算を廃止
        return cost / 10000;
    };

    L.calculatePension = (currentAge, retirementAge, avgIncome) => {
        if (avgIncome <= 0) return 0;
        const workYearsForBasic = Math.min(40, Math.max(0, Math.min(60, retirementAge) - 20));
        const basicPension = App.PENSION_BASIC_MAX * (workYearsForBasic / 40);
        const workYearsForKosei = Math.max(0, retirementAge - 22);
        const koseiPension = avgIncome * App.PENSION_KOSEI_RATE * workYearsForKosei;
        return basicPension + koseiPension;
    };

    L.calculateAnnualMortgage = (principal, annualRate, years) => {
        if (annualRate <= 0) return principal / years;
        const r = annualRate / 100 / 12;
        const n = years * 12;
        const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return monthlyPayment * 12;
    };

    // Monte Carlo Simulation Engine
    L.runMonteCarlo = (params, trials = 1000) => {
        const {
            ageSelf, incomeSelf, annualExpenses, initialCash, initialInvestment,
            annualInvestmentCap, returnRate, retirementAge, emergencyFundMonths,
            inflationRate, returnVolatility,
            maritalStatus, incomeSpouse, ageSpouse, retirementAgeSpouse,
            allowanceSelf, allowanceSpouse, pensionSelf, pensionSpouse,
            childCount, birthYear1, birthYear2, birthYear3,
            courseChild1, courseChild2, courseChild3,
            formData, activeEvents, currentYear
        } = params;

        const useGlidePath = params.useGlidePath;
        const GLIDE_TRANSITION_YEARS = 10;
        const GLIDE_VOL_FLOOR = 0.3;
        const GLIDE_RETURN_TARGET = 2.0;

        const simulationEndAge = params.simulationEndAge || 85;
        const simulationYears = simulationEndAge - ageSelf + 1;
        const allPaths = [];
        const allReturnPaths = [];
        const allBreakdowns = []; // Store breakdown for each trial
        const bankruptcyAges = [];

        for (let t = 0; t < trials; t++) {
            const rp = [];
            for (let i = 0; i < simulationYears; i++) {
                const age = ageSelf + i;
                let yearVol = returnVolatility;
                let yearReturn = returnRate;
                let u1 = Math.random();
                while (u1 === 0) u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                rp.push(yearReturn + (yearVol * z));
            }
            allReturnPaths.push(rp);

            let cash = initialCash;
            let investment = initialInvestment;
            let trialBankruptcyAge = null;
            const trialPath = [];
            const cashPath = [];
            const investmentPath = [];
            const incomePath = [];
            const expensePath = [];
            const familyAgesPath = [];

            for (let i = 0; i < simulationYears; i++) {
                const age = ageSelf + i;
                const year = currentYear + i;
                const currentAgeSpouse = ageSpouse + i;

                let incomeThisYear = 0;
                if (age < retirementAge) incomeThisYear += incomeSelf;
                else if (age >= App.PENSION_START_AGE) incomeThisYear += pensionSelf;
                if (age === retirementAge && allowanceSelf > 0) incomeThisYear += allowanceSelf;
                incomeThisYear += L.getSpouseIncomeContribution(year, formData, age, currentAgeSpouse);
                if (L.isUnlocked('PRO')) {
                    if (formData.maritalStatus === 'married' && currentAgeSpouse === retirementAgeSpouse && allowanceSpouse > 0)
                        incomeThisYear += allowanceSpouse;
                    if (formData.maritalStatus === 'married' && currentAgeSpouse >= App.PENSION_START_AGE)
                        incomeThisYear += pensionSpouse;
                }

                const inflationFactor = Math.pow(1 + (inflationRate / 100), i);
                let expenseThisYear = annualExpenses * inflationFactor;
                if (childCount >= 1 && birthYear1 > 0) expenseThisYear += L.getEducationCost(year - birthYear1, courseChild1) * inflationFactor;
                if (childCount >= 2 && birthYear2 > 0) expenseThisYear += L.getEducationCost(year - birthYear2, courseChild2) * inflationFactor;
                if (childCount >= 3 && birthYear3 > 0) expenseThisYear += L.getEducationCost(year - birthYear3, courseChild3) * inflationFactor;
                expenseThisYear += L.getHousingExpenseContribution(year, formData, age) * inflationFactor;
                expenseThisYear += L.getCarExpenseContribution(year, formData, age) * inflationFactor;
                activeEvents.forEach(event => {
                    let applicable = false;
                    if (event.mode === 'onetime' && age === event.age) applicable = true;
                    else if (event.mode === 'period' && age >= event.age && (!event.endAge || age <= event.endAge)) applicable = true;
                    else if (event.mode === 'continuous' && age >= event.age) applicable = true;

                    if (applicable) {
                        if (event.type === 'income') incomeThisYear += event.amount;
                        else expenseThisYear += event.amount;
                    }
                });

                const annualBalance = incomeThisYear - expenseThisYear;

                // --- Dynamic Cash Cushion (Active Rebalancing) ---
                const baseThreshold = (expenseThisYear / 12) * emergencyFundMonths;
                let emergencyThreshold = baseThreshold;

                if (useGlidePath) {
                    const glideStartAge = params.glideStartAge;
                    const glideDuration = params.glideDuration;
                    const glideTargetAmount = params.glideTargetAmount;

                    if (age >= glideStartAge) {
                        const progress = Math.min(1, Math.max(0, (age - glideStartAge) / Math.max(1, glideDuration)));
                        emergencyThreshold = baseThreshold + (glideTargetAmount - baseThreshold) * progress;
                    }
                }

                // Active Rebalancing: Sell investment to reach threshold
                if (useGlidePath && age >= params.glideStartAge) {
                    if (cash < emergencyThreshold && investment > 0) {
                        const needed = emergencyThreshold - cash;
                        const sellGross = needed / 0.95; // 5% flat friction (tax/fees)
                        const actualSell = Math.min(investment, sellGross);
                        investment -= actualSell;
                        cash += actualSell * 0.95;
                    }
                }

                if (annualBalance > 0) {
                    cash += annualBalance;
                    const investableBuffer = Math.max(0, cash - emergencyThreshold);
                    const actualInvestAmount = Math.min(investableBuffer, annualInvestmentCap);
                    investment += actualInvestAmount;
                    cash -= actualInvestAmount;
                } else {
                    const deficit = Math.abs(annualBalance);
                    const cashAboveThreshold = Math.max(0, cash - emergencyThreshold);
                    if (cashAboveThreshold >= deficit) {
                        cash -= deficit;
                    } else {
                        let remainingDeficit = deficit - cashAboveThreshold;
                        cash -= cashAboveThreshold;
                        if (investment >= remainingDeficit) investment -= remainingDeficit;
                        else {
                            remainingDeficit -= investment;
                            investment = 0;
                            cash -= remainingDeficit;
                        }
                    }
                }

                if (investment > 0) investment += investment * (rp[i] / 100);
                const totalAssets = cash + investment;

                trialPath.push(totalAssets);
                cashPath.push(Math.round(cash));
                investmentPath.push(Math.round(investment));
                incomePath.push(Math.round(incomeThisYear));
                expensePath.push(Math.round(expenseThisYear));

                const ages = { self: age };
                if (maritalStatus === 'married') ages.spouse = currentAgeSpouse;
                if (childCount >= 1 && birthYear1 > 0) ages.child1 = year - birthYear1;
                if (childCount >= 2 && birthYear2 > 0) ages.child2 = year - birthYear2;
                if (childCount >= 3 && birthYear3 > 0) ages.child3 = year - birthYear3;
                familyAgesPath.push(ages);

                if (totalAssets < 0 && trialBankruptcyAge === null) trialBankruptcyAge = age;
            }
            allPaths.push(trialPath);
            allBreakdowns.push({ cashPath, investmentPath, incomePath, expensePath, familyAgesPath });
            if (trialBankruptcyAge !== null) bankruptcyAges.push(trialBankruptcyAge);
        }

        // --- Sequence of Returns Risk Analysis ---
        const retireStartIdx = retirementAge - ageSelf;
        let seqRiskCrashTrials = 0;
        let seqRiskCrashBankrupt = 0;
        for (let t = 0; t < trials; t++) {
            let hadCrash = false;
            for (let y = 0; y < 5; y++) {
                const idx = retireStartIdx + y;
                if (idx >= 0 && idx < simulationYears && allReturnPaths[t][idx] < -20) {
                    hadCrash = true;
                    break;
                }
            }
            if (hadCrash) {
                seqRiskCrashTrials++;
                if (allPaths[t][allPaths[t].length - 1] < 0) seqRiskCrashBankrupt++;
            }
        }
        const seqRiskBankruptRate = seqRiskCrashTrials > 0 ? Math.round((seqRiskCrashBankrupt / seqRiskCrashTrials) * 100) : 0;

        const sortedByFinal = allPaths.map((path, idx) => ({ path, idx, final: path[path.length - 1] }))
            .sort((a, b) => a.final - b.final);

        const medianIdx = sortedByFinal[Math.floor(sortedByFinal.length / 2)].idx;
        const medianBreakdown = allBreakdowns[medianIdx];

        const worst5Indices = sortedByFinal.slice(0, 5).map(x => x.idx);
        const best5Indices = sortedByFinal.slice(-5).map(x => x.idx);

        const worst5Path = [];
        const medianPath = [];
        const best5Path = [];
        for (let i = 0; i < simulationYears; i++) {
            const w5 = worst5Indices.reduce((s, idx) => s + allPaths[idx][i], 0) / 5;
            const b5 = best5Indices.reduce((s, idx) => s + allPaths[idx][i], 0) / 5;
            const allAtI = allPaths.map(p => p[i]).sort((a, b) => a - b);
            const mid = Math.floor(allAtI.length / 2);
            const med = allAtI.length % 2 === 0 ? (allAtI[mid - 1] + allAtI[mid]) / 2 : allAtI[mid];
            worst5Path.push(Math.floor(w5));
            medianPath.push(Math.floor(med));
            best5Path.push(Math.floor(b5));
        }

        const survivalAt = (targetAge) => {
            const idx = targetAge - ageSelf;
            if (idx < 0 || idx >= simulationYears) return 100;
            const alive = allPaths.filter(p => p[idx] > 0).length;
            return Math.round((alive / trials) * 100);
        };

        const survivalRate = survivalAt(simulationEndAge);
        const survivalAgeMap = [];
        for (let i = 4; i >= 0; i--) {
            const age = simulationEndAge - (i * 5);
            if (age >= ageSelf) survivalAgeMap.push({ label: `${age}歳`, val: survivalAt(age) });
        }

        let medianPathBankruptAge = null;
        for (let i = 0; i < medianPath.length; i++) {
            if (medianPath[i] < 0) {
                medianPathBankruptAge = ageSelf + i;
                break;
            }
        }

        let medianBankruptcyAge = null;
        if (bankruptcyAges.length > 0) {
            const sorted = [...bankruptcyAges].sort((a, b) => a - b);
            const m = Math.floor(sorted.length / 2);
            medianBankruptcyAge = sorted.length % 2 === 0 ? Math.round((sorted[m - 1] + sorted[m]) / 2) : sorted[m];
        }

        return {
            medianPath, worst5Path, best5Path,
            survivalRate, survivalAgeMap,
            medianBankruptcyAge, medianPathBankruptAge,
            seqRiskCrashTrials, seqRiskBankruptRate,
            trials, allPaths, ageSelf, retirementAge,
            breakdown: medianBreakdown, // Consistency fixed
            _params: params
        };
    };


    // Attach to App
    App.Logic = L;
})(window.LifePlanApp);

console.log('LifePlanApp logic.js loaded');
