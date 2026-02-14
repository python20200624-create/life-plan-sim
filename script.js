// Debug log to confirm script execution
console.log('Script loaded v3');

// --- Phase 4(5): Education Cost Constants ---
const EDUCATION_RISK_RATE = 1.2;
const EDUCATION_BASE_COSTS = {
    preschool: 300000,           // 幼稚園・保育園（3-5歳）
    elementary: 350000,          // 小学校（公立）
    elementary_private: 1600000, // 小学校（私立）
    juniorHigh: 540000,          // 中学校（公立）
    juniorHigh_private: 1400000, // 中学校（私立）
    highSchool_public: 520000,   // 高校（公立）
    highSchool_private: 1050000, // 高校（私立）
    university_public: 1100000,  // 大学（国公立）
    university_private_arts: 1500000, // 大学（私立文系）
    university_private_science: 1800000 // 大学（私立理系）
};

// Helper: Get Education Cost
const getEducationCost = (age, course) => {
    let cost = 0;

    // Preschool (3-5)
    if (age >= 3 && age <= 5) {
        cost = EDUCATION_BASE_COSTS.preschool;
    }
    // Elementary (6-11)
    else if (age >= 6 && age <= 11) {
        cost = (course === 'all_private') ? EDUCATION_BASE_COSTS.elementary_private : EDUCATION_BASE_COSTS.elementary;
    }
    // Junior High (12-14)
    else if (age >= 12 && age <= 14) {
        cost = (course === 'all_private') ? EDUCATION_BASE_COSTS.juniorHigh_private : EDUCATION_BASE_COSTS.juniorHigh;
    }
    // High School (15-17)
    else if (age >= 15 && age <= 17) {
        cost = (course === 'all_public') ? EDUCATION_BASE_COSTS.highSchool_public : EDUCATION_BASE_COSTS.highSchool_private;
    }
    // University (18-21)
    else if (age >= 18 && age <= 21) {
        // Simplified university logic based on course name, otherwise default to Private Arts
        // course: 'all_private' -> Private Arts (default assumption for "All Private")
        // course: 'public_high_private_uni' -> Private Arts
        // course: 'all_public' -> Public
        if (course === 'all_public') {
            cost = EDUCATION_BASE_COSTS.university_public;
        } else {
            cost = EDUCATION_BASE_COSTS.university_private_arts; // Default private logic
        }
    }

    // Apply Risk Rate
    return cost * EDUCATION_RISK_RATE / 10000; // Convert to "Man-yen" (Base costs are in Yen)
};

// Event Management Logic
const addEventBtn = document.getElementById('add-event-btn');
const eventsContainer = document.getElementById('life-events-container');

