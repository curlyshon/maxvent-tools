// ==========================================
// MODULE: items.js
// Форма добавления изделий, динамические поля, спецификация и групповые действия
// ==========================================

// ==========================================
// ФОРМА ДОБАВЛЕНИЯ И РЕДАКТИРОВАНИЯ ПОЗИЦИЙ
// ==========================================
function populateFormDropdowns() {
    const mSel = document.getElementById('inMetal');
    const tSel = document.getElementById('inThickness');
    mSel.innerHTML = appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    tSel.innerHTML = appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');
    if (appState.thicknesses.includes(0.5)) {
        tSel.value = '0.5';
    }

    const fmSel = document.getElementById('specFilterMetal');
    const ftSel = document.getElementById('specFilterThick');
    fmSel.innerHTML = '<option value="all">Все</option>' + appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    ftSel.innerHTML = '<option value="all">Все</option>' + appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');

    const wBox = document.getElementById('workersCheckboxes');
    wBox.innerHTML = appState.users.map(u => `
        <label class="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-slate-700 transition">
            <input type="checkbox" name="assignWorker" onchange="onWorkerSelectionChanged()" value="${u.name}" ${session.user && session.user.name === u.name ? 'checked' : ''} class="rounded text-blue-600">
            <span class="text-slate-300 font-medium">${u.name}</span>
        </label>
    `).join('');

    // Слушатели на поля количества и цены для живого пересчета долей
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

    onWorkerSelectionChanged();
}

function selectCategory(cat) {
    session.activeCategory = cat;
    document.getElementById('btnCatDuct').className = cat === 'duct' 
        ? 'py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-white text-black shadow-sm transition' 
        : 'py-3 text-xs font-semibold uppercase tracking-wider rounded-xl bg-white/5 text-zinc-400 hover:text-white transition';
    document.getElementById('btnCatFitting').className = cat === 'fitting' 
        ? 'py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-white text-black shadow-sm transition' 
        : 'py-3 text-xs font-semibold uppercase tracking-wider rounded-xl bg-white/5 text-zinc-400 hover:text-white transition';

    if (cat === 'duct' && session.activeShape === 'smooth') {
        session.activeShape = 'rect';
    }

    document.getElementById('fittingSelectWrap').classList.toggle('hidden', cat !== 'fitting');
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
                    ? 'py-2.5 text-xs font-extrabold rounded-xl bg-white text-black shadow-sm transition' 
                    : 'py-2.5 text-xs font-semibold rounded-xl bg-white/5 text-zinc-400 hover:text-white transition';
            }
        }
    });
    updateFittingDropdown();
    renderDynamicInputs();
}

function updateFittingDropdown() {
    if (session.activeCategory !== 'fitting') return;
    const sel = document.getElementById('fittingTypeSelect');
    const list = appState.fittings[session.activeShape] || [];
    sel.innerHTML = list.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    if (list.length > 0) onFittingTypeChange();
}

function onFittingTypeChange() {
    const fitId = document.getElementById('fittingTypeSelect').value;
    const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === fitId);
    if (fitDef && fitDef.price) {
        document.getElementById('inPrice').value = fitDef.price;
    }
    renderDynamicInputs();
}

