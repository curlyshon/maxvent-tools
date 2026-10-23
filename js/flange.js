// ==========================================
// MODULE: flange.js
// Калькулятор шинорейки 1D, раскрой пачек, учет обрезков и хвостиков/запаса
// ==========================================

let flangeModalTarget = 'project'; // 'project' or 'standalone'

// ==========================================
// НАСТРОЙКИ ПАЧКИ И ПРОПИЛА (FLANGE SETTINGS)
// ==========================================
function openFlangeSettingsModal() {
    triggerHaptic('light');
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    const data = getProjectFlangeData(p);

    const lenInp = document.getElementById('settPackLen');
    const qtyInp = document.getElementById('settPackQty');
    const kerfInp = document.getElementById('settKerf');

    if (lenInp) lenInp.value = data.pack_len || 3000;
    if (qtyInp) qtyInp.value = data.pack_qty || 10;
    if (kerfInp) kerfInp.value = data.kerf !== undefined ? data.kerf : 2;

    const modal = document.getElementById('flangeSettingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (typeof lockScroll === 'function') lockScroll();
    }
}

function closeFlangeSettingsModal() {
    triggerHaptic('light');
    const modal = document.getElementById('flangeSettingsModal');
    if (modal) modal.classList.add('hidden');
    if (typeof unlockScroll === 'function') unlockScroll();
}

async function saveFlangeSettingsModal() {
    const len = Number(document.getElementById('settPackLen')?.value) || 3000;
    const qty = Number(document.getElementById('settPackQty')?.value) || 10;
    const kerf = Number(document.getElementById('settKerf')?.value) || 2;

    const isProj = (flangeSource === 'project' && session.insideProjectId);
    if (isProj) {
        const p = appState.projects.find(x => x.id === session.insideProjectId);
        if (p) {
            const data = getProjectFlangeData(p);
            data.pack_len = len;
            data.pack_qty = qty;
            data.kerf = kerf;
            await saveProjectFlangeData(p, data);
            renderProjectFlange();
        }
    } else {
        if (!appState.standaloneFlange) appState.standaloneFlange = {};
        appState.standaloneFlange.pack_len = len;
        appState.standaloneFlange.pack_qty = qty;
        appState.standaloneFlange.kerf = kerf;
        await saveGlobalSettings();
        renderStandaloneFlange();
    }

    closeFlangeSettingsModal();
    showToast(`Настройки сохранены: Пачка ${len} мм (${qty} шт), рез ${kerf} мм`, 'success');
}

// ==========================================
// ДОБАВЛЕНИЕ И УДАЛЕНИЕ ОБРЕЗКОВ ШИНКИ
// ==========================================
function openFlangeAddScrapModal(target) {
    triggerHaptic('light');
    flangeModalTarget = target || 'project';
    session.editFlangeScrapIndex = null;
    const isProj = (flangeModalTarget === 'project');
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    const defPackQty = isProj ? getProjectPackQty(p) : (appState.standaloneFlange?.pack_qty || 10);

    const lenInp = document.getElementById('modalScrapLen');
    const cntInp = document.getElementById('modalScrapCount');
    if (lenInp) lenInp.value = '';
    if (cntInp) cntInp.value = defPackQty;

    const hdr = document.getElementById('flangeScrapModalHeader');
    if (hdr) hdr.textContent = '✂️ Обрезок шинки';
    const btn = document.getElementById('btnSubmitFlangeScrap');
    if (btn) btn.textContent = '+ Добавить обрезок';

    const modal = document.getElementById('flangeAddScrapModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (typeof lockScroll === 'function') lockScroll();
    }
    setTimeout(() => lenInp?.focus(), 80);
}

function editFlangeScrap(target, index) {
    triggerHaptic('light');
    flangeModalTarget = target || 'project';
    session.editFlangeScrapIndex = index;

    let s = null;
    if (flangeModalTarget === 'project') {
        const p = appState.projects.find(x => x.id === session.insideProjectId);
        if (p) {
            const data = getProjectFlangeData(p);
            s = data.scraps ? data.scraps[index] : null;
        }
    } else {
        s = appState.standaloneFlange?.scraps ? appState.standaloneFlange.scraps[index] : null;
    }

    if (!s) return;
    const sLen = typeof s === 'number' ? s : s.len;
    const sCnt = typeof s === 'number' ? 10 : (s.count || 10);

    const lenInp = document.getElementById('modalScrapLen');
    const cntInp = document.getElementById('modalScrapCount');
    if (lenInp) lenInp.value = sLen;
    if (cntInp) cntInp.value = sCnt;

    const hdr = document.getElementById('flangeScrapModalHeader');
    if (hdr) hdr.textContent = '✂️ Редактировать обрезок';
    const btn = document.getElementById('btnSubmitFlangeScrap');
    if (btn) btn.textContent = 'Сохранить изменения';

    const modal = document.getElementById('flangeAddScrapModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (typeof lockScroll === 'function') lockScroll();
    }
    setTimeout(() => lenInp?.focus(), 80);
}

