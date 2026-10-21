// ==========================================
// MODULE: projects.js
// Главное меню объектов, создание/редактирование проектов, фальцы и карточки
// ==========================================

// ==========================================
// ГЛАВНОЕ МЕНЮ И ПРОЕКТЫ
// ==========================================
function goToMainMenu() {
    session.clickedProjectId = null;
    const drop = document.getElementById('profileDropdown');
    if (drop) drop.classList.add('hidden');
    if (typeof navigateTo === 'function') {
        navigateTo(SCREENS.MENU);
    }
}

function goToProjectsScreen() {
    if (typeof navigateTo === 'function') {
        navigateTo(SCREENS.PROJECTS);
    }
}

function setProjectFilter(f) {
    session.projectFilter = f;
    session.clickedProjectId = null;
    document.getElementById('btnProjActive').className = f === 'active' 
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-black transition' 
        : 'px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition';
    document.getElementById('btnProjArchived').className = f === 'archived' 
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-black transition' 
        : 'px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition';
    renderMainMenuProjects();
}

function toggleProjectsSection() {
    document.getElementById('projectsMainGrid').classList.toggle('hidden');
}

function renderMainMenuProjects() {
    const search = (document.getElementById('projectSearchInput')?.value || '').trim().toLowerCase();
    let list = appState.projects.filter(p => (p.archive_state || 'active') === session.projectFilter);

    if (search) {
        list = list.filter(p => {
            const titleMatch = (p.title || '').toLowerCase().includes(search);
            const groupMatch = (p.group_name || '').toLowerCase().includes(search);
            const descMatch = (p.description || '').toLowerCase().includes(search);
            const statusMatch = (p.status_text || '').toLowerCase().includes(search);
            return titleMatch || groupMatch || descMatch || statusMatch;
        });
    }

    document.getElementById('projectsBadgeCount').textContent = list.length;

    const container = document.getElementById('projectsButtonsContainer');
    const preview = document.getElementById('projectPreviewCard');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-500 text-center">Проекты не найдены</div>`;
        preview.classList.add('hidden');
        return;
    }

    list.forEach(p => {
        const isSelected = p.id === session.clickedProjectId;
        const pItems = appState.allItems.filter(x => x.project_id === p.id);
        const totalQty = pItems.reduce((s, i) => s + (Number(i.qty) || 1), 0);
        const doneQty = pItems.filter(i => i.item_status === 'done').reduce((s, i) => s + (Number(i.qty) || 1), 0);
        const pct = totalQty > 0 ? Math.round((doneQty / totalQty) * 100) : 0;

        let ductsArea = 0;
        let fittingsCount = 0;
        pItems.forEach(it => {
            if (it.category === 'duct') {
                const seams = getProjectSeams(p);
                const unfold = it.shape === 'rect' 
                    ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                    : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
                ductsArea += (unfold * Number(it.l || 1250) * (Number(it.qty) || 1)) / 1e6;
            } else {
                fittingsCount += (Number(it.qty) || 1);
            }
        });

        // Цвета статуса
        let stColor = 'bg-white/10 border-white/15 text-zinc-300';
        if (p.status_text === 'Воздуховоды отрезаны' || p.status_text === 'Готов к отгрузке') {
            stColor = 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400';
        } else if (p.status_text === 'Ожидает металл') {
            stColor = 'bg-amber-500/15 border-amber-500/20 text-amber-300';
        } else if (p.status_text === 'Сдан') {
            stColor = 'bg-white/5 border-white/10 text-zinc-500';
        }

        const card = document.createElement('div');
        card.className = `w-full text-left p-4 sm:p-5 rounded-3xl border transition-all duration-200 shadow-sm space-y-3 cursor-pointer ${
            isSelected 
                ? 'bg-[#181b26] border-white/30 shadow-lg' 
                : 'bg-[#12141c] border-white/5 hover:border-white/20 hover:bg-[#151822]'
        }`;

        card.onclick = async (e) => {
            // Если клик по кнопке открыть — не переключаем preview
            if (e.target.closest('.btn-direct-open')) return;
            session.clickedProjectId = (session.clickedProjectId === p.id) ? null : p.id;
            if (session.clickedProjectId) {
                await loadProjectDetails(p.id);
            }
            renderMainMenuProjects();
        };

        card.innerHTML = `
            <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <h3 class="font-extrabold text-sm sm:text-base text-white truncate">${p.title}</h3>
                        <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${stColor}">${p.status_text || 'В работе'}</span>
                    </div>
                    <div class="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                        <span>🔧 ${p.group_name || 'Без бригады'}</span>
                        ${p.description ? `<span>• <span class="truncate max-w-[150px] inline-block align-bottom text-zinc-500">${p.description}</span></span>` : ''}
                    </div>
                </div>
                <button type="button" onclick="openInsideProject(${p.id})" class="btn-direct-open bg-white hover:bg-zinc-200 text-black text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm active:scale-95">
                    <span>Открыть</span> <span class="text-[10px]">→</span>
                </button>
            </div>

            <!-- ПРОГРЕСС БАР -->
            <div class="space-y-1">
                <div class="flex justify-between items-center text-[11px]">
                    <span class="text-zinc-400">Готовность:</span>
                    <span class="mono font-bold ${pct === 100 ? 'text-emerald-400' : 'text-zinc-300'}">${doneQty} / ${totalQty} шт (${pct}%)</span>
                </div>
                <div class="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div class="h-full bg-white rounded-full transition-all duration-300" style="width: ${pct}%"></div>
                </div>
            </div>

            <div class="flex items-center justify-between text-[11px] pt-1 text-zinc-400 border-t border-white/5">
                <span class="mono text-zinc-300 font-semibold">${ductsArea.toFixed(1)} м² воздуховодов</span>
                <span class="mono text-zinc-300 font-semibold">${fittingsCount} шт изделий</span>
            </div>
        `;
        container.appendChild(card);
    });

    if (!session.clickedProjectId) {
        preview.classList.add('hidden');
    } else {
        renderProjectPreviewCard(session.clickedProjectId);
    }
}

