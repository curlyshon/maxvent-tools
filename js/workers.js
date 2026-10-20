// ==========================================
// MODULE: workers.js
// Расчет стоимости и долей мастеров, личный кабинет выработки и KPI
// ==========================================

// ==========================================
// РАСЧЕТ ВЫРАБОТКИ, СТОИМОСТИ И ДОЛЕЙ МАСТЕРОВ
// ==========================================
function getItemPositionCost(it, project = null) {
    if (!project) {
        project = appState.projects.find(p => p.id === (it.project_id || session.insideProjectId));
    }
    const seams = getProjectSeams(project);
    const qty = Number(it.qty) || 1;
    const price = Number(it.price) || 0;

    if (it.category === 'duct') {
        const unfold = it.shape === 'rect' 
            ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
            : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
        const area = (unfold * Number(it.l || 1250) * qty) / 1e6;
        return Math.round(area * price);
    } else {
        return Math.round(qty * price);
    }
}

function getWorkerItemShareInfo(it, workerName, project = null) {
    const workers = it.workers || [];
    if (!workers.includes(workerName)) {
        return { hasWorker: false, percent: 0, amount: 0, totalCost: 0 };
    }
    const totalCost = getItemPositionCost(it, project);
    const shares = it.worker_shares || it.dimensions?.worker_shares;
    let percent = 0;
    if (shares && shares[workerName] !== undefined && !isNaN(Number(shares[workerName]))) {
        percent = Number(shares[workerName]);
    } else {
        percent = workers.length > 0 ? (100 / workers.length) : 0;
    }
    const amount = Math.round(totalCost * (percent / 100));
    return { hasWorker: true, percent, amount, totalCost };
}

function formatItemWorkersDisplay(it) {
    if (!it.workers || !it.workers.length) return '';
    const shares = it.worker_shares || it.dimensions?.worker_shares;
    if (it.workers.length === 1) {
        return it.workers[0];
    }
    const parts = it.workers.map(w => {
        if (shares && shares[w] !== undefined) {
            return `${w} (${Math.round(shares[w])}%)`;
        }
        return `${w} (${Math.round(100 / it.workers.length)}%)`;
    });
    return parts.join(', ');
}

// --- УПРАВЛЕНИЕ РАСПРЕДЕЛЕНИЕМ ДОЛЕЙ В ФОРМЕ ДОБАВЛЕНИЯ ---
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
        const otherWorkers = checked.filter(w => w !== devWorker);
        const count = otherWorkers.length;
        const base = Math.floor(50 / count);
        const rem = 50 - base * count;
        otherWorkers.forEach((w, idx) => {
            shares[w] = idx === 0 ? (base + rem) : base;
        });
    } else {
        const count = checked.length;
        const base = Math.floor(100 / count);
        const rem = 100 - base * count;
        checked.forEach((w, idx) => {
            shares[w] = idx === 0 ? (base + rem) : base;
        });
    }
    return shares;
}

function onWorkerSelectionChanged(presetShares = null) {
    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    const badge = document.getElementById('workersCountBadge');
    if (badge) badge.textContent = `Выбрано: ${checked.length}`;

    const sharesBox = document.getElementById('workerSharesBox');
    if (!sharesBox) return;

    if (checked.length <= 1) {
        sharesBox.classList.add('hidden');
        session.workerSharesState = {};
        if (checked.length === 1) {
            session.workerSharesState[checked[0]] = 100;
        }
        return;
    }

    sharesBox.classList.remove('hidden');

    if (presetShares && typeof presetShares === 'object') {
        session.workerSharesState = { ...presetShares };
        session.workerSplitMode = 'custom';
    } else {
        if (session.workerSplitMode === 'equal') {
            session.workerSharesState = calculateDefaultWorkerShares(checked);
        } else {
            const newShares = {};
            let sumExisting = 0;
            const missing = [];
            checked.forEach(w => {
                if (session.workerSharesState[w] !== undefined) {
                    newShares[w] = session.workerSharesState[w];
                    sumExisting += newShares[w];
                } else {
                    missing.push(w);
                }
            });
            if (missing.length > 0) {
                const rem = Math.max(0, 100 - sumExisting);
                const each = Math.floor(rem / missing.length);
                const lastRem = rem - each * missing.length;
                missing.forEach((w, idx) => {
                    newShares[w] = idx === 0 ? (each + lastRem) : each;
                });
            }
            session.workerSharesState = newShares;
        }
    }

    renderWorkerSharesList();
}