function closeFlangeAddScrapModal() {
    triggerHaptic('light');
    session.editFlangeScrapIndex = null;
    const modal = document.getElementById('flangeAddScrapModal');
    if (modal) modal.classList.add('hidden');
    if (typeof unlockScroll === 'function') unlockScroll();
}

async function submitFlangeAddScrapModal() {
    if (session.isSavingScrap) return;
    const len = Number(document.getElementById('modalScrapLen')?.value);
    const count = Number(document.getElementById('modalScrapCount')?.value) || 10;

    if (!len || len < 100) {
        showToast('Укажите длину обрезка (от 100 мм)', 'warning');
        return;
    }

    session.isSavingScrap = true;
    const submitBtn = document.getElementById('btnSubmitFlangeScrap');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'pointer-events-none');
    }

    try {
        const isProj = (flangeModalTarget === 'project');
        const editIdx = session.editFlangeScrapIndex;

        if (isProj) {
            const p = appState.projects.find(x => x.id === session.insideProjectId);
            if (p) {
                const data = getProjectFlangeData(p);
                if (editIdx !== null && editIdx !== undefined && editIdx >= 0) {
                    data.scraps[editIdx] = { len, count };
                } else {
                    data.scraps.push({ len, count });
                }
                await saveProjectFlangeData(p, data);
                renderProjectFlange();
            }
        } else {
            if (!appState.standaloneFlange) appState.standaloneFlange = {};
            if (!appState.standaloneFlange.scraps) appState.standaloneFlange.scraps = [];
            if (editIdx !== null && editIdx !== undefined && editIdx >= 0) {
                appState.standaloneFlange.scraps[editIdx] = { len, count };
            } else {
                appState.standaloneFlange.scraps.push({ len, count });
            }
            await saveGlobalSettings();
            renderStandaloneFlange();
        }

        closeFlangeAddScrapModal();
        showToast(editIdx !== null ? `Обрезок обновлен: ${len} мм (${count} шинок)` : `Обрезок ${len} мм (${count} шинок) добавлен`, 'success');
    } catch (err) {
        console.error('Error in submitFlangeAddScrapModal:', err);
    } finally {
        session.isSavingScrap = false;
        session.editFlangeScrapIndex = null;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
    }
}

async function removeFlangeScrap(target, idx) {
    triggerHaptic('warning');
    if (target === 'project') {
        const p = appState.projects.find(x => x.id === session.insideProjectId);
        if (p) {
            const data = getProjectFlangeData(p);
            data.scraps.splice(idx, 1);
            await saveProjectFlangeData(p, data);
            renderProjectFlange();
        }
    } else {
        if (appState.standaloneFlange && appState.standaloneFlange.scraps) {
            appState.standaloneFlange.scraps.splice(idx, 1);
            await saveGlobalSettings();
            renderStandaloneFlange();
        }
    }
    showToast('Обрезок удален', 'info');
}

// Переключение режима «Хвостики на дорез» / «Пачка в запас»
function setFlangeReserveMode(mode) {
    triggerHaptic('medium');
    session.flangeReserveMode = mode;
    if (flangeSource === 'project') {
        renderProjectFlange();
    } else {
        renderStandaloneFlange();
    }
}

