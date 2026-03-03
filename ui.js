/**
 * ui.js - UI Controller & DOM Interactions
 * 
 * Handles layout, tabs, life events, and input state.
 */

(function (App) {
    const UI = {};

    // --- State & Constants ---
    UI.updateSimulateButtonState = (isDirty) => {
        const btn = document.getElementById('simulate-btn-header');
        if (btn) {
            if (isDirty) btn.classList.add('primary');
            else btn.classList.remove('primary');
        }
        App.state.isDirty = isDirty;
    };

    UI.showError = (msg) => {
        const errorMessage = document.getElementById('error-message');
        console.error(msg);
        if (errorMessage) {
            errorMessage.textContent = msg;
            errorMessage.style.display = 'block';
        } else alert(msg);
    };

    UI.clearError = () => {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
    };

    UI.switchTab = (tabId) => {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        // Deactivate all tab items
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));

        // Activate target
        const target = document.getElementById(tabId);
        if (target) {
            target.classList.add('active');
            // Scroll to top of the content area
            const scrollArea = document.querySelector('.main-scroll-area');
            if (scrollArea) scrollArea.scrollTop = 0;
        }

        // Activate button
        const btn = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
        if (btn) btn.classList.add('active');

        // Optional: Resize chart if switching to diagnosis
        if (tabId === 'tab-diagnosis' && App.state.chartInstance) {
            App.state.chartInstance.resize();
        }
    };

    UI.initTabs = () => {
        document.querySelectorAll('.tab-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                UI.switchTab(tabId);
            });
        });
    };

    // --- Life Events Management ---
    UI.addEventRow = (data = null) => {
        const eventsContainer = document.getElementById('life-events-container');
        if (!eventsContainer) return;

        const initialData = { name: '', age: 40, endAge: '', type: 'expense', mode: 'onetime', amount: 300, ...data };
        const details = document.createElement('details');
        details.className = 'event-row';
        details.dataset.type = initialData.type;

        const getIcon = (name) => {
            if (name.includes('車')) return '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>';
            if (name.includes('家') || name.includes('リフォーム') || name.includes('住宅')) return '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>';
            if (name.includes('教育') || name.includes('学費') || name.includes('入学')) return '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 14l9 - 5 - 9 - 5 - 9 5 9 5z" /><path d="M12 14l6.16 - 3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00 - 6.824 - 2.998 12.078 12.078 0 01.665 - 6.479L12 14z" /></svg>';
            if (name.includes('結婚')) return '💍';
            if (name.includes('年金') || name.includes('退職')) return '💴';
            if (name.includes('介護')) return '🏥';
            if (name.includes('旅行')) return '✈️';
            return '📅';
        };

        const icon = getIcon(initialData.name);
        const nameDisplay = initialData.name ? `${icon} ${initialData.name}` : '(新規イベント)';

        const summary = document.createElement('summary');
        summary.className = 'event-summary';
        summary.innerHTML = `
            <div class="summary-content">
                <span class="summary-age">${initialData.age}歳</span>
                <span class="summary-name">${nameDisplay}</span>
                <span class="summary-amount">${initialData.amount}万円</span>
            </div>
            <span class="summary-chevron"></span>
        `;

        const content = document.createElement('div');
        content.className = 'event-details-content';
        content.innerHTML = `
            <div class="event-details-grid">
                <div class="m-input-group full">
                     <label>イベント名</label>
                     <div class="m-input-wrapper"><input type="text" class="event-name" value="${initialData.name}" placeholder="例：車の買い替え" style="text-align: left;"></div>
                </div>
                <div class="m-input-group">
                    <label>開始年齢</label>
                    <div class="m-input-wrapper"><input type="number" class="event-age" value="${initialData.age}" min="0" max="100"><span class="m-unit">歳</span></div>
                </div>
                <div class="m-input-group end-age-group" style="display: ${initialData.mode === 'period' ? 'flex' : 'none'};">
                    <label>終了年齢</label>
                    <div class="m-input-wrapper"><input type="number" class="event-age-end" value="${initialData.endAge}" placeholder="65" min="0" max="100"><span class="m-unit">歳</span></div>
                </div>
                <div class="m-input-group">
                    <label>タイプ</label>
                    <div class="m-input-wrapper">
                        <select class="event-type" style="width:100%; border:none; outline:none; font-size:14px; font-weight:600; background:transparent;">
                            <option value="income" ${initialData.type === 'income' ? 'selected' : ''}>収入</option>
                            <option value="expense" ${initialData.type === 'expense' ? 'selected' : ''}>支出</option>
                        </select>
                    </div>
                </div>
                <div class="m-input-group">
                    <label>期間モード</label>
                    <div class="m-input-wrapper">
                        <select class="event-mode" style="width:100%; border:none; outline:none; font-size:14px; font-weight:600; background:transparent;">
                            <option value="onetime" ${initialData.mode === 'onetime' ? 'selected' : ''}>単年（１回）</option>
                            <option value="continuous" ${initialData.mode === 'continuous' ? 'selected' : ''}>永続（開始～100歳）</option>
                            <option value="period" ${initialData.mode === 'period' ? 'selected' : ''}>期間指定</option>
                        </select>
                    </div>
                </div>
                <div class="m-input-group full">
                    <label>金額 (万円)</label>
                    <div class="m-input-wrapper"><input type="number" class="event-amount" value="${initialData.amount}" min="0"><span class="m-unit">万円</span></div>
                </div>
            </div>
            <div class="event-actions-row">
                <button type="button" class="close-event-btn">完了（とじる）</button>
                <button type="button" class="remove-event-btn">削除</button>
            </div>
        `;

        details.appendChild(summary);
        details.appendChild(content);

        const inputs = {
            name: content.querySelector('.event-name'),
            age: content.querySelector('.event-age'),
            amount: content.querySelector('.event-amount'),
            type: content.querySelector('.event-type'),
            mode: content.querySelector('.event-mode'),
            endAgeGroup: content.querySelector('.end-age-group')
        };
        const summarySpans = {
            name: summary.querySelector('.summary-name'),
            age: summary.querySelector('.summary-age'),
            amount: summary.querySelector('.summary-amount')
        };

        const updateSummary = () => {
            const icon = getIcon(inputs.name.value);
            summarySpans.name.textContent = inputs.name.value ? `${icon} ${inputs.name.value}` : '(新規イベント)';
            summarySpans.age.textContent = `${inputs.age.value}歳`;
            summarySpans.amount.textContent = `${inputs.amount.value}万円`;
            details.dataset.type = inputs.type.value;
        };

        inputs.name.addEventListener('input', updateSummary);
        inputs.age.addEventListener('input', updateSummary);
        inputs.age.addEventListener('change', () => UI.sortEvents());
        inputs.amount.addEventListener('input', updateSummary);
        inputs.type.addEventListener('change', updateSummary);
        inputs.mode.addEventListener('change', () => {
            inputs.endAgeGroup.style.display = (inputs.mode.value === 'period') ? 'flex' : 'none';
        });

        content.querySelector('.remove-event-btn').addEventListener('click', () => {
            if (confirm('このイベントを削除しますか？')) { details.remove(); UI.updateSimulateButtonState(true); }
        });
        content.querySelector('.close-event-btn').addEventListener('click', () => {
            details.open = false; UI.updateSimulateButtonState(true);
        });

        eventsContainer.appendChild(details);
    };

    UI.sortEvents = () => {
        const container = document.getElementById('life-events-container');
        if (!container) return;
        const rows = Array.from(container.querySelectorAll('.event-row'));
        rows.sort((a, b) => {
            const ageA = parseInt(a.querySelector('.event-age').value) || 0;
            const ageB = parseInt(b.querySelector('.event-age').value) || 0;
            return ageA - ageB;
        });
        rows.forEach(row => container.appendChild(row));
    };

    // --- Event Listener Helpers ---
    UI.initToggles = () => {
        // Yield Mode Radios
        document.querySelectorAll('input[name="yield-mode-radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const mode = e.target.value;
                if (mode === 'variable') {
                    if (volRow) volRow.style.display = 'grid';
                } else {
                    if (volRow) volRow.style.display = 'none';
                }
                UI.updateSimulateButtonState(true);
            });
        });

        // Housing Strategy
        document.querySelectorAll('input[name="housing-strategy"]').forEach(radio => {
            radio.addEventListener('change', (e) => UI.toggleHousingDetails(e.target.value));
        });

        // Marital Status
        document.querySelectorAll('input[name="marital-status"]').forEach(radio => {
            radio.addEventListener('change', (e) => UI.toggleMarriageInputs(e.target.value));
        });

        // Child Count
        document.querySelectorAll('input[name="child-count"]').forEach(radio => {
            radio.addEventListener('change', (e) => UI.toggleChildInputs(e.target.value));
        });

        // Car Count
        document.querySelectorAll('input[name="car-count"]').forEach(radio => {
            radio.addEventListener('change', (e) => UI.toggleCarInputs(e.target.value));
        });

        // Glide Path
        const glideCheck = document.getElementById('glide-path');
        if (glideCheck) {
            glideCheck.addEventListener('change', (e) => {
                const settings = document.getElementById('glide-settings');
                if (settings) settings.style.display = e.target.checked ? 'block' : 'none';
                UI.updateSimulateButtonState(true);
            });
        }
    };

    // --- Help Modal Logic ---
    UI.closeHelpModal = () => {
        const modal = document.getElementById('help-modal');
        if (modal) modal.classList.remove('active');
    };

    UI.initHelpModal = () => {
        const helpModal = document.getElementById('help-modal');
        const helpText = document.getElementById('help-text');
        if (!helpModal || !helpText) return;

        // Use event delegation for help icons
        document.body.addEventListener('click', (e) => {
            const icon = e.target.closest('.help-icon');
            if (icon) {
                const text = icon.getAttribute('data-help');
                if (text) {
                    helpText.innerHTML = text;
                    helpModal.classList.add('active');
                }
            }
        });

        // Close when clicking outside content
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) UI.closeHelpModal();
        });
    };

    // --- UI Visibility Toggles ---
    UI.toggleHousingDetails = (strategy) => {
        const rental = document.getElementById('housing-rental-fields');
        const owned = document.getElementById('housing-owned-fields');
        const future = document.getElementById('housing-future-fields');
        const container = document.getElementById('housing-details-container');

        if (rental) rental.style.display = 'none';
        if (owned) owned.style.display = 'none';
        if (future) future.style.display = 'none';
        if (container) container.style.display = 'block';

        if (strategy === 'rental' && rental) rental.style.display = 'block';
        else if (strategy === 'already_owned' && owned) owned.style.display = 'block';
        else if (strategy === 'buy_future' && future) future.style.display = 'block';
        else if (container) container.style.display = 'none';

        UI.applyVersionRestrictions();
    };

    UI.toggleMarriageInputs = (status) => {
        const spouseUnit = document.getElementById('spouse-profile-unit');
        if (spouseUnit) {
            spouseUnit.style.display = (status === 'married') ? 'block' : 'none';
        }
        UI.applyVersionRestrictions();
    };

    UI.toggleChildInputs = (count) => {
        const c1 = document.getElementById('child-1-group');
        const c2 = document.getElementById('child-2-group');
        const c3 = document.getElementById('child-3-group');
        const num = parseInt(count) || 0;

        if (c1) c1.style.display = (num >= 1) ? 'block' : 'none';
        if (c2) c2.style.display = (num >= 2) ? 'block' : 'none';
        if (c3) c3.style.display = (num >= 3) ? 'block' : 'none';

        UI.applyVersionRestrictions();
    };

    UI.toggleCarInputs = (count) => {
        const car1 = document.getElementById('car-1-details');
        const car2 = document.getElementById('car-2-details');
        const num = parseInt(count) || 0;

        if (car1) car1.style.display = (num >= 1) ? 'block' : 'none';
        if (car2) car2.style.display = (num >= 2) ? 'block' : 'none';

        UI.applyVersionRestrictions();
    };

    // --- Version Management ---
    UI.showUpsellModal = (required) => {
        const modal = document.getElementById('upsell-modal');
        const title = document.getElementById('upsell-title');
        const msg = document.getElementById('upsell-message');
        if (!modal) return;
        if (required === 'PRO') {
            title.textContent = 'Pro版限定の機能です';
            msg.textContent = '配偶者の設定、2名以上の子供設定、持家・住宅ローン、車の複数台シミュレーションのご利用にはPro版以上が必要です。';
        } else if (required === 'PREMIUM') {
            title.textContent = 'Premium版限定の機能です';
            msg.textContent = '相続税・生前贈与シミュレーション、高度な節税対策アドバイスのご利用には最上位のPremium版が必要です。';
        }
        modal.style.display = 'block';
    };

    UI.applyVersionRestrictions = () => {
        document.querySelectorAll('[data-version-required]').forEach(el => {
            const required = el.getAttribute('data-version-required');
            const allowed = App.Logic.isUnlocked ? App.Logic.isUnlocked(required) : true;
            if (!allowed) {
                el.classList.add('version-locked');
                if (['INPUT', 'SELECT', 'BUTTON'].includes(el.tagName)) el.disabled = true;
            } else {
                el.classList.remove('version-locked');
                if (['INPUT', 'SELECT', 'BUTTON'].includes(el.tagName)) el.disabled = false;
            }
        });
    };

    // --- Diagnosis Rendering ---
    UI.renderDiagnosis = (results, formData) => {
        const analysisEl = document.getElementById('analysis-text');
        if (!analysisEl) return;

        // Render Survival Ring
        const yieldMode = formData.yieldMode || 'fixed';
        let score = results.survivalRate;
        let ringColor = "#6366f1"; // Default primary

        if (yieldMode === 'fixed') {
            // Fixed Mode Scoring Logic (Align with Spec section 7)
            if (results.medianPathBankruptAge) {
                // 仕様：破綻年齢 / 100 * 50
                score = Math.max(10, Math.round((results.medianPathBankruptAge / 100) * 50));
                ringColor = "#ef4444";
            } else {
                const finalAssets = results.medianPath[results.medianPath.length - 1];
                // 仕様：>1億: 95, >5000: 85, >2000: 70, それ以下: 55
                if (finalAssets > 10000) { score = 95; ringColor = "#10b981"; }
                else if (finalAssets > 5000) { score = 85; ringColor = "#10b981"; }
                else if (finalAssets > 2000) { score = 70; ringColor = "#f59e0b"; }
                else { score = 55; ringColor = "#ef4444"; }
            }
        } else {
            // Variable Mode Color
            ringColor = score >= 90 ? "#10b981" : (score >= 70 ? "#f59e0b" : "#ef4444");
        }

        UI.renderSurvivalRing(score, yieldMode, ringColor);

        // Render Age Bars
        const barsContainer = document.getElementById('mc-age-bars-container');
        const mcReportCard = document.querySelector('.mc-report-card');
        if (barsContainer) {
            if (yieldMode === 'fixed') {
                if (mcReportCard) mcReportCard.style.display = 'none';
                barsContainer.innerHTML = '';
            } else if (results.survivalAgeMap) {
                if (mcReportCard) mcReportCard.style.display = 'block';
                barsContainer.innerHTML = '';
                results.survivalAgeMap.forEach(item => {
                    const bar = document.createElement('div');
                    bar.className = 'mc-age-bar';
                    const color = item.val > 80 ? '#10b981' : (item.val > 50 ? '#f59e0b' : '#ef4444');
                    bar.innerHTML = `
                        <div class="mc-age-label">${item.label}</div>
                        <div class="mc-age-track"><div class="mc-age-fill" style="width:0%; background:${color}"></div></div>
                        <div class="mc-age-val">${item.val}%</div>
                    `;
                    barsContainer.appendChild(bar);
                    setTimeout(() => {
                        bar.querySelector('.mc-age-fill').style.width = `${item.val}%`;
                    }, 1000);
                });
            }
        }

        // Advice Text (Align with Spec)
        let advice = "";
        if (score >= 95) {
            advice = `✨ 完璧なライフプラン: 盤石の体制です。資産継承などの出口戦略を視野に検討を始めましょう。`;
        } else if (score >= 85) {
            advice = `🟢 極めて健全: 十分な余力があります。生活の質をさらに上げる検討が可能です。`;
        } else if (score >= 70) {
            advice = `🟡 概ね良好: 安定していますが、突発的な大支出や長期間のインフレには注意が必要です。`;
        } else {
            advice = `🟠 注意が必要: 老後資金の余力が乏しいため、月々の支出見直しや予備費の確保を優先してください。`;
        }
        analysisEl.innerHTML = `<p>${advice}</p>`;
    };

    UI.renderSurvivalRing = (score, mode, color) => {
        const scoreEl = document.getElementById('survival-score');
        const ringEl = document.getElementById('survival-progress-ring');
        const titleEl = document.getElementById('survival-title');
        const subTitleEl = document.getElementById('survival-subtitle');
        const unitEl = document.querySelector('.survival-ring-unit');

        if (!scoreEl || !ringEl) return;

        scoreEl.textContent = score;
        scoreEl.style.color = color;
        const offset = 100 - score;
        ringEl.style.strokeDashoffset = offset;
        ringEl.style.stroke = color;

        if (unitEl) unitEl.textContent = (mode === 'variable') ? '%' : '点';

        if (score >= 95) {
            titleEl.textContent = "完璧なライフプラン";
            titleEl.style.color = "#10b981";
        } else if (score >= 85) {
            titleEl.textContent = "極めて健全";
            titleEl.style.color = "#10b981";
        } else if (score >= 70) {
            titleEl.textContent = "概ね良好";
            titleEl.style.color = "#f59e0b";
        } else {
            titleEl.textContent = "注意が必要";
            titleEl.style.color = "#ef4444";
        }

        if (mode === 'variable') {
            subTitleEl.textContent = "1000回のシミュレーションに基づく資産生存確率です。";
        } else {
            subTitleEl.textContent = "現在の設定に基づく総合評価スコアです。";
        }
    };

    // Attach to App
    App.UI = UI;
})(window.LifePlanApp);

console.log('LifePlanApp ui.js loaded');