function setWorkersSplitMode(mode) {
    session.workerSplitMode = mode;
    const btnEq = document.getElementById('btnSplitEqual');
    const btnCust = document.getElementById('btnSplitCustom');
    if (btnEq) {
        btnEq.className = mode === 'equal' 
            ? 'px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-600 text-white transition' 
            : 'px-2.5 py-1 text-[11px] font-bold rounded-md text-slate-400 hover:text-white transition';
    }
    if (btnCust) {
        btnCust.className = mode === 'custom' 
            ? 'px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-600 text-white transition' 
            : 'px-2.5 py-1 text-[11px] font-bold rounded-md text-slate-400 hover:text-white transition';
    }

    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    if (mode === 'equal' && checked.length > 0) {
        session.workerSharesState = calculateDefaultWorkerShares(checked);
    }

    renderWorkerSharesList();
}

function renderWorkerSharesList() {
    const list = document.getElementById('workerSharesList');
    if (!list) return;

    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    if (checked.length === 0) {
        list.innerHTML = '';
        return;
    }

    const isCustom = session.workerSplitMode === 'custom';

    list.innerHTML = checked.map(w => {
        const pct = session.workerSharesState[w] !== undefined ? session.workerSharesState[w] : Math.round(100 / checked.length);
        return `
            <div class="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-xs">${w.charAt(0).toUpperCase()}</span>
                    <span class="font-bold text-white text-xs">${w}</span>
                </div>
                <div class="flex items-center gap-2">
                    ${isCustom ? `
                        <div class="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5">
                            <button type="button" onclick="adjustWorkerShare('${w}', -5)" class="text-slate-400 hover:text-white font-bold text-xs px-1">-</button>
                            <input type="number" min="0" max="100" id="shareInput_${w}" value="${pct}" oninput="onWorkerShareInputChanged()" class="w-10 bg-transparent text-center mono font-bold text-amber-300 text-xs focus:outline-none">
                            <span class="text-slate-500 text-xs font-bold">%</span>
                            <button type="button" onclick="adjustWorkerShare('${w}', +5)" class="text-slate-400 hover:text-white font-bold text-xs px-1">+</button>
                        </div>
                    ` : `
                        <span class="mono font-bold text-amber-300 text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">${pct}%</span>
                    `}
                    <span id="shareAmt_${w}" class="mono font-bold text-emerald-400 text-xs min-w-[75px] text-right">0 ₸</span>
                </div>
            </div>
        `;
    }).join('');

    onWorkerShareInputChanged(false);
}

function adjustWorkerShare(workerName, delta) {
    session.workerSplitMode = 'custom';
    const cur = Number(session.workerSharesState[workerName]) || 0;
    const next = Math.max(0, Math.min(100, cur + delta));
    session.workerSharesState[workerName] = next;

    const inp = document.getElementById(`shareInput_${workerName}`);
    if (inp) inp.value = next;

    onWorkerShareInputChanged();
}

function onWorkerShareInputChanged(updateState = true) {
    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    let sum = 0;
    checked.forEach(w => {
        if (session.workerSplitMode === 'custom') {
            const inp = document.getElementById(`shareInput_${w}`);
            const val = inp ? (Number(inp.value) || 0) : (session.workerSharesState[w] || 0);
            if (updateState) session.workerSharesState[w] = val;
            sum += val;
        } else {
            sum += (session.workerSharesState[w] || 0);
        }
    });

    const lbl = document.getElementById('workerSharesTotalLabel');
    const balBtn = document.getElementById('balanceSharesBtn');

    if (lbl) {
        if (sum === 100) {
            lbl.textContent = 'Сумма долей: 100% ✓';
            lbl.className = 'text-emerald-400 font-bold';
            if (balBtn) balBtn.classList.add('hidden');
        } else {
            const diff = 100 - sum;
            lbl.textContent = `Сумма долей: ${sum}% (${diff > 0 ? 'не хватает ' + diff + '%' : 'превышение на ' + Math.abs(diff) + '%'})`;
            lbl.className = 'text-amber-400 font-bold';
            if (balBtn) balBtn.classList.remove('hidden');
        }
    }

    updateWorkerSharesTengeAmounts();
}

function balanceWorkerShares() {
    const checked = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);
    if (checked.length === 0) return;

    let sum = 0;
    checked.forEach(w => {
        sum += (session.workerSharesState[w] || 0);
    });

    if (sum === 0) {
        setWorkersSplitMode('equal');
        return;
    }

    let running = 0;
    checked.forEach((w, idx) => {
        if (idx === checked.length - 1) {
            session.workerSharesState[w] = Math.max(0, 100 - running);
        } else {
            const scaled = Math.round((session.workerSharesState[w] / sum) * 100);
            session.workerSharesState[w] = scaled;
            running += scaled;
        }
    });

    renderWorkerSharesList();
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
    if (workers.length === 1) {
        return { [workers[0]]: 100 };
    }
    const shares = {};
    workers.forEach(w => {
        if (session.workerSharesState[w] !== undefined) {
            shares[w] = Number(session.workerSharesState[w]) || 0;
        } else {
            shares[w] = Math.round(100 / workers.length);
        }
    });
    return shares;
}