// ==========================================
// РАСКРОЙ ШИНКИ ДЛЯ ПРОЕКТА
// ==========================================
function renderProjectFlange() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;
    const data = getProjectFlangeData(p);

    const scrapBox = document.getElementById('projScrapChips');
    if (scrapBox) {
        if (!data.scraps || data.scraps.length === 0) {
            scrapBox.innerHTML = '<span class="text-zinc-500 italic">Нет обрезков. Добавьте, если в цехе есть остатки пачек.</span>';
        } else {
            scrapBox.innerHTML = data.scraps.map((s, i) => {
                const sLen = typeof s === 'number' ? s : s.len;
                const sCnt = typeof s === 'number' ? data.pack_qty : (s.count || data.pack_qty);
                return `
                    <span class="bg-[#18181f] border border-white/10 px-3 py-1.5 rounded-xl text-zinc-200 mono flex items-center gap-2 text-xs font-bold shadow-sm">
                        <span>✂ ${sLen} мм <strong class="text-amber-300">(${sCnt} шинок)</strong></span>
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="editFlangeScrap('project', ${i})" title="Редактировать" class="text-zinc-400 hover:text-white font-bold px-1 py-0.5 rounded btn-press">✎</button>
                            <button type="button" onclick="removeFlangeScrap('project', ${i})" title="Удалить обрезок" class="text-zinc-500 hover:text-rose-400 font-bold px-1 py-0.5 rounded btn-press">×</button>
                        </div>
                    </span>
                `;
            }).join('');
        }
    }

    const packLen = data.pack_len || 3000;
    const packQty = data.pack_qty || 10;
    const kerf = data.kerf !== undefined ? data.kerf : 2;
    const reserveMode = session.flangeReserveMode || 'spare'; // 'spare' (запас) or 'tail' (хвостики)

    let items = appState.activeProjectItems;
    if (session.activePhaseId && session.activePhaseId !== 'all') {
        items = items.filter(i => (i.phase_id || i.dimensions?.phase_id || 'main') === session.activePhaseId);
    }

    const framesObj = {};
    items.forEach(it => {
        const frames = getItemFrames(it);
        frames.forEach(fr => {
            const normalized = fr.replace('x', '×').trim();
            framesObj[normalized] = (framesObj[normalized] || 0) + it.qty;
        });
    });

    const outEl = document.getElementById('projFlangeOutput');
    if (outEl) {
        outEl.innerHTML = buildFlangeCalculationUI(
            framesObj, packLen, kerf, reserveMode, data.scraps || [], packQty, 'project'
        );
    }
}

// ==========================================
// АВТОНОМНЫЙ КАЛЬКУЛЯТОР ШИНКИ
// ==========================================
function renderStandaloneFlange() {
    if (!appState.standaloneFlange) {
        appState.standaloneFlange = { items: [], scraps: [], pack_qty: 10, pack_len: 3000, kerf: 2 };
    }
    const stData = appState.standaloneFlange;

    const scrapBox = document.getElementById('stScrapChips');
    if (scrapBox) {
        if (!stData.scraps || stData.scraps.length === 0) {
            scrapBox.innerHTML = '<span class="text-zinc-500 italic">Нет обрезков. Добавьте, если в цехе есть остатки пачек.</span>';
        } else {
            scrapBox.innerHTML = stData.scraps.map((s, i) => `
                <span class="bg-[#18181f] border border-white/10 px-3 py-1.5 rounded-xl text-zinc-200 mono flex items-center gap-2 text-xs font-bold shadow-sm">
                    <span>✂ ${s.len} мм <strong class="text-amber-300">(${s.count} шинок)</strong></span>
                    <div class="flex items-center gap-1">
                        <button type="button" onclick="editFlangeScrap('standalone', ${i})" title="Редактировать" class="text-zinc-400 hover:text-white font-bold px-1 py-0.5 rounded btn-press">✎</button>
                        <button type="button" onclick="removeFlangeScrap('standalone', ${i})" title="Удалить обрезок" class="text-zinc-500 hover:text-rose-400 font-bold px-1 py-0.5 rounded btn-press">×</button>
                    </div>
                </span>
            `).join('');
        }
    }

    const packLen = stData.pack_len || 3000;
    const packQty = stData.pack_qty || 10;
    const kerf = stData.kerf !== undefined ? stData.kerf : 2;
    const reserveMode = session.flangeReserveMode || 'spare';

    const framesObj = {};
    (stData.items || []).forEach(it => {
        framesObj[it.size] = (framesObj[it.size] || 0) + it.qty;
    });

    const outEl = document.getElementById('stFlangeOutput');
    if (outEl) {
        outEl.innerHTML = buildFlangeCalculationUI(
            framesObj, packLen, kerf, reserveMode, stData.scraps || [], packQty, 'standalone'
        );
    }
}

