// ==========================================
// MODULE: flange.js
// Калькулятор шинки 1D, раскрой пачек, учет обрезков
// ==========================================

// ==========================================
// ЧАСТЬ 3: ШИНКА, РАСКРОЙ 2D, ФИНАНСЫ И ПАНЕЛЬ РАЗРАБОТЧИКА
// ==========================================

// --- ШИНКА (РАСЧЕТ И РАСКРОЙ ПО ПАЧКАМ) ---
async function addFlangeScrap(target) {
    const isProj = target === 'project';
    const inpLen = isProj ? document.getElementById('projScrapLenInput') : document.getElementById('stScrapInput');
    const inpCount = isProj ? document.getElementById('projScrapCountInput') : document.getElementById('stScrapCountInput');
    const len = Number(inpLen?.value);
    if (!len || len < 100) {
        showToast('Укажите длину обрезка (от 100 мм)', 'warning');
        return;
    }

    const p = appState.projects.find(x => x.id === session.insideProjectId);
    const defPackQty = isProj ? getProjectPackQty(p) : (appState.standaloneFlange.pack_qty || 10);
    const count = Number(inpCount?.value) || defPackQty;

    if (isProj) {
        const data = getProjectFlangeData(p);
        data.scraps.push({ len, count });
        await saveProjectFlangeData(p, data);
        renderProjectFlange();
        showToast(`Обрезок ${len} мм (${count} шт) добавлен`, 'success');
    } else {
        if (!appState.standaloneFlange.scraps) appState.standaloneFlange.scraps = [];
        appState.standaloneFlange.scraps.push({ len, count });
        await saveGlobalSettings();
        renderStandaloneFlange();
        showToast(`Обрезок ${len} мм (${count} шт) добавлен`, 'success');
    }
    if (inpLen) inpLen.value = '';
    if (inpCount) inpCount.value = '';
}

async function removeFlangeScrap(target, idx) {
    if (target === 'project') {
        const p = appState.projects.find(x => x.id === session.insideProjectId);
        const data = getProjectFlangeData(p);
        data.scraps.splice(idx, 1);
        await saveProjectFlangeData(p, data);
        renderProjectFlange();
    } else {
        appState.standaloneFlange.scraps.splice(idx, 1);
        await saveGlobalSettings();
        renderStandaloneFlange();
    }
    showToast('Обрезок удален', 'info');
}

function renderProjectFlange() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;
    const data = getProjectFlangeData(p);

    const scrapBox = document.getElementById('projScrapChips');
    if (scrapBox) {
        scrapBox.innerHTML = (data.scraps || []).map((s, i) => {
            const sLen = typeof s === 'number' ? s : s.len;
            const sCnt = typeof s === 'number' ? data.pack_qty : (s.count || data.pack_qty);
            return `
                <span class="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-200 mono flex items-center gap-1.5 text-xs">
                    ✂ ${sLen} мм <strong class="text-amber-400">(${sCnt} шт)</strong>
                    <button onclick="removeFlangeScrap('project', ${i})" title="Удалить обрезок" class="text-slate-500 hover:text-rose-400 font-bold ml-1">×</button>
                </span>
            `;
        }).join('');
    }

    const packLen = Number(document.getElementById('projPackLen')?.value) || 3000;
    const packQtyInp = Number(document.getElementById('projPackQty')?.value);
    const packQty = packQtyInp > 0 ? packQtyInp : (data.pack_qty || 10);
    const kerf = Number(document.getElementById('projKerf')?.value) || 2;
    const roundMode = document.getElementById('projFlangeRound')?.value || 'down';

    if (packQty !== data.pack_qty) {
        data.pack_qty = packQty;
        saveProjectFlangeData(p, data);
    }

    const framesObj = {};
    appState.activeProjectItems.forEach(it => {
        const frames = getItemFrames(it);
        frames.forEach(fr => {
            const normalized = fr.replace('x', '×').trim();
            framesObj[normalized] = (framesObj[normalized] || 0) + it.qty;
        });
    });

    document.getElementById('projFlangeOutput').innerHTML = buildFlangeCalculationUI(
        framesObj, packLen, kerf, roundMode, data.scraps || [], packQty
    );
}

