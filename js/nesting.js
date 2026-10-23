// ==========================================
// MODULE: nesting.js
// 2D Раскрой листа для воздуховодов, учет деловых обрезков листа,
// нулевой рез ножниц (kerf = 0), выбор размеров листа и экспорт в PDF
// ==========================================

let editingSheetScrapIdx = null;

// ==========================================
// ПРЕСЕТЫ РАЗМЕРОВ ЛИСТА
// ==========================================
function setNestingSheetPreset(w, h) {
    triggerHaptic('light');
    const inpW = document.getElementById('nestSheetW');
    const inpH = document.getElementById('nestSheetH');
    if (inpW) inpW.value = w;
    if (inpH) inpH.value = h;
    showToast(`Выбран размер листа: ${w} × ${h} мм`, 'info');
}

// ==========================================
// ДЕЛОВЫЕ ОБРЕЗКИ ЛИСТА ДЛЯ РАСКРОЯ
// ==========================================
function openNestingAddScrapModal(editIdx = null) {
    triggerHaptic('light');
    editingSheetScrapIdx = editIdx;
    const modal = document.getElementById('nestingAddScrapModal');
    if (!modal) return;

    const inpW = document.getElementById('modalSheetScrapW');
    const inpL = document.getElementById('modalSheetScrapL');
    const inpQty = document.getElementById('modalSheetScrapQty');

    const key = session.activeNestingKey || 'default';
    if (!session.activeNestingScraps[key]) session.activeNestingScraps[key] = [];
    const list = session.activeNestingScraps[key];

    if (editIdx !== null && list[editIdx]) {
        const item = list[editIdx];
        if (inpW) inpW.value = item.w;
        if (inpL) inpL.value = item.l;
        if (inpQty) inpQty.value = item.qty || 1;
    } else {
        const sheetW = Number(document.getElementById('nestSheetW')?.value) || 1250;
        if (inpW) inpW.value = sheetW;
        if (inpL) inpL.value = '';
        if (inpQty) inpQty.value = 1;
    }

    modal.classList.remove('hidden');
    setTimeout(() => inpL?.focus(), 80);
}

function closeNestingAddScrapModal() {
    triggerHaptic('light');
    const modal = document.getElementById('nestingAddScrapModal');
    if (modal) modal.classList.add('hidden');
    editingSheetScrapIdx = null;
}

async function submitNestingAddScrapModal() {
    const w = Number(document.getElementById('modalSheetScrapW')?.value) || 1250;
    const l = Number(document.getElementById('modalSheetScrapL')?.value);
    const qty = Number(document.getElementById('modalSheetScrapQty')?.value) || 1;

    if (!l || l < 100) {
        showToast('Укажите корректную длину обрезка (от 100 мм)', 'warning');
        return;
    }

    const key = session.activeNestingKey || 'default';
    if (!session.activeNestingScraps[key]) session.activeNestingScraps[key] = [];

    if (editingSheetScrapIdx !== null && session.activeNestingScraps[key][editingSheetScrapIdx]) {
        session.activeNestingScraps[key][editingSheetScrapIdx] = { w, l, qty };
        showToast(`Обрезок ${w}×${l} мм обновлен`, 'success');
    } else {
        session.activeNestingScraps[key].push({ w, l, qty });
        showToast(`Обрезок ${w}×${l} мм (${qty} шт) добавлен`, 'success');
    }

    closeNestingAddScrapModal();
    renderNestingScrapsList();
}

function deleteNestingScrap(idx) {
    triggerHaptic('warning');
    const key = session.activeNestingKey || 'default';
    if (session.activeNestingScraps[key]) {
        session.activeNestingScraps[key].splice(idx, 1);
        renderNestingScrapsList();
        showToast('Обрезок удален', 'info');
    }
}