function addStandaloneFlangeRow() {
    triggerHaptic('light');
    const w = Number(document.getElementById('stW')?.value);
    const h = Number(document.getElementById('stH')?.value);
    const sides = Number(document.getElementById('stSides')?.value) || 2;
    const qty = Number(document.getElementById('stQty')?.value) || 1;

    if (!w || !h || w < 50 || h < 50) {
        showToast('Укажите корректные размеры рамки (W и H)', 'warning');
        return;
    }

    const totalFrames = sides * qty;
    const sizeStr = `${w}×${h}`;

    if (!appState.standaloneFlange) appState.standaloneFlange = { items: [], scraps: [], pack_qty: 10 };
    if (!appState.standaloneFlange.items) appState.standaloneFlange.items = [];

    const existing = appState.standaloneFlange.items.find(x => x.size === sizeStr);
    if (existing) {
        existing.qty += totalFrames;
    } else {
        appState.standaloneFlange.items.push({ size: sizeStr, qty: totalFrames });
    }

    saveGlobalSettings();
    renderStandaloneFlange();
    showToast(`Добавлено: ${sizeStr} мм (${totalFrames} рамок)`, 'success');
}

function clearStandaloneFlange() {
    triggerHaptic('warning');
    if (!confirm('Очистить введенные рамки автономного расчета?')) return;
    if (appState.standaloneFlange) appState.standaloneFlange.items = [];
    saveGlobalSettings();
    renderStandaloneFlange();
}