function buildFlangeCalculationUI(framesObj, packLen, kerf, roundMode, scrapsList, packQty) {
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
        return `<div class="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">В проекте нет прямоугольных изделий с включенной шинкой</div>`;
    }

    const totalFrames = Object.values(framesObj).reduce((s, v) => s + v, 0);
    const exactTotalShinkas = Object.values(cutsNeeded).reduce((s, v) => s + v, 0);
    // Точное количество уголков всегда строго равно суммарному количеству шинок (по 4 шт на каждую рамку):
    const totalCorners = exactTotalShinkas;

    const totalShinkaMeters = Object.entries(cutsNeeded).reduce((sum, [len, q]) => sum + (Number(len) * q), 0) / 1000;
    const tapeMeters = Object.entries(framesObj).reduce((sum, [sz, cnt]) => {
        const parts = sz.split('×').map(Number);
        return sum + (2 * (parts[0] + parts[1]) * cnt);
    }, 0) / 1000;

    const remainingDemand = { ...cutsNeeded };

    // Нормализация имеющихся обрезков
    const availableScraps = (scrapsList || []).map(s => {
        let totalLen = typeof s === 'number' ? s : Number(s.len);
        let count = typeof s === 'number' ? packQty : (Number(s.count) || packQty);
        if (isNaN(totalLen) && typeof s === 'string') {
            const mLen = s.match(/len\s*=\s*(\d+)/i);
            const mCnt = s.match(/count\s*=\s*(\d+)/i);
            totalLen = mLen ? Number(mLen[1]) : 1000;
            count = mCnt ? Number(mCnt[1]) : packQty;
        }
        return {
            totalLen: totalLen || 1000,
            count: count || packQty,
            isScrap: true,
            cuts: []
        };
    });

    // Оптимальный поиск комбинации резов из пула под заданную длину пачки/обрезка
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

    // Шаг 3: Раскрой оставшихся обрезков под неполные потребности (хвостики < packQty)
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
    const singleTails = [];
    for (let [lStr, rem] of Object.entries(remainingDemand)) {
        const l = Number(lStr);
        if (rem > 0) {
            if (roundMode === 'up') {
                let placed = false;
                for (let p of resultPacks) {
                    const used = p.cuts.length > 0 ? (p.cuts.reduce((s, x) => s + x, 0) + (p.cuts.length - 1) * kerf) : 0;
                    if (used + kerf + l <= p.totalLen) {
                        p.cuts.push(l);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    resultPacks.push({ totalLen: packLen, count: packQty, isScrap: false, cuts: [l] });
                }
                remainingDemand[l] = 0;
            } else {
                singleTails.push({ len: l, qty: rem });
            }
        }
    }

    let html = `
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Уголки УГФ (точно):</div>
                <div class="text-2xl font-black mono text-emerald-400 mt-1">${totalCorners} шт</div>
                <div class="text-[10px] text-slate-500 mt-0.5">по 4 шт на каждую рамку</div>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Всего рамок:</div>
                <div class="text-2xl font-black mono text-blue-400 mt-1">${totalFrames} шт</div>
                <div class="text-[10px] text-slate-500 mt-0.5">${exactTotalShinkas} заготовок шинки</div>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Шинка в метрах:</div>
                <div class="text-2xl font-black mono text-white mt-1">${totalShinkaMeters.toFixed(1)} м</div>
                <div class="text-[10px] text-slate-500 mt-0.5">чистая длина заготовок</div>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Лента межфланцевая:</div>
                <div class="text-2xl font-black mono text-cyan-400 mt-1">${tapeMeters.toFixed(1)} м</div>
                <div class="text-[10px] text-slate-500 mt-0.5">периметр всех рамок</div>
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-blue-400 uppercase tracking-wider text-xs">Готовые рамки шинорейки для сборки:</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mono text-xs">
                ${Object.entries(framesObj).map(([k, v]) => `
                    <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                        <span class="text-slate-300">${k} мм</span>
                        <strong class="text-white">${v} рамок</strong>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-emerald-400 uppercase tracking-wider text-xs">Количество заготовок шинки (Сторона рамки − 30 мм):</div>
            <div class="flex flex-wrap gap-2 mono text-xs">
                ${Object.entries(cutsNeeded).map(([k, v]) => `
                    <span class="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200">
                        ${k} мм — <strong class="text-emerald-400">${v} шт</strong>
                    </span>
                `).join('')}
            </div>
        </div>

        <div class="space-y-3">
            <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-white uppercase tracking-wider">Карты реза пачек (1 рез = кол-во шинок в пачке):</span>
                <span class="text-slate-400">Всего пачек на распил: <strong class="text-blue-400 mono">${resultPacks.length} шт</strong></span>
            </div>
            <div class="space-y-2.5">
    `;

    resultPacks.forEach((p, idx) => {
        const used = p.cuts.length > 0 ? (p.cuts.reduce((s, x) => s + x, 0) + (p.cuts.length - 1) * kerf) : 0;
        const rem = Math.max(0, p.totalLen - used);
        html += `
            <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div class="flex justify-between text-xs">
                    <span class="font-bold text-white">${p.isScrap ? `✂ Обрезок (${p.count} шт в пачке)` : `Пачка №${idx + 1} (${p.count} шт в пачке)`} — ${p.totalLen} мм</span>
                    <span class="text-slate-400">Деловой остаток: <strong class="text-amber-400 mono">${rem} мм</strong></span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${p.cuts.map(c => `
                        <span class="bg-blue-950 border border-blue-700 text-blue-200 px-3 py-1 rounded-lg text-xs mono font-bold">
                            Рез ${c} мм → ${p.count} шт
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;

    if (singleTails.length > 0) {
        html += `
            <div class="bg-amber-950/30 border border-amber-800/60 p-4 rounded-xl text-xs space-y-2">
                <div class="font-bold text-amber-300 uppercase tracking-wider">Памятка: Хвостики на штучный дорез (некратные количеству в пачке):</div>
                <div class="flex flex-wrap gap-2 mono">
                    ${singleTails.map(t => `<span class="bg-amber-900/40 text-amber-200 px-3 py-1 rounded-lg">${t.len} мм — ${t.qty} шт</span>`).join('')}
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="bg-emerald-950/30 border border-emerald-800/60 p-3.5 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <span>✓</span>
                <span>Все заготовки полностью на 100% раскроены в пачках, штучных хвостиков нет!</span>
            </div>
        `;
    }

    return html;
}

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
    showToast('Наряд на шинку скопирован в буфер обмена!', 'success');
}

function printFlangeOrder(mode) {
    const isProj = mode === 'project';
    const p = isProj ? appState.projects.find(x => x.id === session.insideProjectId) : null;
    const title = p ? p.title : 'Автономный расчет шинки';
    const outEl = document.getElementById(isProj ? 'projFlangeOutput' : 'stFlangeOutput');
    if (!outEl) return;

    const printArea = document.getElementById('printReportArea');
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

// --- 2D РАСКРОЙ ЛИСТА (УМНОЕ РАЗДЕЛЕНИЕ КОРОБОВ И УЧЕТ ФАЛЬЦЕВ) ---