function renderNestingScrapsList() {
    const box = document.getElementById('nestingScrapsList');
    if (!box) return;

    const key = session.activeNestingKey || 'default';
    const list = session.activeNestingScraps[key] || [];

    if (list.length === 0) {
        box.innerHTML = `<span class="text-zinc-500 italic text-[11px]">Нет обрезков для металла «${key}». Они используются в раскрое в первую очередь.</span>`;
        return;
    }

    box.innerHTML = list.map((s, i) => `
        <span class="bg-[#18181f] border border-amber-500/30 px-3 py-1.5 rounded-xl text-zinc-200 mono flex items-center gap-2 text-xs font-bold">
            <span class="text-amber-300">✂️ ${s.w}×${s.l} мм</span>
            <strong class="text-white">(${s.qty} шт)</strong>
            <button type="button" onclick="openNestingAddScrapModal(${i})" title="Редактировать" class="text-zinc-400 hover:text-white ml-1 btn-press">✎</button>
            <button type="button" onclick="deleteNestingScrap(${i})" title="Удалить" class="text-zinc-500 hover:text-rose-400 font-bold btn-press">×</button>
        </span>
    `).join('');
}

// ==========================================
// ОСНОВНОЙ ЭКРАН РАСКРОЯ
// ==========================================
function renderProjectNesting() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;

    const seams = getProjectSeams(p);

    let ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    if (session.activePhaseId && session.activePhaseId !== 'all') {
        ducts = ducts.filter(i => (i.phase_id || i.dimensions?.phase_id || 'main') === session.activePhaseId);
    }

    const queues = {};
    ducts.forEach(d => {
        const k = `${d.metal} ${d.thickness} мм`;
        if (!queues[k]) queues[k] = [];
        queues[k].push(d);
    });

    const tabs = document.getElementById('nestingSheetTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    const keys = Object.keys(queues);

    if (keys.length === 0) {
        tabs.innerHTML = `<span class="text-xs text-zinc-500">В выбранной очереди нет воздуховодов для раскроя листа</span>`;
        document.getElementById('nestingDuctsSelectionBox').innerHTML = '';
        document.getElementById('nestingVisualizerBox').innerHTML = '';
        return;
    }

    if (!session.activeNestingKey || !queues[session.activeNestingKey]) {
        session.activeNestingKey = keys[0];
    }

    keys.forEach(k => {
        const btn = document.createElement('button');
        const isSel = (k === session.activeNestingKey);
        btn.className = `px-3.5 py-2 rounded-xl text-xs font-bold transition btn-press whitespace-nowrap ${
            isSel ? 'bg-white text-black shadow-sm' : 'bg-[#18181f] border border-white/5 text-zinc-300 hover:text-white'
        }`;
        btn.textContent = `${k} (${queues[k].reduce((s, i) => s + i.qty, 0)} шт)`;
        btn.onclick = () => {
            session.activeNestingKey = k;
            renderProjectNesting();
        };
        tabs.appendChild(btn);
    });

    renderNestingScrapsList();

    const currentDucts = queues[session.activeNestingKey] || [];
    const selBox = document.getElementById('nestingDuctsSelectionBox');

    selBox.innerHTML = `
        <div class="space-y-3">
            <div class="flex flex-wrap justify-between items-center text-xs border-b border-white/5 pb-2.5 gap-2">
                <div>
                    <span class="font-extrabold text-white uppercase tracking-wider">Воздуховоды в раскрой:</span>
                    <span class="text-zinc-400 ml-2">Фальцы проекта: <strong class="text-amber-300 mono">${seams.lock_pittsburgh}+${seams.lock_single} мм</strong></span>
                </div>
                <div class="text-[11px] text-zinc-500">
                    Режем ножницами (зазор 0 мм). При развертке > 2500 мм используйте L или П гибки.
                </div>
            </div>
            <div class="space-y-2.5">
                ${currentDucts.map(d => {
                    if (!session.nestingCustomModes[d.id]) {
                        const wholeUnfold = d.shape === 'rect' ? (2 * (d.w + d.h) + seams.lock_pittsburgh + seams.lock_single) : Math.round(Math.PI * d.d + seams.round_seam);
                        const autoMode = (d.shape === 'rect' && wholeUnfold > 2450) ? 'L' : 'whole';
                        session.nestingCustomModes[d.id] = {
                            mode: autoMode,
                            wholeQty: autoMode === 'whole' ? d.qty : 0,
                            lQty: autoMode === 'L' ? d.qty : 0,
                            uQty: 0,
                            showSplit: false
                        };
                    }
                    const cfg = session.nestingCustomModes[d.id];

                    if (d.shape === 'round') {
                        const unfold = Math.round(Math.PI * d.d + seams.round_seam);
                        return `
                            <div class="bg-[#18181f] p-3 rounded-2xl border border-white/5 text-xs flex flex-wrap justify-between items-center gap-3">
                                <div class="flex items-center gap-3">
                                    <input type="checkbox" id="nestDuctCheck_${d.id}" checked class="rounded text-white accent-white">
                                    <div>
                                        <div class="font-bold text-white">Ø${d.d} мм <span class="text-zinc-400 font-normal">| L=${d.l || 1250} мм</span></div>
                                        <div class="text-[11px] text-zinc-400 mono mt-0.5">Развертка (πD + ${seams.round_seam} мм): <strong class="text-zinc-200">${unfold} × ${d.l || 1250} мм</strong></div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-zinc-400">Штук:</span>
                                    <input type="number" id="nestDuctQty_${d.id}" value="${d.qty}" min="1" max="${d.qty}" inputmode="numeric" class="w-16 bg-[#121217] border border-white/10 rounded-xl px-2 py-1 text-center mono text-white font-bold">
                                </div>
                            </div>
                        `;
                    }

                    const unfoldWhole = 2 * (d.w + d.h) + seams.lock_pittsburgh + seams.lock_single;
                    const unfoldL = d.w + d.h + seams.lock_pittsburgh + seams.lock_single;
                    const unfoldTrough = 2 * d.h + d.w + 2 * seams.lock_pittsburgh;
                    const unfoldCap = d.w + 2 * seams.lock_single;
                    const exceeds2500 = unfoldWhole > 2500;

                    return `
                        <div class="bg-[#18181f] p-3.5 rounded-2xl border ${exceeds2500 && cfg.mode === 'whole' ? 'border-rose-500/40 bg-rose-950/10' : 'border-white/5'} text-xs space-y-2.5">
                            <div class="flex flex-wrap justify-between items-center gap-2">
                                <div class="flex items-center gap-3">
                                    <input type="checkbox" id="nestDuctCheck_${d.id}" checked class="rounded text-white accent-white">
                                    <div>
                                        <span class="font-extrabold text-white text-sm">${d.w}×${d.h} мм</span>
                                        <span class="text-zinc-400 ml-2 mono text-[11px]">L=${d.l || 1250} мм</span>
                                        ${exceeds2500 ? '<span class="ml-2 bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-rose-500/30">⚠ >2500 мм — выберите L или П</span>' : ''}
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-zinc-400">Всего:</span>
                                    <input type="number" id="nestDuctQty_${d.id}" value="${d.qty}" min="1" max="${d.qty}" inputmode="numeric" class="w-16 bg-[#121217] border border-white/10 rounded-xl px-2 py-1 text-center mono text-white font-bold" onchange="onNestingDuctQtyChange(${d.id})">
                                    <span class="text-zinc-400">шт</span>
                                </div>
                            </div>

                            <!-- Кнопки выбора типа гибки -->
                            <div class="bg-[#121217] p-2.5 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <span class="text-[11px] text-zinc-400 font-semibold mr-1">Гибка:</span>
                                    <button type="button" onclick="setNestingDuctMode(${d.id}, 'whole')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition btn-press ${cfg.mode === 'whole' ? 'bg-white text-black shadow-sm' : 'bg-white/5 text-zinc-400 hover:text-white'}">
                                        Цельный (${unfoldWhole} мм)
                                    </button>
                                    <button type="button" onclick="setNestingDuctMode(${d.id}, 'L')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition btn-press ${cfg.mode === 'L' ? 'bg-white text-black shadow-sm' : 'bg-white/5 text-zinc-400 hover:text-white'}">
                                        L-половинки (2×${unfoldL} мм)
                                    </button>
                                    <button type="button" onclick="setNestingDuctMode(${d.id}, 'U')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition btn-press ${cfg.mode === 'U' ? 'bg-white text-black shadow-sm' : 'bg-white/5 text-zinc-400 hover:text-white'}">
                                        П-корыто (${unfoldTrough}) + Крышка (${unfoldCap})
                                    </button>
                                </div>
                                ${d.qty > 1 ? `
                                    <button type="button" onclick="toggleNestingDuctSplit(${d.id})" class="text-[11px] font-bold ${cfg.showSplit ? 'text-amber-300 underline' : 'text-zinc-400 hover:text-white'} btn-press">
                                        ${cfg.showSplit ? '▾ Скрыть разделение' : '⚙ Разбить партию'}
                                    </button>
                                ` : ''}
                            </div>

                            ${cfg.showSplit && d.qty > 1 ? `
                                <div class="bg-[#121217] p-3 rounded-xl border border-amber-500/20 space-y-2">
                                    <div class="text-[11px] text-amber-300 font-bold">Распределение партии (сумма должна быть ${d.qty} шт):</div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <div>
                                            <label class="block text-[10px] text-zinc-400 mb-0.5">Цельных (шт)</label>
                                            <input type="number" id="split_whole_${d.id}" value="${cfg.wholeQty}" min="0" max="${d.qty}" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-lg px-2 py-1 text-center mono text-white text-xs font-bold" onchange="updateNestingSplitValues(${d.id})">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] text-zinc-400 mb-0.5">L-образных (шт)</label>
                                            <input type="number" id="split_l_${d.id}" value="${cfg.lQty}" min="0" max="${d.qty}" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-lg px-2 py-1 text-center mono text-white text-xs font-bold" onchange="updateNestingSplitValues(${d.id})">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] text-zinc-400 mb-0.5">П-образных (шт)</label>
                                            <input type="number" id="split_u_${d.id}" value="${cfg.uQty}" min="0" max="${d.qty}" inputmode="numeric" class="w-full bg-[#18181f] border border-white/10 rounded-lg px-2 py-1 text-center mono text-white text-xs font-bold" onchange="updateNestingSplitValues(${d.id})">
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    renderNestingResult(p);
}

function setNestingDuctMode(id, mode) {
    if (!session.nestingCustomModes[id]) session.nestingCustomModes[id] = {};
    const it = appState.activeProjectItems.find(x => x.id === id);
    const totalQty = it ? it.qty : 1;
    session.nestingCustomModes[id].mode = mode;
    session.nestingCustomModes[id].wholeQty = mode === 'whole' ? totalQty : 0;
    session.nestingCustomModes[id].lQty = mode === 'L' ? totalQty : 0;
    session.nestingCustomModes[id].uQty = mode === 'U' ? totalQty : 0;
    renderProjectNesting();
}

function toggleNestingDuctSplit(id) {
    if (!session.nestingCustomModes[id]) session.nestingCustomModes[id] = {};
    session.nestingCustomModes[id].showSplit = !session.nestingCustomModes[id].showSplit;
    renderProjectNesting();
}

function updateNestingSplitValues(id) {
    const cfg = session.nestingCustomModes[id];
    if (!cfg) return;
    cfg.wholeQty = Number(document.getElementById(`split_whole_${id}`)?.value || 0);
    cfg.lQty = Number(document.getElementById(`split_l_${id}`)?.value || 0);
    cfg.uQty = Number(document.getElementById(`split_u_${id}`)?.value || 0);
}

function onNestingDuctQtyChange(id) {
    const val = Number(document.getElementById(`nestDuctQty_${id}`)?.value || 1);
    const cfg = session.nestingCustomModes[id];
    if (cfg && !cfg.showSplit) {
        if (cfg.mode === 'whole') cfg.wholeQty = val;
        if (cfg.mode === 'L') cfg.lQty = val;
        if (cfg.mode === 'U') cfg.uQty = val;
    }
}

// ==========================================
// РАСЧЕТ РАСКРОЯ С УЧЕТОМ ОБРЕЗКОВ И НОЖНИЦ (KERF = 0)
// ==========================================
function runNesting() {
    calculateAndSaveNesting();
}

async function calculateAndSaveNesting() {
    const projId = session.insideProjectId;
    const p = appState.projects.find(x => x.id === projId);
    if (!p) return;

    const seams = getProjectSeams(p);
    const ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    const currentDucts = ducts.filter(d => `${d.metal} ${d.thickness} мм` === session.activeNestingKey);

    const partsToCut = [];
    currentDucts.forEach(d => {
        const isChecked = document.getElementById(`nestDuctCheck_${d.id}`)?.checked;
        const totalQty = Number(document.getElementById(`nestDuctQty_${d.id}`)?.value || 0);
        if (!isChecked || totalQty <= 0) return;

        if (d.shape === 'round') {
            const unfoldL = Math.round(Math.PI * d.d + seams.round_seam);
            for (let i = 0; i < totalQty; i++) {
                partsToCut.push({
                    title: d.title,
                    label: `Ø${d.d}`,
                    subLabel: 'Круглый',
                    cutL: unfoldL,
                    cutW: d.l || 1250,
                    type: 'round'
                });
            }
            return;
        }

        const cfg = session.nestingCustomModes[d.id] || { mode: 'whole', wholeQty: totalQty, lQty: 0, uQty: 0 };
        const unfoldWhole = 2 * (d.w + d.h) + seams.lock_pittsburgh + seams.lock_single;
        const unfoldL = d.w + d.h + seams.lock_pittsburgh + seams.lock_single;
        const unfoldTrough = 2 * d.h + d.w + 2 * seams.lock_pittsburgh;
        const unfoldCap = d.w + 2 * seams.lock_single;

        let wQty = 0, lQty = 0, uQty = 0;
        if (cfg.showSplit) {
            wQty = cfg.wholeQty || 0;
            lQty = cfg.lQty || 0;
            uQty = cfg.uQty || 0;
        } else {
            if (cfg.mode === 'whole') wQty = totalQty;
            else if (cfg.mode === 'L') lQty = totalQty;
            else if (cfg.mode === 'U') uQty = totalQty;
        }

        for (let i = 0; i < wQty; i++) {
            partsToCut.push({ title: d.title, label: `${d.w}×${d.h}`, subLabel: 'Цельный', cutL: unfoldWhole, cutW: d.l || 1250, type: 'whole' });
        }
        for (let i = 0; i < lQty * 2; i++) {
            partsToCut.push({ title: d.title, label: `${d.w}×${d.h}`, subLabel: 'L-1/2', cutL: unfoldL, cutW: d.l || 1250, type: 'L' });
        }
        for (let i = 0; i < uQty; i++) {
            partsToCut.push({ title: d.title, label: `${d.w}×${d.h}`, subLabel: 'П-корыто', cutL: unfoldTrough, cutW: d.l || 1250, type: 'trough' });
            partsToCut.push({ title: d.title, label: `${d.w}×${d.h}`, subLabel: 'Крышка', cutL: unfoldCap, cutW: d.l || 1250, type: 'cap' });
        }
    });

    if (partsToCut.length === 0) {
        showToast('Отметьте галочками хотя бы один воздуховод', 'warning');
        return;
    }

    const sheetW = Number(document.getElementById('nestSheetW')?.value) || 1250;
    const sheetL = Number(document.getElementById('nestSheetH')?.value) || 2500;
    const kerf = Number(document.getElementById('nestKerf')?.value) || 0; // ножницы: 0 мм

    const tooLong = partsToCut.filter(p => p.cutL > sheetL);
    if (tooLong.length > 0) {
        alert(`Ошибка: деталь ${tooLong[0].label} (${tooLong[0].cutL} мм) превышает длину листа ${sheetL} мм.\nПереключите ее на L или П гибки!`);
        return;
    }

    // Сортировка по убыванию длины
    partsToCut.sort((a, b) => b.cutL - a.cutL);

    const sheets = [];

    // ШАГ 1: ПРИОРИТЕТНОЕ ЗАПОЛНЕНИЕ ДЕЛОВЫХ ОБРЕЗКОВ
    const scrapKey = session.activeNestingKey || 'default';
    const scrapsPool = (session.activeNestingScraps[scrapKey] || []).flatMap(s => {
        const arr = [];
        for (let i = 0; i < (s.qty || 1); i++) {
            arr.push({ w: s.w, l: s.l, isScrap: true, parts: [], cutDone: false });
        }
        return arr;
    });

    for (let sc of scrapsPool) {
        for (let i = 0; i < partsToCut.length; i++) {
            const pt = partsToCut[i];
            const used = sc.parts.reduce((sum, item) => sum + item.cutL + kerf, 0);
            if (used + pt.cutL <= sc.l && pt.cutW <= sc.w) {
                sc.parts.push(pt);
                partsToCut.splice(i, 1);
                i--;
            }
        }
        if (sc.parts.length > 0) {
            sheets.push(sc);
        }
    }

    // ШАГ 2: ЗАПОЛНЕНИЕ СТАНДАРТНЫХ ЛИСТОВ
    partsToCut.forEach(pt => {
        let placed = false;
        for (let s of sheets) {
            if (s.isScrap) continue;
            const used = s.parts.reduce((sum, item) => sum + item.cutL + kerf, 0);
            if (used + pt.cutL <= sheetL) {
                s.parts.push(pt);
                placed = true;
                break;
            }
        }
        if (!placed) {
            sheets.push({ w: sheetW, l: sheetL, isScrap: false, parts: [pt], cutDone: false });
        }
    });

    await supabaseClient.from('nestings').upsert({
        project_id: projId,
        metal_key: session.activeNestingKey,
        sheets,
        updated_at: new Date().toISOString()
    }, { onConflict: 'project_id,metal_key' });

    await loadProjectDetails(projId);
    renderNestingResult(p);
    showToast(`Раскрой готов: ${sheets.length} карт раскроя!`, 'success');
}

function renderNestingResult(p) {
    const box = document.getElementById('nestingVisualizerBox');
    if (!box) return;
    const nestingData = appState.activeProjectNestings[session.activeNestingKey];

    if (!nestingData || !nestingData.sheets || nestingData.sheets.length === 0) {
        box.innerHTML = `<div class="bg-[#121217] p-8 rounded-3xl border border-white/5 text-center text-xs text-zinc-500">Нажмите «Рассчитать карту раскроя», чтобы получить карты раскроя</div>`;
        return;
    }

    const sheets = nestingData.sheets;
    const allDone = sheets.every(s => s.cutDone);

    const typeStyles = {
        whole: 'bg-white/10 border-white/20 text-white',
        L: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200',
        trough: 'bg-amber-500/20 border-amber-500/30 text-amber-200',
        cap: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200',
        round: 'bg-sky-500/20 border-sky-500/30 text-sky-200'
    };

    let html = `
        <div class="flex flex-wrap justify-between items-center gap-2">
            <div class="text-xs">
                <span class="font-extrabold text-white uppercase tracking-wider">Карты раскроя листа (${session.activeNestingKey}):</span>
                <span class="text-zinc-400 ml-2">Всего: <strong class="text-white mono">${sheets.length} шт</strong></span>
            </div>
            <button onclick="finishCuttingWork()" class="${allDone ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'} text-xs font-bold px-4 py-2 rounded-xl transition btn-press">
                ✓ Воздуховоды отрезаны
            </button>
        </div>
        <div class="space-y-4">
    `;

    sheets.forEach((s, idx) => {
        const fullL = s.l || 2500;
        const fullW = s.w || 1250;
        const usedL = s.parts.reduce((sum, item) => sum + item.cutL, 0);
        const remL = Math.max(0, fullL - usedL);

        html += `
            <div class="bg-[#121217] border ${s.cutDone ? 'border-emerald-500/40 bg-emerald-950/10' : (s.isScrap ? 'border-amber-500/30' : 'border-white/5')} rounded-3xl p-4 sm:p-5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <label class="flex items-center gap-2 cursor-pointer font-extrabold text-white">
                        <input type="checkbox" onchange="toggleSheetCutDone(${idx}, this.checked)" ${s.cutDone ? 'checked' : ''} class="rounded text-white accent-white">
                        <span>${s.isScrap ? `✂️ Обрезок №${idx + 1}` : `📄 Лист №${idx + 1}`} (${fullW} × ${fullL} мм) — ${s.cutDone ? '<span class="text-emerald-400">✓ Отрезан</span>' : '<span class="text-zinc-400">В процессе</span>'}</span>
                    </label>
                    <span class="text-zinc-400">Деловой остаток: <strong class="text-amber-400 mono">${remL} × ${fullW} мм</strong></span>
                </div>
                <div class="w-full bg-[#18181f] border border-white/10 rounded-2xl p-1.5 flex h-24 overflow-hidden relative">
                    ${s.parts.map(pt => {
                        const styleClass = typeStyles[pt.type] || typeStyles.whole;
                        return `
                            <div style="width: ${(pt.cutL / fullL) * 100}%" class="h-full border-r ${styleClass} p-2 flex flex-col justify-between overflow-hidden rounded-lg">
                                <div>
                                    <div class="text-[11px] font-black truncate">${pt.label}</div>
                                    <div class="text-[9px] uppercase tracking-wider opacity-75">${pt.subLabel || ''}</div>
                                </div>
                                <div class="text-[10px] mono font-bold truncate">${pt.cutL} мм</div>
                            </div>
                        `;
                    }).join('')}
                    ${remL > 0 ? `<div style="width: ${(remL / fullL) * 100}%" class="h-full bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-300 mono truncate px-1 border-l border-dashed border-amber-500/30 rounded-lg">Остаток ${remL} мм</div>` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    box.innerHTML = html;
}

async function toggleSheetCutDone(idx, isChecked) {
    const projId = session.insideProjectId;
    const nestingData = appState.activeProjectNestings[session.activeNestingKey];
    if (nestingData && nestingData.sheets[idx]) {
        nestingData.sheets[idx].cutDone = isChecked;
        await supabaseClient.from('nestings').update({ sheets: nestingData.sheets }).eq('project_id', projId).eq('metal_key', session.activeNestingKey);
        renderNestingResult(appState.projects.find(x => x.id === projId));
    }
}

async function finishCuttingWork() {
    triggerHaptic('success');
    const projId = session.insideProjectId;
    const p = appState.projects.find(x => x.id === projId);
    if (!p) return;
    p.status_text = 'Воздуховоды отрезаны';
    await supabaseClient.from('projects').update({ status_text: 'Воздуховоды отрезаны', updated_at: new Date().toISOString() }).eq('id', projId);
    const badge = document.getElementById('activeProjCutBadge');
    if (badge) badge.classList.remove('hidden');
    showToast('Статус проекта: «Воздуховоды отрезаны» ✓', 'success');
}

// ==========================================
// ЭКСПОРТ РАСКРОЯ В PDF
// ==========================================
function exportNestingPDF() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    const title = p ? p.title : 'Раскрой листа';
    const visualizer = document.getElementById('nestingVisualizerBox');
    if (!visualizer) return;

    const printArea = document.getElementById('printReportArea');
    if (!printArea) return;

    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; color: #000; font-size: 13px;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: bold;">MAXVENT TOOLS</h2>
                    <p style="margin: 3px 0 0 0; font-size: 13px; color: #555;">Карты раскроя листового металла (Ножницы)</p>
                </div>
                <div style="text-align: right; font-size: 12px;">
                    <div>Объект: <b>${title}</b></div>
                    <div>Металл: <b>${session.activeNestingKey || ''}</b></div>
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                </div>
            </div>
            ${visualizer.innerHTML}
        </div>
    `;
    window.print();
}
