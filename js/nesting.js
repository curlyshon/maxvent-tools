// ==========================================
// MODULE: nesting.js
// 2D Раскрой листа для воздуховодов, канвас и экспорт в PDF
// ==========================================

function renderProjectNesting() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;

    const seams = getProjectSeams(p);
    const ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    const queues = {};
    ducts.forEach(d => {
        const k = `${d.metal} ${d.thickness} мм`;
        if (!queues[k]) queues[k] = [];
        queues[k].push(d);
    });

    const tabs = document.getElementById('nestingSheetTabs');
    tabs.innerHTML = '';
    const keys = Object.keys(queues);

    if (keys.length === 0) {
        tabs.innerHTML = `<span class="text-xs text-slate-500">В проекте нет воздуховодов для раскроя листа</span>`;
        document.getElementById('nestingDuctsSelectionBox').innerHTML = '';
        document.getElementById('nestingVisualizerBox').innerHTML = '';
        return;
    }

    if (!session.activeNestingKey || !queues[session.activeNestingKey]) {
        session.activeNestingKey = keys[0];
    }

    keys.forEach(k => {
        const btn = document.createElement('button');
        btn.className = `px-3.5 py-2 rounded-xl text-xs font-bold transition ${k === session.activeNestingKey ? 'bg-blue-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'}`;
        btn.textContent = `${k} (${queues[k].reduce((s, i) => s + i.qty, 0)} шт)`;
        btn.onclick = () => { session.activeNestingKey = k; renderProjectNesting(); };
        tabs.appendChild(btn);
    });

    const currentDucts = queues[session.activeNestingKey];
    const selBox = document.getElementById('nestingDuctsSelectionBox');

    selBox.innerHTML = `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div class="flex flex-wrap justify-between items-center text-xs border-b border-slate-800 pb-3 gap-2">
                <div>
                    <span class="font-bold text-white uppercase tracking-wider">Воздуховоды в раскрой:</span>
                    <span class="text-slate-400 ml-2">Лист 2500 × 1250 мм | Фальцы проекта: <strong class="text-amber-400 mono">${seams.lock_pittsburgh}+${seams.lock_single} мм</strong></span>
                </div>
                <div class="text-[11px] text-slate-500">
                    При превышении 2500 мм используйте L или П разделение
                </div>
            </div>
            <div class="space-y-3">
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
                            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs flex flex-wrap justify-between items-center gap-3">
                                <div class="flex items-center gap-3">
                                    <input type="checkbox" id="nestDuctCheck_${d.id}" checked class="rounded text-blue-600">
                                    <div>
                                        <div class="font-bold text-white">Ø${d.d} мм <span class="text-slate-400 font-normal">| L=${d.l || 1250} мм</span></div>
                                        <div class="text-[11px] text-slate-400 mono mt-0.5">Развертка (πD + ${seams.round_seam}мм): <strong class="text-blue-300">${unfold} × ${d.l || 1250} мм</strong></div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-slate-400">Штук:</span>
                                    <input type="number" id="nestDuctQty_${d.id}" value="${d.qty}" min="1" max="${d.qty}" class="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center mono text-white font-bold">
                                </div>
                            </div>
                        `;
                    }

                    // Прямоугольный воздуховод
                    const unfoldWhole = 2 * (d.w + d.h) + seams.lock_pittsburgh + seams.lock_single;
                    const unfoldL = d.w + d.h + seams.lock_pittsburgh + seams.lock_single;
                    const unfoldTrough = 2 * d.h + d.w + 2 * seams.lock_pittsburgh;
                    const unfoldCap = d.w + 2 * seams.lock_single;
                    const exceeds2500 = unfoldWhole > 2500;

                    return `
                        <div class="bg-slate-900 p-3.5 rounded-xl border ${exceeds2500 && cfg.mode === 'whole' ? 'border-rose-700 bg-rose-950/10' : 'border-slate-800'} text-xs space-y-2.5">
                            <div class="flex flex-wrap justify-between items-center gap-2">
                                <div class="flex items-center gap-3">
                                    <input type="checkbox" id="nestDuctCheck_${d.id}" checked class="rounded text-blue-600">
                                    <div>
                                        <span class="font-bold text-white text-sm">${d.w}×${d.h} мм</span>
                                        <span class="text-slate-400 ml-2 mono text-[11px]">L=${d.l || 1250} мм</span>
                                        ${exceeds2500 ? '<span class="ml-2 bg-rose-950 border border-rose-700 text-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">⚠ >2500 мм — выберите L или П</span>' : ''}
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-slate-400">Всего:</span>
                                    <input type="number" id="nestDuctQty_${d.id}" value="${d.qty}" min="1" max="${d.qty}" class="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center mono text-white font-bold" onchange="onNestingDuctQtyChange(${d.id})">
                                    <span class="text-slate-400">шт</span>
                                </div>
                            </div>

                            <!-- Выбор типа гибки -->
                            <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <span class="text-[11px] text-slate-400 font-semibold mr-1">Гибка:</span>
                                    <button type="button" onclick="setNestingDuctMode(${d.id}, 'whole')" class="px-2.5 py-1 rounded text-[11px] font-bold transition ${cfg.mode === 'whole' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'}">
                                        Цельный (${unfoldWhole} мм)
                                    </button>
                                    <button type="button" onclick="setNestingDuctMode(${d.id}, 'L')" class="px-2.5 py-1 rounded text-[11px] font-bold transition ${cfg.mode === 'L' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'}">
                                        L-половинки (2×${unfoldL} мм)
                                    </button>
                                    <button type="button" onclick="setNestingDuctMode(${d.id}, 'U')" class="px-2.5 py-1 rounded text-[11px] font-bold transition ${cfg.mode === 'U' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'}">
                                        П-корыто (${unfoldTrough} мм) + Крышка (${unfoldCap} мм)
                                    </button>
                                </div>
                                ${d.qty > 1 ? `
                                    <button type="button" onclick="toggleNestingDuctSplit(${d.id})" class="text-[11px] font-bold ${cfg.showSplit ? 'text-amber-400 underline' : 'text-slate-400 hover:text-blue-300'}">
                                        ${cfg.showSplit ? '▾ Скрыть разделение партии' : '⚙ Разбить партию (комбинировать)'}
                                    </button>
                                ` : ''}
                            </div>

                            <!-- Разделение партии (если несколько штук) -->
                            ${cfg.showSplit && d.qty > 1 ? `
                                <div class="bg-slate-950/80 p-3 rounded-lg border border-amber-900/40 space-y-2">
                                    <div class="text-[11px] text-amber-300 font-bold">Укажите количество для каждого способа (сумма должна быть ${d.qty} шт):</div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <div>
                                            <label class="block text-[10px] text-slate-400 mb-0.5">Цельных (шт)</label>
                                            <input type="number" id="split_whole_${d.id}" value="${cfg.wholeQty}" min="0" max="${d.qty}" class="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center mono text-white text-xs font-bold" onchange="updateNestingSplitValues(${d.id})">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] text-slate-400 mb-0.5">L-образных (шт)</label>
                                            <input type="number" id="split_l_${d.id}" value="${cfg.lQty}" min="0" max="${d.qty}" class="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center mono text-white text-xs font-bold" onchange="updateNestingSplitValues(${d.id})">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] text-slate-400 mb-0.5">П-образных (шт)</label>
                                            <input type="number" id="split_u_${d.id}" value="${cfg.uQty}" min="0" max="${d.qty}" class="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center mono text-white text-xs font-bold" onchange="updateNestingSplitValues(${d.id})">
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="text-[10px] text-slate-500 font-mono">
                                Фальцы: L-половинка: ${seams.lock_pittsburgh}+${d.h}+${d.w}+${seams.lock_single} мм | Корыто: ${seams.lock_pittsburgh}+${d.h}+${d.w}+${d.h}+${seams.lock_pittsburgh} мм, Крышка: ${seams.lock_single}+${d.w}+${seams.lock_single} мм
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="pt-2 flex justify-end">
                <button onclick="calculateAndSaveNesting()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg transition">
                    Рассчитать оптимальные карты раскроя →
                </button>
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

