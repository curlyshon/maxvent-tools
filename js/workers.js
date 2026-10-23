// ==========================================
// MODULE: workers.js
// Расчет выработки, долей мастеров, личный кабинет выработки по активным проектам
// ==========================================

let workerProjectsFilter = 'active'; // 'active' or 'archived'

function setWorkerProjectsFilter(f) {
    triggerHaptic('light');
    workerProjectsFilter = f;
    const btnAct = document.getElementById('wpFilterActiveBtn');
    const btnArc = document.getElementById('wpFilterArchivedBtn');
    if (btnAct) {
        btnAct.className = f === 'active'
            ? 'px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white text-black transition btn-press shadow-sm'
            : 'px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 text-zinc-400 hover:text-white transition btn-press';
    }
    if (btnArc) {
        btnArc.className = f === 'archived'
            ? 'px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white text-black transition btn-press shadow-sm'
            : 'px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 text-zinc-400 hover:text-white transition btn-press';
    }
    renderWorkerProfileContent();
}

// ==========================================
// РАСЧЕТ СТОИМОСТИ И ДОЛЕЙ ПОЗИЦИИ
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

// ==========================================
// ЛИЧНЫЙ КАБИНЕТ ВЫРАБОТКИ МАСТЕРА
// ==========================================
function openWorkerProfileModal(specificWorkerName = null) {
    session.workerProfSelectedUser = specificWorkerName || session.user?.name || appState.users[0]?.name;
    if (typeof navigateTo === 'function') {
        navigateTo(SCREENS.WORKER);
    }
}

function switchWorkerProfileUser(userName) {
    triggerHaptic('light');
    session.workerProfSelectedUser = userName;
    renderWorkerProfileContent();
}

function renderWorkerProfileContent() {
    const targetUser = session.workerProfSelectedUser || session.user?.name || appState.users[0]?.name;
    if (!targetUser) return;

    // Шапка мастера
    const avatarEl = document.getElementById('workerProfAvatar');
    const nameEl = document.getElementById('workerProfName');
    const roleBadge = document.getElementById('workerProfRoleBadge');
    const selectWrap = document.getElementById('workerProfSelectWrap');
    const userSelect = document.getElementById('workerProfUserSelect');

    const uObj = appState.users.find(u => u.name === targetUser);
    if (avatarEl) avatarEl.textContent = uObj?.avatar || targetUser.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = targetUser;
    if (roleBadge) roleBadge.textContent = uObj?.role === 'developer' ? 'Разработчик' : 'Мастер цеха';

    // Для руководителя показываем выбор любого мастера
    if (isDev() && selectWrap && userSelect) {
        selectWrap.classList.remove('hidden');
        selectWrap.classList.add('flex');
        userSelect.innerHTML = appState.users.map(u => `
            <option value="${u.name}" ${u.name === targetUser ? 'selected' : ''}>${u.name}</option>
        `).join('');
    } else if (selectWrap) {
        selectWrap.classList.add('hidden');
    }

    // Фильтрация проектов: по умолчанию активные объекты (не в архиве)
    let projectsList = appState.projects.filter(p => (p.archive_state || 'active') === workerProjectsFilter);
    const allowedProjIds = new Set(projectsList.map(p => p.id));
    const items = appState.allItems.filter(it => allowedProjIds.has(it.project_id) && (it.workers || []).includes(targetUser));

    // KPI Расчеты
    let earnedDone = 0;
    let earnedPlanned = 0;
    let ductsArea = 0;
    let ductsCount = 0;
    let fittingsCount = 0;
    let fittingsEarned = 0;
    let totalItems = items.length;
    let doneItems = items.filter(it => it.item_status === 'done').length;

    items.forEach(it => {
        const p = appState.projects.find(x => x.id === it.project_id);
        const info = getWorkerItemShareInfo(it, targetUser, p);
        const isDone = (it.item_status === 'done');

        earnedPlanned += info.amount;
        if (isDone) earnedDone += info.amount;

        if (it.category === 'duct') {
            const seams = getProjectSeams(p);
            const unfold = it.shape === 'rect' 
                ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
            ductsArea += (unfold * Number(it.l || 1250) * (Number(it.qty) || 1)) / 1e6;
            ductsCount += (Number(it.qty) || 1);
        } else {
            fittingsCount += (Number(it.qty) || 1);
            if (isDone) fittingsEarned += info.amount;
        }
    });

    const pctDone = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    // Заполнение KPI карточек
    const elEarnedDone = document.getElementById('wpStatEarnedDone');
    const elPlanned = document.getElementById('wpStatPlanned');
    const elDuctsArea = document.getElementById('wpStatDuctsArea');
    const elDuctsCount = document.getElementById('wpStatDuctsCount');
    const elFitCount = document.getElementById('wpStatFittingsCount');
    const elFitEarned = document.getElementById('wpStatFittingsEarned');
    const elDoneRatio = document.getElementById('wpStatDoneRatio');
    const elDonePct = document.getElementById('wpStatDonePct');

    if (elEarnedDone) elEarnedDone.textContent = `${earnedDone.toLocaleString()} ₸`;
    if (elPlanned) elPlanned.textContent = `Всего запланировано: ${earnedPlanned.toLocaleString()} ₸`;
    if (elDuctsArea) elDuctsArea.textContent = `${ductsArea.toFixed(1)} м²`;
    if (elDuctsCount) elDuctsCount.textContent = `${ductsCount} шт деталей`;
    if (elFitCount) elFitCount.textContent = `${fittingsCount} шт`;
    if (elFitEarned) elFitEarned.textContent = `Фасонина: ${fittingsEarned.toLocaleString()} ₸`;
    if (elDoneRatio) elDoneRatio.textContent = `${doneItems} / ${totalItems} поз.`;
    if (elDonePct) elDonePct.textContent = `${pctDone}% собрано`;

    // Рендер проектов с заработком мастера
    renderWorkerProjectsList(targetUser, projectsList);
}