if (addEventBtn && eventsContainer) {
    // Function to add a new event row
    // Function to add a new event row (Accordion Style)
    const addEventRow = (data = null) => {
        // Default Data
        const initialData = {
            name: '',
            age: 40,
            endAge: '',
            type: 'expense',
            mode: 'onetime',
            amount: 300,
            ...data
        };

        const details = document.createElement('details');
        details.className = 'event-row';
        details.dataset.type = initialData.type; // For color coding

        // Auto Icon Logic
        const getIcon = (name) => {
            if (name.includes('車')) return '🚗';
            if (name.includes('家') || name.includes('リフォーム') || name.includes('住宅')) return '🏠';
            if (name.includes('教育') || name.includes('学費') || name.includes('入学')) return '🎓';
            if (name.includes('結婚')) return '💍';
            if (name.includes('年金') || name.includes('退職')) return '💴';
            if (name.includes('介護')) return '🏥';
            if (name.includes('旅行')) return '✈️';
            return '📅';
        };

        const icon = getIcon(initialData.name);
        const nameDisplay = initialData.name ? `${icon} ${initialData.name}` : '(新規イベント)';

        // Summary HTML (Closed View)
        const summary = document.createElement('summary');
        summary.className = 'event-summary';
        summary.innerHTML = `
            <div class="summary-content">
                <span class="summary-age">${initialData.age}歳</span>
                <span class="summary-name">${nameDisplay}</span>
                <span class="summary-amount">${initialData.amount}万円</span>
            </div>
        `;

        // Details HTML (Open View - Form)
        const content = document.createElement('div');
        content.className = 'event-details-content';
        content.innerHTML = `
            <div class="event-details-grid">
                <div class="input-group full-width">
                     <label>イベント名</label>
                     <input type="text" class="event-name" value="${initialData.name}" placeholder="例：車の買い替え">
                </div>

                <div class="input-group">
                    <label>開始年齢</label>
                    <div class="input-with-unit">
                        <input type="number" class="event-age" value="${initialData.age}" min="0" max="100">
                        <span>歳</span>
                    </div>
                </div>

                <div class="input-group end-age-group" style="display: ${initialData.mode === 'period' ? 'flex' : 'none'};">
                    <label>終了年齢</label>
                    <div class="input-with-unit">
                         <input type="number" class="event-age-end" value="${initialData.endAge}" placeholder="65" min="0" max="100">
                         <span>歳</span>
                    </div>
                </div>

                <div class="input-group">
                    <label>タイプ</label>
                    <select class="event-type">
                        <option value="income" ${initialData.type === 'income' ? 'selected' : ''}>収入</option>
                        <option value="expense" ${initialData.type === 'expense' ? 'selected' : ''}>支出</option>
                    </select>
                </div>

                <div class="input-group">
                    <label>期間モード</label>
                    <select class="event-mode">
                        <option value="onetime" ${initialData.mode === 'onetime' ? 'selected' : ''}>単年（１回）</option>
                        <option value="continuous" ${initialData.mode === 'continuous' ? 'selected' : ''}>永続（開始～100歳）</option>
                        <option value="period" ${initialData.mode === 'period' ? 'selected' : ''}>期間指定（開始～終了）</option>
                    </select>
                </div>

                <div class="input-group full-width">
                    <label>金額 (万円)</label>
                    <div class="input-with-unit">
                        <input type="number" class="event-amount" value="${initialData.amount}" min="0">
                        <span>万円</span>
                    </div>
                </div>
            </div>
            <button type="button" class="remove-event-btn">このイベントを削除</button>
        `;

        details.appendChild(summary);
        details.appendChild(content);

        // --- Event Listeners for Interactivity ---

        // References
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

        // Update Summary on Input Change
        const updateSummary = () => {
            const icon = getIcon(inputs.name.value);
            summarySpans.name.textContent = inputs.name.value ? `${icon} ${inputs.name.value}` : '(新規イベント)';
            summarySpans.age.textContent = `${inputs.age.value}歳`;
            summarySpans.amount.textContent = `${inputs.amount.value}万円`;

            // Update color coding
            details.dataset.type = inputs.type.value;
        };

        // Listeners
        inputs.name.addEventListener('input', updateSummary);
        inputs.age.addEventListener('input', () => {
            updateSummary();
            // Sort on blur or change is tricky, let's sort when adding or explicitly? 
            // User requested auto-sort. Sorting on every keystroke breaks focus.
            // Let's sort logic handles this separately or we add a specific listener for 'change' (blur).
        });
        inputs.age.addEventListener('change', () => sortEvents()); // Sort when age is confirmed

        inputs.amount.addEventListener('input', updateSummary);
        inputs.type.addEventListener('change', updateSummary);

        // Mode Change Logic
        inputs.mode.addEventListener('change', () => {
            if (inputs.mode.value === 'period') {
                inputs.endAgeGroup.style.display = 'flex';
            } else {
                inputs.endAgeGroup.style.display = 'none';
            }
        });

        // Delete Logic
        content.querySelector('.remove-event-btn').addEventListener('click', () => {
            if (confirm('このイベントを削除しますか？')) {
                details.remove();
            }
        });

        eventsContainer.appendChild(details);

        // Auto sort after adding
        // Adding a slight delay to ensure DOM is ready? Not strictly needed but safe.
        // sortEvents(); // Defined outside
    };

    // Sort Function
    const sortEvents = () => {
        const rows = Array.from(eventsContainer.querySelectorAll('.event-row'));
        rows.sort((a, b) => {
            const ageA = parseInt(a.querySelector('.event-age').value) || 0;
            const ageB = parseInt(b.querySelector('.event-age').value) || 0;
            return ageA - ageB;
        });

        // Re-append in order
        rows.forEach(row => eventsContainer.appendChild(row));
    };

    addEventBtn.addEventListener('click', () => {
        addEventRow();
        // Open the new empty row for editing
        const newRow = eventsContainer.lastElementChild;
        if (newRow) newRow.open = true;
    });

    // --- AI Life Plan Proposal Logic ---
    const aiProposeBtn = document.getElementById('ai-propose-btn');
    const aiLoading = document.getElementById('ai-loading');
    const aiError = document.getElementById('ai-error');
    const apiKeyInput = document.getElementById('gemini-api-key');

    if (aiProposeBtn) {
        aiProposeBtn.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                alert('Gemini APIキーを入力してください。');
                return;
            }

            // Clear previous error
            aiError.textContent = '';
            aiError.style.display = 'none';

            // Show loading
            aiLoading.style.display = 'block';
            aiProposeBtn.disabled = true;

            try {
                // 0. Dynamic Model Discovery (to ensure compatibility)
                // First, list available models to find one that supports generateContent
                let targetModel = 'models/gemini-1.5-flash'; // Default fallback

                try {
                    const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                    if (modelsResponse.ok) {
                        const modelsData = await modelsResponse.json();
                        // Find the first model that supports generateContent and is not an embedding model
                        const validModel = modelsData.models?.find(m =>
                            m.supportedGenerationMethods?.includes('generateContent') &&
                            (m.name.includes('gemini') || m.name.includes('flash') || m.name.includes('pro'))
                        );
                        if (validModel) {
                            targetModel = validModel.name;
                            console.log('Selected Model:', targetModel);
                        }
                    }
                } catch (e) {
                    console.warn('Model discovery failed, using fallback:', e);
                }

                // 1. Gather Profile Data
                const profile = {
                    age: document.getElementById('age-self').value,
                    income: document.getElementById('household-income').value,
                    cah: document.getElementById('initial-cash').value,
                    asset: document.getElementById('initial-investment').value,
                    childCount: document.getElementById('child-count').value,
                    housing: document.getElementById('housing-status').value,       // 'rental', 'owned_house', etc.
                    care: document.getElementById('family-care').value,              // 'none', 'possible_5y', etc.
                    housingStrategy: document.querySelector('input[name="housing-strategy"]:checked')?.value || 'rental', // Phase 15
                    futureChildren: document.getElementById('future-children-plan').value, // Phase 24
                    // Phase 25 New Inputs
                    retirementAge: document.getElementById('retirement-age').value,
                    retirementAllowance: document.getElementById('retirement-allowance').value,
                    car: document.getElementById('car-ownership').value,
                    parentsHome: document.getElementById('parents-home').value
                };

                const maritalText = (profile.maritalStatus === 'married') ? '既婚（配偶者あり）' : '独身';
                let housingText = '賃貸';
                if (profile.housing === 'owned_house') housingText = '持ち家（戸建て）';
                if (profile.housing === 'owned_condo') housingText = '持ち家（マンション）';
                if (profile.housing === 'company') housingText = '社宅・寮';

                let careText = '特になし';
                if (profile.care === 'possible_5y') careText = '5年以内に親族介護の可能性あり';
                if (profile.care === 'possible_10y') careText = '10年以内に親族介護の可能性あり';
                if (profile.care === 'likely') careText = '親族介護を強く懸念';

                let strategyText = 'ずっと賃貸派';
                if (profile.housingStrategy === 'buy_house') strategyText = '戸建て購入希望';
                if (profile.housingStrategy === 'buy_condo') strategyText = 'マンション購入希望';

                let futureChildrenText = 'これ以上予定なし';
                if (profile.futureChildren === '1') futureChildrenText = 'あと1人欲しい';
                if (profile.futureChildren === '2') futureChildrenText = 'あと2人欲しい';
                if (profile.futureChildren === '3') futureChildrenText = 'あと3人欲しい';

                // Phase 25 Texts
                let carText = 'なし';
                if (profile.car === '1_k') carText = '軽自動車1台 (150万円/10年更新)';
                if (profile.car === '1_normal') carText = '普通車1台 (300万円/10年更新)';
                if (profile.car === '1_luxury') carText = '高級車1台 (600万円/7年更新)';
                if (profile.car === '2_mix') carText = '2台持ち (普通車+軽自動車)';

                let parentsHomeText = '考慮しない';
                if (profile.parentsHome === 'owned_safe') parentsHomeText = '実家は持ち家（資産価値あり・相続期待）';
                if (profile.parentsHome === 'owned_risk') parentsHomeText = '実家は持ち家（古い・空き家管理コストのリスクあり）';
                if (profile.parentsHome === 'rental') parentsHomeText = '実家は賃貸（将来の住居費支援リスクあり）';

                // 2. Construct Prompt (Phase 25 Robust Version)
                const prompt = `
                    あなたはプロのファイナンシャルプランナーであり、リスク管理に厳しいシステムエンジニアです。
                    ユーザーの入力情報を基に、将来発生しうる「ライフイベント（収入・支出）」を網羅的に予測し、JSONデータとしてリストアップしてください。
                    **楽観的なシナリオは排除し、保守的かつ現実的なリスク（修繕、介護、買い替え）を漏れなく計上してください。**
                    
                    【プロフィール】
                    - 現在年齢: ${profile.age}歳
                    - 配偶者: ${maritalText}
                    - 世帯年収: ${profile.income}万円
                    - 現在の住まい: ${housingText}
                    - **今後の住宅プラン: ${strategyText}**
                    - 現預金: ${profile.cah}万円 / 投資資産: ${profile.asset}万円
                    - 定年退職: ${profile.retirementAge}歳
                    - 退職金見込: ${profile.retirementAllowance}万円
                    - 子供の人数: ${profile.childCount}人
                    - **今後の家族計画: ${futureChildrenText}**
                    - 親族の介護懸念: ${careText}
                    - **車両保有方針: ${carText}**
                    - **実家の状況: ${parentsHomeText}**

                    【要件・出力ルール】
                    以下のカテゴリごとに、漏れなく詳細なイベントを作成してください。

                    1. **住宅リスク (category: housing)**
                       - **「今後の住宅プラン」に基づき、15年周期の「大規模修繕（150万〜300万）」を必須イベントとして計上すること。**
                       - 「戸建て購入」: 頭金、ローン開始、修繕費（15年ごと）、固定資産税、火災保険。
                       - 「マンション購入」: 頭金、修繕積立金の一時金徴収（大規模修繕時）、管理費負担増。
                       - 「賃貸継続」: 高齢期の家賃負担（更新料は除く）。

                    2. **車両コスト (category: car)**
                       - プロフィールの「車両保有方針」に基づき、定期的な「買い替え費用（下取り考慮後の純支出）」を計上する。
                       - 車検費用（2年ごと）は家計等の日常支出に含まれるためイベント化しないが、買い替えはイベントとする。

                    3. **教育費 (category: education)**
                       - **重要: 「授業料・入学金」はシステムで自動計算されるため、出力しないこと。**
                       - 出力すべきは「塾代」「夏期講習」「習い事」「私立大の下宿費用・仕送り」「海外留学費用」などのプラスアルファのみ。
                       - 「今後の家族計画」で子供が増える場合は、その子供分のイベントも追加する。

                    4. **老後・健康リスク (category: medical / care)**
                       - 定年後の「バリアフリー改修（100万〜）」や「有料老人ホーム入居一時金（300万〜）」などのリスクを年齢に応じて提案する。
                       - プロフィールの「実家の状況」が「空き家リスク」や「賃貸」の場合、実家の解体費用や親の家賃支援イベントを追加する。

                    5. **楽しみ・その他 (category: leisure / income / other)**
                       - 定年退職記念旅行（1回のみ、予算大きめ）。
                       - 「退職金受け取り」は category: income として計上。
                    
                    【JSON出力フォーマット】
                    解説やMarkdownは一切不要。以下のJSON配列のみを出力すること。
                    [
                        {
                            "name": "イベント名（例：自宅大規模修繕）",
                            "age": 発生年齢（数値）,
                            "category": "housing" | "car" | "education" | "medical" | "leisure" | "income" | "other",
                            "type": "income" または "expense",
                            "mode": "onetime"（単発） または "continuous"（永続） または "period"（期間）,
                            "amount": 金額（万円・数値）,
                            "endAge": 期間指定の場合のみ終了年齢（数値）
                        }
                    ]
                `;

                // 3. Call Gemini API (Using discovered model)
                // Ensure targetModel doesn't have double 'models/' prefix if API returns it
                const modelPath = targetModel.startsWith('models/') ? targetModel : `models/${targetModel}`;
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

                console.log('Calling API:', apiUrl);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.error?.message || response.statusText;
                    throw new Error(`API Error (${modelPath}): ${errorMessage}`);
                }

                const data = await response.json();

                // 4. Parse Response
                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error('AIからの応答が空でした。');
                }

                let text = data.candidates[0].content.parts[0].text;

                // Clean Markdown code blocks if present
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();

                const events = JSON.parse(text);

                if (!Array.isArray(events)) {
                    throw new Error('Invalid JSON format received');
                }

                // 5. Add Events to List
                // Clear existing events to prevent duplication (User Request)
                eventsContainer.innerHTML = '';

                events.forEach(event => {
                    // Map AI response to addEventRow format
                    addEventRow({
                        name: event.name,
                        age: event.age,
                        type: event.type,
                        duration: event.mode,
                        amount: event.amount,
                        endAge: event.endAge
                    });
                });

                // Sort after adding all AI events
                sortEvents();

                alert(`${events.length}件のライフイベントを提案しました！\n(使用モデル: ${modelPath})`);

            } catch (err) {
                console.error(err);
                aiError.textContent = `エラーが発生しました: ${err.message}`;
                aiError.style.display = 'block';
            } finally {
                // Hide loading
                aiLoading.style.display = 'none';
                aiProposeBtn.disabled = false;
            }
        });
    }

    // Default Life Events Data
    const DEFAULT_LIFE_EVENTS = [
        // --- 車関連（10年おき） ---
        { age: 40, type: 'expense', duration: 'onetime', amount: 300, name: '車買い替え' },
        { age: 50, type: 'expense', duration: 'onetime', amount: 300, name: '車買い替え' },
        { age: 60, type: 'expense', duration: 'onetime', amount: 300, name: '車買い替え' },

        // --- 住宅関連（修繕・リフォーム） ---
        { age: 45, type: 'expense', duration: 'onetime', amount: 150, name: '住宅設備修繕（給湯器・外壁等）' },
        { age: 60, type: 'expense', duration: 'onetime', amount: 300, name: '大規模リフォーム（水回り等）' },

        // --- 老後・資産 ---
        { age: 60, type: 'income', duration: 'onetime', amount: 1500, name: '退職金' },
        { age: 65, type: 'income', duration: 'continuous', amount: 180, name: '公的年金（夫婦合計・年額）' },

        // --- 家族イベント ---
        { age: 55, type: 'expense', duration: 'onetime', amount: 100, name: '子供の結婚援助' },
        { age: 70, type: 'expense', duration: 'onetime', amount: 200, name: '免許返納・移動手段確保' }
    ];

    // Initialize with Defaults
    if (DEFAULT_LIFE_EVENTS.length > 0) {
        DEFAULT_LIFE_EVENTS.forEach(event => addEventRow(event));
        sortEvents(); // Ensure defaults are sorted
    } else {
        addEventRow();
    }
}