function renderProjectPreviewCard(projId) {
    const preview = document.getElementById('projectPreviewCard');
    const p = appState.projects.find(x => x.id === projId);
    if (!p) { preview.classList.add('hidden'); return; }
    preview.classList.remove('hidden');

    const ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    const fittings = appState.activeProjectItems.filter(i => i.category === 'fitting');
    const totalDuctQty = ducts.reduce((s, i) => s + i.qty, 0);
    const totalFitQty = fittings.reduce((s, i) => s + i.qty, 0);

    let treeHtml = '';
    const dRect = ducts.filter(i => i.shape === 'rect');
    if (dRect.length) treeHtml += `<div class="font-bold text-blue-400 mt-2">Воздуховоды прямоугольные</div>` + formatPreviewItems(dRect, false);

    const dRound = ducts.filter(i => i.shape === 'round');
    if (dRound.length) treeHtml += `<div class="font-bold text-emerald-400 mt-2">Воздуховоды круглые</div>` + formatPreviewItems(dRound, false);

    const fRect = fittings.filter(i => i.shape === 'rect');
    if (fRect.length) treeHtml += `<div class="font-bold text-amber-400 mt-2">Изделия прямоугольные</div>` + formatPreviewItems(fRect, true);

    const fRound = fittings.filter(i => i.shape === 'round');
    if (fRound.length) treeHtml += `<div class="font-bold text-purple-400 mt-2">Изделия круглые</div>` + formatPreviewItems(fRound, true);

    const fSmooth = fittings.filter(i => i.shape === 'smooth');
    if (fSmooth.length) treeHtml += `<div class="font-bold text-cyan-400 mt-2">Изделия плавные</div>` + formatPreviewItems(fSmooth, true);

    preview.innerHTML = `
        <div class="flex flex-wrap justify-between items-start gap-2 border-b border-white/10 pb-3">
            <div>
                <h3 class="text-base font-black text-white">${p.title}</h3>
                <p class="text-xs text-zinc-400 mt-0.5">${p.description || 'Описание не указано'}</p>
            </div>
            <div class="text-right">
                <span class="text-xs px-2.5 py-1 rounded-full font-bold ${p.status_text === 'Воздуховоды отрезаны' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-white border border-white/15'}">${p.status_text || 'В работе'}</span>
                <div class="text-[11px] text-zinc-400 mt-1">${p.group_name || 'Без бригады'}</div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-[#181b26] p-3 rounded-2xl border border-white/5">
                <span class="text-zinc-400">Воздуховоды:</span> <strong class="text-white mono">${totalDuctQty} шт</strong>
            </div>
            <div class="bg-[#181b26] p-3 rounded-2xl border border-white/5">
                <span class="text-zinc-400">Изделия:</span> <strong class="text-white mono">${totalFitQty} шт</strong>
            </div>
        </div>

        <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1 bg-[#181b26] p-3.5 rounded-2xl border border-white/5 text-xs">
            <div class="text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-1">Состав проекта:</div>
            ${treeHtml || '<div class="text-zinc-500">В проекте пока нет позиций</div>'}
        </div>

        <div class="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <button onclick="openInsideProject(${p.id})" class="flex-1 bg-white hover:bg-zinc-200 text-black font-extrabold py-3 px-3 rounded-xl text-xs uppercase tracking-wider transition text-center shadow-sm">
                Открыть проект
            </button>
            <button onclick="openProjectModal(${p.id})" class="bg-white/5 hover:bg-white/10 text-zinc-200 py-3 px-3.5 rounded-xl text-xs font-semibold border border-white/5">
                ✎ Изменить
            </button>
            <button onclick="archiveProjectSafe(${p.id})" class="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white py-3 px-3.5 rounded-xl text-xs border border-white/5">
                ${p.archive_state === 'archived' ? 'Восстановить' : 'В архив'}
            </button>
            ${isDev() && p.archive_state === 'archived' ? `<button onclick="deleteProjectPermanent(${p.id})" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 px-3.5 rounded-xl text-xs font-semibold">Удалить</button>` : ''}
        </div>
    `;
}

function formatPreviewItems(items, isFitting) {
    let out = '';
    const byGroup = {};
    items.forEach(it => {
        const subKey = isFitting ? it.title : 'Прямые участки';
        const metalKey = `${it.metal} ${it.thickness} мм`;
        if (!byGroup[subKey]) byGroup[subKey] = {};
        if (!byGroup[subKey][metalKey]) byGroup[subKey][metalKey] = [];
        byGroup[subKey][metalKey].push(it);
    });

    for (let [subName, metals] of Object.entries(byGroup)) {
        if (isFitting) out += `<div class="text-[11px] font-semibold text-slate-300 mt-1 pl-1">${subName}</div>`;
        for (let [mKey, arr] of Object.entries(metals)) {
            out += `<div class="text-[10px] font-bold text-slate-400 pl-2 mt-0.5">${mKey}</div>`;
            arr.forEach(it => {
                let dimText = '';
                if (it.shape === 'rect') dimText = `${it.w}×${it.h} | L=${it.l || 1250}`;
                else if (it.shape === 'round') dimText = `Ø${it.d} | L=${it.l || 1250}`;
                else dimText = `${it.w1 || it.w}×${it.h1 || it.h} → Ø${it.d}${it.l ? ` | L=${it.l}` : ''}`;
                out += `<div class="pl-4 text-[11px] text-slate-200 mono">${dimText} | <strong class="text-blue-300">${it.qty} шт</strong></div>`;
            });
        }
    }
    return out;
}

// ==========================================
// СОЗДАНИЕ И РЕДАКТИРОВАНИЕ ПРОЕКТОВ
// ==========================================
function openProjectModal(editId = null) {
    document.getElementById('modalProjId').value = editId || '';
    document.getElementById('projectModalHeader').textContent = editId ? 'Редактировать проект' : 'Создать проект';

    const groupSel = document.getElementById('modalProjGroup');
    groupSel.innerHTML = appState.groups.map(g => `<option value="${g}">${g}</option>`).join('');

    if (editId) {
        const p = appState.projects.find(x => x.id === editId);
        if (p) {
            document.getElementById('modalProjTitle').value = p.title;
            document.getElementById('modalProjDesc').value = p.description || '';
            document.getElementById('modalProjGroup').value = p.group_name || appState.groups[0];
            document.getElementById('modalProjStatusText').value = p.status_text || 'В работе';
            const fData = getProjectFlangeData(p);
            document.getElementById('modalProjSeamBig').value = fData.seams.lock_pittsburgh;
            document.getElementById('modalProjSeamSmall').value = fData.seams.lock_single;
            document.getElementById('modalProjSeamRound').value = fData.seams.round_seam;
            document.getElementById('modalProjPackQty').value = fData.pack_qty;
        }
    } else {
        document.getElementById('modalProjTitle').value = '';
        document.getElementById('modalProjDesc').value = '';
        document.getElementById('modalProjStatusText').value = 'В работе';
        document.getElementById('modalProjSeamBig').value = 32;
        document.getElementById('modalProjSeamSmall').value = 9;
        document.getElementById('modalProjSeamRound').value = 22;
        document.getElementById('modalProjPackQty').value = 10;
    }
    document.getElementById('projectModal').classList.remove('hidden');
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.add('hidden');
}

async function saveProjectModal() {
    const title = document.getElementById('modalProjTitle').value.trim();
    if (!title) { showToast('Укажите название проекта', 'warning'); return; }
    const editId = document.getElementById('modalProjId').value;
    const desc = document.getElementById('modalProjDesc').value.trim();
    const group = document.getElementById('modalProjGroup').value;
    const statusText = document.getElementById('modalProjStatusText').value;

    const big = Number(document.getElementById('modalProjSeamBig').value) || 32;
    const small = Number(document.getElementById('modalProjSeamSmall').value) || 9;
    const round = Number(document.getElementById('modalProjSeamRound').value) || 22;
    const packQty = Number(document.getElementById('modalProjPackQty').value) || 10;

    if (editId) {
        const p = appState.projects.find(x => x.id === Number(editId));
        const currentData = getProjectFlangeData(p);
        currentData.seams = { lock_pittsburgh: big, lock_single: small, round_seam: round };
        currentData.pack_qty = packQty;

        await supabaseClient.from('projects').update({
            title, description: desc, group_name: group, status_text: statusText, flange_scraps: currentData, updated_at: new Date().toISOString()
        }).eq('id', Number(editId));

        if (p) {
            p.title = title;
            p.description = desc;
            p.group_name = group;
            p.status_text = statusText;
            p.flange_scraps = currentData;
        }
        showToast('Проект успешно обновлен!', 'success');
    } else {
        const newFlangeData = {
            scraps: [],
            seams: { lock_pittsburgh: big, lock_single: small, round_seam: round },
            pack_qty: packQty
        };
        const { data: newP } = await supabaseClient.from('projects').insert({
            title, description: desc, group_name: group, status_text: statusText, archive_state: 'active', flange_scraps: newFlangeData
        }).select().single();

        if (newP) {
            appState.projects.unshift(newP);
            session.clickedProjectId = newP.id;
            await loadProjectDetails(newP.id);
            showToast(`Проект "${title}" создан!`, 'success');
        }
    }

    closeProjectModal();
    renderMainMenuProjects();
}

async function archiveProjectSafe(id) {
    const p = appState.projects.find(x => x.id === id);
    if (!p) return;

    if (p.archive_state !== 'archived') {
        await loadProjectDetails(id);
        const fin = calculateProjectFinances(id);
        if (fin.debt > 0) {
            const confirmArch = confirm(`Внимание: по объекту "${p.title}" есть непогашенная задолженность: ${fin.debt.toLocaleString()} ₸!\n\nВы действительно хотите отправить его в архив с долгом?`);
            if (!confirmArch) return;
        }
        p.archive_state = 'archived';
        showToast(`Проект "${p.title}" перемещен в архив`, 'info');
    } else {
        p.archive_state = 'active';
        showToast(`Проект "${p.title}" восстановлен из архива`, 'success');
    }

    await supabaseClient.from('projects').update({ archive_state: p.archive_state }).eq('id', id);
    renderMainMenuProjects();
}

async function deleteProjectPermanent(id) {
    if (!confirm('Удалить проект навсегда из базы? Все расчеты и история будут стерты.')) return;
    await supabaseClient.from('projects').delete().eq('id', id);
    appState.projects = appState.projects.filter(x => x.id !== id);
    appState.allItems = appState.allItems.filter(x => x.project_id !== id);
    appState.allPayments = appState.allPayments.filter(x => x.project_id !== id);
    session.clickedProjectId = null;
    showToast('Проект удален из базы', 'error');
    renderMainMenuProjects();
}

// ==========================================
// ВНУТРИ ПРОЕКТА И СВОДКА
// ==========================================
async function openInsideProject(id) {
    session.insideProjectId = id;
    session.selectedSpecIds = [];

    const p = appState.projects.find(x => x.id === id);
    const titleHeader = document.getElementById('activeProjTitleHeader');
    if (titleHeader) titleHeader.textContent = p ? p.title : 'Проект';

    const statusBadge = document.getElementById('activeProjStatusBadge');
    if (statusBadge) {
        statusBadge.textContent = p ? (p.status_text || 'В работе') : 'В работе';
    }

    const cutBadge = document.getElementById('activeProjCutBadge');
    if (cutBadge) cutBadge.classList.toggle('hidden', p?.status_text !== 'Воздуховоды отрезаны');

    await loadProjectDetails(id);
    updateProjectSeamsUI(p);
    populateFormDropdowns();
    selectCategory('duct');
    selectShape('rect');
    renderProjectInside();

    if (typeof navigateTo === 'function') {
        navigateTo(SCREENS.PROJECT_DETAIL);
    }
}

function switchInnerTab(tab) {
    ['items', 'flange', 'nesting', 'finance'].forEach(t => {
        const view = document.getElementById('view-' + t);
        const btn = document.getElementById('inTab-' + t);
        if (view) view.classList.toggle('hidden', t !== tab);
        if (btn) {
            btn.className = t === tab 
                ? "px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-black whitespace-nowrap shadow-sm transition" 
                : "px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-zinc-400 hover:text-white whitespace-nowrap transition";
        }
    });

    if (tab === 'flange') renderProjectFlange();
    if (tab === 'nesting') renderProjectNesting();
    if (tab === 'finance') renderProjectFinance();
}

function renderProjectInside() {
    renderSummarySection();
    renderSpecification();
}

function toggleSummaryAccordion() {
    const body = document.getElementById('summaryBody');
    const arrow = document.getElementById('summaryArrow');
    if (!body) return;
    const isHidden = body.classList.contains('hidden');
    body.classList.toggle('hidden', !isHidden);
    if (arrow) arrow.textContent = isHidden ? '▼' : '▶';
}

function renderSummarySection() {
    const ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    const fittings = appState.activeProjectItems.filter(i => i.category === 'fitting');

    const totalQty = appState.activeProjectItems.reduce((s, i) => s + (Number(i.qty) || 1), 0);
    const doneQty = appState.activeProjectItems.filter(i => i.item_status === 'done').reduce((s, i) => s + (Number(i.qty) || 1), 0);
    const pct = totalQty > 0 ? Math.round((doneQty / totalQty) * 100) : 0;

    const p = appState.projects.find(x => x.id === session.insideProjectId);
    const seams = getProjectSeams(p);

    let totalDuctArea = 0;
    ducts.forEach(it => {
        const unfold = it.shape === 'rect' 
            ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
            : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
        totalDuctArea += (unfold * Number(it.l || 1250) * (Number(it.qty) || 1)) / 1e6;
    });

    const sumDucts = document.getElementById('sumTotalDucts');
    if (sumDucts) sumDucts.textContent = ducts.reduce((s, i) => s + i.qty, 0) + ' шт';
    const sumFittings = document.getElementById('sumTotalFittings');
    if (sumFittings) sumFittings.textContent = fittings.reduce((s, i) => s + i.qty, 0) + ' шт';

    const quickSummary = document.getElementById('activeProjQuickSummary');
    if (quickSummary) {
        quickSummary.textContent = `${totalQty} изд. • ${totalDuctArea.toFixed(1)} м² • Готово: ${pct}%`;
    }

    const dBox = document.getElementById('summaryDuctsBox');
    if (dBox) {
        let dHtml = '<div class="font-bold text-blue-400 uppercase tracking-wider text-[11px] mb-1">1. Воздуховоды</div>';

        const dRect = ducts.filter(i => i.shape === 'rect');
        if (dRect.length) {
            dHtml += '<div class="text-[11px] font-bold text-slate-300 mt-1">Прямоугольные воздуховоды:</div>';
            const grouped = groupSummaryDucts(dRect);
            for (let [m, d] of Object.entries(grouped)) {
                dHtml += `<div class="pl-2 text-slate-400 mono">${m} | Кол-во: <strong class="text-white">${d.qty} шт</strong> | Площадь: <strong class="text-blue-300">${d.area.toFixed(2)} м²</strong></div>`;
            }
        }

        const dRound = ducts.filter(i => i.shape === 'round');
        if (dRound.length) {
            dHtml += '<div class="text-[11px] font-bold text-slate-300 mt-2">Круглые воздуховоды:</div>';
            const grouped = groupSummaryDucts(dRound);
            for (let [m, d] of Object.entries(grouped)) {
                dHtml += `<div class="pl-2 text-slate-400 mono">${m} | Кол-во: <strong class="text-white">${d.qty} шт</strong> | Площадь: <strong class="text-blue-300">${d.area.toFixed(2)} м²</strong></div>`;
            }
        }
        if (!dRect.length && !dRound.length) dHtml += '<div class="text-slate-500">Нет воздуховодов</div>';
        dBox.innerHTML = dHtml;
    }

    const fBox = document.getElementById('summaryFittingsBox');
    if (fBox) {
        let fHtml = '<div class="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-1">2. Изделия (Фасонина)</div>';

        const fRect = fittings.filter(i => i.shape === 'rect');
        if (fRect.length) {
            fHtml += '<div class="text-[11px] font-bold text-slate-300 mt-1">Прямоугольные изделия:</div>';
            const grouped = groupSummaryFittings(fRect);
            for (let [m, q] of Object.entries(grouped)) {
                fHtml += `<div class="pl-2 text-slate-400 mono">${m} | Кол-во: <strong class="text-white">${q} шт</strong></div>`;
            }
        }

        const fRound = fittings.filter(i => i.shape === 'round');
        if (fRound.length) {
            fHtml += '<div class="text-[11px] font-bold text-slate-300 mt-2">Круглые изделия:</div>';
            const grouped = groupSummaryFittings(fRound);
            for (let [m, q] of Object.entries(grouped)) {
                fHtml += `<div class="pl-2 text-slate-400 mono">${m} | Кол-во: <strong class="text-white">${q} шт</strong></div>`;
            }
        }

        const fSmooth = fittings.filter(i => i.shape === 'smooth');
        if (fSmooth.length) {
            fHtml += '<div class="text-[11px] font-bold text-slate-300 mt-2">Плавные изделия:</div>';
            const grouped = groupSummaryFittings(fSmooth);
            for (let [m, q] of Object.entries(grouped)) {
                fHtml += `<div class="pl-2 text-slate-400 mono">${m} | Кол-во: <strong class="text-white">${q} шт</strong></div>`;
            }
        }
        if (!fRect.length && !fRound.length && !fSmooth.length) fHtml += '<div class="text-slate-500">Нет фасонных изделий</div>';
        fBox.innerHTML = fHtml;
    }
}

function groupSummaryDucts(arr) {
    const res = {};
    arr.forEach(it => {
        const k = `${it.metal} ${it.thickness} мм`;
        if (!res[k]) res[k] = { qty: 0, area: 0 };
        res[k].qty += it.qty;
        const unfold = it.shape === 'rect' ? (2 * (it.w + it.h) + 41) : Math.round(Math.PI * it.d + 22);
        res[k].area += (unfold * (it.l || 1250) * it.qty) / 1e6;
    });
    return res;
}

function groupSummaryFittings(arr) {
    const res = {};
    arr.forEach(it => {
        const k = `${it.metal} ${it.thickness} мм`;
        res[k] = (res[k] || 0) + it.qty;
    });
    return res;
}