function renderWorkerProjectsList(workerName, projectsList) {
    const listEl = document.getElementById('wpProjectsList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const myProjects = projectsList.filter(p => {
        return appState.allItems.some(it => it.project_id === p.id && (it.workers || []).includes(workerName));
    });

    if (myProjects.length === 0) {
        listEl.innerHTML = `
            <div class="bg-[#121217] border border-white/5 rounded-3xl p-8 text-center text-xs text-zinc-500 space-y-2">
                <span class="text-2xl block">💰</span>
                <p>Нет назначенных позиций для мастера ${workerName}</p>
            </div>
        `;
        return;
    }

    myProjects.forEach(p => {
        const pItems = appState.allItems.filter(it => it.project_id === p.id && (it.workers || []).includes(workerName));
        const allProjItems = appState.allItems.filter(it => it.project_id === p.id);

        // Общий сдельный фонд проекта
        let totalProjectFund = 0;
        allProjItems.forEach(it => {
            totalProjectFund += getItemPositionCost(it, p);
        });

        // Доля текущего мастера в этом проекте
        let myEarnedDone = 0;
        let myEarnedTotal = 0;
        let myDoneCount = 0;
        let myTotalCount = 0;

        pItems.forEach(it => {
            const info = getWorkerItemShareInfo(it, workerName, p);
            const qty = Number(it.qty) || 1;
            myTotalCount += qty;
            myEarnedTotal += info.amount;
            if (it.item_status === 'done') {
                myDoneCount += qty;
                myEarnedDone += info.amount;
            }
        });

        const pct = myTotalCount > 0 ? Math.round((myDoneCount / myTotalCount) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'bg-[#121217] border border-white/5 rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm';
        card.innerHTML = `
            <div class="flex flex-wrap justify-between items-start gap-2">
                <div>
                    <div class="flex items-center gap-2">
                        <h4 class="font-black text-sm sm:text-base text-white">${p.title}</h4>
                        <span class="text-[10px] bg-white/10 text-zinc-300 border border-white/10 px-2 py-0.5 rounded-full font-bold">${p.status_text || 'В работе'}</span>
                    </div>
                    <p class="text-xs text-zinc-400 mt-0.5">${p.group_name || 'Без бригады'} • Сдельный фонд объекта: <strong class="text-zinc-200 mono">${totalProjectFund.toLocaleString()} ₸</strong></p>
                </div>
                <div class="text-right">
                    <div class="text-base sm:text-lg font-black mono text-emerald-400">${myEarnedDone.toLocaleString()} ₸</div>
                    <div class="text-[10px] text-zinc-500">из ${myEarnedTotal.toLocaleString()} ₸ по объекту</div>
                </div>
            </div>

            <!-- Прогресс готовности позиций мастера -->
            <div class="space-y-1">
                <div class="flex justify-between items-center text-[11px]">
                    <span class="text-zinc-400">Собрано:</span>
                    <span class="mono font-bold ${pct === 100 ? 'text-emerald-400' : 'text-zinc-300'}">${myDoneCount} из ${myTotalCount} шт (${pct}%)</span>
                </div>
                <div class="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
                </div>
            </div>

            <!-- Разворачиваемый список позиций мастера в объекте -->
            <div class="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                <span class="text-zinc-400 font-mono">${pItems.length} позиций закреплено</span>
                <button type="button" onclick="openInsideProject(${p.id})" class="bg-white hover:bg-zinc-200 text-black font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition btn-press">
                    Открыть объект →
                </button>
            </div>
        `;
        listEl.appendChild(card);
    });
}