// ==========================================
// ЛИЧНЫЙ КАБИНЕТ МАСТЕРА (ВЫРАБОТКА И ЗАРАБОТОК)
// ==========================================
function openWorkerProfileModal(specificWorkerName = null) {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.add('hidden');

    const modal = document.getElementById('workerProfileModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const selectWrap = document.getElementById('workerProfSelectWrap');
    const userSelect = document.getElementById('workerProfUserSelect');

    if (userSelect) {
        userSelect.innerHTML = `
            <option value="${session.user?.name || ''}">👤 Мой профиль (${session.user?.name || ''})</option>
            ${isDev() ? '<option value="all">🏆 Все мастера цеха (Сводка)</option>' : ''}
            ${appState.users.filter(u => u.name !== session.user?.name).map(u => `<option value="${u.name}">${u.name} (${u.role === 'developer' ? 'Админ' : 'Мастер'})</option>`).join('')}
        `;
    }

    if (isDev() && selectWrap) {
        selectWrap.classList.remove('hidden');
        selectWrap.classList.add('flex');
    } else if (selectWrap) {
        selectWrap.classList.add('hidden');
    }

    session.workerProfSelectedUser = specificWorkerName || session.user?.name || appState.users[0]?.name;
    if (userSelect) userSelect.value = session.workerProfSelectedUser;

    renderWorkerProfileContent();
}

function closeWorkerProfileModal() {
    const modal = document.getElementById('workerProfileModal');
    if (modal) modal.classList.add('hidden');
}

function switchWorkerProfileUser(userName) {
    session.workerProfSelectedUser = userName;
    renderWorkerProfileContent();
}

function switchWorkerProfTab(tab) {
    session.workerProfActiveTab = tab;
    const tabProj = document.getElementById('wpTab-by-project');
    const tabItems = document.getElementById('wpTab-all-items');
    const viewProj = document.getElementById('wpView-by-project');
    const viewItems = document.getElementById('wpView-all-items');

    if (tab === 'by-project') {
        if (tabProj) tabProj.className = 'px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white whitespace-nowrap transition';
        if (tabItems) tabItems.className = 'px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition';
        if (viewProj) viewProj.classList.remove('hidden');
        if (viewItems) viewItems.classList.add('hidden');
        renderWorkerProjectsSummary();
    } else {
        if (tabProj) tabProj.className = 'px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition';
        if (tabItems) tabItems.className = 'px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white whitespace-nowrap transition';
        if (viewProj) viewProj.classList.add('hidden');
        if (viewItems) viewItems.classList.remove('hidden');
        renderWorkerAllItems();
    }
}

function updateWorkerProfileKPIs() {
    const targetUser = session.workerProfSelectedUser || session.user?.name;
    const filterState = document.getElementById('wpProjStateFilter')?.value || 'active';

    let projectsList = appState.projects;
    if (filterState === 'active') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'active');
    } else if (filterState === 'archived') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'archived');
    }
    const allowedProjIds = new Set(projectsList.map(p => p.id));

    let earnedDone = 0;
    let earnedPlanned = 0;
    let ductsArea = 0;
    let ductsCount = 0;
    let fittingsCount = 0;
    let fittingsEarned = 0;
    let donePositions = 0;
    let totalPositions = 0;

    appState.allItems.forEach(it => {
        if (!allowedProjIds.has(it.project_id)) return;
        const hasWorker = (targetUser === 'all') ? ((it.workers || []).length > 0) : (it.workers || []).includes(targetUser);
        if (!hasWorker) return;

        totalPositions++;
        const p = appState.projects.find(x => x.id === it.project_id);
        const seams = getProjectSeams(p);
        const totalCost = getItemPositionCost(it, p);

        let userShareAmount = 0;
        if (targetUser === 'all') {
            userShareAmount = totalCost;
        } else {
            const shareInfo = getWorkerItemShareInfo(it, targetUser, p);
            userShareAmount = shareInfo.amount;
        }

        earnedPlanned += userShareAmount;

        const isDone = it.item_status === 'done';
        if (isDone) {
            earnedDone += userShareAmount;
            donePositions++;
        }

        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' 
                ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
            const area = (unfold * Number(it.l || 1250) * (Number(it.qty) || 1)) / 1e6;
            ductsArea += area;
            ductsCount += (Number(it.qty) || 1);
        } else {
            fittingsCount += (Number(it.qty) || 1);
            fittingsEarned += userShareAmount;
        }
    });

    const pctDone = totalPositions > 0 ? Math.round((donePositions / totalPositions) * 100) : 0;

    const elEarnedDone = document.getElementById('wpStatEarnedDone');
    const elPlanned = document.getElementById('wpStatPlanned');
    const elDuctsArea = document.getElementById('wpStatDuctsArea');
    const elDuctsCount = document.getElementById('wpStatDuctsCount');
    const elFittingsCount = document.getElementById('wpStatFittingsCount');
    const elFittingsEarned = document.getElementById('wpStatFittingsEarned');
    const elDoneRatio = document.getElementById('wpStatDoneRatio');
    const elDonePct = document.getElementById('wpStatDonePct');

    if (elEarnedDone) elEarnedDone.textContent = `${earnedDone.toLocaleString()} ₸`;
    if (elPlanned) elPlanned.textContent = `Всего по наряду: ${earnedPlanned.toLocaleString()} ₸`;
    if (elDuctsArea) elDuctsArea.textContent = `${ductsArea.toFixed(1)} м²`;
    if (elDuctsCount) elDuctsCount.textContent = `${ductsCount} шт деталей`;
    if (elFittingsCount) elFittingsCount.textContent = `${fittingsCount} шт`;
    if (elFittingsEarned) elFittingsEarned.textContent = `${fittingsEarned.toLocaleString()} ₸`;
    if (elDoneRatio) elDoneRatio.textContent = `${donePositions} / ${totalPositions} поз.`;
    if (elDonePct) elDonePct.textContent = `${pctDone}% завершено`;
}