// ==========================================
// ЯДРО РАСКРОЯ ПАЧЕК ШИНКИ 1D
// ==========================================
function buildFlangeCalculationUI(framesObj, packLen, kerf, reserveMode, scrapsList, packQty, sourceMode) {
    const cutsNeeded = {};
    for (let [sizeStr, frameCount] of Object.entries(framesObj)) {
        const parts = sizeStr.split('×').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const cutW = Math.max(0, parts[0] - 30);
            const cutH = Math.max(0, parts[1] - 30);
            cutsNeeded[cutW] = (cutsNeeded[cutW] || 0) + (2 * frameCount);
            cutsNeeded[cutH] = (cutsNeeded[cutH] || 0) + (2 * frameCount);
        }
    }

    if (Object.keys(cutsNeeded).length === 0) {
        return `
            <div class="bg-[#121217] p-8 rounded-3xl border border-white/5 text-center text-xs text-zinc-500 space-y-1">
                <span class="text-2xl block">📐</span>
                <p>Нет рамок с шинорейкой для расчета</p>
                <p class="text-[11px] text-zinc-600">Добавьте прямоугольные воздуховоды или фасонину с включенными рамками</p>
            </div>
        `;
    }

    const totalFrames = Object.values(framesObj).reduce((s, v) => s + v, 0);
    const exactTotalShinkas = Object.values(cutsNeeded).reduce((s, v) => s + v, 0);
    const totalCorners = exactTotalShinkas; // 4 уголка на каждую рамку = ровно сумме шинок

    const totalShinkaMeters = Object.entries(cutsNeeded).reduce((sum, [len, q]) => sum + (Number(len) * q), 0) / 1000;
    const tapeMeters = Object.entries(framesObj).reduce((sum, [sz, cnt]) => {
        const parts = sz.split('×').map(Number);
        return sum + (2 * (parts[0] + parts[1]) * cnt);
    }, 0) / 1000;

    const remainingDemand = { ...cutsNeeded };

    // Подготовка доступных цеховых обрезков
    const availableScraps = (scrapsList || []).map(s => {
        const totalLen = typeof s === 'number' ? s : Number(s.len);
        const count = typeof s === 'number' ? packQty : (Number(s.count) || packQty);
        return {
            totalLen: totalLen || 1000,
            count: count || packQty,
            isScrap: true,
            cuts: []
        };
    });

    // Алгоритм поиска наилучшей комбинации резов под длину пачки/обрезка
    function findBestFit(poolMap, capLen) {
        const keys = Object.keys(poolMap).map(Number).sort((a, b) => b - a);
        let bestCombo = [];
        let bestUsed = -1;

        function search(idx, currentCombo, currentLen) {
            const cutsCount = currentCombo.length;
            const totalWithKerf = cutsCount > 0 ? (currentLen + (cutsCount - 1) * kerf) : 0;
            if (totalWithKerf > capLen) return;

            if (totalWithKerf > bestUsed || (totalWithKerf === bestUsed && currentCombo.length < bestCombo.length)) {
                bestUsed = totalWithKerf;
                bestCombo = [...currentCombo];
            }

            for (let i = idx; i < keys.length; i++) {
                const len = keys[i];
                if (poolMap[len] > 0) {
                    poolMap[len]--;
                    currentCombo.push(len);
                    search(i, currentCombo, currentLen + len);
                    currentCombo.pop();
                    poolMap[len]++;
                }
            }
        }

        search(0, [], 0);
        return bestCombo;
    }

    const resultPacks = [];

    // Шаг 1: Раскрой обрезков, в которых количество шинок >= стандартной пачки (приоритет утилизации цеховых остатков)
    const scrapsStep1 = availableScraps.filter(s => s.count >= packQty).sort((a, b) => a.totalLen - b.totalLen);
    for (let scrap of scrapsStep1) {
        const pool = {};
        for (let [lStr, rem] of Object.entries(remainingDemand)) {
            const l = Number(lStr);
            const maxC = Math.floor(rem / scrap.count);
            if (maxC > 0) pool[l] = maxC;
        }
        if (Object.keys(pool).length > 0) {
            const combo = findBestFit(pool, scrap.totalLen);
            if (combo.length > 0) {
                scrap.cuts = combo;
                for (let c of combo) {
                    remainingDemand[c] -= scrap.count;
                }
                resultPacks.push(scrap);
                const idx = availableScraps.indexOf(scrap);
                if (idx !== -1) availableScraps.splice(idx, 1);
            }
        }
    }

    // Шаг 2: Раскрой новых стандартных пачек (длина packLen, кол-во packQty) под кратные потребности
    while (true) {
        const pool = {};
        for (let [lStr, rem] of Object.entries(remainingDemand)) {
            const l = Number(lStr);
            const maxC = Math.floor(rem / packQty);
            if (maxC > 0) pool[l] = maxC;
        }
        if (Object.keys(pool).length === 0) break;

        const combo = findBestFit(pool, packLen);
        if (combo.length === 0) break;

        const newPack = { totalLen: packLen, count: packQty, isScrap: false, cuts: combo };
        for (let c of combo) {
            remainingDemand[c] -= packQty;
        }
        resultPacks.push(newPack);
    }

    // Шаг 3: Раскрой оставшихся обрезков под неполные потребности (< packQty)
    availableScraps.sort((a, b) => b.count - a.count || a.totalLen - b.totalLen);
    for (let i = 0; i < availableScraps.length; i++) {
        const scrap = availableScraps[i];
        const pool = {};
        for (let [lStr, rem] of Object.entries(remainingDemand)) {
            const l = Number(lStr);
            if (rem > 0) {
                const maxC = Math.floor(rem / scrap.count);
                if (maxC > 0) pool[l] = maxC;
            }
        }
        if (Object.keys(pool).length > 0) {
            const combo = findBestFit(pool, scrap.totalLen);
            if (combo.length > 0) {
                scrap.cuts = combo;
                for (let c of combo) {
                    remainingDemand[c] -= scrap.count;
                }
                resultPacks.push(scrap);
                availableScraps.splice(i, 1);
                i--;
            }
        }
    }

    // Шаг 4: Обработка оставшихся единичных заготовок
    // Режим reserveMode: 'spare' (Пачка в запас) vs 'tail' (Хвостики на дорез)
    const singleTails = [];
    const spareProduced = {}; // Сколько штук отрезано в запас сверх потребности

    for (let [lStr, rem] of Object.entries(remainingDemand)) {
        const l = Number(lStr);
        if (rem > 0) {
            if (reserveMode === 'spare') {
                // Добавляем в пачку, производя остаток в запас
                let placed = false;
                for (let p of resultPacks) {
                    const used = p.cuts.length > 0 ? (p.cuts.reduce((s, x) => s + x, 0) + (p.cuts.length - 1) * kerf) : 0;
                    if (used + kerf + l <= p.totalLen) {
                        p.cuts.push(l);
                        placed = true;
                        const extraInPack = p.count - rem;
                        if (extraInPack > 0) {
                            spareProduced[l] = (spareProduced[l] || 0) + extraInPack;
                        }
                        break;
                    }
                }
                if (!placed) {
                    resultPacks.push({ totalLen: packLen, count: packQty, isScrap: false, cuts: [l] });
                    const extraInPack = packQty - rem;
                    if (extraInPack > 0) {
                        spareProduced[l] = (spareProduced[l] || 0) + extraInPack;
                    }
                }
                remainingDemand[l] = Math.max(0, rem - (placed ? (resultPacks[resultPacks.length - 1]?.count || packQty) : packQty));
            } else {
                // Режим 'tail': оставляем хвостики для штучного дореза
                singleTails.push({ len: l, qty: rem });
            }
        }
    }

    // Сортировка резов в каждой пачке по возрастанию (от меньшего к большему)
    resultPacks.forEach(p => {
        p.cuts.sort((a, b) => a - b);
    });

    const isSpare = (reserveMode === 'spare');

    // Формирование HTML
    let html = `
        <!-- KPI КАРТОЧКИ (Ровно 4 карточки) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="bg-[#121217] p-4 rounded-3xl border border-white/5 space-y-1">
                <div class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Общая длина шинки:</div>
                <div class="text-xl sm:text-2xl font-black mono text-white">${totalShinkaMeters.toFixed(1)} м</div>
                <div class="text-[10px] text-zinc-500">чистый метраж шинорейки</div>
            </div>
            <div class="bg-[#121217] p-4 rounded-3xl border border-white/5 space-y-1">
                <div class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Общее количество шинок:</div>
                <div class="text-xl sm:text-2xl font-black mono text-amber-300">${exactTotalShinkas} шт</div>
                <div class="text-[10px] text-zinc-500">заготовок для резки</div>
            </div>
            <div class="bg-[#121217] p-4 rounded-3xl border border-white/5 space-y-1">
                <div class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Общее количество рамок:</div>
                <div class="text-xl sm:text-2xl font-black mono text-white">${totalFrames} шт</div>
                <div class="text-[10px] text-zinc-500">фланцевых рамок в заказе</div>
            </div>
            <div class="bg-[#121217] p-4 rounded-3xl border border-white/5 space-y-1">
                <div class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Общее количество уголков:</div>
                <div class="text-xl sm:text-2xl font-black mono text-emerald-400">${totalCorners} шт</div>
                <div class="text-[10px] text-zinc-500">по 4 шт на каждую рамку</div>
            </div>
        </div>

        <!-- ТОЧНОЕ КОЛИЧЕСТВО ШИНОК ПО РАЗМЕРАМ С КНОПКАМИ РЕЖИМА -->
        <div class="bg-[#121217] p-4 sm:p-5 rounded-3xl border border-white/5 space-y-3">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                <div>
                    <h3 class="font-extrabold text-sm text-white">Количество заготовок шинки</h3>
                    <p class="text-[11px] text-zinc-400">Сторона рамки − 30 мм (припуск на уголки)</p>
                </div>
                <!-- Сегментированный переключатель режима раскроя -->
                <div class="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1 gap-1">
                    <button type="button" onclick="setFlangeReserveMode('tail')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition btn-press ${
                        !isSpare 
                            ? 'bg-amber-400 text-black shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                    }">
                        ✂️ Хвостики на дорез
                    </button>
                    <button type="button" onclick="setFlangeReserveMode('spare')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition btn-press ${
                        isSpare 
                            ? 'bg-white text-black shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                    }">
                        📦 Пачка в запас
                    </button>
                </div>
            </div>

            <!-- Список точных размеров шинок -->
            <div class="flex flex-wrap gap-2 mono text-xs">
                ${Object.entries(cutsNeeded).map(([k, v]) => `
                    <div class="bg-[#18181f] border border-white/5 px-3 py-2 rounded-2xl flex items-center gap-2">
                        <span class="text-zinc-300 font-bold">${k} мм</span>
                        <span class="text-zinc-500">—</span>
                        <strong class="text-emerald-400">${v} шт</strong>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- КАРТЫ РАСПИЛА ПАЧЕК -->
        <div class="space-y-3">
            <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-white uppercase tracking-wider">Карты реза пачек (${packQty} шт в пачке, резы от меньшего к большему):</span>
                <span class="text-zinc-400">Всего пачек: <strong class="text-white mono">${resultPacks.length} шт</strong></span>
            </div>
            <div class="space-y-2.5">
    `;

    resultPacks.forEach((p, idx) => {
        const used = p.cuts.length > 0 ? (p.cuts.reduce((s, x) => s + x, 0) + (p.cuts.length - 1) * kerf) : 0;
        const rem = Math.max(0, p.totalLen - used);
        html += `
            <div class="bg-[#121217] p-4 rounded-3xl border border-white/5 space-y-3">
                <div class="flex justify-between items-center text-xs">
                    <span class="font-extrabold text-white">${p.isScrap ? `✂ Обрезок (${p.count} шт в пачке)` : `Пачка №${idx + 1} (${p.count} шт в пачке)`} — ${p.totalLen} мм</span>
                    <span class="text-zinc-400">Деловой остаток: <strong class="text-amber-400 mono">${rem} мм</strong></span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${p.cuts.map(c => `
                        <span class="bg-white/10 border border-white/15 text-white px-3 py-1.5 rounded-xl text-xs mono font-black">
                            Рез ${c} мм → ${p.count} шт
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;

    // Информационный блок внизу (Хвостики или Запас)
    if (!isSpare) {
        if (singleTails.length > 0) {
            const totalTails = singleTails.reduce((s, t) => s + t.qty, 0);
            html += `
                <div class="bg-amber-500/10 border border-amber-500/25 p-4 rounded-3xl text-xs space-y-2">
                    <div class="flex items-center gap-2 text-amber-300 font-extrabold">
                        <span>✂️</span>
                        <span>Штучные хвостики на дорез (всего ${totalTails} шт надо дорезать штучно):</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mono">
                        ${singleTails.map(t => `
                            <span class="bg-[#121217] border border-amber-500/30 text-amber-200 px-3 py-1.5 rounded-xl font-bold">
                                ${t.len} мм — ${t.qty} шт
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-3xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                    <span>✓</span>
                    <span>Все заготовки полностью на 100% кратны пачкам, штучных хвостиков нет!</span>
                </div>
            `;
        }
    } else {
        const spareEntries = Object.entries(spareProduced);
        if (spareEntries.length > 0) {
            const totalSpare = spareEntries.reduce((s, [, q]) => s + q, 0);
            html += `
                <div class="bg-white/5 border border-white/10 p-4 rounded-3xl text-xs space-y-2">
                    <div class="flex items-center gap-2 text-zinc-200 font-extrabold">
                        <span>📦</span>
                        <span>Отрезано в запас на склад (всего +${totalSpare} шт готовых шинок в запасе):</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mono">
                        ${spareEntries.map(([len, q]) => `
                            <span class="bg-[#121217] border border-white/10 text-zinc-200 px-3 py-1.5 rounded-xl font-bold">
                                ${len} мм — +${q} шт
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-3xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                    <span>✓</span>
                    <span>Идеальный раскрой: пачки заполнены точно под заказ без излишков.</span>
                </div>
            `;
        }
    }

    return html;
}

// ==========================================
// ЭКСПОРТ И ПЕЧАТЬ
// ==========================================
function exportFlangeText(mode) {
    const isProj = mode === 'project';
    const p = isProj ? appState.projects.find(x => x.id === session.insideProjectId) : null;
    const title = p ? p.title : 'Автономный расчет';

    let text = `MAXVENT TOOLS — НАРЯД НА ШИНКУ И УГОЛКИ\nОбъект: ${title}\nДата: ${new Date().toLocaleDateString()}\n\n`;
    const outEl = document.getElementById(isProj ? 'projFlangeOutput' : 'stFlangeOutput');
    if (outEl) {
        text += outEl.innerText || '';
    }

    navigator.clipboard.writeText(text);
    showToast('Наряд скопирован в буфер обмена!', 'success');
}

function printFlangeOrder(mode) {
    const isProj = mode === 'project';
    const p = isProj ? appState.projects.find(x => x.id === session.insideProjectId) : null;
    const title = p ? p.title : 'Автономный расчет';
    const outEl = document.getElementById(isProj ? 'projFlangeOutput' : 'stFlangeOutput');
    if (!outEl) return;

    const printArea = document.getElementById('printReportArea');
    if (!printArea) return;

    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #000; font-size: 13px;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: bold;">MAXVENT TOOLS</h2>
                    <p style="margin: 3px 0 0 0; font-size: 13px; color: #555;">Производственный наряд: нарезка шинорейки и сборка рамок</p>
                </div>
                <div style="text-align: right; font-size: 12px;">
                    <div>Объект: <b>${title}</b></div>
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                </div>
            </div>
            ${outEl.innerHTML}
            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; border-top: 1px dashed #999; padding-top: 20px;">
                <div>Распиловщик: ___________________</div>
                <div>Сборщик рамок: ___________________</div>
                <div>Принял в монтаж: ___________________</div>
            </div>
        </div>
    `;
    window.print();
}
