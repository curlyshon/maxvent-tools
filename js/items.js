// ==========================================
// MODULE: items.js
// Поэтапный мастер добавления изделий, динамические формы,
// спецификация со свайпами, режим группового выделения и умный балансировщик долей
// ==========================================

// ==========================================
// СОСТОЯНИЕ МАСТЕРА (WIZARD)
// ==========================================
let currentFormStep = 1;
let currentFormMode = localStorage.getItem('maxvent_form_mode') || 'wizard';

function setFormMode(mode) {
    currentFormMode = mode;
    try { localStorage.setItem('maxvent_form_mode', mode); } catch (_) {}
    triggerHaptic('light');

    const isWiz = (mode === 'wizard');
    const btnWiz = document.getElementById('btnModeWizard');
    const btnAll = document.getElementById('btnModeAll');
    if (btnWiz) {
        btnWiz.className = isWiz 
            ? 'px-2.5 py-1 rounded-lg font-bold bg-white text-black transition btn-press shadow-sm' 
            : 'px-2.5 py-1 rounded-lg font-semibold text-zinc-400 hover:text-white transition btn-press';
    }
    if (btnAll) {
        btnAll.className = !isWiz 
            ? 'px-2.5 py-1 rounded-lg font-bold bg-white text-black transition btn-press shadow-sm' 
            : 'px-2.5 py-1 rounded-lg font-semibold text-zinc-400 hover:text-white transition btn-press';
    }

    const stepIndicator = document.getElementById('wizardStepIndicator');
    if (stepIndicator) stepIndicator.classList.toggle('hidden', !isWiz);

    document.querySelectorAll('.step-nav-btn').forEach(el => el.classList.toggle('hidden', !isWiz));

    if (!isWiz) {
        const s1 = document.getElementById('wizStep-1');
        const s2 = document.getElementById('wizStep-2');
        const s3 = document.getElementById('wizStep-3');
        if (s1) s1.classList.remove('hidden');
        if (s2) s2.classList.remove('hidden');
        if (s3) s3.classList.remove('hidden');
    } else {
        goToWizardStep(currentFormStep);
    }
}

function goToWizardStep(step) {
    currentFormStep = Math.max(1, Math.min(3, step));
    triggerHaptic('light');

    if (currentFormMode === 'wizard') {
        [1, 2, 3].forEach(s => {
            const stepEl = document.getElementById(`wizStep-${s}`);
            if (stepEl) stepEl.classList.toggle('hidden', s !== currentFormStep);

            const tabEl = document.getElementById(`stepTab-${s}`);
            if (tabEl) {
                if (s === currentFormStep) {
                    tabEl.className = 'py-2 px-1 rounded-xl font-black bg-white text-black transition btn-press flex items-center justify-center gap-1.5 shadow-sm';
                    const numBadge = tabEl.querySelector('span:first-child');
                    if (numBadge) numBadge.className = 'w-4 h-4 rounded-full bg-black text-white text-[10px] inline-flex items-center justify-center font-mono font-bold';
                } else {
                    tabEl.className = 'py-2 px-1 rounded-xl font-semibold text-zinc-400 hover:text-white transition btn-press flex items-center justify-center gap-1.5';
                    const numBadge = tabEl.querySelector('span:first-child');
                    if (numBadge) numBadge.className = 'w-4 h-4 rounded-full bg-white/10 text-zinc-300 text-[10px] inline-flex items-center justify-center font-mono font-bold';
                }
            }
        });
    }

    if (currentFormStep === 3) {
        onWorkerSelectionChanged();
    }
}

function openItemAddSheet() {
    triggerHaptic('light');
    resetItemForm();
    const modal = document.getElementById('itemFormModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (typeof lockScroll === 'function') lockScroll();
    }
}

function closeItemAddSheet() {
    triggerHaptic('light');
    const modal = document.getElementById('itemFormModal');
    if (modal) modal.classList.add('hidden');
    if (typeof unlockScroll === 'function') unlockScroll();
}

function adjustQtyStepper(delta) {
    triggerHaptic('medium');
    const input = document.getElementById('inQty');
    if (!input) return;
    let val = parseInt(input.value, 10) || 1;
    val = Math.max(1, val + delta);
    input.value = val;
    input.dispatchEvent(new Event('input'));
    updateWorkerSharesTengeAmounts();
}

// ==========================================
// ФОРМА ДОБАВЛЕНИЯ И ВЫПАДАЮЩИЕ СПИСКИ
// ==========================================
function populateFormDropdowns() {
    const mSel = document.getElementById('inMetal');
    const tSel = document.getElementById('inThickness');
    if (mSel) mSel.innerHTML = appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    if (tSel) {
        tSel.innerHTML = appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');
        if (appState.thicknesses.includes(0.5)) tSel.value = '0.5';
    }

    const fmSel = document.getElementById('specFilterMetal');
    const ftSel = document.getElementById('specFilterThick');
    if (fmSel) fmSel.innerHTML = '<option value="all">Все</option>' + appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    if (ftSel) ftSel.innerHTML = '<option value="all">Все</option>' + appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');

    renderWorkersCheckboxes();

    const inQty = document.getElementById('inQty');
    const inPrice = document.getElementById('inPrice');
    if (inQty && !inQty.dataset.hasShareListener) {
        inQty.dataset.hasShareListener = 'true';
        inQty.addEventListener('input', () => updateWorkerSharesTengeAmounts());
    }
    if (inPrice && !inPrice.dataset.hasShareListener) {
        inPrice.dataset.hasShareListener = 'true';
        inPrice.addEventListener('input', () => updateWorkerSharesTengeAmounts());
    }

    setFormMode(currentFormMode);
}

function renderWorkersCheckboxes() {
    const wBox = document.getElementById('itemWorkersCheckboxes');
    if (!wBox) return;

    wBox.innerHTML = appState.users.map(u => `
        <label class="bg-[#121217] border border-white/5 hover:border-white/20 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition btn-press">
            <input type="checkbox" name="assignWorker" onchange="onWorkerSelectionChanged()" value="${u.name}" ${session.user && session.user.name === u.name ? 'checked' : ''} class="rounded text-white accent-white">
            <span class="text-zinc-200 text-xs font-bold truncate">${u.name}</span>
        </label>
    `).join('');
}

function selectCategory(cat) {
    session.activeCategory = cat;
    const btnDuct = document.getElementById('btnCatDuct');
    const btnFitting = document.getElementById('btnCatFitting');
    if (btnDuct) {
        btnDuct.className = cat === 'duct' 
            ? 'py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-white text-black shadow-sm transition btn-press' 
            : 'py-3 text-xs font-semibold uppercase tracking-wider rounded-xl bg-white/5 text-zinc-400 hover:text-white transition btn-press';
    }
    if (btnFitting) {
        btnFitting.className = cat === 'fitting' 
            ? 'py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-white text-black shadow-sm transition btn-press' 
            : 'py-3 text-xs font-semibold uppercase tracking-wider rounded-xl bg-white/5 text-zinc-400 hover:text-white transition btn-press';
    }

    if (cat === 'duct' && session.activeShape === 'smooth') {
        session.activeShape = 'rect';
    }

    const fitWrap = document.getElementById('fittingSelectWrap');
    if (fitWrap) fitWrap.classList.toggle('hidden', cat !== 'fitting');

    selectShape(session.activeShape);
}

function selectShape(sh) {
    if (session.activeCategory === 'duct' && sh === 'smooth') {
        sh = 'rect';
    }
    session.activeShape = sh;
    const isDuct = session.activeCategory === 'duct';
    const shapeWrap = document.getElementById('shapeButtonsWrap');
    if (shapeWrap) {
        if (isDuct) {
            shapeWrap.classList.remove('grid-cols-3');
            shapeWrap.classList.add('grid-cols-2');
        } else {
            shapeWrap.classList.remove('grid-cols-2');
            shapeWrap.classList.add('grid-cols-3');
        }
    }
    ['rect', 'round', 'smooth'].forEach(s => {
        const btn = document.getElementById('btnShape' + s.charAt(0).toUpperCase() + s.slice(1));
        if (btn) {
            if (s === 'smooth' && isDuct) {
                btn.className = 'hidden';
            } else {
                btn.className = s === sh 
                    ? 'py-2.5 text-xs font-extrabold rounded-xl bg-white text-black shadow-sm transition btn-press' 
                    : 'py-2.5 text-xs font-semibold rounded-xl bg-white/5 text-zinc-400 hover:text-white transition btn-press';
            }
        }
    });
    updateFittingDropdown();
    renderDynamicInputs();
}