function renderWorkerProfileContent() {
    const targetUser = session.workerProfSelectedUser || session.user?.name;
    const uObj = appState.users.find(u => u.name === targetUser);
    const profNameEl = document.getElementById('workerProfName');
    const profAvatarEl = document.getElementById('workerProfAvatar');
    const profRoleBadge = document.getElementById('workerProfRoleBadge');

    if (targetUser === 'all') {
        if (profNameEl) profNameEl.textContent = 'Сводная выработка всех мастеров цеха';
        if (profAvatarEl) profAvatarEl.textContent = '🏆';
        if (profRoleBadge) profRoleBadge.textContent = 'Цех';
    } else {
        if (profNameEl) profNameEl.textContent = `Кабинет: ${targetUser || ''}`;
        if (profAvatarEl) profAvatarEl.textContent = targetUser ? targetUser.charAt(0).toUpperCase() : '👤';
        if (profRoleBadge) profRoleBadge.textContent = uObj?.role === 'developer' ? 'Разработчик / Админ' : 'Мастер цеха';
    }

    updateWorkerProfileKPIs();

    if (session.workerProfActiveTab === 'by-project') {
        renderWorkerProjectsSummary();
    } else {
        renderWorkerAllItems();
    }
}

function renderWorkerProjectsSummary() {
    const list = document.getElementById('wpProjectsList');
    if (!list) return;

    const targetUser = session.workerProfSelectedUser || session.user?.name;
    const filterState = document.getElementById('wpProjStateFilter')?.value || 'active';

    let projectsList = appState.projects;
    if (filterState === 'active') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'active');
    } else if (filterState === 'archived') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'archived');
    }

    const projectsWithItems = [];
    projectsList.forEach(p => {
        const pItems = appState.allItems.filter(it => {
            if (it.project_id !== p.id) return false;
            return (targetUser === 'all') ? ((it.workers || []).length > 0) : (it.workers || []).includes(targetUser);
        });
        if (pItems.length > 0) {
            projectsWithItems.push({ project: p, items: pItems });
        }
    });

    if (projectsWithItems.length === 0) {
        list.innerHTML = `<div class="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">Нет позиций для отображения по выбранным критериям</div>`;
        return;
    }

    list.innerHTML = projectsWithItems.map(({ project: p, items }) => {
        let earnedDone = 0;
        let earnedPlanned = 0;
        let ductsArea = 0;
        let ductsCount = 0;
        let fittingsCount = 0;
        let doneCount = 0;

        items.forEach(it => {
            const seams = getProjectSeams(p);
            const totalCost = getItemPositionCost(it, p);
            let shareAmt = 0;
            if (targetUser === 'all') {
                shareAmt = totalCost;
            } else {
                shareAmt = getWorkerItemShareInfo(it, targetUser, p).amount;
            }

            earnedPlanned += shareAmt;
            if (it.item_status === 'done') {
                earnedDone += shareAmt;
                doneCount += (Number(it.qty) || 1);
            }

            if (it.category === 'duct') {
                const unfold = it.shape === 'rect' 
                    ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                    : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
                ductsArea += (unfold * Number(it.l || 1250) * (Number(it.qty) || 1)) / 1e6;
                ductsCount += (Number(it.qty) || 1);
            } else {
                fittingsCount += (Number(it.qty) || 1);
            }
        });

        const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 1), 0);
        const pct = totalQty > 0 ? Math.round((doneCount / totalQty) * 100) : 0;
        const isOpen = !!(session.workerAccordions && session.workerAccordions[p.id]);
        const accordionId = `wpProjAcc_${p.id}`;
        const btnId = `wpProjAccBtn_${p.id}`;

        const itemsHtml = items.map(it => {
            const desc = [];
            if (it.shape === 'rect') desc.push(`${it.w || 0}×${it.h || 0}`);
            else if (it.shape === 'round') desc.push(`Ø${it.d || 0}`);
            if (it.l) desc.push(`L=${it.l}`);
            if (it.deg) desc.push(`${it.deg}°`);

            const frames = getItemFrames(it);
            const framesHtml = frames.length ? `<span class="text-blue-300 font-semibold">[Рамки: ${frames.join(', ')}]</span>` : '';

            const shareInfo = getWorkerItemShareInfo(it, targetUser, p);
            const shareText = targetUser === 'all' 
                ? formatItemWorkersDisplay(it) 
                : `${Math.round(shareInfo.percent)}% (${shareInfo.amount.toLocaleString()} ₸)`;

            const stConfig = {
                queue: { text: '⏳ Не готово', cls: 'bg-slate-800 text-slate-300 border-slate-700' },
                done: { text: '✓ Готово', cls: 'bg-emerald-950/70 text-emerald-300 border-emerald-700' }
            };
            const curSt = stConfig[it.item_status || 'queue'] || stConfig.queue;

            return `
                <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div class="space-y-0.5">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-bold text-white">${it.title}</span>
                            <span class="mono text-blue-300 font-semibold">${desc.join(' ')}</span>
                            ${framesHtml}
                            <button type="button" id="wpItemBtn_${it.id}" onclick="toggleWorkerItemStatus(${it.id})" title="Кликните для смены этапа" class="border px-2 py-0.5 rounded-md text-[10px] font-bold ${curSt.cls} transition hover:scale-105">
                                ${curSt.text}
                            </button>
                        </div>
                        <div class="text-[11px] text-slate-400">
                            Металл: <strong class="text-slate-200">${it.metal} ${it.thickness} мм</strong> • Кол-во: <strong class="mono text-white">${it.qty} шт</strong>
                        </div>
                    </div>
                    <div class="text-right sm:self-center">
                        <div class="text-[11px] text-amber-400 font-semibold">${targetUser === 'all' ? 'Мастера:' : 'Доля мастера:'} ${shareText}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-black text-sm text-white">${p.title}</h4>
                            <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-950 text-blue-300 border border-blue-800">${p.group_name || 'Без бригады'}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded font-bold ${p.status_text === 'Воздуховоды отрезаны' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-300'}">${p.status_text || 'В работе'}</span>
                        </div>
                    </div>
                    <button type="button" onclick="closeWorkerProfileModal(); openInsideProject(${p.id});" class="text-blue-400 hover:text-blue-300 text-xs font-bold transition flex items-center gap-1">
                        <span>Перейти к объекту</span> <span>→</span>
                    </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                        <span class="text-slate-400">Начислено (готово):</span>
                        <div id="wpEarnedDone_${p.id}" class="text-sm font-black mono text-emerald-400 mt-0.5">${earnedDone.toLocaleString()} ₸</div>
                    </div>
                    <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                        <span class="text-slate-400">Всего по объекту:</span>
                        <div class="text-sm font-black mono text-white mt-0.5">${earnedPlanned.toLocaleString()} ₸</div>
                    </div>
                    <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                        <span class="text-slate-400">Воздуховоды:</span>
                        <div class="text-sm font-black mono text-blue-400 mt-0.5">${ductsArea.toFixed(1)} м² <span class="text-[10px] text-slate-400">(${ductsCount} шт)</span></div>
                    </div>
                    <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                        <span class="text-slate-400">Изделия:</span>
                        <div class="text-sm font-black mono text-amber-400 mt-0.5">${fittingsCount} шт</div>
                    </div>
                </div>

                <div class="space-y-1">
                    <div class="flex justify-between items-center text-[11px]">
                        <span class="text-slate-400">Готовность позиций мастера:</span>
                        <span id="wpDoneCount_${p.id}" class="mono font-bold ${pct === 100 ? 'text-emerald-400' : 'text-slate-300'}">${doneCount} / ${totalQty} шт (${pct}%)</span>
                    </div>
                    <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div id="wpProgressBar_${p.id}" class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style="width: ${pct}%"></div>
                    </div>
                </div>

                <button type="button" id="${btnId}" data-count="${items.length}" onclick="toggleWorkerProjectAccordion(${p.id})" class="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800/70 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-between transition">
                    <span>Позиции мастера на объекте (${items.length} поз.)</span>
                    <span class="text-blue-400 font-bold">${isOpen ? 'Свернуть ▲' : 'Развернуть ▼'}</span>
                </button>
                <div id="${accordionId}" class="${isOpen ? '' : 'hidden'} space-y-2 pt-1 border-t border-slate-800">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function toggleWorkerProjectAccordion(projectId) {
    if (!session.workerAccordions) session.workerAccordions = {};
    session.workerAccordions[projectId] = !session.workerAccordions[projectId];
    const isOpen = !!session.workerAccordions[projectId];

    const accEl = document.getElementById(`wpProjAcc_${projectId}`);
    const btnEl = document.getElementById(`wpProjAccBtn_${projectId}`);
    if (accEl) {
        accEl.classList.toggle('hidden', !isOpen);
    }
    if (btnEl) {
        const count = btnEl.dataset.count || '';
        btnEl.innerHTML = `
            <span>Позиции мастера на объекте (${count} поз.)</span>
            <span class="text-blue-400 font-bold">${isOpen ? 'Свернуть ▲' : 'Развернуть ▼'}</span>
        `;
    }
}

function renderWorkerAllItems() {
    const list = document.getElementById('wpAllItemsList');
    if (!list) return;

    const targetUser = session.workerProfSelectedUser || session.user?.name;
    const filterState = document.getElementById('wpProjStateFilter')?.value || 'active';
    const statusFilter = document.getElementById('wpStatusFilter')?.value || 'all';
    const categoryFilter = document.getElementById('wpCategoryFilter')?.value || 'all';
    const search = (document.getElementById('wpSearchInput')?.value || '').trim().toLowerCase();

    let projectsList = appState.projects;
    if (filterState === 'active') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'active');
    } else if (filterState === 'archived') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'archived');
    }
    const allowedProjIds = new Set(projectsList.map(p => p.id));

    let items = appState.allItems.filter(it => {
        if (!allowedProjIds.has(it.project_id)) return false;
        const hasWorker = (targetUser === 'all') ? ((it.workers || []).length > 0) : (it.workers || []).includes(targetUser);
        if (!hasWorker) return false;

        if (statusFilter !== 'all' && (it.item_status || 'queue') !== statusFilter) return false;
        if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;

        if (search) {
            const p = appState.projects.find(x => x.id === it.project_id);
            const framesText = (getItemFrames(it) || []).join(' ');
            const fullText = `${p?.title || ''} ${it.title} ${it.w || ''} ${it.h || ''} ${it.d || ''} ${it.l || ''} ${it.metal || ''} ${(it.workers || []).join(' ')} ${framesText}`.toLowerCase();
            if (!fullText.includes(search)) return false;
        }

        return true;
    });

    if (items.length === 0) {
        list.innerHTML = `<div class="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">Позиции не найдены</div>`;
        return;
    }

    list.innerHTML = items.map(it => {
        const p = appState.projects.find(x => x.id === it.project_id);
        const desc = [];
        if (it.shape === 'rect') desc.push(`${it.w || 0}×${it.h || 0}`);
        else if (it.shape === 'round') desc.push(`Ø${it.d || 0}`);
        if (it.l) desc.push(`L=${it.l}`);
        if (it.deg) desc.push(`${it.deg}°`);

        const frames = getItemFrames(it);
        const framesHtml = frames.length ? `<span class="text-blue-300 font-semibold">[Рамки: ${frames.join(', ')}]</span>` : '';

        const shareInfo = getWorkerItemShareInfo(it, targetUser, p);
        const shareText = targetUser === 'all' 
            ? formatItemWorkersDisplay(it) 
            : `${Math.round(shareInfo.percent)}% (${shareInfo.amount.toLocaleString()} ₸)`;

        const stConfig = {
            queue: { text: '⏳ Не готово', cls: 'bg-slate-800 text-slate-300 border-slate-700' },
            done: { text: '✓ Готово', cls: 'bg-emerald-950/70 text-emerald-300 border-emerald-700' }
        };
        const curSt = stConfig[it.item_status || 'queue'] || stConfig.queue;

        return `
            <div class="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <div class="space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">${p?.title || 'Проект'}</span>
                        <strong class="text-white">${it.title}</strong>
                        <span class="mono text-blue-300 font-semibold">${desc.join(' ')}</span>
                        ${framesHtml}
                        <button type="button" id="wpAllItemBtn_${it.id}" onclick="toggleWorkerItemStatus(${it.id})" title="Кликните для переключения статуса" class="border px-2 py-0.5 rounded-md text-[10px] font-bold ${curSt.cls} transition hover:scale-105">
                            ${curSt.text}
                        </button>
                    </div>
                    <div class="text-[11px] text-slate-400">
                        Металл: <strong class="text-slate-200">${it.metal} ${it.thickness} мм</strong> • Кол-во: <strong class="mono text-white">${it.qty} шт</strong>
                    </div>
                </div>
                <div class="text-right sm:self-center">
                    <div class="text-[11px] text-amber-400 font-semibold">${targetUser === 'all' ? 'Мастера:' : 'Доля мастера:'} ${shareText}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleWorkerItemStatus(itemId) {
    const it = appState.allItems.find(x => x.id === itemId);
    if (!it) return;

    if (!session.workerAccordions) session.workerAccordions = {};
    session.workerAccordions[it.project_id] = true;

    const cur = it.item_status || 'queue';
    const next = (cur === 'done') ? 'queue' : 'done';
    it.item_status = next;
    if (!it.dimensions) it.dimensions = {};
    it.dimensions.item_status = next;

    const actIt = appState.activeProjectItems.find(x => x.id === itemId);
    if (actIt) {
        actIt.item_status = next;
        if (!actIt.dimensions) actIt.dimensions = {};
        actIt.dimensions.item_status = next;
    }

    // Сохранение в Supabase в фоне
    supabaseClient.from('items').update({ dimensions: it.dimensions }).eq('id', itemId);
    showToast(`Статус: ${next === 'done' ? '✓ Готово' : '⏳ Не готово'}`, next === 'done' ? 'success' : 'info');

    // 1. Точечное обновление кнопок в DOM БЕЗ перерисовки аккордеона!
    const btnByProj = document.getElementById(`wpItemBtn_${itemId}`);
    if (btnByProj) {
        btnByProj.className = next === 'done'
            ? "border px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border-emerald-700 transition hover:scale-105"
            : "border px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border-slate-700 transition hover:scale-105";
        btnByProj.textContent = next === 'done' ? "✓ Готово" : "⏳ Не готово";
    }

    const btnAll = document.getElementById(`wpAllItemBtn_${itemId}`);
    if (btnAll) {
        btnAll.className = next === 'done'
            ? "border px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border-emerald-700 transition hover:scale-105"
            : "border px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border-slate-700 transition hover:scale-105";
        btnAll.textContent = next === 'done' ? "✓ Готово" : "⏳ Не готово";
    }

    // 2. Обновление плашки проекта (начислено, готовность)
    const p = appState.projects.find(x => x.id === it.project_id);
    if (p) {
        const targetUser = session.workerProfSelectedUser || session.user?.name;
        const pItems = appState.allItems.filter(x => {
            if (x.project_id !== p.id) return false;
            return (targetUser === 'all') ? ((x.workers || []).length > 0) : (x.workers || []).includes(targetUser);
        });
        let pEarnedDone = 0;
        let pDoneCount = 0;
        const pTotalQty = pItems.reduce((s, i) => s + (Number(i.qty) || 1), 0);
        pItems.forEach(x => {
            const share = (targetUser === 'all') 
                ? getItemPositionCost(x, p) 
                : getWorkerItemShareInfo(x, targetUser, p).amount;
            if (x.item_status === 'done') {
                pEarnedDone += share;
                pDoneCount += (Number(x.qty) || 1);
            }
        });
        const pPct = pTotalQty > 0 ? Math.round((pDoneCount / pTotalQty) * 100) : 0;
        const elEarned = document.getElementById(`wpEarnedDone_${p.id}`);
        if (elEarned) elEarned.textContent = `${pEarnedDone.toLocaleString()} ₸`;
        const elDone = document.getElementById(`wpDoneCount_${p.id}`);
        if (elDone) {
            elDone.textContent = `${pDoneCount} / ${pTotalQty} шт (${pPct}%)`;
            elDone.className = `mono font-bold ${pPct === 100 ? 'text-emerald-400' : 'text-slate-300'}`;
        }
        const elBar = document.getElementById(`wpProgressBar_${p.id}`);
        if (elBar) elBar.style.width = `${pPct}%`;
    }

    // 3. Обновление KPI шапки модалки и шапки приложения
    updateWorkerProfileKPIs();
    updateHeaderUI();

    if (session.insideProjectId === it.project_id) {
        renderSpecification();
    }
}

function printWorkerReport() {
    const targetUser = session.workerProfSelectedUser || session.user?.name;
    const filterState = document.getElementById('wpProjStateFilter')?.value || 'active';

    let projectsList = appState.projects;
    if (filterState === 'active') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'active');
    } else if (filterState === 'archived') {
        projectsList = projectsList.filter(p => (p.archive_state || 'active') === 'archived');
    }
    const allowedProjIds = new Set(projectsList.map(p => p.id));

    let grandEarnedDone = 0;
    let grandEarnedPlanned = 0;
    let grandDuctsArea = 0;
    let grandFittingsCount = 0;

    let rowsHtml = '';
    appState.allItems.forEach(it => {
        if (!allowedProjIds.has(it.project_id)) return;
        const hasWorker = (targetUser === 'all') ? ((it.workers || []).length > 0) : (it.workers || []).includes(targetUser);
        if (!hasWorker) return;

        const p = appState.projects.find(x => x.id === it.project_id);
        const seams = getProjectSeams(p);
        const totalCost = getItemPositionCost(it, p);
        const shareInfo = getWorkerItemShareInfo(it, targetUser, p);
        const shareAmt = (targetUser === 'all') ? totalCost : shareInfo.amount;
        const sharePct = (targetUser === 'all') ? 100 : shareInfo.percent;

        grandEarnedPlanned += shareAmt;
        if (it.item_status === 'done') grandEarnedDone += shareAmt;

        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' 
                ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
            grandDuctsArea += (unfold * Number(it.l || 1250) * (Number(it.qty) || 1)) / 1e6;
        } else {
            grandFittingsCount += (Number(it.qty) || 1);
        }

        const desc = [];
        if (it.shape === 'rect') desc.push(`${it.w || 0}×${it.h || 0}`);
        else if (it.shape === 'round') desc.push(`Ø${it.d || 0}`);
        if (it.l) desc.push(`L=${it.l}`);
        if (it.deg) desc.push(`${it.deg}°`);

        const frames = getItemFrames(it).join(', ');

        rowsHtml += `
            <tr>
                <td style="border: 1px solid #cbd5e1; padding: 6px;">${p?.title || '—'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${it.title} ${desc.join(' ')}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px;">${frames || '—'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px;">${it.metal} ${it.thickness} мм</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">${it.qty} шт</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${it.item_status === 'done' ? '✓ Готово' : '⏳ Не готово'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${Math.round(sharePct)}%</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-weight: bold;">${shareAmt.toLocaleString()} ₸</td>
            </tr>
        `;
    });

    const printArea = document.getElementById('printReportArea');
    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; color: #000;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between;">
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: bold;">MAXVENT TOOLS</h2>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">Ведомость выработки и начисления заработной платы</p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #0284c7;">Мастер: ${targetUser === 'all' ? 'Все мастера цеха' : targetUser}</p>
                </div>
                <div style="text-align: right; font-size: 12px;">
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                    <div>Период: ${filterState === 'active' ? 'Активные объекты' : 'Все объекты'}</div>
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 11px; color: #666;">Заработано (Собрано ✓):</div>
                    <div style="font-size: 18px; font-weight: bold; color: #16a34a; margin-top: 4px;">${grandEarnedDone.toLocaleString()} ₸</div>
                </div>
                <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 11px; color: #666;">Всего по нарядам:</div>
                    <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${grandEarnedPlanned.toLocaleString()} ₸</div>
                </div>
                <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 11px; color: #666;">Воздуховоды:</div>
                    <div style="font-size: 18px; font-weight: bold; color: #0284c7; margin-top: 4px;">${grandDuctsArea.toFixed(1)} м²</div>
                </div>
                <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px;">
                    <div style="font-size: 11px; color: #666;">Фасонина:</div>
                    <div style="font-size: 18px; font-weight: bold; color: #d97706; margin-top: 4px;">${grandFittingsCount} шт</div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Объект</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Изделие и размеры</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Рамки</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Металл</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">Кол-во</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">Этап</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Доля</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Сумма (₸)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 10px;">Нет данных</td></tr>'}
                </tbody>
            </table>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px;">
                <div>Сдал (Мастер): ___________________</div>
                <div>Принял (Начальник цеха): ___________________</div>
            </div>
        </div>
    `;

    window.print();
}