function renderDynamicInputs() {
    const box = document.getElementById('dynamicFieldsBox');
    box.innerHTML = '';

    if (session.activeCategory === 'duct') {
        if (session.activeShape === 'rect') {
            box.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs text-slate-400">Ширина (А) мм</label>
                            <button type="button" onclick="swapDims('f_w', 'f_h')" class="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition">⇄ Поменять A ↔ B</button>
                        </div>
                        <input type="number" id="f_w" value="400" oninput="updateFrameLabels()" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_w', POPULAR_RECT)}
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Высота (В) мм</label>
                        <input type="number" id="f_h" value="300" oninput="updateFrameLabels()" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_h', POPULAR_RECT)}
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Длина (L) мм (стандарт 1250)</label>
                        <input type="number" id="f_l" value="1250" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_l', [500, 1000, 1250, 1500, 2000, 2500])}
                    </div>
                    <div class="pt-2 border-t border-slate-800">
                        <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Рамки шинорейки:</div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <label class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-slate-700">
                                <input type="checkbox" id="f_flange1" checked onchange="updateFrameLabels()" class="rounded text-blue-600">
                                <span id="label_flange1" class="font-semibold text-slate-200">Рамка 1: 400×300 мм</span>
                            </label>
                            <label class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-slate-700">
                                <input type="checkbox" id="f_flange2" checked onchange="updateFrameLabels()" class="rounded text-blue-600">
                                <span id="label_flange2" class="font-semibold text-slate-200">Рамка 2: 400×300 мм</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        } else {
            box.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Диаметр (Ø) мм</label>
                        <input type="number" id="f_d" value="200" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_d', POPULAR_DIAM)}
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Длина (L) мм (стандарт 1250)</label>
                        <input type="number" id="f_l" value="1250" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_l', [500, 1000, 1250, 1500, 2000, 2500])}
                    </div>
                </div>
            `;
        }
        updateFrameLabels();
        return;
    }

    const fitId = document.getElementById('fittingTypeSelect').value;
    const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === fitId) || { params: ['w', 'h', 'len'] };
    let html = '<div class="space-y-3">';

    if (fitDef.params.includes('hood_type')) {
        html += `
            <div>
                <label class="block text-xs text-slate-400 mb-1">Вид зонта</label>
                <select id="f_hood_type" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white">
                    <option value="Пристенный">Пристенный</option>
                    <option value="Островной">Островной</option>
                </select>
            </div>
        `;
    }

    if (fitDef.params.includes('deg')) html += `<div><label class="block text-xs text-slate-400 mb-1">Градус (°)</label><input type="number" id="f_deg" value="90" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('deg135')) html += `<div><label class="block text-xs text-slate-400 mb-1">Градус (°)</label><input type="number" id="f_deg" value="135" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;

    if (fitDef.params.includes('w') && fitDef.params.includes('h')) {
        html += `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <label class="block text-xs text-slate-400">Ширина (мм)</label>
                    <button type="button" onclick="swapDims('f_w', 'f_h')" class="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition">⇄ Поменять A ↔ B</button>
                </div>
                <input type="number" id="f_w" value="400" oninput="updateFrameLabels()" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w', POPULAR_RECT)}
            </div>
            <div>
                <label class="block text-xs text-slate-400 mb-1">Высота (мм)</label>
                <input type="number" id="f_h" value="300" oninput="updateFrameLabels()" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h', POPULAR_RECT)}
            </div>
        `;
    } else {
        if (fitDef.params.includes('w')) html += `<div><label class="block text-xs text-slate-400 mb-1">Ширина (мм)</label><input type="number" id="f_w" value="400" oninput="updateFrameLabels()" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w', POPULAR_RECT)}</div>`;
        if (fitDef.params.includes('h')) html += `<div><label class="block text-xs text-slate-400 mb-1">Высота (мм)</label><input type="number" id="f_h" value="300" oninput="updateFrameLabels()" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h', POPULAR_RECT)}</div>`;
    }

    if (fitDef.params.includes('w1') && fitDef.params.includes('h1')) {
        const isSmoothTrans = fitDef.id === 's_trans' || session.activeShape === 'smooth';
        html += `
            <div class="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-[11px] font-bold text-slate-300">${isSmoothTrans ? 'Прямоугольное сечение (Вход):' : 'Рамка 1 (Вход):'}</span>
                    <button type="button" onclick="swapDims('f_w1', 'f_h1')" class="text-[10px] text-blue-400 hover:text-blue-300 font-bold transition">⇄ Поменять A1 ↔ B1</button>
                </div>
                <div><label class="block text-[10px] text-slate-400 mb-0.5">Ширина 1 (мм)</label><input type="number" id="f_w1" value="400" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 mono text-white text-xs">${renderChipScroller('f_w1', POPULAR_RECT)}</div>
                <div><label class="block text-[10px] text-slate-400 mb-0.5">Высота 1 (мм)</label><input type="number" id="f_h1" value="300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 mono text-white text-xs">${renderChipScroller('f_h1', POPULAR_RECT)}</div>
            </div>
        `;
    }

    if (fitDef.params.includes('w2') && fitDef.params.includes('h2')) {
        html += `
            <div class="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-[11px] font-bold text-slate-300">Рамка 2 (Выход):</span>
                    <button type="button" onclick="swapDims('f_w2', 'f_h2')" class="text-[10px] text-blue-400 hover:text-blue-300 font-bold transition">⇄ A2 ↔ B2</button>
                </div>
                <div><label class="block text-[10px] text-slate-400 mb-0.5">Ширина 2 (мм)</label><input type="number" id="f_w2" value="300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 mono text-white text-xs">${renderChipScroller('f_w2', POPULAR_RECT)}</div>
                <div><label class="block text-[10px] text-slate-400 mb-0.5">Высота 2 (мм)</label><input type="number" id="f_h2" value="250" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 mono text-white text-xs">${renderChipScroller('f_h2', POPULAR_RECT)}</div>
            </div>
        `;
    }

    if (fitDef.params.includes('d')) {
        const isSmoothTrans = fitDef.id === 's_trans' || session.activeShape === 'smooth';
        html += `<div><label class="block text-xs text-slate-400 mb-1">${isSmoothTrans ? 'Диаметр Ø (Выход) мм' : 'Диаметр Ø (мм)'}</label><input type="number" id="f_d" value="200" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d', POPULAR_DIAM)}</div>`;
    }
    if (fitDef.params.includes('d1')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр 1 Ø (мм)</label><input type="number" id="f_d1" value="250" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d1', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d2')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр 2 Ø (мм)</label><input type="number" id="f_d2" value="200" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d2', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d_main')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр основного воздуховода Ø (мм)</label><input type="number" id="f_d_main" value="315" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d_main', POPULAR_DIAM)}</div>`;

    if (fitDef.params.includes('len')) html += `<div><label class="block text-xs text-slate-400 mb-1">Длина L (мм)</label><input type="number" id="f_len" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('len_silencer')) html += `<div><label class="block text-xs text-slate-400 mb-1">Длина L (мм)</label><input type="number" id="f_len" value="1000" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_len', POPULAR_LEN_SILENCER)}</div>`;
    if (fitDef.params.includes('hood_seat')) html += `<div><label class="block text-xs text-slate-400 mb-1">Длина посадочного места (мм)</label><input type="number" id="f_hood_seat" value="100" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('offset')) html += `<div><label class="block text-xs text-slate-400 mb-1">Смещение (мм)</label><input type="number" id="f_offset" value="100" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('inlets_cnt')) html += `<div><label class="block text-xs text-slate-400 mb-1">Количество врезок (шт)</label><input type="number" id="f_inlets_cnt" value="2" min="1" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;

    if (fitDef.params.includes('tee_rect')) {
        html += `
            <div class="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_tee_same" onchange="toggleSameCheck('tee_rect', this.checked)" class="rounded text-blue-600"> <span class="font-bold text-slate-200">Все 3 рамки одинакового размера</span></label>
                <div><label class="block text-[11px] text-slate-400">Сечение 1 (А1×В1)</label><input type="text" id="f_ts1" value="400x300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_ts2"><label class="block text-[11px] text-slate-400">Сечение 2 (А2×В2)</label><input type="text" id="f_ts2" value="300x300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_ts3"><label class="block text-[11px] text-slate-400">Сечение 3 (А3×В3)</label><input type="text" id="f_ts3" value="400x300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div class="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                    <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Рамки шинорейки:</div>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_t_frame1" checked class="rounded text-blue-600"> <span id="label_t_fr1" class="font-mono text-slate-200">Рамка 1: 400×300 мм</span></label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_t_frame2" checked class="rounded text-blue-600"> <span id="label_t_fr2" class="font-mono text-slate-200">Рамка 2: 300×300 мм</span></label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_t_frame3" checked class="rounded text-blue-600"> <span id="label_t_fr3" class="font-mono text-slate-200">Рамка 3: 400×300 мм</span></label>
                </div>
            </div>
        `;
    }

    if (fitDef.params.includes('cross_rect')) {
        html += `
            <div class="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_cross_same" onchange="toggleSameCheck('cross_rect', this.checked)" class="rounded text-blue-600"> <span class="font-bold text-slate-200">Все 4 рамки одинакового размера</span></label>
                <div><label class="block text-[11px] text-slate-400">Сечение 1 (А1×В1)</label><input type="text" id="f_cs1" value="400x300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cs2"><label class="block text-[11px] text-slate-400">Сечение 2 (А2×В2)</label><input type="text" id="f_cs2" value="400x300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cs3"><label class="block text-[11px] text-slate-400">Сечение 3 (А3×В3)</label><input type="text" id="f_cs3" value="400x300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cs4"><label class="block text-[11px] text-slate-400">Сечение 4 (А4×В4)</label><input type="text" id="f_cs4" value="400x300" oninput="updateFrameLabels()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div class="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                    <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Рамки шинорейки:</div>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_c_frame1" checked class="rounded text-blue-600"> <span id="label_c_fr1" class="font-mono text-slate-200">Рамка 1: 400×300 мм</span></label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_c_frame2" checked class="rounded text-blue-600"> <span id="label_c_fr2" class="font-mono text-slate-200">Рамка 2: 400×300 мм</span></label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_c_frame3" checked class="rounded text-blue-600"> <span id="label_c_fr3" class="font-mono text-slate-200">Рамка 3: 400×300 мм</span></label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_c_frame4" checked class="rounded text-blue-600"> <span id="label_c_fr4" class="font-mono text-slate-200">Рамка 4: 400×300 мм</span></label>
                </div>
            </div>
        `;
    }

    if (fitDef.params.includes('tee_round')) {
        html += `
            <div class="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_tee_r_same" onchange="toggleSameCheck('tee_round', this.checked)" class="rounded text-blue-600"> <span>Все диаметры одинаковые</span></label>
                <div><label class="block text-[11px] text-slate-400">Ø1 (мм)</label><input type="number" id="f_tr1" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_tr2"><label class="block text-[11px] text-slate-400">Ø2 (мм)</label><input type="number" id="f_tr2" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_tr3"><label class="block text-[11px] text-slate-400">Ø3 (мм)</label><input type="number" id="f_tr3" value="250" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
            </div>
        `;
    }

    if (fitDef.params.includes('cross_round')) {
        html += `
            <div class="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_cross_r_same" onchange="toggleSameCheck('cross_round', this.checked)" class="rounded text-blue-600"> <span>Все 4 диаметра одинаковые</span></label>
                <div><label class="block text-[11px] text-slate-400">Ø1 (мм)</label><input type="number" id="f_cr1" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cr2"><label class="block text-[11px] text-slate-400">Ø2 (мм)</label><input type="number" id="f_cr2" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cr3"><label class="block text-[11px] text-slate-400">Ø3 (мм)</label><input type="number" id="f_cr3" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cr4"><label class="block text-[11px] text-slate-400">Ø4 (мм)</label><input type="number" id="f_cr4" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
            </div>
        `;
    }

    if (fitDef.params.includes('flange1') || fitDef.params.includes('flange2')) {
        const isTwo = fitDef.params.includes('flange2');
        html += `
            <div class="pt-2 border-t border-slate-800">
                <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Рамки шинорейки:</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-slate-700">
                        <input type="checkbox" id="f_flange1" checked onchange="updateFrameLabels()" class="rounded text-blue-600">
                        <span id="label_flange1" class="font-semibold text-slate-200">Рамка 1</span>
                    </label>
                    ${isTwo ? `
                        <label class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-slate-700">
                            <input type="checkbox" id="f_flange2" checked onchange="updateFrameLabels()" class="rounded text-blue-600">
                            <span id="label_flange2" class="font-semibold text-slate-200">Рамка 2</span>
                        </label>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Кастомные пользовательские параметры изделия
    const standardParamCodes = new Set(['deg', 'deg135', 'hood_type', 'w', 'h', 'w1', 'h1', 'w2', 'h2', 'd', 'd1', 'd2', 'd_main', 'len', 'len_silencer', 'hood_seat', 'offset', 'inlets_cnt', 'tee_rect', 'cross_rect', 'tee_round', 'cross_round', 'flange1', 'flange2']);
    const customParamsList = (fitDef.params || []).filter(p => !standardParamCodes.has(p));
    if (customParamsList.length > 0) {
        html += `<div class="pt-2 border-t border-slate-800 space-y-2.5"><div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Дополнительные параметры:</div>`;
        customParamsList.forEach(code => {
            const pDef = ALL_PARAM_DEFS.find(x => x.code === code) || { label: code, code };
            html += `
                <div>
                    <label class="block text-xs text-slate-400 mb-1">${pDef.label}</label>
                    <input type="text" id="f_${code}" placeholder="Введите ${pDef.label}..." class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white text-xs">
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

    const ts1 = document.getElementById('f_ts1')?.value || '400x300';
    const sameT = document.getElementById('f_tee_same')?.checked;
    const ts2 = sameT ? ts1 : (document.getElementById('f_ts2')?.value || ts1);
    const ts3 = sameT ? ts1 : (document.getElementById('f_ts3')?.value || ts1);
    if (document.getElementById('label_t_fr1')) document.getElementById('label_t_fr1').textContent = `Рамка 1: ${ts1} мм`;
    if (document.getElementById('label_t_fr2')) document.getElementById('label_t_fr2').textContent = `Рамка 2: ${ts2} мм`;
    if (document.getElementById('label_t_fr3')) document.getElementById('label_t_fr3').textContent = `Рамка 3: ${ts3} мм`;

    const cs1 = document.getElementById('f_cs1')?.value || '400x300';
    const sameC = document.getElementById('f_cross_same')?.checked;
    const cs2 = sameC ? cs1 : (document.getElementById('f_cs2')?.value || cs1);
    const cs3 = sameC ? cs1 : (document.getElementById('f_cs3')?.value || cs1);
    const cs4 = sameC ? cs1 : (document.getElementById('f_cs4')?.value || cs1);
    if (document.getElementById('label_c_fr1')) document.getElementById('label_c_fr1').textContent = `Рамка 1: ${cs1} мм`;
    if (document.getElementById('label_c_fr2')) document.getElementById('label_c_fr2').textContent = `Рамка 2: ${cs2} мм`;
    if (document.getElementById('label_c_fr3')) document.getElementById('label_c_fr3').textContent = `Рамка 3: ${cs3} мм`;
    if (document.getElementById('label_c_fr4')) document.getElementById('label_c_fr4').textContent = `Рамка 4: ${cs4} мм`;
}