function updateFittingDropdown() {
    if (session.activeCategory !== 'fitting') return;
    const sel = document.getElementById('fittingTypeSelect');
    if (!sel) return;
    const list = appState.fittings[session.activeShape] || [];
    sel.innerHTML = list.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    if (list.length > 0) onFittingTypeChange();
}

function onFittingTypeChange() {
    const sel = document.getElementById('fittingTypeSelect');
    if (!sel) return;
    const fitId = sel.value;
    const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === fitId);
    if (fitDef && fitDef.price) {
        const inPrice = document.getElementById('inPrice');
        if (inPrice) inPrice.value = fitDef.price;
    }
    renderDynamicInputs();
}

// ==========================================
// ДИНАМИЧЕСКИЕ ПОЛЯ С ЦИФРОВОЙ КЛАВИАТУРОЙ (inputmode="numeric")
// ==========================================
function renderDynamicInputs() {
    const box = document.getElementById('dynamicFieldsBox');
    if (!box) return;
    box.innerHTML = '';

    if (session.activeCategory === 'duct') {
        if (session.activeShape === 'rect') {
            box.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-semibold text-zinc-400">Ширина (А) мм</label>
                            <button type="button" onclick="swapDims('f_w', 'f_h')" class="text-[11px] text-zinc-300 hover:text-zinc-200 font-bold flex items-center gap-1 transition btn-press">⇄ Поменять A ↔ B</button>
                        </div>
                        <input type="number" id="f_w" value="400" inputmode="numeric" oninput="updateFrameLabels()" required class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-sm mono text-white font-bold">
                        ${renderChipScroller('f_w', POPULAR_RECT)}
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-zinc-400 mb-1">Высота (В) мм</label>
                        <input type="number" id="f_h" value="300" inputmode="numeric" oninput="updateFrameLabels()" required class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-sm mono text-white font-bold">
                        ${renderChipScroller('f_h', POPULAR_RECT)}
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-zinc-400 mb-1">Длина (L) мм (стандарт 1250)</label>
                        <input type="number" id="f_l" value="1250" inputmode="numeric" required class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-sm mono text-white font-bold">
                        ${renderChipScroller('f_l', [500, 1000, 1250, 1500, 2000, 2500])}
                    </div>
                    <div class="pt-2 border-t border-white/5">
                        <div class="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Рамки шинорейки:</div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <label class="bg-[#18181f] border border-white/5 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-white/20 transition btn-press">
                                <input type="checkbox" id="f_flange1" checked onchange="updateFrameLabels()" class="rounded text-white accent-white">
                                <span id="label_flange1" class="font-bold text-zinc-200">Рамка 1: 400×300 мм</span>
                            </label>
                            <label class="bg-[#18181f] border border-white/5 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-white/20 transition btn-press">
                                <input type="checkbox" id="f_flange2" checked onchange="updateFrameLabels()" class="rounded text-white accent-white">
                                <span id="label_flange2" class="font-bold text-zinc-200">Рамка 2: 400×300 мм</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        } else {
            box.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-semibold text-zinc-400 mb-1">Диаметр (Ø) мм</label>
                        <input type="number" id="f_d" value="200" inputmode="numeric" required class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-sm mono text-white font-bold">
                        ${renderChipScroller('f_d', POPULAR_DIAM)}
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-zinc-400 mb-1">Длина (L) мм (стандарт 1250)</label>
                        <input type="number" id="f_l" value="1250" inputmode="numeric" required class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-sm mono text-white font-bold">
                        ${renderChipScroller('f_l', [500, 1000, 1250, 1500, 2000, 2500])}
                    </div>
                </div>
            `;
        }
        updateFrameLabels();
        return;
    }

    const fitId = document.getElementById('fittingTypeSelect')?.value;
    const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === fitId) || { params: ['w', 'h', 'len'] };
    let html = '<div class="space-y-3">';

    if (fitDef.params.includes('hood_type')) {
        html += `
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Вид зонта</label>
                <select id="f_hood_type" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold">
                    <option value="Пристенный">Пристенный</option>
                    <option value="Островной">Островной</option>
                </select>
            </div>
        `;
    }

    if (fitDef.params.includes('deg')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Градус (°)</label><input type="number" id="f_deg" value="90" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold"></div>`;
    if (fitDef.params.includes('deg135')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Градус (°)</label><input type="number" id="f_deg" value="135" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold"></div>`;

    if (fitDef.params.includes('w') && fitDef.params.includes('h')) {
        html += `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <label class="block text-xs font-semibold text-zinc-400">Ширина (А) мм</label>
                    <button type="button" onclick="swapDims('f_w', 'f_h')" class="text-[11px] text-zinc-300 hover:text-zinc-200 font-bold flex items-center gap-1 transition btn-press">⇄ Поменять A ↔ B</button>
                </div>
                <input type="number" id="f_w" value="400" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_w', POPULAR_RECT)}
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Высота (В) мм</label>
                <input type="number" id="f_h" value="300" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_h', POPULAR_RECT)}
            </div>
        `;
    } else {
        if (fitDef.params.includes('w')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Ширина (А) мм</label><input type="number" id="f_w" value="400" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_w', POPULAR_RECT)}</div>`;
        if (fitDef.params.includes('h')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Высота (В) мм</label><input type="number" id="f_h" value="300" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_h', POPULAR_RECT)}</div>`;
    }

    if (fitDef.params.includes('w1') && fitDef.params.includes('h1')) {
        const isSmoothTrans = fitDef.id === 's_trans' || session.activeShape === 'smooth';
        html += `
            <div class="bg-[#18181f] p-3 rounded-2xl border border-white/5 space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-[11px] font-bold text-zinc-300">${isSmoothTrans ? 'Прямоугольное сечение (Вход):' : 'Рамка 1 (Вход):'}</span>
                    <button type="button" onclick="swapDims('f_w1', 'f_h1')" class="text-[10px] text-zinc-300 hover:text-zinc-200 font-bold transition btn-press">⇄ Поменять A1 ↔ B1</button>
                </div>
                <div><label class="block text-[10px] text-zinc-400 mb-0.5">Ширина 1 (мм)</label><input type="number" id="f_w1" value="400" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#121217] border border-white/10 rounded-xl px-3 py-2 mono text-white text-xs font-bold">${renderChipScroller('f_w1', POPULAR_RECT)}</div>
                <div><label class="block text-[10px] text-zinc-400 mb-0.5">Высота 1 (мм)</label><input type="number" id="f_h1" value="300" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#121217] border border-white/10 rounded-xl px-3 py-2 mono text-white text-xs font-bold">${renderChipScroller('f_h1', POPULAR_RECT)}</div>
            </div>
        `;
    }

    if (fitDef.params.includes('w2') && fitDef.params.includes('h2')) {
        html += `
            <div class="bg-[#18181f] p-3 rounded-2xl border border-white/5 space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-[11px] font-bold text-zinc-300">Рамка 2 (Выход):</span>
                    <button type="button" onclick="swapDims('f_w2', 'f_h2')" class="text-[10px] text-zinc-300 hover:text-zinc-200 font-bold transition btn-press">⇄ A2 ↔ B2</button>
                </div>
                <div><label class="block text-[10px] text-zinc-400 mb-0.5">Ширина 2 (мм)</label><input type="number" id="f_w2" value="300" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#121217] border border-white/10 rounded-xl px-3 py-2 mono text-white text-xs font-bold">${renderChipScroller('f_w2', POPULAR_RECT)}</div>
                <div><label class="block text-[10px] text-zinc-400 mb-0.5">Высота 2 (мм)</label><input type="number" id="f_h2" value="250" inputmode="numeric" oninput="updateFrameLabels()" class="w-full bg-[#121217] border border-white/10 rounded-xl px-3 py-2 mono text-white text-xs font-bold">${renderChipScroller('f_h2', POPULAR_RECT)}</div>
            </div>
        `;
    }

    if (fitDef.params.includes('d')) {
        const isSmoothTrans = fitDef.id === 's_trans' || session.activeShape === 'smooth';
        html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">${isSmoothTrans ? 'Диаметр Ø (Выход) мм' : 'Диаметр Ø (мм)'}</label><input type="number" id="f_d" value="200" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_d', POPULAR_DIAM)}</div>`;
    }
    if (fitDef.params.includes('d1')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Диаметр 1 Ø (мм)</label><input type="number" id="f_d1" value="250" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_d1', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d2')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Диаметр 2 Ø (мм)</label><input type="number" id="f_d2" value="200" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_d2', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d_main')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Диаметр основного Ø (мм)</label><input type="number" id="f_d_main" value="315" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_d_main', POPULAR_DIAM)}</div>`;

    if (fitDef.params.includes('len')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Длина L (мм)</label><input type="number" id="f_len" value="300" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold"></div>`;
    if (fitDef.params.includes('len_silencer')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Длина L (мм)</label><input type="number" id="f_len" value="1000" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold">${renderChipScroller('f_len', POPULAR_LEN_SILENCER)}</div>`;
    if (fitDef.params.includes('hood_seat')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Посадочное место (мм)</label><input type="number" id="f_hood_seat" value="100" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold"></div>`;
    if (fitDef.params.includes('offset')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Смещение (мм)</label><input type="number" id="f_offset" value="100" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold"></div>`;
    if (fitDef.params.includes('inlets_cnt')) html += `<div><label class="block text-xs font-semibold text-zinc-400 mb-1">Количество врезок (шт)</label><input type="number" id="f_inlets_cnt" value="2" min="1" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white font-bold"></div>`;

    if (fitDef.params.includes('flange1') || fitDef.params.includes('flange2')) {
        const isTwo = fitDef.params.includes('flange2');
        html += `
            <div class="pt-2 border-t border-white/5">
                <div class="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Рамки шинорейки:</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label class="bg-[#18181f] border border-white/5 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-white/20 transition btn-press">
                        <input type="checkbox" id="f_flange1" checked onchange="updateFrameLabels()" class="rounded text-white accent-white">
                        <span id="label_flange1" class="font-bold text-zinc-200">Рамка 1</span>
                    </label>
                    ${isTwo ? `
                        <label class="bg-[#18181f] border border-white/5 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-white/20 transition btn-press">
                            <input type="checkbox" id="f_flange2" checked onchange="updateFrameLabels()" class="rounded text-white accent-white">
                            <span id="label_flange2" class="font-bold text-zinc-200">Рамка 2</span>
                        </label>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Кастомные параметры конструктора изделий
    const standardParamCodes = new Set(['deg', 'deg135', 'hood_type', 'w', 'h', 'w1', 'h1', 'w2', 'h2', 'd', 'd1', 'd2', 'd_main', 'len', 'len_silencer', 'hood_seat', 'offset', 'inlets_cnt', 'flange1', 'flange2']);
    const customParamsList = (fitDef.params || []).filter(p => !standardParamCodes.has(p));
    if (customParamsList.length > 0) {
        html += `<div class="pt-2 border-t border-white/5 space-y-2.5"><div class="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Дополнительные параметры:</div>`;
        customParamsList.forEach(code => {
            const pDef = ALL_PARAM_DEFS.find(x => x.code === code) || { label: code, code };
            html += `
                <div>
                    <label class="block text-xs font-semibold text-zinc-400 mb-1">${pDef.label}</label>
                    <input type="text" id="f_${code}" placeholder="Введите ${pDef.label}..." class="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 mono text-white text-xs">
                </div>
            `;
        });
        html += `</div>`;
    }

    html += '</div>';
    box.innerHTML = html;
    updateFrameLabels();
}

function updateFrameLabels() {
    const w = document.getElementById('f_w')?.value || 400;
    const h = document.getElementById('f_h')?.value || 300;
    const w1 = document.getElementById('f_w1')?.value || w;
    const h1 = document.getElementById('f_h1')?.value || h;
    const w2 = document.getElementById('f_w2')?.value || 300;
    const h2 = document.getElementById('f_h2')?.value || 250;

    const l1 = document.getElementById('label_flange1');
    const l2 = document.getElementById('label_flange2');

    if (l1) {
        if (document.getElementById('f_w1') && document.getElementById('f_w2')) {
            l1.textContent = `Рамка 1: ${w1}×${h1} мм`;
        } else if (document.getElementById('f_w1')) {
            l1.textContent = `Рамка: ${w1}×${h1} мм`;
        } else {
            l1.textContent = l2 ? `Рамка 1: ${w}×${h} мм` : `Рамка: ${w}×${h} мм`;
        }
    }
    if (l2) {
        if (document.getElementById('f_w1') && document.getElementById('f_w2')) {
            l2.textContent = `Рамка 2: ${w2}×${h2} мм`;
        } else {
            l2.textContent = `Рамка 2: ${w}×${h} мм`;
        }
    }
}

function setChipValue(targetId, val) {
    triggerHaptic('light');
    const input = document.getElementById(targetId);
    if (input) {
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    updateFrameLabels();
}

function renderChipScroller(targetId, arr) {
    return `
        <div class="chip-scroll mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
            ${arr.map(v => `<button type="button" onclick="setChipValue('${targetId}', ${v})" class="chip-btn px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-mono text-xs font-bold hover:bg-white/15 btn-press">${v}</button>`).join('')}
        </div>
    `;
}

// ==========================================
// УМНЫЙ БАЛАНСИРОВЩИК ДОЛЕЙ МАСТЕРОВ (SMART BALANCER SLIDER)
// ==========================================
const WORKER_COLORS = [
    '#10b981', // emerald
    '#38bdf8', // sky
    '#f59e0b', // amber
    '#a855f7', // violet
    '#f43f5e', // rose
    '#14b8a6', // teal
    '#eab308', // yellow
    '#6366f1'  // indigo
];

function onWorkerSelectionChanged(presetShares = null) {
    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    const sharesBox = document.getElementById('workerSharesBox');
    const bar = document.getElementById('workerSharesBreakdownBar');

    if (checked.length === 0) {
        session.workerSharesState = {};
        if (sharesBox) sharesBox.classList.add('hidden');
        if (bar) bar.innerHTML = '';
        return;
    }

    if (checked.length === 1) {
        session.workerSharesState = { [checked[0]]: 100 };
        if (sharesBox) sharesBox.classList.add('hidden');
        renderWorkerSharesBreakdownBar();
        updateWorkerSharesTengeAmounts();
        return;
    }

    if (sharesBox) sharesBox.classList.remove('hidden');

    if (presetShares && typeof presetShares === 'object') {
        session.workerSharesState = { ...presetShares };
    } else {
        // Проверяем сохраненное состояние или инициализируем
        const curKeys = Object.keys(session.workerSharesState || {});
        const isMatch = checked.every(w => curKeys.includes(w)) && curKeys.length === checked.length;

        if (!isMatch) {
            session.workerSharesState = calculateDefaultWorkerShares(checked);
        }
    }

    renderWorkerSharesSlidersList();
    renderWorkerSharesBreakdownBar();
    updateWorkerSharesTengeAmounts();
}

function calculateDefaultWorkerShares(checked) {
    const shares = {};
    if (!checked || checked.length === 0) return shares;
    if (checked.length === 1) {
        shares[checked[0]] = 100;
        return shares;
    }

    const devWorker = checked.find(w => isChingisOrDev(w));
    if (devWorker) {
        shares[devWorker] = 50;
        const others = checked.filter(w => w !== devWorker);
        const each = Math.floor(50 / others.length);
        const rem = 50 - each * others.length;
        others.forEach((w, i) => {
            shares[w] = (i === 0) ? (each + rem) : each;
        });
    } else {
        const each = Math.floor(100 / checked.length);
        const rem = 100 - each * checked.length;
        checked.forEach((w, i) => {
            shares[w] = (i === 0) ? (each + rem) : each;
        });
    }
    return shares;
}

function applyPresetShares(type) {
    triggerHaptic('medium');
    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    if (checked.length <= 1) return;

    if (type === 'equal') {
        const each = Math.floor(100 / checked.length);
        const rem = 100 - each * checked.length;
        const shares = {};
        checked.forEach((w, i) => {
            shares[w] = (i === 0) ? (each + rem) : each;
        });
        session.workerSharesState = shares;
    } else if (type === 'chingis_half') {
        session.workerSharesState = calculateDefaultWorkerShares(checked);
    }

    renderWorkerSharesSlidersList();
    renderWorkerSharesBreakdownBar();
    updateWorkerSharesTengeAmounts();
}

function renderWorkerSharesSlidersList() {
    const list = document.getElementById('workerSharesSlidersList');
    if (!list) return;

    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    list.innerHTML = checked.map((w, idx) => {
        const pct = session.workerSharesState[w] !== undefined ? session.workerSharesState[w] : Math.round(100 / checked.length);
        const color = WORKER_COLORS[idx % WORKER_COLORS.length];
        return `
            <div class="bg-[#121217] border border-white/5 rounded-2xl p-3 space-y-2">
                <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                        <span class="font-extrabold text-white">${w}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="shareAmt_${w}" class="mono font-bold text-emerald-400">0 ₸</span>
                        <div class="flex items-center gap-1">
                            <input type="number" id="shareNum_${w}" min="0" max="100" value="${pct}" inputmode="numeric" oninput="onWorkerSliderChanged('${w}', Number(this.value))" class="w-14 bg-[#18181f] border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-black text-white text-xs">
                            <span class="text-zinc-400 font-bold">%</span>
                        </div>
                    </div>
                </div>
                <input type="range" min="0" max="100" value="${pct}" oninput="onWorkerSliderChanged('${w}', Number(this.value))" class="w-full accent-white h-1.5 bg-black/40 rounded-lg cursor-pointer">
            </div>
        `;
    }).join('');
}

function onWorkerSliderChanged(activeWorker, newVal) {
    newVal = Math.max(0, Math.min(100, Math.round(newVal)));
    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    const peers = checked.filter(w => w !== activeWorker);

    session.workerSharesState[activeWorker] = newVal;

    if (peers.length > 0) {
        const remaining = 100 - newVal;
        const each = Math.floor(remaining / peers.length);
        const rem = remaining - each * peers.length;

        peers.forEach((pw, i) => {
            session.workerSharesState[pw] = (i === 0) ? (each + rem) : each;
            const slider = document.querySelector(`input[type="range"][oninput*="${pw}"]`);
            const numInp = document.getElementById(`shareNum_${pw}`);
            if (slider) slider.value = session.workerSharesState[pw];
            if (numInp) numInp.value = session.workerSharesState[pw];
        });
    }

    const myNum = document.getElementById(`shareNum_${activeWorker}`);
    if (myNum) myNum.value = newVal;

    renderWorkerSharesBreakdownBar();
    updateWorkerSharesTengeAmounts();
}

function renderWorkerSharesBreakdownBar() {
    const bar = document.getElementById('workerSharesBreakdownBar');
    if (!bar) return;

    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    bar.innerHTML = checked.map((w, idx) => {
        const pct = session.workerSharesState[w] || 0;
        const color = WORKER_COLORS[idx % WORKER_COLORS.length];
        return `
            <div style="width: ${pct}%; background-color: ${color}" class="h-full transition-all duration-200 flex items-center justify-center text-[9px] font-mono font-black text-black overflow-hidden" title="${w}: ${pct}%">
                ${pct >= 15 ? `${pct}%` : ''}
            </div>
        `;
    }).join('');
}

function updateWorkerSharesTengeAmounts() {
    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    if (checked.length === 0) return;

    const qty = Number(document.getElementById('inQty')?.value) || 1;
    const price = Number(document.getElementById('inPrice')?.value) || 1000;
    const cat = session.activeCategory;
    const sh = session.activeShape;

    let totalCost = 0;
    if (cat === 'duct') {
        const p = appState.projects.find(x => x.id === session.insideProjectId);
        const seams = getProjectSeams(p);
        let unfold = 0;
        if (sh === 'rect') {
            const w = Number(document.getElementById('f_w')?.value || 400);
            const h = Number(document.getElementById('f_h')?.value || 300);
            unfold = 2 * (w + h) + seams.lock_pittsburgh + seams.lock_single;
        } else {
            const d = Number(document.getElementById('f_d')?.value || 200);
            unfold = Math.round(Math.PI * d + seams.round_seam);
        }
        const l = Number(document.getElementById('f_l')?.value || 1250);
        const area = (unfold * l * qty) / 1e6;
        totalCost = Math.round(area * price);
    } else {
        totalCost = Math.round(qty * price);
    }

    checked.forEach(w => {
        const pct = session.workerSharesState[w] !== undefined ? session.workerSharesState[w] : Math.round(100 / checked.length);
        const amt = Math.round(totalCost * (pct / 100));
        const el = document.getElementById(`shareAmt_${w}`);
        if (el) el.textContent = `${amt.toLocaleString()} ₸`;
    });
}

function getWorkerSharesFromForm(workers) {
    if (!workers || workers.length === 0) return {};
    if (workers.length === 1) return { [workers[0]]: 100 };
    const shares = {};
    workers.forEach(w => {
        shares[w] = session.workerSharesState[w] !== undefined 
            ? Number(session.workerSharesState[w]) 
            : Math.round(100 / workers.length);
    });
    return shares;
}

// ==========================================
// СОХРАНЕНИЕ ИЗДЕЛИЯ С ПОДПРОЕКТОМ (PHASE_ID)
// ==========================================
async function saveProjectItem(e) {
    if (e) e.preventDefault();
    const projId = session.insideProjectId;
    if (!projId) return;

    if (session.isSavingItem) return;
    session.isSavingItem = true;
    const submitBtn = document.getElementById('submitItemBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'pointer-events-none');
        submitBtn.textContent = '⏳ Добавление...';
    }

    const editId = document.getElementById('editItemId')?.value;
    const metal = document.getElementById('inMetal')?.value || 'Оцинкованная сталь';
    const thickness = Number(document.getElementById('inThickness')?.value) || 0.5;
    const qty = Number(document.getElementById('inQty')?.value) || 1;
    const price = Number(document.getElementById('inPrice')?.value) || 1000;
    const workers = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);

    let title = '';
    let itemKey = '';
    let dims = {
        item_status: 'queue',
        phase_id: (session.activePhaseId && session.activePhaseId !== 'all') ? session.activePhaseId : 'main'
    };

    if (editId) {
        const oldItem = appState.activeProjectItems.find(i => i.id === Number(editId));
        if (oldItem && oldItem.item_status) dims.item_status = oldItem.item_status;
        if (oldItem && oldItem.phase_id) dims.phase_id = oldItem.phase_id;
    }

    const frames = [];

    if (session.activeCategory === 'duct') {
        title = session.activeShape === 'rect' ? 'Воздуховод прямой' : 'Воздуховод круглый';
        dims.l = Number(document.getElementById('f_l')?.value || 1250);
        if (session.activeShape === 'rect') {
            dims.w = Number(document.getElementById('f_w')?.value || 400);
            dims.h = Number(document.getElementById('f_h')?.value || 300);
            dims.flange1 = !!document.getElementById('f_flange1')?.checked;
            dims.flange2 = !!document.getElementById('f_flange2')?.checked;
            if (dims.flange1) frames.push(`${dims.w}×${dims.h}`);
            if (dims.flange2) frames.push(`${dims.w}×${dims.h}`);
            dims.frames = frames;
            itemKey = `duct_rect_${dims.w}_${dims.h}_${dims.l}_${dims.flange1}_${dims.flange2}_${metal}_${thickness}_${dims.phase_id}`;
        } else {
            dims.d = Number(document.getElementById('f_d')?.value || 200);
            itemKey = `duct_round_${dims.d}_${dims.l}_${metal}_${thickness}_${dims.phase_id}`;
        }
    } else {
        const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === document.getElementById('fittingTypeSelect')?.value);
        title = fitDef ? fitDef.name : 'Изделие';
        dims.fittingId = fitDef ? fitDef.id : 'custom';

        if (document.getElementById('f_hood_type')) dims.hood_type = document.getElementById('f_hood_type').value;
        if (document.getElementById('f_deg')) dims.deg = Number(document.getElementById('f_deg').value);
        if (document.getElementById('f_w')) dims.w = Number(document.getElementById('f_w').value);
        if (document.getElementById('f_h')) dims.h = Number(document.getElementById('f_h').value);
        if (document.getElementById('f_w1')) dims.w1 = Number(document.getElementById('f_w1').value);
        if (document.getElementById('f_h1')) dims.h1 = Number(document.getElementById('f_h1').value);
        if (document.getElementById('f_w2')) dims.w2 = Number(document.getElementById('f_w2').value);
        if (document.getElementById('f_h2')) dims.h2 = Number(document.getElementById('f_h2').value);
        if (document.getElementById('f_d')) dims.d = Number(document.getElementById('f_d').value);
        if (document.getElementById('f_d1')) dims.d1 = Number(document.getElementById('f_d1').value);
        if (document.getElementById('f_d2')) dims.d2 = Number(document.getElementById('f_d2').value);
        if (document.getElementById('f_d_main')) dims.d_main = Number(document.getElementById('f_d_main').value);
        if (document.getElementById('f_len')) dims.l = Number(document.getElementById('f_len').value);
        if (document.getElementById('f_hood_seat')) dims.hood_seat = Number(document.getElementById('f_hood_seat').value);
        if (document.getElementById('f_offset')) dims.offset = Number(document.getElementById('f_offset').value);
        if (document.getElementById('f_inlets_cnt')) dims.inlets_cnt = Number(document.getElementById('f_inlets_cnt').value);
        if (document.getElementById('f_flange1')) dims.flange1 = document.getElementById('f_flange1').checked;
        if (document.getElementById('f_flange2')) dims.flange2 = document.getElementById('f_flange2').checked;

        if (dims.w1 && dims.h1 && dims.w2 && dims.h2) {
            if (dims.flange1) frames.push(`${dims.w1}×${dims.h1}`);
            if (dims.flange2) frames.push(`${dims.w2}×${dims.h2}`);
        } else if (dims.w1 && dims.h1) {
            if (dims.flange1) frames.push(`${dims.w1}×${dims.h1}`);
            if (dims.flange2 && dims.w2 && dims.h2) frames.push(`${dims.w2}×${dims.h2}`);
        } else if (dims.w && dims.h) {
            if (dims.flange1) frames.push(`${dims.w}×${dims.h}`);
            if (dims.flange2) frames.push(`${dims.w}×${dims.h}`);
        }

        // Пользовательские параметры
        if (fitDef && Array.isArray(fitDef.params)) {
            fitDef.params.forEach(pCode => {
                const inputEl = document.getElementById(`f_${pCode}`);
                if (inputEl) {
                    const val = inputEl.value.trim();
                    dims[pCode] = (val !== '' && !isNaN(Number(val))) ? Number(val) : val;
                }
            });
        }

        dims.frames = frames;
        itemKey = `fit_${title}_${dims.w || 0}_${dims.h || 0}_${dims.w1 || 0}_${dims.h1 || 0}_${dims.w2 || 0}_${dims.h2 || 0}_${dims.d || 0}_${dims.d1 || 0}_${dims.l || 0}_${dims.deg || 0}_${dims.flange1}_${dims.flange2}_${frames.join('_')}_${metal}_${thickness}_${dims.phase_id}`;
    }

    const workerShares = getWorkerSharesFromForm(workers);
    dims.worker_shares = workerShares;

    if (editId) {
        await supabaseClient.from('items').update({
            item_key: itemKey,
            category: session.activeCategory,
            shape: session.activeShape,
            title,
            metal,
            thickness,
            qty,
            price,
            workers,
            dimensions: dims
        }).eq('id', Number(editId));
        showToast('Позиция успешно обновлена!', 'success');
    } else {
        const existing = appState.activeProjectItems.find(i => i.item_key === itemKey);
        if (existing) {
            const newQty = existing.qty + qty;
            const mergedWorkers = Array.from(new Set([...(existing.workers || []), ...workers]));
            const existingDims = existing.dimensions || {};
            existingDims.worker_shares = { ...(existingDims.worker_shares || {}), ...workerShares };
            await supabaseClient.from('items').update({
                qty: newQty,
                workers: mergedWorkers,
                dimensions: existingDims
            }).eq('id', existing.id);
            showToast(`Количество увеличено (+${qty} шт)`, 'success');
        } else {
            await supabaseClient.from('items').insert({
                project_id: projId,
                item_key: itemKey,
                category: session.activeCategory,
                shape: session.activeShape,
                title,
                metal,
                thickness,
                qty,
                price,
                workers,
                dimensions: dims
            });
            showToast('Позиция добавлена в спецификацию!', 'success');
        }
    }

    try {
        await supabaseClient.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projId);
        await loadProjectDetails(projId);
        resetItemForm();
        closeItemAddSheet();
        renderProjectInside();
    } catch (err) {
        console.error('Error saving item:', err);
        showToast('Ошибка при сохранении позиции', 'error');
    } finally {
        session.isSavingItem = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'pointer-events-none');
            const editId = document.getElementById('editItemId')?.value;
            submitBtn.textContent = editId ? 'Сохранить изменения' : 'Добавить в проект';
        }
    }
}

function resetItemForm() {
    const editInput = document.getElementById('editItemId');
    if (editInput) editInput.value = '';
    const headerTitle = document.getElementById('formHeaderTitle');
    if (headerTitle) headerTitle.textContent = 'Добавить в проект';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    const submitBtn = document.getElementById('submitItemBtn');
    if (submitBtn) submitBtn.textContent = 'Добавить в проект';

    const tSel = document.getElementById('inThickness');
    if (tSel && appState.thicknesses.includes(0.5)) tSel.value = '0.5';

    renderDynamicInputs();
    renderWorkersCheckboxes();
    onWorkerSelectionChanged();
    goToWizardStep(1);
}

// ==========================================
// РЕЖИМ ВЫДЕЛЕНИЯ И СПЕЦИФИКАЦИЯ
// ==========================================
function toggleSpecSelectionMode() {
    session.specSelectionMode = !session.specSelectionMode;
    if (!session.specSelectionMode) {
        session.selectedSpecIds = [];
    }
    triggerHaptic('light');

    const btn = document.getElementById('btnToggleSelectionMode');
    const lbl = document.getElementById('lblToggleSelectionMode');
    if (btn) {
        btn.className = session.specSelectionMode
            ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition btn-press shadow-sm'
            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition btn-press';
    }
    if (lbl) {
        lbl.textContent = session.specSelectionMode ? 'Готово' : 'Выбрать';
    }

    renderSpecification();
}

function toggleSelectAllSpecItems() {
    triggerHaptic('light');
    let items = getFilteredSpecItems();
    if (session.selectedSpecIds.length === items.length) {
        session.selectedSpecIds = [];
    } else {
        session.selectedSpecIds = items.map(i => i.id);
    }
    renderSpecification();
}

function getFilteredSpecItems() {
    const filterM = document.getElementById('specFilterMetal')?.value || 'all';
    const filterT = document.getElementById('specFilterThick')?.value || 'all';
    const search = (document.getElementById('specSearchInput')?.value || '').trim().toLowerCase();

    return appState.activeProjectItems.filter(it => {
        // Фильтр по подочереди/дозаказу
        if (session.activePhaseId && session.activePhaseId !== 'all') {
            const itemPhase = it.phase_id || it.dimensions?.phase_id || 'main';
            if (itemPhase !== session.activePhaseId) return false;
        }

        if (filterM !== 'all' && it.metal !== filterM) return false;
        if (filterT !== 'all' && Number(it.thickness) !== Number(filterT)) return false;
        if (search) {
            const framesText = (getItemFrames(it) || []).join(' ');
            const fullText = `${it.title} ${it.w || ''} ${it.h || ''} ${it.w1 || ''} ${it.h1 || ''} ${it.w2 || ''} ${it.h2 || ''} ${it.d || ''} ${it.l || ''} ${it.descDetail || ''} ${it.metal || ''} ${(it.workers || []).join(' ')} ${framesText}`.toLowerCase();
            if (!fullText.includes(search)) return false;
        }
        return true;
    });
}

function renderSpecification() {
    const items = getFilteredSpecItems();
    const container = document.getElementById('specificationAccordionList');
    if (!container) return;
    container.innerHTML = '';

    const selCount = session.selectedSpecIds.length;
    const batchToolbar = document.getElementById('specBatchToolbar');
    const batchCount = document.getElementById('batchSelectedCount');
    const bulkCount = document.getElementById('bulkCount');
    const lblSelectAll = document.getElementById('lblSelectAllSpec');

    if (batchToolbar) batchToolbar.classList.toggle('hidden', !session.specSelectionMode);
    if (batchCount) batchCount.textContent = selCount;
    if (bulkCount) bulkCount.textContent = selCount;
    if (lblSelectAll) {
        lblSelectAll.textContent = (items.length > 0 && selCount === items.length) ? 'Снять все' : 'Выбрать все';
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div class="bg-[#121217] border border-white/5 rounded-3xl p-8 text-center text-xs text-zinc-500 space-y-2">
                <span class="text-2xl block">📦</span>
                <p>В этой очереди или по выбранным фильтрам нет позиций</p>
            </div>
        `;
        return;
    }

    const categories = [
        { id: 'sec_duct_rect', title: 'Воздуховоды прямоугольные', list: items.filter(i => i.category === 'duct' && i.shape === 'rect') },
        { id: 'sec_duct_round', title: 'Воздуховоды круглые', list: items.filter(i => i.category === 'duct' && i.shape === 'round') },
        { id: 'sec_fit_rect', title: 'Фасонина прямоугольная', list: items.filter(i => i.category === 'fitting' && i.shape === 'rect') },
        { id: 'sec_fit_round', title: 'Фасонина круглая', list: items.filter(i => i.category === 'fitting' && i.shape === 'round') },
        { id: 'sec_fit_smooth', title: 'Фасонина плавная', list: items.filter(i => i.category === 'fitting' && i.shape === 'smooth') }
    ];

    categories.forEach(sec => {
        if (sec.list.length === 0) return;
        const isExpanded = session.accordionState[sec.id] !== false;

        const block = document.createElement('div');
        block.className = 'bg-[#121217] border border-white/5 rounded-3xl overflow-hidden shadow-sm';
        block.innerHTML = `
            <button onclick="toggleSectionAccordion('${sec.id}')" class="w-full p-4 bg-[#18181f]/50 border-b border-white/5 flex justify-between items-center text-left hover:bg-[#18181f] transition btn-press">
                <div class="flex items-center gap-2">
                    <span class="text-white font-bold text-xs">${isExpanded ? '▼' : '▶'}</span>
                    <span class="text-xs font-black uppercase tracking-wider text-white">${sec.title}</span>
                    <span class="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full mono font-bold">${sec.list.length}</span>
                </div>
                <span class="text-xs text-zinc-400 mono">Итого: <strong class="text-white">${sec.list.reduce((s, i) => s + i.qty, 0)} шт</strong></span>
            </button>
            <div id="${sec.id}_body" class="${isExpanded ? '' : 'hidden'} p-3 space-y-2.5">
                ${sec.list.map(it => renderSpecItemRow(it)).join('')}
            </div>
        `;
        container.appendChild(block);
    });

    attachSpecSwipeHandlers();
    if (typeof unlockScroll === 'function') unlockScroll();
}

function toggleSectionAccordion(secId) {
    session.accordionState[secId] = (session.accordionState[secId] === false) ? true : false;
    renderSpecification();
}

function renderSpecItemRow(it) {
    const isSelected = session.selectedSpecIds.includes(it.id);
    let descParts = [];

    if (it.shape === 'rect' && it.category === 'duct') {
        descParts.push(`${it.w}×${it.h} мм`);
        descParts.push(`L=${it.l || 1250}`);
    } else if (it.shape === 'round' && it.category === 'duct') {
        descParts.push(`Ø${it.d} мм`);
        descParts.push(`L=${it.l || 1250}`);
    } else {
        if (it.hood_type) descParts.push(it.hood_type);
        if (it.deg) descParts.push(`${it.deg}°`);
        if (it.descDetail) descParts.push(it.descDetail);
        if (it.w1 && it.w2) descParts.push(`${it.w1}×${it.h1} → ${it.w2}×${it.h2}`);
        else if (it.w1 && it.h1 && it.d) descParts.push(`${it.w1}×${it.h1} → Ø${it.d}`);
        else if (it.w && it.h && it.d && (it.shape === 'smooth' || it.fittingId === 's_trans')) descParts.push(`${it.w}×${it.h} → Ø${it.d}`);
        else if (it.w1 && it.h1) descParts.push(`${it.w1}×${it.h1}`);
        else if (it.w && it.h) descParts.push(`${it.w}×${it.h}`);

        if (it.d1 && it.d2) descParts.push(`Ø${it.d1} → Ø${it.d2}`);
        else if (it.d && !it.w1 && !(it.w && (it.shape === 'smooth' || it.fittingId === 's_trans'))) descParts.push(`Ø${it.d}`);
        if (it.d_main) descParts.push(`Осн: Ø${it.d_main}`);
        if (it.l) descParts.push(`L=${it.l}`);
        if (it.hood_seat) descParts.push(`Посадка: ${it.hood_seat} мм`);
        if (it.offset) descParts.push(`Смещение: ${it.offset} мм`);
        if (it.inlets_cnt) descParts.push(`Врезок: ${it.inlets_cnt} шт`);
    }

    const frames = getItemFrames(it);
    const framesHtml = frames.length ? `
        <div class="flex items-center gap-1.5 flex-wrap mt-1">
            <span class="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Рамки:</span>
            ${frames.map((fr, idx) => `<span class="bg-white/5 border border-white/10 text-zinc-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg">№${idx + 1}: ${fr} мм</span>`).join('')}
        </div>
    ` : '';

    const workersHtml = (it.workers && it.workers.length) 
        ? `<div class="text-[10px] text-amber-300 mt-0.5 font-medium">👷 Мастера: <strong class="text-white">${formatItemWorkersDisplay(it)}</strong></div>` 
        : '';

    const st = it.item_status || 'queue';
    const isDone = (st === 'done');
    const stBadge = isDone 
        ? `<button type="button" onclick="triggerHaptic('light'); toggleItemStatus(${it.id}, event)" class="border border-emerald-500/20 bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold btn-press">✓ Готово</button>`
        : `<button type="button" onclick="triggerHaptic('light'); toggleItemStatus(${it.id}, event)" class="border border-white/10 bg-white/5 text-zinc-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold btn-press hover:border-emerald-500">⏳ В очереди</button>`;

    // Если включен режим выделения, показываем красивый кружок чекбокса
    const selectCheckHtml = session.specSelectionMode ? `
        <div onclick="toggleSpecItemSelect(${it.id})" class="cursor-pointer flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition btn-press ${
            isSelected ? 'border-white bg-white text-black' : 'border-white/30 bg-transparent'
        }">
            ${isSelected ? '<span class="text-xs font-black">✓</span>' : ''}
        </div>
    ` : '';

    return `
        <div class="spec-swipe-card relative overflow-hidden rounded-2xl group select-none" data-item-id="${it.id}">
            <!-- Фоновый индикатор свайпа вправо (Готово) -->
            <div class="swipe-hint-done absolute inset-y-0 left-0 w-32 bg-emerald-600/30 border border-emerald-500/40 rounded-2xl flex items-center px-4 gap-2 text-emerald-300 font-extrabold text-xs opacity-0 transition-opacity pointer-events-none z-0">
                <span class="text-base">✓</span>
                <span>Готово</span>
            </div>

            <!-- Фоновый индикатор свайпа влево (Действия: Дубликат, Редактировать, Удалить) -->
            <div class="swipe-hint-actions absolute inset-y-0 right-0 w-44 bg-[#18181f] border border-white/10 rounded-2xl flex items-center justify-end px-3 gap-1.5 opacity-0 transition-opacity z-0 pointer-events-none">
                <button type="button" onclick="event.stopPropagation(); triggerHaptic('light'); duplicateWithModal(${it.id})" title="Дублировать" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white text-base font-bold flex items-center justify-center btn-press">⧉</button>
                <button type="button" onclick="event.stopPropagation(); triggerHaptic('light'); editProjectItem(${it.id})" title="Редактировать" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white text-base font-bold flex items-center justify-center btn-press">✎</button>
                <button type="button" onclick="event.stopPropagation(); triggerHaptic('warning'); deleteSingleItem(${it.id})" title="Удалить" class="w-10 h-10 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-base font-bold flex items-center justify-center btn-press">🗑</button>
            </div>

            <!-- Основная карточка позиции -->
            <div onclick="${session.specSelectionMode ? `toggleSpecItemSelect(${it.id})` : ''}" class="swipe-inner relative z-10 bg-[#121217] border ${isSelected ? 'border-white/40 bg-[#18181f] ring-1 ring-white/20' : 'border-white/5 hover:border-white/15'} rounded-2xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition cursor-pointer">
                <div class="flex items-start gap-3 w-full sm:w-auto min-w-0" onclick="${session.specSelectionMode ? `toggleSpecItemSelect(${it.id})` : ''}">
                    ${selectCheckHtml}
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-extrabold text-xs sm:text-sm text-white">${it.title}</span>
                            ${stBadge}
                        </div>
                        <div class="text-xs text-zinc-300 mono mt-0.5">${descParts.join(' | ')}</div>
                        ${framesHtml}
                        <div class="text-[11px] text-zinc-400 mt-0.5">Металл: <strong class="text-zinc-200">${it.metal} ${it.thickness} мм</strong> ${isDev() ? `| Тариф: <span class="mono text-emerald-400">${it.price} ₸</span>` : ''}</div>
                        ${workersHtml}
                    </div>
                </div>
                <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div class="text-sm font-black mono text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl shrink-0">${it.qty} шт</div>
                </div>
            </div>
        </div>
    `;
}

// Свайп-жесты для позиций спецификации
function attachSpecSwipeHandlers() {
    if (session.specSelectionMode) return;
    const cards = document.querySelectorAll('.spec-swipe-card');
    cards.forEach(card => {
        if (card.dataset.hasSwipeListener) return;
        card.dataset.hasSwipeListener = 'true';

        let startX = 0, startY = 0, currentX = 0;
        let isSwiping = false, isDecided = false;
        const row = card.querySelector('.swipe-inner');
        const itemId = Number(card.dataset.itemId);
        const hintDone = card.querySelector('.swipe-hint-done');
        const hintActions = card.querySelector('.swipe-hint-actions');

        card.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = 0;
            isSwiping = false;
            isDecided = false;
            if (row) row.style.transition = 'none';
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const dx = x - startX;
            const dy = y - startY;

            if (!isDecided) {
                const absX = Math.abs(dx);
                const absY = Math.abs(dy);
                // Если вертикальный сдвиг больше горизонтального — это скролл страницы, немедленно пропускаем
                if (absY > 6 && absY > absX) {
                    isDecided = true;
                    isSwiping = false;
                    return;
                }
                // Для свайпа позиции нужно уверенное горизонтальное движение
                if (absX > 10 && absX > absY * 1.3) {
                    isDecided = true;
                    isSwiping = true;
                }
            }

            if (!isSwiping || !row) return;

            currentX = dx;
            const damp = 0.55;
            const tx = dx * damp;
            row.style.transform = `translateX(${tx}px)`;

            if (dx > 25) {
                if (hintDone) hintDone.style.opacity = Math.min(1, (dx - 25) / 40);
                if (hintActions) {
                    hintActions.style.opacity = '0';
                    hintActions.style.pointerEvents = 'none';
                }
            } else if (dx < -25) {
                if (hintActions) {
                    hintActions.style.opacity = Math.min(1, (-dx - 25) / 40);
                    hintActions.style.pointerEvents = 'auto';
                }
                if (hintDone) hintDone.style.opacity = '0';
            } else {
                if (hintDone) hintDone.style.opacity = '0';
                if (hintActions) {
                    hintActions.style.opacity = '0';
                    hintActions.style.pointerEvents = 'none';
                }
            }
        }, { passive: true });

        card.addEventListener('touchend', () => {
            if (!isSwiping || !row) return;
            row.style.transition = 'transform 0.25s var(--ios-spring)';

            if (currentX > 80) {
                // Свайп вправо: переключить статус Готово / Не готово
                toggleItemStatus(itemId);
                row.style.transform = 'translateX(0px)';
                if (hintDone) hintDone.style.opacity = '0';
                if (hintActions) {
                    hintActions.style.opacity = '0';
                    hintActions.style.pointerEvents = 'none';
                }
                card.dataset.isOpen = 'false';
            } else if (currentX < -50) {
                // Свайп влево: приоткрыть действия
                row.style.transform = 'translateX(-150px)';
                if (hintActions) {
                    hintActions.style.opacity = '1';
                    hintActions.style.pointerEvents = 'auto';
                }
                card.dataset.isOpen = 'true';
            } else {
                row.style.transform = 'translateX(0px)';
                if (hintDone) hintDone.style.opacity = '0';
                if (hintActions) {
                    hintActions.style.opacity = '0';
                    hintActions.style.pointerEvents = 'none';
                }
                card.dataset.isOpen = 'false';
            }
            isSwiping = false;
        }, { passive: true });

        card.addEventListener('click', (e) => {
            if (card.dataset.isOpen === 'true') {
                if (e.target.closest('.swipe-hint-actions')) return;
                if (row) row.style.transform = 'translateX(0px)';
                if (hintActions) {
                    hintActions.style.opacity = '0';
                    hintActions.style.pointerEvents = 'none';
                }
                card.dataset.isOpen = 'false';
            }
        });
    });
}

function toggleSpecItemSelect(id) {
    triggerHaptic('light');
    if (session.selectedSpecIds.includes(id)) {
        session.selectedSpecIds = session.selectedSpecIds.filter(x => x !== id);
    } else {
        session.selectedSpecIds.push(id);
    }
    renderSpecification();
}

async function toggleItemStatus(id, e) {
    if (e) e.stopPropagation();
    triggerHaptic('medium');
    const it = appState.activeProjectItems.find(x => x.id === id);
    if (!it) return;

    const cur = it.item_status || 'queue';
    const next = (cur === 'done') ? 'queue' : 'done';

    it.item_status = next;
    if (!it.dimensions) it.dimensions = {};
    it.dimensions.item_status = next;

    await supabaseClient.from('items').update({ dimensions: it.dimensions }).eq('id', id);

    showToast(next === 'done' ? 'Позиция: ✓ Готово' : 'Позиция: ⏳ В очереди', 'info');
    renderProjectInside();
    updateHeaderUI();
}

async function batchSetStatus(newStatus) {
    if (!session.selectedSpecIds || session.selectedSpecIds.length === 0) return;
    triggerHaptic('medium');
    const ids = [...session.selectedSpecIds];

    for (const id of ids) {
        const it = appState.activeProjectItems.find(x => x.id === id);
        if (!it) continue;
        it.item_status = newStatus;
        if (!it.dimensions) it.dimensions = {};
        it.dimensions.item_status = newStatus;
        await supabaseClient.from('items').update({ dimensions: it.dimensions }).eq('id', id);
    }

    showToast(`Статус обновлен для ${ids.length} позиций`, 'success');
    renderProjectInside();
    updateHeaderUI();
}

// ==========================================
// ГРУППОВОЕ ИЗМЕНЕНИЕ ИЗДЕЛИЙ (LIMITED BULK EDIT)
// ==========================================
let bulkSharesState = {};

function toggleBulkField(checkboxId, targetWrapperId) {
    const checked = document.getElementById(checkboxId)?.checked;
    const wrapper = document.getElementById(targetWrapperId);
    if (wrapper) {
        wrapper.classList.toggle('opacity-40', !checked);
        wrapper.classList.toggle('pointer-events-none', !checked);
    }
}

function openBulkEditModal() {
    if (!session.selectedSpecIds || session.selectedSpecIds.length === 0) {
        showToast('Выберите позиции для группового изменения', 'warning');
        return;
    }

    const modal = document.getElementById('bulkEditModal');
    if (!modal) return;

    document.getElementById('bulkEditItemsCount').textContent = session.selectedSpecIds.length;

    ['bulkCheckMetal', 'bulkCheckThick', 'bulkCheckWorkers'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });
    toggleBulkField('bulkCheckMetal', 'bulkWrapMetal');
    toggleBulkField('bulkCheckThick', 'bulkWrapThick');
    toggleBulkField('bulkCheckWorkers', 'bulkWrapWorkers');

    const selMetal = document.getElementById('bulkSelectMetal');
    if (selMetal) selMetal.innerHTML = appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');

    const selThick = document.getElementById('bulkSelectThick');
    if (selThick) {
        selThick.innerHTML = appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');
        if (appState.thicknesses.includes(0.5)) selThick.value = '0.5';
    }

    const wBox = document.getElementById('bulkWorkersCheckboxes');
    if (wBox) {
        wBox.innerHTML = appState.users.map(u => `
            <label class="bg-[#121217] border border-white/5 hover:border-white/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition text-xs btn-press">
                <input type="checkbox" name="bulkAssignWorker" onchange="onBulkWorkersSelectionChanged()" value="${u.name}" class="rounded text-white accent-white">
                <span class="text-zinc-300 font-bold truncate">${u.name}</span>
            </label>
        `).join('');
    }

    bulkSharesState = {};
    const sharesBox = document.getElementById('bulkSharesBox');
    if (sharesBox) sharesBox.classList.add('hidden');

    modal.classList.remove('hidden');
    if (typeof lockScroll === 'function') lockScroll();
}

function closeBulkEditModal() {
    triggerHaptic('light');
    const modal = document.getElementById('bulkEditModal');
    if (modal) modal.classList.add('hidden');
    if (typeof unlockScroll === 'function') unlockScroll();
}

function onBulkWorkersSelectionChanged() {
    const checked = Array.from(document.querySelectorAll('input[name="bulkAssignWorker"]:checked')).map(cb => cb.value);
    const sharesBox = document.getElementById('bulkSharesBox');
    if (!sharesBox) return;

    if (checked.length <= 1) {
        sharesBox.classList.add('hidden');
        bulkSharesState = {};
        if (checked.length === 1) bulkSharesState[checked[0]] = 100;
        return;
    }

    sharesBox.classList.remove('hidden');
    bulkSharesState = calculateDefaultWorkerShares(checked);
    renderBulkSharesList();
}

function renderBulkSharesList() {
    const list = document.getElementById('bulkSharesList');
    if (!list) return;
    const checked = Array.from(document.querySelectorAll('input[name="bulkAssignWorker"]:checked')).map(cb => cb.value);
    list.innerHTML = checked.map(w => {
        const pct = bulkSharesState[w] !== undefined ? bulkSharesState[w] : Math.round(100 / checked.length);
        return `
            <div class="flex items-center justify-between gap-2 bg-[#121217] border border-white/5 p-2 rounded-xl text-xs">
                <span class="font-bold text-white">${w}</span>
                <div class="flex items-center gap-1">
                    <input type="number" min="0" max="100" value="${pct}" inputmode="numeric" oninput="bulkSharesState['${w}'] = Number(this.value)" class="w-12 bg-[#18181f] border border-white/10 rounded-lg px-1.5 py-0.5 text-center mono font-bold text-amber-300">
                    <span class="text-zinc-400 font-bold">%</span>
                </div>
            </div>
        `;
    }).join('');
}

async function applyBulkEdit() {
    const changeMetal = document.getElementById('bulkCheckMetal')?.checked;
    const changeThick = document.getElementById('bulkCheckThick')?.checked;
    const changeWorkers = document.getElementById('bulkCheckWorkers')?.checked;

    if (!changeMetal && !changeThick && !changeWorkers) {
        showToast('Отметьте хотя бы один параметр для изменения', 'warning');
        return;
    }

    const valMetal = document.getElementById('bulkSelectMetal')?.value;
    const valThick = Number(document.getElementById('bulkSelectThick')?.value);
    const checkedWorkers = Array.from(document.querySelectorAll('input[name="bulkAssignWorker"]:checked')).map(cb => cb.value);

    const count = session.selectedSpecIds.length;

    for (const id of session.selectedSpecIds) {
        const it = appState.activeProjectItems.find(x => x.id === id);
        if (!it) continue;
        if (!it.dimensions) it.dimensions = {};

        if (changeMetal) {
            it.metal = valMetal;
            it.dimensions.metal = valMetal;
        }
        if (changeThick) {
            it.thickness = valThick;
            it.dimensions.thickness = valThick;
        }
        if (changeWorkers) {
            it.workers = checkedWorkers;
            it.dimensions.workers = checkedWorkers;
            const sharesToApply = (checkedWorkers.length <= 1) 
                ? (checkedWorkers.length === 1 ? { [checkedWorkers[0]]: 100 } : {}) 
                : { ...bulkSharesState };
            it.dimensions.worker_shares = sharesToApply;
            it.worker_shares = sharesToApply;
        }

        await supabaseClient.from('items').update({
            metal: it.metal,
            thickness: it.thickness,
            workers: it.workers,
            dimensions: it.dimensions
        }).eq('id', id);

        const globalIt = appState.allItems.find(x => x.id === id);
        if (globalIt) {
            if (changeMetal) globalIt.metal = valMetal;
            if (changeThick) globalIt.thickness = valThick;
            if (changeWorkers) {
                globalIt.workers = checkedWorkers;
                globalIt.worker_shares = it.worker_shares;
            }
            globalIt.dimensions = { ...it.dimensions };
        }
    }

    updateHeaderUI();
    renderSpecification();
    closeBulkEditModal();
    showToast(`Успешно обновлено ${count} позиций!`, 'success');
}

async function deleteSelectedItems() {
    if (!confirm(`Удалить выбранные позиции (${session.selectedSpecIds.length} шт)?`)) return;
    triggerHaptic('warning');
    await supabaseClient.from('items').delete().in('id', session.selectedSpecIds);
    session.selectedSpecIds = [];
    await loadProjectDetails(session.insideProjectId);
    renderProjectInside();
    showToast('Выбранные позиции удалены', 'info');
}

async function deleteSingleItem(id) {
    if (!confirm('Удалить эту позицию из проекта?')) return;
    triggerHaptic('warning');
    await supabaseClient.from('items').delete().eq('id', id);
    session.selectedSpecIds = session.selectedSpecIds.filter(x => x !== id);
    await loadProjectDetails(session.insideProjectId);
    renderProjectInside();
    showToast('Позиция удалена', 'info');
}

function duplicateWithModal(id) {
    const it = appState.activeProjectItems.find(x => x.id === id);
    if (!it) return;

    editProjectItem(id);
    document.getElementById('editItemId').value = '';
    document.getElementById('formHeaderTitle').textContent = `Дубликат: ${it.title}`;
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('submitItemBtn').textContent = '+ Создать дубликат';
    goToWizardStep(2);
    triggerHaptic('light');
}

function editProjectItem(id) {
    const it = appState.activeProjectItems.find(x => x.id === id);
    if (!it) return;

    openItemAddSheet();
    document.getElementById('editItemId').value = it.id;
    document.getElementById('formHeaderTitle').textContent = 'Редактировать позицию';
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('submitItemBtn').textContent = 'Сохранить изменения';

    selectCategory(it.category);
    selectShape(it.shape);

    document.getElementById('inMetal').value = it.metal;
    document.getElementById('inThickness').value = it.thickness;
    document.getElementById('inQty').value = it.qty;
    document.getElementById('inPrice').value = it.price;

    if (it.fittingId) document.getElementById('fittingTypeSelect').value = it.fittingId;
    renderDynamicInputs();

    if (document.getElementById('f_w')) document.getElementById('f_w').value = it.w || 400;
    if (document.getElementById('f_h')) document.getElementById('f_h').value = it.h || 300;
    if (document.getElementById('f_d')) document.getElementById('f_d').value = it.d || 200;
    if (document.getElementById('f_l')) document.getElementById('f_l').value = it.l || 1250;
    if (document.getElementById('f_w1')) document.getElementById('f_w1').value = it.w1 || it.w || 400;
    if (document.getElementById('f_h1')) document.getElementById('f_h1').value = it.h1 || it.h || 300;
    if (document.getElementById('f_w2')) document.getElementById('f_w2').value = it.w2 || 300;
    if (document.getElementById('f_h2')) document.getElementById('f_h2').value = it.h2 || 250;
    if (document.getElementById('f_d1')) document.getElementById('f_d1').value = it.d1 || 250;
    if (document.getElementById('f_d2')) document.getElementById('f_d2').value = it.d2 || 200;
    if (document.getElementById('f_d_main')) document.getElementById('f_d_main').value = it.d_main || 315;
    if (document.getElementById('f_deg')) document.getElementById('f_deg').value = it.deg || 90;
    if (document.getElementById('f_offset')) document.getElementById('f_offset').value = it.offset || 100;
    if (document.getElementById('f_hood_seat')) document.getElementById('f_hood_seat').value = it.hood_seat || 100;
    if (document.getElementById('f_inlets_cnt')) document.getElementById('f_inlets_cnt').value = it.inlets_cnt || 2;
    if (document.getElementById('f_flange1')) document.getElementById('f_flange1').checked = !!it.flange1;
    if (document.getElementById('f_flange2')) document.getElementById('f_flange2').checked = !!it.flange2;
    updateFrameLabels();

    document.querySelectorAll('input[name="assignWorker"]').forEach(cb => {
        cb.checked = (it.workers || []).includes(cb.value);
    });
    onWorkerSelectionChanged(it.worker_shares || it.dimensions?.worker_shares);

    goToWizardStep(2);
    triggerHaptic('light');
}