// ==========================================
// ПЕЧАТЬ ВЕДОМОСТИ ВЫРАБОТКИ (PDF)
// ==========================================
function printWorkerReport() {
    const targetUser = session.workerProfSelectedUser || session.user?.name;
    const printArea = document.getElementById('printReportArea');
    if (!printArea) return;

    const projectsList = appState.projects.filter(p => (p.archive_state || 'active') === workerProjectsFilter);
    const allowedProjIds = new Set(projectsList.map(p => p.id));
    const items = appState.allItems.filter(it => allowedProjIds.has(it.project_id) && (it.workers || []).includes(targetUser));

    let totalDone = 0;
    let rowsHtml = '';

    items.forEach((it, idx) => {
        const p = appState.projects.find(x => x.id === it.project_id);
        const info = getWorkerItemShareInfo(it, targetUser, p);
        if (it.item_status === 'done') totalDone += info.amount;

        rowsHtml += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 6px;">${idx + 1}</td>
                <td style="padding: 6px;"><b>${p ? p.title : ''}</b></td>
                <td style="padding: 6px;">${it.title}</td>
                <td style="padding: 6px; text-align: center;">${it.qty} шт</td>
                <td style="padding: 6px; text-align: center;">${info.percent}%</td>
                <td style="padding: 6px; text-align: right;">${info.amount.toLocaleString()} ₸</td>
                <td style="padding: 6px; text-align: center;">${it.item_status === 'done' ? '✓ Сдано' : '⏳ В очереди'}</td>
            </tr>
        `;
    });

    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #000; font-size: 13px;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: bold;">MAXVENT TOOLS</h2>
                    <p style="margin: 3px 0 0 0; font-size: 13px; color: #555;">Ведомость сдельной выработки мастера</p>
                </div>
                <div style="text-align: right; font-size: 12px;">
                    <div>Мастер: <b>${targetUser}</b></div>
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                </div>
            </div>

            <div style="margin-bottom: 20px; padding: 12px; background: #f4f4f5; border-radius: 8px; font-size: 14px;">
                <b>Фактически начислено к выплате (собрано ✓):</b> <span style="font-size: 18px; font-weight: bold; color: #059669;">${totalDone.toLocaleString()} ₸</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #e4e4e7; border-bottom: 2px solid #999;">
                        <th style="padding: 6px; text-align: left;">№</th>
                        <th style="padding: 6px; text-align: left;">Объект</th>
                        <th style="padding: 6px; text-align: left;">Изделие</th>
                        <th style="padding: 6px; text-align: center;">Кол-во</th>
                        <th style="padding: 6px; text-align: center;">Доля</th>
                        <th style="padding: 6px; text-align: right;">Сумма</th>
                        <th style="padding: 6px; text-align: center;">Статус</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; border-top: 1px dashed #999; padding-top: 20px;">
                <div>Руководитель цеха: ___________________</div>
                <div>Мастер: ___________________</div>
            </div>
        </div>
    `;
    window.print();
}