function renderChipScroller(targetId, arr) {
    return `
        <div class="chip-scroll mt-1.5">
            ${arr.map(v => `<button type="button" onclick="document.getElementById('${targetId}').value = ${v}; updateFrameLabels();" class="chip-btn">${v}</button>`).join('')}
        </div>
    `;
}

function toggleSameCheck(type, isChecked) {
    if (type === 'tee_rect') {
        document.getElementById('wrap_ts2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_ts3').style.display = isChecked ? 'none' : 'block';
    } else if (type === 'cross_rect') {
        document.getElementById('wrap_cs2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cs3').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cs4').style.display = isChecked ? 'none' : 'block';
    } else if (type === 'tee_round') {
        document.getElementById('wrap_tr2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_tr3').style.display = isChecked ? 'none' : 'block';
    } else if (type === 'cross_round') {
        document.getElementById('wrap_cr2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cr3').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cr4').style.display = isChecked ? 'none' : 'block';
    }
    updateFrameLabels();
}

// ==========================================
// СОХРАНЕНИЕ ИЗДЕЛИЯ В SUPABASE С АВТОСУММИРОВАНИЕМ
// ==========================================
async function saveProjectItem(e) {
    e.preventDefault();
    const projId = session.insideProjectId;
    if (!projId) return;

    const editId = document.getElementById('editItemId').value;
    const metal = document.getElementById('inMetal').value;
    const thickness = Number(document.getElementById('inThickness').value);
    const qty = Number(document.getElementById('inQty').value) || 1;
    const price = Number(document.getElementById('inPrice').value) || 1000;
    const workers = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);

    let title = '';
    let itemKey = '';
    let dims = {
        item_status: 'queue'
    };
    if (editId) {
        const oldItem = appState.activeProjectItems.find(i => i.id === Number(editId));
        if (oldItem && oldItem.item_status) dims.item_status = oldItem.item_status;
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
            itemKey = `duct_rect_${dims.w}_${dims.h}_${dims.l}_${dims.flange1}_${dims.flange2}_${metal}_${thickness}`;
        } else {
            dims.d = Number(document.getElementById('f_d')?.value || 200);
            itemKey = `duct_round_${dims.d}_${dims.l}_${metal}_${thickness}`;
        }
    } else {
        const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === document.getElementById('fittingTypeSelect').value);
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

        if (document.getElementById('f_t_frame1')) {
            const sameT = document.getElementById('f_tee_same')?.checked;
            const ts1 = document.getElementById('f_ts1')?.value || '400x300';
            const ts2 = sameT ? ts1 : (document.getElementById('f_ts2')?.value || ts1);
            const ts3 = sameT ? ts1 : (document.getElementById('f_ts3')?.value || ts1);
            if (document.getElementById('f_t_frame1').checked) frames.push(ts1.replace('x', '×'));
            if (document.getElementById('f_t_frame2').checked) frames.push(ts2.replace('x', '×'));
            if (document.getElementById('f_t_frame3').checked) frames.push(ts3.replace('x', '×'));
            dims.descDetail = sameT ? `Все 3 рамки: ${ts1}` : `${ts1} / ${ts2} / ${ts3}`;
        } else if (document.getElementById('f_c_frame1')) {
            const sameC = document.getElementById('f_cross_same')?.checked;
            const cs1 = document.getElementById('f_cs1')?.value || '400x300';
            const cs2 = sameC ? cs1 : (document.getElementById('f_cs2')?.value || cs1);
            const cs3 = sameC ? cs1 : (document.getElementById('f_cs3')?.value || cs1);
            const cs4 = sameC ? cs1 : (document.getElementById('f_cs4')?.value || cs1);
            if (document.getElementById('f_c_frame1').checked) frames.push(cs1.replace('x', '×'));
            if (document.getElementById('f_c_frame2').checked) frames.push(cs2.replace('x', '×'));
            if (document.getElementById('f_c_frame3').checked) frames.push(cs3.replace('x', '×'));
            if (document.getElementById('f_c_frame4').checked) frames.push(cs4.replace('x', '×'));
            dims.descDetail = sameC ? `Все 4 рамки: ${cs1}` : `${cs1} / ${cs2} / ${cs3} / ${cs4}`;
        } else {
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
        }

        if (document.getElementById('f_tee_r_same')?.checked) {
            dims.descDetail = `Все Ø${document.getElementById('f_tr1').value}`;
        } else if (document.getElementById('f_tr1')) {
            dims.descDetail = `Ø${document.getElementById('f_tr1').value} / Ø${document.getElementById('f_tr2').value} / Ø${document.getElementById('f_tr3').value}`;
        }
        if (document.getElementById('f_cross_r_same')?.checked) {
            dims.descDetail = `Все Ø${document.getElementById('f_cr1').value}`;
        } else if (document.getElementById('f_cr1')) {
            dims.descDetail = `Ø${document.getElementById('f_cr1').value} / Ø${document.getElementById('f_cr2').value} / Ø${document.getElementById('f_cr3').value} / Ø${document.getElementById('f_cr4').value}`;
        }

        // Сбор значений всех дополнительных/пользовательских параметров изделия
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
        itemKey = `fit_${title}_${dims.w || 0}_${dims.h || 0}_${dims.w1 || 0}_${dims.h1 || 0}_${dims.w2 || 0}_${dims.h2 || 0}_${dims.d || 0}_${dims.d1 || 0}_${dims.d2 || 0}_${dims.d_main || 0}_${dims.l || 0}_${dims.deg || 0}_${dims.offset || 0}_${dims.hood_seat || 0}_${dims.inlets_cnt || 0}_${dims.flange1}_${dims.flange2}_${dims.descDetail || ''}_${frames.join('_')}_${metal}_${thickness}`;
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

    await supabaseClient.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projId);
    await loadProjectDetails(projId);
    resetItemForm();
    renderProjectInside();
}