const simulateBtn = document.getElementById('simulate-btn');
let chartInstance = null; // To keep track of the chart instance

if (simulateBtn) {
    console.log('Button found');
    simulateBtn.addEventListener('click', () => {
        console.log('Button clicked');
        runSimulation();
    });
} else {
    console.error('Button NOT found');
}

function runSimulation() {
    console.log('Running simulation...');

    // Inputs
    const ageSelfInput = document.getElementById('age-self');
    const householdIncomeInput = document.getElementById('household-income');
    const annualExpensesInput = document.getElementById('annual-expenses');

    // Phase 2 Inputs
    const initialCashInput = document.getElementById('initial-cash');
    const initialInvestmentInput = document.getElementById('initial-investment');
    const annualInvestmentCapInput = document.getElementById('annual-investment-cap');

    const returnRateInput = document.getElementById('return-rate');
    const retirementAgeInput = document.getElementById('retirement-age');

    // Child Inputs (Phase 5)
    const childCountSelect = document.getElementById('child-count');
    const ageChild1Input = document.getElementById('age-child-1');
    const courseChild1Input = document.getElementById('course-child-1');
    const ageChild2Input = document.getElementById('age-child-2');
    const courseChild2Input = document.getElementById('course-child-2');

    // Result areas
    const resultSection = document.getElementById('result-section');
    const resultTableBody = document.querySelector('#result-table tbody');
    const educationCostSection = document.getElementById('education-cost-section');
    const educationTableBody = document.querySelector('#education-cost-table tbody');
    const errorMessage = document.getElementById('error-message');

    // Helper: Show Error
    const showError = (msg) => {
        console.error(msg);
        if (errorMessage) {
            errorMessage.textContent = msg;
            errorMessage.style.display = 'block';
        } else {
            alert(msg);
        }
    };

    // Helper: Clear Error
    const clearError = () => {
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
    };

    try {
        clearError();

        // 1. Validate Inputs
        if (!ageSelfInput || !householdIncomeInput || !annualExpensesInput ||
            !initialCashInput || !initialInvestmentInput || !annualInvestmentCapInput ||
            !returnRateInput || !retirementAgeInput) {
            throw new Error('入力欄が見つかりません。HTMLが正しく更新されていない可能性があります。');
        }

        const ageSelf = parseInt(ageSelfInput.value);
        const householdIncome = parseFloat(householdIncomeInput.value);
        const annualExpenses = parseFloat(annualExpensesInput.value);

        const initialCash = parseFloat(initialCashInput.value);
        const initialInvestment = parseFloat(initialInvestmentInput.value);
        const annualInvestmentCap = parseFloat(annualInvestmentCapInput.value);

        const returnRate = parseFloat(returnRateInput.value);
        const retirementAge = parseInt(retirementAgeInput.value);

        // Parse Life Events
        const events = [];
        document.querySelectorAll('.event-row').forEach(row => {
            const age = parseInt(row.querySelector('.event-age').value);
            const endAgeInput = row.querySelector('.event-age-end');
            const endAge = endAgeInput ? parseInt(endAgeInput.value) : null;

            const type = row.querySelector('.event-type').value;
            const mode = row.querySelector('.event-mode').value;
            const amount = parseFloat(row.querySelector('.event-amount').value);

            if (!isNaN(age) && !isNaN(amount)) {
                events.push({ age, endAge, type, mode, amount });
            }
        });

        console.log('Events:', events);

        // Helper: Checker
        if (isNaN(ageSelf) || isNaN(householdIncome) || isNaN(annualExpenses) ||
            isNaN(initialCash) || isNaN(initialInvestment) || isNaN(annualInvestmentCap) ||
            isNaN(returnRate) || isNaN(retirementAge)) {
            throw new Error('すべての項目に正しい数値を入力してください。');
        }

        // 2. Prepare Simulation
        resultTableBody.innerHTML = ''; // Clear previous results
        educationTableBody.innerHTML = ''; // Clear education table
        const currentYear = new Date().getFullYear();

        let hasEducationCost = false; // Flag to show/hide education section

        // Initial Assets
        let currentCash = initialCash;
        let currentInvestment = initialInvestment;

        // Child Info
        const childCount = childCountSelect ? parseInt(childCountSelect.value) : 0;
        let child1Age = childCount >= 1 && ageChild1Input ? parseInt(ageChild1Input.value) : -1;
        let child2Age = childCount >= 2 && ageChild2Input ? parseInt(ageChild2Input.value) : -1;
        const child1Course = courseChild1Input ? courseChild1Input.value : 'all_private';
        const child2Course = courseChild2Input ? courseChild2Input.value : 'all_private';

        // Helper: format number with commas
        const formatCurrency = (num) => {
            return Math.floor(num).toLocaleString();
        };

        // Arrays for Chart
        const labels = [];
        const dataCash = [];
        const dataInvestment = [];
        const dataTotal = [];

        // Result areas
        const alertSection = document.getElementById('bankruptcy-alert');
        let bankruptcyAge = null;

        // Loop from current age to 100
        for (let age = ageSelf; age <= 100; age++) {
            const year = currentYear + (age - ageSelf);

            // Calculate Education Cost for this year
            let educationCostTotal = 0;
            let cost1 = 0;
            let cost2 = 0;
            let age1Display = '-';
            let age2Display = '-';

            if (childCount >= 1 && child1Age !== -1) {
                const currentChild1Age = child1Age + (age - ageSelf);
                if (currentChild1Age >= 0) {
                    age1Display = `${currentChild1Age}歳`;
                    cost1 = getEducationCost(currentChild1Age, child1Course);
                    educationCostTotal += cost1;
                }
            }
            if (childCount >= 2 && child2Age !== -1) {
                const currentChild2Age = child2Age + (age - ageSelf);
                if (currentChild2Age >= 0) {
                    age2Display = `${currentChild2Age}歳`;
                    cost2 = getEducationCost(currentChild2Age, child2Course);
                    educationCostTotal += cost2;
                }
            }

            // Generate Education Table Row (Only if relevant ages or costs exist)
            // Show if any child is between 0 and 22, OR if there is a cost
            let showEducationRow = false;

            if (childCount >= 1 && child1Age !== -1) {
                const currentChild1Age = child1Age + (age - ageSelf);
                if (currentChild1Age >= 0 && currentChild1Age <= 22) showEducationRow = true;
            }
            if (childCount >= 2 && child2Age !== -1) {
                const currentChild2Age = child2Age + (age - ageSelf);
                if (currentChild2Age >= 0 && currentChild2Age <= 22) showEducationRow = true;
            }

            if (showEducationRow) {
                hasEducationCost = true;
                const eduRow = document.createElement('tr');
                eduRow.innerHTML = `
                    <td>${year}年</td>
                    <td>${age1Display}</td>
                    <td>${formatCurrency(cost1)} 万円</td>
                    <td>${age2Display}</td>
                    <td>${formatCurrency(cost2)} 万円</td>
                    <td>${formatCurrency(educationCostTotal)} 万円</td>
                `;
                educationTableBody.appendChild(eduRow);
            }

            // Step A: Income/Expenses (Pre-calculation logic removed)

            // Recalculate Expense with Events

            let adjustedIncome = householdIncome;
            if (age >= retirementAge) {
                // Retirement: Base income stops. Pension is handled via Life Events.
                adjustedIncome = 0;
            }

            let adjustedExpense = annualExpenses;

            events.forEach(event => {
                let applicable = false;
                if (event.mode === 'continuous') {
                    if (age >= event.age) applicable = true;
                } else if (event.mode === 'onetime') {
                    if (age === event.age) applicable = true;
                } else if (event.mode === 'period') {
                    // Period: StartAge <= age <= EndAge
                    if (age >= event.age && (!event.endAge || age <= event.endAge)) {
                        applicable = true;
                    }
                }

                if (applicable) {
                    if (event.type === 'income') {
                        adjustedIncome += event.amount;
                    } else if (event.type === 'expense') {
                        adjustedExpense += event.amount;
                    }
                }
            });

            // Total Expense
            const totalExpense = adjustedExpense + educationCostTotal;

            const annualBalance = adjustedIncome - totalExpense;

            // Step B: Cash Flow Logic
            if (annualBalance > 0) {
                // Surplus: Invest up to Cap, rest to Cash
                const investAmount = Math.min(annualBalance, annualInvestmentCap);
                const cashAmount = annualBalance - investAmount;

                currentInvestment += investAmount;
                currentCash += cashAmount;
            } else {
                // Deficit: Withdraw from Cash, then Investment
                const deficit = Math.abs(annualBalance);

                if (currentCash >= deficit) {
                    currentCash -= deficit;
                } else {
                    const remainingDeficit = deficit - currentCash;
                    currentCash = 0;
                    currentInvestment -= remainingDeficit;
                }
            }

            // Step C: Investment Return (Stock)
            let investmentGain = 0;
            if (currentInvestment > 0) {
                investmentGain = currentInvestment * (returnRate / 100);
                currentInvestment += investmentGain;
            }

            // Step D: Total Asset
            const totalAssets = currentCash + currentInvestment;

            // Check for Bankruptcy (First time running out of assets)
            if (totalAssets < 0 && bankruptcyAge === null) {
                bankruptcyAge = age;
            }

            // Store data for Chart
            labels.push(`${age}歳`);
            dataCash.push(Math.floor(currentCash));
            dataInvestment.push(Math.floor(currentInvestment));
            dataTotal.push(Math.floor(totalAssets));

            // Render Row
            const row = document.createElement('tr');

            // Optional: Highlight retirement year
            if (age === retirementAge) {
                row.style.backgroundColor = '#e8f6f3';
                row.style.fontWeight = 'bold';
            }

            // Warning style if bankrupt
            if (totalAssets < 0) {
                row.style.color = '#e74c3c';
            }

            row.innerHTML = `
                <td>${age}歳</td>
                <td>${formatCurrency(adjustedIncome)} 万円</td>
                <td>${formatCurrency(totalExpense)} 万円</td>
                <td>${formatCurrency(investmentGain)} 万円</td>
                <td>${formatCurrency(currentCash)} 万円</td>
                <td>${formatCurrency(currentInvestment)} 万円</td>
            `;

            resultTableBody.appendChild(row);
        }

        // 3. Show Result
        console.log('Showing results...');
        resultSection.style.display = 'block';

        if (hasEducationCost) {
            educationCostSection.style.display = 'block';
        } else {
            educationCostSection.style.display = 'none';
        }

        // Show Bankruptcy Alert
        if (alertSection) {
            alertSection.style.display = 'block';
            if (bankruptcyAge !== null) {
                alertSection.className = 'alert-danger';
                alertSection.innerHTML = `⚠️ 残念ながら、<strong>${bankruptcyAge}歳</strong> で資産が尽きる予測です。<br>支出の見直しや資産運用の検討をお勧めします。`;
            } else {
                alertSection.className = 'alert-success';
                alertSection.innerHTML = `🎉 おめでとうございます！ 100歳まで資産は尽きず、<strong>逃げ切り成功</strong> の予測です！`;
            }
        }

        // 4. Render Chart
        renderChart(labels, dataCash, dataInvestment, dataTotal);

        // Switch to Result Tab
        if (typeof switchTab === 'function') {
            switchTab('result');
        }

        // Scroll to top of result
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (e) {
        showError(e.message);
    }
}

function renderChart(labels, dataCash, dataInvestment, dataTotal) {
    const ctx = document.getElementById('assetChart').getContext('2d');

    // Destroy previous chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '総資産',
                    data: dataTotal,
                    borderColor: '#2980b9', // Blue
                    backgroundColor: 'rgba(41, 128, 185, 0.1)',
                    borderWidth: 3,
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: '投資資産',
                    data: dataInvestment,
                    borderColor: '#e67e22', // Orange
                    backgroundColor: 'rgba(230, 126, 34, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: '現預金',
                    data: dataCash,
                    borderColor: '#2ecc71', // Green
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '資産推移シミュレーション'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('ja-JP').format(context.parsed.y) + ' 万円';
                            }
                            return label;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '金額 (万円)'
                    }
                }
            }
        }
    });
}

// Tab Switching Logic
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all buttons
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));

    // Show target tab content
    const target = document.getElementById(`tab-${tabName}`);
    if (target) {
        target.classList.add('active');
    }

    // Activate target button
    const buttons = document.querySelectorAll('.tab-button');
    if (tabName === 'input' && buttons[0]) buttons[0].classList.add('active');
    if (tabName === 'life-events' && buttons[1]) buttons[1].classList.add('active');
    if (tabName === 'result' && buttons[2]) buttons[2].classList.add('active');
}

// Help Modal Logic (Phase 17)
document.addEventListener('DOMContentLoaded', () => {
    const helpModal = document.getElementById('help-modal');
    const helpModalText = document.getElementById('help-modal-text');
    const modalClose = document.querySelector('.modal-close');

    if (helpModal && helpModalText) {
        // Open Modal
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('help-icon')) {
                const helpText = e.target.getAttribute('data-help');
                if (helpText) {
                    helpModalText.innerHTML = helpText;
                    helpModal.style.display = 'flex';
                }
            }
        });

        // Close Modal (X button)
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                helpModal.style.display = 'none';
            });
        }

        // Close Modal (Click outside)
        window.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }
});