async function calculateAndSaveNesting() {
    const projId = session.insideProjectId;
    const p = appState.projects.find(x => x.id === projId);
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

        // Rectangular duct
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

        // Whole parts (1 деталь на воздуховод)
        for (let i = 0; i < wQty; i++) {
            partsToCut.push({
                title: d.title,
                label: `${d.w}×${d.h}`,
                subLabel: 'Цельный',
                cutL: unfoldWhole,
                cutW: d.l || 1250,
                type: 'whole'
            });
        }

        // L-половинки (2 детали на воздуховод)
        for (let i = 0; i < lQty * 2; i++) {
            partsToCut.push({
                title: d.title,
                label: `${d.w}×${d.h}`,
                subLabel: 'L-1/2',
                cutL: unfoldL,
                cutW: d.l || 1250,
                type: 'L'
            });
        }

        // П-корыто и Крышка (по 1 шт корыто + 1 шт крышка на воздуховод)
        for (let i = 0; i < uQty; i++) {
            partsToCut.push({
                title: d.title,
                label: `${d.w}×${d.h}`,
                subLabel: 'П-корыто',
                cutL: unfoldTrough,
                cutW: d.l || 1250,
                type: 'trough'
            });
            partsToCut.push({
                title: d.title,
                label: `${d.w}×${d.h}`,
                subLabel: 'Крышка',
                cutL: unfoldCap,
                cutW: d.l || 1250,
                type: 'cap'
            });
        }
    });

    if (partsToCut.length === 0) {
        showToast('Выберите хотя бы один воздуховод для раскроя', 'warning');
        return;
    }

    // Проверяем, есть ли детали, превышающие длину листа (2500 мм)
    const tooLong = partsToCut.filter(p => p.cutL > 2500);
    if (tooLong.length > 0) {
        alert(`Ошибка: ${tooLong.length} деталь(ей) превышают размер листа 2500 мм (${tooLong[0].label} — ${tooLong[0].cutL} мм).\n\nПереключите эти воздуховоды в режим «L-половинки» или «П-корыто + Крышка»!`);
        return;
    }

    const sheetL = 2500;
    // Сортировка по убыванию длины для плотной упаковки
    partsToCut.sort((a, b) => b.cutL - a.cutL);

    const sheets = [];
    partsToCut.forEach(pt => {
        let placed = false;
        for (let s of sheets) {
            const used = s.parts.reduce((sum, item) => sum + item.cutL, 0);
            if (used + pt.cutL <= sheetL) {
                s.parts.push(pt);
                placed = true;
                break;
            }
        }
        if (!placed) {
            sheets.push({ parts: [pt], cutDone: false });
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
    showToast(`Раскрой готов: ${sheets.length} листов 2500×1250 мм!`, 'success');
}

function renderNestingResult(p) {
    const box = document.getElementById('nestingVisualizerBox');
    const nestingData = appState.activeProjectNestings[session.activeNestingKey];

    if (!nestingData || !nestingData.sheets || nestingData.sheets.length === 0) {
        box.innerHTML = `<div class="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">Нажмите «Рассчитать оптимальные карты раскроя», чтобы получить карты листов</div>`;
        return;
    }

    const sheets = nestingData.sheets;
    const sheetL = 2500;
    const allDone = sheets.every(s => s.cutDone);

    const typeStyles = {
        whole: 'bg-blue-600/40 border-blue-500 text-blue-200',
        L: 'bg-indigo-600/40 border-indigo-500 text-indigo-200',
        trough: 'bg-amber-600/40 border-amber-500 text-amber-200',
        cap: 'bg-emerald-600/40 border-emerald-500 text-emerald-200',
        round: 'bg-sky-600/40 border-sky-500 text-sky-200'
    };

    let html = `
        <div class="flex flex-wrap justify-between items-center gap-2">
            <div class="text-xs">
                <span class="font-bold text-white uppercase tracking-wider">Карты раскроя листа (2500 × 1250 мм):</span>
                <span class="text-slate-400 ml-2">Всего листов: <strong class="text-blue-400 mono">${sheets.length} шт</strong></span>
            </div>
            <button onclick="finishCuttingWork()" class="${allDone ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'} text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                ✓ Закончить работу (Воздуховоды отрезаны)
            </button>
        </div>
        <div class="space-y-4">
    `;

    sheets.forEach((s, idx) => {
        const usedL = s.parts.reduce((sum, item) => sum + item.cutL, 0);
        const remL = sheetL - usedL;

        html += `
            <div class="bg-slate-950 border ${s.cutDone ? 'border-emerald-600/80 bg-emerald-950/10' : 'border-slate-800'} rounded-xl p-4 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <label class="flex items-center gap-2 cursor-pointer font-bold text-white">
                        <input type="checkbox" onchange="toggleSheetCutDone(${idx}, this.checked)" ${s.cutDone ? 'checked' : ''} class="rounded text-emerald-600">
                        <span>Лист №${idx + 1} (2500 × 1250 мм) — ${s.cutDone ? '<span class="text-emerald-400">✓ Отрезан</span>' : '<span class="text-slate-400">В процессе</span>'}</span>
                    </label>
                    <span class="text-slate-400">Деловой остаток: <strong class="text-amber-400 mono">${remL} × 1250 мм</strong></span>
                </div>
                <div class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 flex h-24 overflow-hidden relative">
                    ${s.parts.map(pt => {
                        const styleClass = typeStyles[pt.type] || typeStyles.whole;
                        return `
                            <div style="width: ${(pt.cutL / sheetL) * 100}%" class="h-full border-r ${styleClass} p-1.5 flex flex-col justify-between overflow-hidden">
                                <div>
                                    <div class="text-[11px] font-bold truncate">${pt.label}</div>
                                    <div class="text-[9px] uppercase tracking-wider opacity-80">${pt.subLabel || ''}</div>
                                </div>
                                <div class="text-[10px] mono font-bold truncate">${pt.cutL} мм</div>
                            </div>
                        `;
                    }).join('')}
                    ${remL > 0 ? `<div style="width: ${(remL / sheetL) * 100}%" class="h-full bg-amber-950/20 flex items-center justify-center text-[10px] text-amber-400 mono truncate px-1 border-l border-dashed border-amber-800/40">Остаток ${remL} мм</div>` : ''}
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
    const projId = session.insideProjectId;
    const p = appState.projects.find(x => x.id === projId);
    p.status_text = 'Воздуховоды отрезаны';
    await supabaseClient.from('projects').update({ status_text: 'Воздуховоды отрезаны' }).eq('id', projId);
    document.getElementById('activeProjCutBadge').classList.remove('hidden');
    showToast('Статус проекта: «Воздуховоды отрезаны» ✓', 'success');
}

// --- ПЕЧАТЬ ПРОИЗВОДСТВЕННОГО НАРЯДА В ЦЕХ (A4) ---
function printWorkshopOrder() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;

    const seams = getProjectSeams(p);
    const items = appState.activeProjectItems;
    const ducts = items.filter(i => i.category === 'duct');
    const fittings = items.filter(i => i.category === 'fitting');

    // Рамки и шинка
    const framesObj = {};
    items.forEach(it => {
        const frames = getItemFrames(it);
        frames.forEach(fr => {
            const k = fr.replace('x', '×').trim();
            framesObj[k] = (framesObj[k] || 0) + it.qty;
        });
    });

    const cutsNeeded = {};
    for (let [sz, cnt] of Object.entries(framesObj)) {
        const parts = sz.split('×').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const wCut = Math.max(0, parts[0] - 30);
            const hCut = Math.max(0, parts[1] - 30);
            cutsNeeded[wCut] = (cutsNeeded[wCut] || 0) + (2 * cnt);
            cutsNeeded[hCut] = (cutsNeeded[hCut] || 0) + (2 * cnt);
        }
    }
    const totalCorners = Object.values(cutsNeeded).reduce((s, v) => s + v, 0);

    const printArea = document.getElementById('printReportArea');
    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 820px; margin: 0 auto; color: #000; font-size: 12px; line-height: 1.4;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">MAXVENT TOOLS</h1>
                    <div style="font-size: 13px; font-weight: bold; color: #333; margin-top: 2px;">НАРЯД НА ПРОИЗВОДСТВО В ЦЕХ № ${p.id}</div>
                </div>
                <div style="text-align: right; font-size: 12px;">
                    <div>Объект: <b>${p.title}</b></div>
                    <div>Бригада: <b>${p.group_name || 'Цех'}</b></div>
                    <div>Дата выдачи: ${new Date().toLocaleDateString()}</div>
                </div>
            </div>

            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 11px;">
                <b>Параметры фальцев:</b> Большой фальц (мама) = <b>${seams.lock_pittsburgh} мм</b> | Малый (папа) = <b>${seams.lock_single} мм</b> | Круглый = <b>${seams.round_seam} мм</b>
            </div>

            <!-- 1. ВОЗДУХОВОДЫ -->
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px;">
                    1. Воздуховоды и раскрой листа (${ducts.reduce((s, i) => s + i.qty, 0)} шт)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #e2e8f0;">
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: center; width: 25px;">№</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Сечение / Диаметр</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Длина L</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Развертка и схема гибки</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Металл</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: center; width: 50px;">Кол-во</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: center; width: 60px;">Готово</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ducts.map((d, i) => {
                            let unfoldStr = '';
                            if (d.shape === 'rect') {
                                const whole = 2 * (d.w + d.h) + seams.lock_pittsburgh + seams.lock_single;
                                const lHalf = d.w + d.h + seams.lock_pittsburgh + seams.lock_single;
                                unfoldStr = whole > 2500 ? `L-половинки: 2 шт по ${lHalf} мм (${seams.lock_pittsburgh}+${d.h}+${d.w}+${seams.lock_single})` : `Цельный: ${whole} мм`;
                            } else {
                                unfoldStr = `Развертка: ${Math.round(Math.PI * d.d + seams.round_seam)} мм`;
                            }
                            return `
                                <tr>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">${i + 1}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold;">${d.shape === 'rect' ? `${d.w}×${d.h} мм` : `Ø${d.d} мм`}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px;">${d.l || 1250} мм</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px;">${unfoldStr}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px;">${d.metal} ${d.thickness}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-weight: bold;">${d.qty} шт</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">[  ]</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 2. ФАСОННЫЕ ИЗДЕЛИЯ -->
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px;">
                    2. Фасонные изделия (${fittings.reduce((s, i) => s + i.qty, 0)} шт)
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #e2e8f0;">
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: center; width: 25px;">№</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Изделие</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Размеры / Параметры</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Рамки шинорейки</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: left;">Металл</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: center; width: 50px;">Кол-во</th>
                            <th style="border: 1px solid #94a3b8; padding: 5px; text-align: center; width: 60px;">Готово</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fittings.map((it, i) => {
                            const frames = getItemFrames(it);
                            let desc = '';
                            if (it.w1 && it.w2) desc = `${it.w1}×${it.h1} → ${it.w2}×${it.h2}`;
                            else if (it.w && it.h) desc = `${it.w}×${it.h}`;
                            else if (it.d) desc = `Ø${it.d}`;
                            if (it.deg) desc += `, ${it.deg}°`;
                            if (it.l) desc += `, L=${it.l}`;
                            if (it.descDetail) desc += ` (${it.descDetail})`;
                            return `
                                <tr>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">${i + 1}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold;">${it.title}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px;">${desc}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px;">${frames.length ? frames.join(', ') : '—'}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px;">${it.metal} ${it.thickness}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-weight: bold;">${it.qty} шт</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center;">[  ]</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 3. ШИНКА И УГОЛКИ -->
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">3. Ведомость шинорейки и уголков</h4>
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px;">
                    <div>Уголки УГФ (точно по 4 на рамку): <b style="font-size: 14px; color: #000;">${totalCorners} шт</b></div>
                    <div>Всего рамок: <b>${Object.values(framesObj).reduce((s, v) => s + v, 0)} шт</b></div>
                </div>
                <div style="font-size: 11px;">
                    <b>Заготовки шинки (Сторона рамки − 30 мм):</b>
                    <div style="margin-top: 4px;">
                        ${Object.entries(cutsNeeded).map(([k, v]) => `<span style="display: inline-block; background: #fff; border: 1px solid #94a3b8; padding: 2px 6px; border-radius: 4px; margin: 2px 4px 2px 0;">${k} мм — <b>${v} шт</b></span>`).join('')}
                    </div>
                </div>
            </div>

            <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px;">
                <div>Наряд выдал (Мастер): ___________________</div>
                <div>Наряд принял (Бригадир): ___________________</div>
                <div>Дата выполнения: ___________________</div>
            </div>
        </div>
    `;
    window.print();
}

// --- ФИНАНСЫ И ПЕЧАТЬ PDF-ОТЧЕТОВ ---
function calculateProjectFinances(projId) {
    const p = appState.projects.find(x => x.id === projId);
    const seams = getProjectSeams(p);
    const items = appState.allItems.filter(x => x.project_id === projId);
    const payments = appState.allPayments.filter(x => x.project_id === projId);

    let totalSum = 0;
    items.forEach(it => {
        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' ? (2 * (it.w + it.h) + seams.lock_pittsburgh + seams.lock_single) : Math.round(Math.PI * it.d + seams.round_seam);
            const area = (unfold * (it.l || 1250) * it.qty) / 1e6;
            totalSum += Math.round(area * it.price);
        } else {
            totalSum += Math.round(it.qty * it.price);
        }
    });

    const paid = payments.reduce((s, pay) => s + Number(pay.amount), 0);
    const debt = Math.max(0, totalSum - paid);
    const overpay = Math.max(0, paid - totalSum);
    return { totalSum, paid, debt, overpay, items, payments };
}