function resetItemForm() {
    document.getElementById('editItemId').value = '';
    document.getElementById('formHeaderTitle').textContent = 'Добавить в проект';
    document.getElementById('cancelEditBtn').classList.add('hidden');
    document.getElementById('submitItemBtn').textContent = 'Добавить';
    const tSel = document.getElementById('inThickness');
    if (tSel && appState.thicknesses.includes(0.5)) {
        tSel.value = '0.5';
    }
    renderDynamicInputs();
    onWorkerSelectionChanged();
}

// ==========================================
// СПЕЦИФИКАЦИЯ ИЗДЕЛИЙ
// ==========================================
function renderSpecification() {
    const filterM = document.getElementById('specFilterMetal').value;
    const filterT = document.getElementById('specFilterThick').value;
    const search = (document.getElementById('specSearchInput')?.value || '').trim().toLowerCase();

    let items = appState.activeProjectItems.filter(it => {
        if (filterM !== 'all' && it.metal !== filterM) return false;
        if (filterT !== 'all' && Number(it.thickness) !== Number(filterT)) return false;
        if (search) {
            const framesText = (getItemFrames(it) || []).join(' ');
            const fullText = `${it.title} ${it.w || ''} ${it.h || ''} ${it.w1 || ''} ${it.h1 || ''} ${it.w2 || ''} ${it.h2 || ''} ${it.d || ''} ${it.l || ''} ${it.descDetail || ''} ${it.metal || ''} ${(it.workers || []).join(' ')} ${framesText}`.toLowerCase();
            if (!fullText.includes(search)) return false;
        }
        return true;
    });

    const totalQty = appState.activeProjectItems.reduce((s, i) => s + i.qty, 0);
    const doneQty = appState.activeProjectItems.filter(i => i.item_status === 'done').reduce((s, i) => s + i.qty, 0);
    const pct = totalQty > 0 ? Math.round((doneQty / totalQty) * 100) : 0;
    const pBar = document.getElementById('specProgressBar');
    if (pBar) {
        if (totalQty > 0) {
            pBar.classList.remove('hidden');
            document.getElementById('specProgressLabel').textContent = `Готово: ${doneQty} из ${totalQty} шт (${pct}%)`;
            document.getElementById('specProgressFill').style.width = `${pct}%`;
        } else {
            pBar.classList.add('hidden');
        }
    }

    const container = document.getElementById('specificationAccordionList');
    container.innerHTML = '';

    const selCount = session.selectedSpecIds.length;
    const totalItemsCount = appState.activeProjectItems.length;

    // Панель массовых действий
    const batchToolbar = document.getElementById('specBatchToolbar');
    const batchCount = document.getElementById('batchSelectedCount');
    const lblSelectAll = document.getElementById('lblSelectAllSpec');

    if (batchToolbar) batchToolbar.classList.toggle('hidden', selCount === 0);
    if (batchCount) batchCount.textContent = selCount;
    if (lblSelectAll) {
        lblSelectAll.textContent = (totalItemsCount > 0 && selCount === totalItemsCount) ? 'Снять выделение' : 'Выделить все';
    }

    const bulkBtn = document.getElementById('bulkDeleteBtn');
    const bulkCount = document.getElementById('bulkCount');
    if (bulkCount) bulkCount.textContent = selCount;
    if (bulkBtn) bulkBtn.classList.toggle('hidden', selCount === 0);

    if (items.length === 0) {
        container.innerHTML = `<div class="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">По выбранным фильтрам позиции не найдены</div>`;
        return;
    }

    const categories = [
        { id: 'sec_duct_rect', title: 'Воздуховоды прямоугольные', list: items.filter(i => i.category === 'duct' && i.shape === 'rect') },
        { id: 'sec_duct_round', title: 'Воздуховоды круглые', list: items.filter(i => i.category === 'duct' && i.shape === 'round') },
        { id: 'sec_fit_rect', title: 'Изделия прямоугольные', list: items.filter(i => i.category === 'fitting' && i.shape === 'rect') },
        { id: 'sec_fit_round', title: 'Изделия круглые', list: items.filter(i => i.category === 'fitting' && i.shape === 'round') },
        { id: 'sec_fit_smooth', title: 'Изделия плавные', list: items.filter(i => i.category === 'fitting' && i.shape === 'smooth') }
    ];

    categories.forEach(sec => {
        if (sec.list.length === 0) return;
        const isExpanded = session.accordionState[sec.id] !== false;

        const block = document.createElement('div');
        block.className = 'bg-slate-950 border border-slate-800 rounded-xl overflow-hidden';
        block.innerHTML = `
            <button onclick="toggleSectionAccordion('${sec.id}')" class="w-full p-3.5 bg-slate-900/60 border-b border-slate-800/80 flex justify-between items-center text-left hover:bg-slate-900 transition">
                <div class="flex items-center gap-2">
                    <span class="text-blue-400 font-bold text-xs">${isExpanded ? '▼' : '▶'}</span>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-200">${sec.title}</span>
                    <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full mono">${sec.list.length}</span>
                </div>
                <span class="text-xs text-slate-400 mono">Сумма: ${sec.list.reduce((s, i) => s + i.qty, 0)} шт</span>
            </button>
            <div id="${sec.id}_body" class="${isExpanded ? '' : 'hidden'} p-3 space-y-2">
                ${sec.list.map(it => renderSpecItemRow(it)).join('')}
            </div>
        `;
        container.appendChild(block);
    });
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
        if (it.w1 && it.w2) {
            descParts.push(`${it.w1}×${it.h1} → ${it.w2}×${it.h2}`);
        } else if (it.w1 && it.h1 && it.d) {
            descParts.push(`${it.w1}×${it.h1} → Ø${it.d}`);
        } else if (it.w && it.h && it.d && (it.shape === 'smooth' || it.fittingId === 's_trans')) {
            descParts.push(`${it.w}×${it.h} → Ø${it.d}`);
        } else if (it.w1 && it.h1) {
            descParts.push(`${it.w1}×${it.h1}`);
        } else if (it.w && it.h) {
            descParts.push(`${it.w}×${it.h}`);
        }

        if (it.d1 && it.d2) {
            descParts.push(`Ø${it.d1} → Ø${it.d2}`);
        } else if (it.d && !it.w1 && !(it.w && (it.shape === 'smooth' || it.fittingId === 's_trans'))) {
            descParts.push(`Ø${it.d}`);
        }
        if (it.d_main) descParts.push(`Осн: Ø${it.d_main}`);
        if (it.l) descParts.push(`L=${it.l}`);
        if (it.hood_seat) descParts.push(`Посадка: ${it.hood_seat} мм`);
        if (it.offset) descParts.push(`Смещение: ${it.offset} мм`);
        if (it.inlets_cnt) descParts.push(`Врезок: ${it.inlets_cnt} шт`);

        // Отображение кастомных параметров если они заданы
        const standardParamCodes = new Set(['deg', 'deg135', 'hood_type', 'w', 'h', 'w1', 'h1', 'w2', 'h2', 'd', 'd1', 'd2', 'd_main', 'len', 'len_silencer', 'hood_seat', 'offset', 'inlets_cnt', 'tee_rect', 'cross_rect', 'tee_round', 'cross_round', 'flange1', 'flange2']);
        ALL_PARAM_DEFS.forEach(pDef => {
            if (!standardParamCodes.has(pDef.code) && it[pDef.code] !== undefined && it[pDef.code] !== '') {
                descParts.push(`${pDef.label}: ${it[pDef.code]}`);
            }
        });
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
    const stConfig = {
        queue: { text: '⏳ Не готово', cls: 'bg-white/5 text-zinc-400 border-white/10 hover:border-emerald-500' },
        done: { text: '✓ Готово', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:border-amber-500' }
    };
    const curSt = stConfig[st] || stConfig.queue;

    return `
        <div class="bg-[#12141c] border ${isSelected ? 'border-white/30 bg-[#181b26]' : 'border-white/5 hover:border-white/10'} rounded-2xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition">
            <div class="flex items-start gap-3 w-full sm:w-auto min-w-0">
                <input type="checkbox" onchange="toggleSpecItemSelect(${it.id}, this.checked)" ${isSelected ? 'checked' : ''} class="mt-1 rounded text-white accent-white">
                <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-extrabold text-xs sm:text-sm text-white">${it.title}</span>
                        <button type="button" onclick="toggleItemStatus(${it.id})" title="Нажмите, чтобы переключить этап производства" class="border px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${curSt.cls}">${curSt.text}</button>
                    </div>
                    <div class="text-xs text-zinc-300 mono mt-0.5">${descParts.join(' | ')}</div>
                    ${framesHtml}
                    <div class="text-[11px] text-zinc-400 mt-0.5">Металл: <strong class="text-zinc-200">${it.metal} ${it.thickness} мм</strong> ${isDev() ? `| Тариф: <span class="mono text-emerald-400">${it.price} ₸</span>` : ''}</div>
                    ${workersHtml}
                </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <div class="text-sm font-black mono text-white">${it.qty} шт</div>
                <div class="flex gap-1.5">
                    <button onclick="duplicateWithModal(${it.id})" title="Дублировать с изменением" class="bg-white/5 hover:bg-white/10 text-zinc-200 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-white/5 transition">⧉</button>
                    <button onclick="editProjectItem(${it.id})" title="Редактировать" class="bg-white/5 hover:bg-white/10 text-zinc-200 px-2.5 py-1.5 rounded-xl text-xs border border-white/5 transition">✎</button>
                    <button onclick="deleteSingleItem(${it.id})" title="Удалить" class="bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 px-2.5 py-1.5 rounded-xl text-xs border border-white/5 transition">✕</button>
                </div>
            </div>
        </div>
    `;
}

async function toggleItemStatus(id) {
    const it = appState.activeProjectItems.find(x => x.id === id);
    if (!it) return;
    const cur = it.item_status || 'queue';
    const next = (cur === 'done') ? 'queue' : 'done';
    it.item_status = next;
    if (!it.dimensions) it.dimensions = {};
    it.dimensions.item_status = next;
    await supabaseClient.from('items').update({ dimensions: it.dimensions }).eq('id', id);

    const globalIt = appState.allItems.find(x => x.id === id);
    if (globalIt) {
        globalIt.item_status = next;
        if (!globalIt.dimensions) globalIt.dimensions = {};
        globalIt.dimensions.item_status = next;
    }

    updateHeaderUI();
    renderSpecification();
    showToast(`Статус: ${next === 'done' ? '✓ Готово' : '⏳ Не готово'}`, next === 'done' ? 'success' : 'info');
}

function toggleSelectAllSpecItems() {
    if (!appState.activeProjectItems || appState.activeProjectItems.length === 0) return;
    if (session.selectedSpecIds.length === appState.activeProjectItems.length) {
        session.selectedSpecIds = [];
    } else {
        session.selectedSpecIds = appState.activeProjectItems.map(it => it.id);
    }
    renderSpecification();
}

async function batchSetStatus(newStatus) {
    if (!session.selectedSpecIds || session.selectedSpecIds.length === 0) {
        alert('Выберите хотя бы одно изделие');
        return;
    }
    const count = session.selectedSpecIds.length;
    for (const id of session.selectedSpecIds) {
        const it = appState.activeProjectItems.find(x => x.id === id);
        if (it) {
            it.item_status = newStatus;
            if (!it.dimensions) it.dimensions = {};
            it.dimensions.item_status = newStatus;
            await supabaseClient.from('items').update({ dimensions: it.dimensions }).eq('id', id);
        }
        const globalIt = appState.allItems.find(x => x.id === id);
        if (globalIt) {
            globalIt.item_status = newStatus;
            if (!globalIt.dimensions) globalIt.dimensions = {};
            globalIt.dimensions.item_status = newStatus;
        }
    }
    updateHeaderUI();
    renderSpecification();
    showToast(`Статус ${newStatus === 'done' ? '✓ Готово' : '⏳ Не готово'} установлен для ${count} поз.`, 'success');
}

// ==========================================
// ГРУППОВОЕ РЕДАКТИРОВАНИЕ ПОЗИЦИЙ
// ==========================================
let bulkSharesState = {};

function toggleBulkField(checkId, targetWrapperId) {
    const checked = document.getElementById(checkId)?.checked;
    const wrapper = document.getElementById(targetWrapperId);
    if (wrapper) {
        wrapper.classList.toggle('opacity-40', !checked);
        wrapper.classList.toggle('pointer-events-none', !checked);
    }
}

function openBulkEditModal() {
    if (!session.selectedSpecIds || session.selectedSpecIds.length === 0) {
        alert('Выберите изделия галочками для группового изменения');
        return;
    }

    const modal = document.getElementById('bulkEditModal');
    if (!modal) return;

    document.getElementById('bulkEditItemsCount').textContent = session.selectedSpecIds.length;

    ['bulkCheckMetal', 'bulkCheckThick', 'bulkCheckPrice', 'bulkCheckWorkers'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });
    toggleBulkField('bulkCheckMetal', 'bulkWrapMetal');
    toggleBulkField('bulkCheckThick', 'bulkWrapThick');
    toggleBulkField('bulkCheckPrice', 'bulkWrapPrice');
    toggleBulkField('bulkCheckWorkers', 'bulkWrapWorkers');

    const selMetal = document.getElementById('bulkSelectMetal');
    selMetal.innerHTML = appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');

    const selThick = document.getElementById('bulkSelectThick');
    selThick.innerHTML = appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');
    if (appState.thicknesses.includes(0.5)) selThick.value = '0.5';

    const wBox = document.getElementById('bulkWorkersCheckboxes');
    wBox.innerHTML = appState.users.map(u => `
        <label class="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-slate-700 transition text-xs">
            <input type="checkbox" name="bulkAssignWorker" onchange="onBulkWorkersSelectionChanged()" value="${u.name}" class="rounded text-blue-600">
            <span class="text-slate-300 font-medium truncate">${u.name}</span>
        </label>
    `).join('');

    bulkSharesState = {};
    const sharesBox = document.getElementById('bulkSharesBox');
    if (sharesBox) sharesBox.classList.add('hidden');

    modal.classList.remove('hidden');
}

function closeBulkEditModal() {
    const modal = document.getElementById('bulkEditModal');
    if (modal) modal.classList.add('hidden');
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
            <div class="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs">
                <span class="font-bold text-white">${w}</span>
                <div class="flex items-center gap-1">
                    <input type="number" min="0" max="100" value="${pct}" oninput="bulkSharesState['${w}'] = Number(this.value)" class="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center mono font-bold text-amber-300">
                    <span class="text-slate-400 font-bold">%</span>
                </div>
            </div>
        `;
    }).join('');
}

async function applyBulkEdit() {
    const changeMetal = document.getElementById('bulkCheckMetal')?.checked;
    const changeThick = document.getElementById('bulkCheckThick')?.checked;
    const changePrice = document.getElementById('bulkCheckPrice')?.checked;
    const changeWorkers = document.getElementById('bulkCheckWorkers')?.checked;

    if (!changeMetal && !changeThick && !changePrice && !changeWorkers) {
        alert('Пожалуйста, отметьте хотя бы один параметр для изменения');
        return;
    }

    const valMetal = document.getElementById('bulkSelectMetal')?.value;
    const valThick = Number(document.getElementById('bulkSelectThick')?.value);
    const valPrice = Number(document.getElementById('bulkInputPrice')?.value);
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
        if (changePrice) {
            it.price = valPrice;
            it.dimensions.price = valPrice;
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
            price: it.price,
            workers: it.workers,
            dimensions: it.dimensions
        }).eq('id', id);

        const globalIt = appState.allItems.find(x => x.id === id);
        if (globalIt) {
            if (changeMetal) globalIt.metal = valMetal;
            if (changeThick) globalIt.thickness = valThick;
            if (changePrice) globalIt.price = valPrice;
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

function toggleSpecItemSelect(id, checked) {
    if (checked) {
        if (!session.selectedSpecIds.includes(id)) session.selectedSpecIds.push(id);
    } else {
        session.selectedSpecIds = session.selectedSpecIds.filter(x => x !== id);
    }
    renderSpecification();
}

async function deleteSelectedItems() {
    if (!confirm(`Удалить выбранные позиции (${session.selectedSpecIds.length} шт)?`)) return;
    await supabaseClient.from('items').delete().in('id', session.selectedSpecIds);
    session.selectedSpecIds = [];
    await loadProjectDetails(session.insideProjectId);
    renderProjectInside();
}

async function deleteSingleItem(id) {
    await supabaseClient.from('items').delete().eq('id', id);
    session.selectedSpecIds = session.selectedSpecIds.filter(x => x !== id);
    await loadProjectDetails(session.insideProjectId);
    renderProjectInside();
}

function duplicateWithModal(id) {
    const it = appState.activeProjectItems.find(x => x.id === id);
    if (!it) return;

    editProjectItem(id);
    document.getElementById('editItemId').value = '';
    document.getElementById('formHeaderTitle').textContent = `Дубликат: ${it.title} (измените нужные параметры)`;
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('submitItemBtn').textContent = '+ Создать дубликат';
    window.scrollTo({ top: document.getElementById('itemFormCard').offsetTop - 60, behavior: 'smooth' });
}

function editProjectItem(id) {
    const it = appState.activeProjectItems.find(x => x.id === id);
    if (!it) return;

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

    window.scrollTo({ top: document.getElementById('itemFormCard').offsetTop - 60, behavior: 'smooth' });
}
