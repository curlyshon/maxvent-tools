// ==========================================
// MODULE: projects.js
// Главное меню объектов, создание/редактирование проектов,
// очереди/дозаказы (subprojects), статусы, свайпы и карточки
// ==========================================

// ==========================================
// НАВИГАЦИЯ И ФИЛЬТРЫ ПРОЕКТОВ
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
    const btnActive = document.getElementById('btnProjActive');
    const btnArchived = document.getElementById('btnProjArchived');
    if (btnActive) {
        btnActive.className = f === 'active' 
            ? 'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-black transition btn-press shadow-sm' 
            : 'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition btn-press';
    }
    if (btnArchived) {
        btnArchived.className = f === 'archived' 
            ? 'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-black transition btn-press shadow-sm' 
            : 'flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition btn-press';
    }
    renderMainMenuProjects();
}

// 3 Статуса проектов и их свойства
const PROJECT_STATUSES = {
    not_started: { label: '⚪ Не начат', text: 'Не начат', cls: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400' },
    in_progress: { label: '🟠 В работе', text: 'В работе', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
    done: { label: '🟢 Готово', text: 'Готово', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' }
};

function getProjectStatusKey(statusText) {
    if (!statusText) return 'in_progress';
    const s = statusText.toLowerCase();
    if (s.includes('готов') || s.includes('сдан') || s.includes('отгружен')) return 'done';
    if (s.includes('не начат') || s.includes('ожидает') || s.includes('пауза')) return 'not_started';
    return 'in_progress';
}

async function cycleProjectStatus(id, e) {
    if (e) e.stopPropagation();
    triggerHaptic('medium');
    const p = appState.projects.find(x => x.id === id);
    if (!p) return;

    const curKey = getProjectStatusKey(p.status_text);
    let nextText = 'В работе';
    if (curKey === 'not_started') nextText = 'В работе';
    else if (curKey === 'in_progress') nextText = 'Готово';
    else nextText = 'Не начат';

    p.status_text = nextText;
    await supabaseClient.from('projects').update({ status_text: nextText, updated_at: new Date().toISOString() }).eq('id', id);

    showToast(`Статус "${p.title}": ${nextText}`, 'info');
    renderMainMenuProjects();
    updateHeaderUI();
}

// ==========================================
// РЕНДЕР КАРТОЧЕК ПРОЕКТОВ СО СВАЙПАМИ
// ==========================================
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

    const badge = document.getElementById('projectsBadgeCount');
    if (badge) badge.textContent = list.length;

    const container = document.getElementById('projectsButtonsContainer');
    const preview = document.getElementById('projectPreviewCard');
    if (!container) return;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `
            <div class="bg-[#121217] border border-white/5 rounded-3xl p-8 text-xs text-zinc-500 text-center space-y-2">
                <span class="text-2xl block">📁</span>
                <p>${session.projectFilter === 'archived' ? 'В архиве нет проектов' : 'Активных проектов не найдено'}</p>
                ${session.projectFilter === 'active' ? `<button onclick="openProjectModal()" class="mt-2 text-xs bg-white text-black font-extrabold px-4 py-2 rounded-xl btn-press">+ Создать проект</button>` : ''}
            </div>
        `;
        if (preview) preview.classList.add('hidden');
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

        const statusKey = getProjectStatusKey(p.status_text);
        const stDef = PROJECT_STATUSES[statusKey] || PROJECT_STATUSES.in_progress;
        const phases = (p.flange_scraps?.phases || []);
        const phasesCount = phases.length > 0 ? (phases.length + 1) : 1;

        const cardWrap = document.createElement('div');
        cardWrap.className = 'project-swipe-card relative overflow-hidden rounded-3xl select-none group';
        cardWrap.dataset.projectId = p.id;

        cardWrap.innerHTML = `
            <!-- Фоновый индикатор свайпа вправо (Смена статуса) -->
            <div class="swipe-hint-status absolute inset-y-0 left-0 w-36 bg-emerald-600/30 border border-emerald-500/40 rounded-3xl flex items-center px-4 gap-2 text-emerald-300 font-extrabold text-xs opacity-0 transition-opacity pointer-events-none z-0">
                <span class="text-base">✓</span>
                <span>Статус</span>
            </div>

            <!-- Фоновый индикатор свайпа влево (Действия) -->
            <div class="swipe-hint-actions absolute inset-y-0 right-0 w-44 bg-[#18181f] border border-white/10 rounded-3xl flex items-center justify-end px-3 gap-2 opacity-0 transition-opacity z-0">
                <button type="button" onclick="triggerHaptic('light'); openProjectModal(${p.id})" title="Редактировать" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold btn-press">✎</button>
                <button type="button" onclick="triggerHaptic('medium'); archiveProjectSafe(${p.id})" title="${p.archive_state === 'archived' ? 'Восстановить' : 'В архив'}" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-bold btn-press">${p.archive_state === 'archived' ? '↩' : '📁'}</button>
                ${p.archive_state === 'archived' && isDev() ? `<button type="button" onclick="triggerHaptic('warning'); deleteProjectPermanent(${p.id})" title="Удалить" class="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold btn-press">🗑</button>` : ''}
            </div>

            <!-- Основное тело карточки -->
            <div class="swipe-inner relative z-10 w-full text-left p-4 sm:p-5 rounded-3xl border transition-all duration-200 shadow-sm space-y-3 cursor-pointer ${
                isSelected 
                    ? 'bg-[#18181f] border-white/30 shadow-lg' 
                    : 'bg-[#121217] border-white/5 hover:border-white/20 hover:bg-[#18181f]'
            }">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h3 class="font-extrabold text-sm sm:text-base text-white truncate">${p.title}</h3>
                            <button type="button" onclick="cycleProjectStatus(${p.id}, event)" title="Нажмите, чтобы переключить статус" class="text-[10px] px-2.5 py-0.5 rounded-full font-bold border transition btn-press ${stDef.cls}">
                                ${p.status_text || stDef.label}
                            </button>
                            ${phasesCount > 1 ? `<span class="text-[10px] bg-white/10 text-zinc-300 font-bold px-2 py-0.5 rounded-full">⚡ ${phasesCount} очер.</span>` : ''}
                        </div>
                        <div class="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                            <span>🔧 ${p.group_name || 'Без бригады'}</span>
                            ${p.description ? `<span>• <span class="truncate max-w-[150px] inline-block align-bottom text-zinc-500">${p.description}</span></span>` : ''}
                        </div>
                    </div>
                    <button type="button" onclick="openInsideProject(${p.id})" class="btn-direct-open bg-white hover:bg-zinc-200 text-black text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm btn-press">
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
            </div>
        `;

        cardWrap.onclick = async (e) => {
            if (e.target.closest('.btn-direct-open') || e.target.closest('button')) return;
            session.clickedProjectId = (session.clickedProjectId === p.id) ? null : p.id;
            if (session.clickedProjectId) {
                await loadProjectDetails(p.id);
            }
            renderMainMenuProjects();
        };

        container.appendChild(cardWrap);
    });

    attachProjectSwipeHandlers();

    if (!session.clickedProjectId) {
        if (preview) preview.classList.add('hidden');
    } else {
        renderProjectPreviewCard(session.clickedProjectId);
    }
}

// Свайп-жесты для карточек проектов
function attachProjectSwipeHandlers() {
    const cards = document.querySelectorAll('.project-swipe-card');
    cards.forEach(card => {
        if (card.dataset.hasSwipeListener) return;
        card.dataset.hasSwipeListener = 'true';

        let startX = 0, startY = 0, currentX = 0;
        let isSwiping = false, isDecided = false;
        const row = card.querySelector('.swipe-inner');
        const projId = Number(card.dataset.projectId);
        const hintStatus = card.querySelector('.swipe-hint-status');
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
                if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
                    isDecided = true;
                    isSwiping = false;
                    return;
                }
                if (Math.abs(dx) > 10) {
                    isDecided = true;
                    isSwiping = true;
                }
            }

            if (!isSwiping || !row) return;

            currentX = dx;
            const damp = 0.5;
            const tx = dx * damp;
            row.style.transform = `translateX(${tx}px)`;

            if (dx > 30) {
                if (hintStatus) hintStatus.style.opacity = Math.min(1, (dx - 30) / 40);
                if (hintActions) hintActions.style.opacity = 0;
            } else if (dx < -30) {
                if (hintActions) hintActions.style.opacity = Math.min(1, (-dx - 30) / 40);
                if (hintStatus) hintStatus.style.opacity = 0;
            } else {
                if (hintStatus) hintStatus.style.opacity = 0;
                if (hintActions) hintActions.style.opacity = 0;
            }
        }, { passive: true });

        card.addEventListener('touchend', () => {
            if (!isSwiping || !row) return;
            row.style.transition = 'transform 0.25s var(--ios-spring)';

            if (currentX > 80) {
                // Свайп вправо: переключить статус проекта
                cycleProjectStatus(projId);
            } else if (currentX < -80) {
                // Свайп влево: приоткрыть быстрые действия
                row.style.transform = 'translateX(-120px)';
                setTimeout(() => {
                    if (row) row.style.transform = 'translateX(0px)';
                }, 3000);
            } else {
                row.style.transform = 'translateX(0px)';
            }

            if (hintStatus) hintStatus.style.opacity = 0;
            if (hintActions) hintActions.style.opacity = 0;
            isSwiping = false;
        }, { passive: true });
    });
}

// Превью карточка
function renderProjectPreviewCard(projId) {
    const preview = document.getElementById('projectPreviewCard');
    const p = appState.projects.find(x => x.id === projId);
    if (!preview) return;
    if (!p) { preview.classList.add('hidden'); return; }
    preview.classList.remove('hidden');

    const ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    const fittings = appState.activeProjectItems.filter(i => i.category === 'fitting');
    const totalDuctQty = ducts.reduce((s, i) => s + i.qty, 0);
    const totalFitQty = fittings.reduce((s, i) => s + i.qty, 0);

    let treeHtml = '';
    const dRect = ducts.filter(i => i.shape === 'rect');
    if (dRect.length) treeHtml += `<div class="font-bold text-zinc-300 mt-2">Воздуховоды прямоугольные</div>` + formatPreviewItems(dRect, false);

    const dRound = ducts.filter(i => i.shape === 'round');
    if (dRound.length) treeHtml += `<div class="font-bold text-emerald-400 mt-2">Воздуховоды круглые</div>` + formatPreviewItems(dRound, false);

    const fRect = fittings.filter(i => i.shape === 'rect');
    if (fRect.length) treeHtml += `<div class="font-bold text-amber-400 mt-2">Изделия прямоугольные</div>` + formatPreviewItems(fRect, true);

    const fRound = fittings.filter(i => i.shape === 'round');
    if (fRound.length) treeHtml += `<div class="font-bold text-purple-400 mt-2">Изделия круглые</div>` + formatPreviewItems(fRound, true);

    const fSmooth = fittings.filter(i => i.shape === 'smooth');
    if (fSmooth.length) treeHtml += `<div class="font-bold text-cyan-400 mt-2">Изделия плавные</div>` + formatPreviewItems(fSmooth, true);

    const stDef = PROJECT_STATUSES[getProjectStatusKey(p.status_text)] || PROJECT_STATUSES.in_progress;

    preview.innerHTML = `
        <div class="flex flex-wrap justify-between items-start gap-2 border-b border-white/10 pb-3">
            <div>
                <h3 class="text-base font-black text-white">${p.title}</h3>
                <p class="text-xs text-zinc-400 mt-0.5">${p.description || 'Описание не указано'}</p>
            </div>
            <div class="text-right">
                <span class="text-xs px-2.5 py-1 rounded-full font-bold border ${stDef.cls}">${p.status_text || stDef.label}</span>
                <div class="text-[11px] text-zinc-400 mt-1">${p.group_name || 'Без бригады'}</div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-[#18181f] p-3 rounded-2xl border border-white/5">
                <span class="text-zinc-400">Воздуховоды:</span> <strong class="text-white mono">${totalDuctQty} шт</strong>
            </div>
            <div class="bg-[#18181f] p-3 rounded-2xl border border-white/5">
                <span class="text-zinc-400">Изделия:</span> <strong class="text-white mono">${totalFitQty} шт</strong>
            </div>
        </div>

        <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1 bg-[#18181f] p-3.5 rounded-2xl border border-white/5 text-xs">
            <div class="text-[11px] uppercase tracking-wider font-bold text-zinc-400 mb-1">Состав проекта:</div>
            ${treeHtml || '<div class="text-zinc-500">В проекте пока нет позиций</div>'}
        </div>

        <div class="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <button onclick="openInsideProject(${p.id})" class="flex-1 bg-white hover:bg-zinc-200 text-black font-extrabold py-3 px-3 rounded-xl text-xs uppercase tracking-wider transition text-center shadow-sm btn-press">
                Открыть проект
            </button>
            <button onclick="openProjectModal(${p.id})" class="bg-white/5 hover:bg-white/10 text-zinc-200 py-3 px-3.5 rounded-xl text-xs font-semibold border border-white/5 btn-press">
                ✎ Изменить
            </button>
            <button onclick="archiveProjectSafe(${p.id})" class="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white py-3 px-3.5 rounded-xl text-xs border border-white/5 btn-press">
                ${p.archive_state === 'archived' ? 'Восстановить' : 'В архив'}
            </button>
            ${isDev() && p.archive_state === 'archived' ? `<button onclick="deleteProjectPermanent(${p.id})" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 px-3.5 rounded-xl text-xs font-semibold btn-press">Удалить</button>` : ''}
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
        if (isFitting) out += `<div class="text-[11px] font-semibold text-zinc-300 mt-1 pl-1">${subName}</div>`;
        for (let [mKey, arr] of Object.entries(metals)) {
            out += `<div class="text-[10px] font-bold text-zinc-400 pl-2 mt-0.5">${mKey}</div>`;
            arr.forEach(it => {
                let dimText = '';
                if (it.shape === 'rect') dimText = `${it.w}×${it.h} | L=${it.l || 1250}`;
                else if (it.shape === 'round') dimText = `Ø${it.d} | L=${it.l || 1250}`;
                else dimText = `${it.w1 || it.w}×${it.h1 || it.h} → Ø${it.d}${it.l ? ` | L=${it.l}` : ''}`;
                out += `<div class="pl-4 text-[11px] text-zinc-200 mono">${dimText} | <strong class="text-zinc-200">${it.qty} шт</strong></div>`;
            });
        }
    }
    return out;
}

// ==========================================
// СОЗДАНИЕ И РЕДАКТИРОВАНИЕ ПРОЕКТОВ
// ==========================================
function openProjectModal(editId = null) {
    triggerHaptic('light');
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
    triggerHaptic('light');
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
            pack_qty: packQty,
            phases: []
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
    updateHeaderUI();
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

    await supabaseClient.from('projects').update({ archive_state: p.archive_state, updated_at: new Date().toISOString() }).eq('id', id);
    renderMainMenuProjects();
    updateHeaderUI();
}

async function deleteProjectPermanent(id) {
    if (!confirm('Удалить проект навсегда из базы? Все позиции и история будут стерты без возможности восстановления.')) return;
    await supabaseClient.from('projects').delete().eq('id', id);
    await supabaseClient.from('items').delete().eq('project_id', id);
    await supabaseClient.from('nestings').delete().eq('project_id', id);

    appState.projects = appState.projects.filter(x => x.id !== id);
    appState.allItems = appState.allItems.filter(x => x.project_id !== id);
    appState.allPayments = appState.allPayments.filter(x => x.project_id !== id);
    session.clickedProjectId = null;
    showToast('Проект удален из базы', 'error');
    renderMainMenuProjects();
    updateHeaderUI();
}

// ==========================================
// ПОДПРОЕКТЫ / ДОЗАКАЗЫ / ОЧЕРЕДИ (PHASES)
// ==========================================
function openSubprojectModal() {
    triggerHaptic('light');
    const input = document.getElementById('subprojectTitleInput');
    if (input) input.value = '';
    const modal = document.getElementById('subprojectModal');
    if (modal) modal.classList.remove('hidden');
    setTimeout(() => input?.focus(), 80);
}

function closeSubprojectModal() {
    triggerHaptic('light');
    const modal = document.getElementById('subprojectModal');
    if (modal) modal.classList.add('hidden');
}

async function saveSubprojectModal() {
    const input = document.getElementById('subprojectTitleInput');
    const title = (input?.value || '').trim();
    if (!title) {
        showToast('Укажите название дозаказа / очереди', 'warning');
        return;
    }

    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;

    const data = getProjectFlangeData(p);
    if (!Array.isArray(data.phases)) data.phases = [];

    const newPhase = {
        id: 'phase_' + Date.now(),
        name: title,
        created_at: new Date().toISOString()
    };

    data.phases.push(newPhase);
    await saveProjectFlangeData(p, data);

    session.activePhaseId = newPhase.id;
    closeSubprojectModal();
    showToast(`Очередь "${title}" добавлена`, 'success');
    renderProjectPhases();
    renderProjectInside();
}

async function deleteSubproject(phaseId) {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;

    const data = getProjectFlangeData(p);
    const ph = (data.phases || []).find(x => x.id === phaseId);
    if (!ph) return;

    const phaseItemsCount = appState.activeProjectItems.filter(i => (i.phase_id || i.dimensions?.phase_id) === phaseId).length;
    const msg = phaseItemsCount > 0 
        ? `В очереди "${ph.name}" есть ${phaseItemsCount} позиций. Переместить их в «Основной заказ» и удалить очередь?`
        : `Удалить очередь "${ph.name}"?`;

    if (!confirm(msg)) return;

    data.phases = data.phases.filter(x => x.id !== phaseId);
    await saveProjectFlangeData(p, data);

    // Перемещаем позиции удаленной очереди в 'main'
    for (const it of appState.activeProjectItems) {
        if ((it.phase_id || it.dimensions?.phase_id) === phaseId) {
            it.phase_id = 'main';
            if (!it.dimensions) it.dimensions = {};
            it.dimensions.phase_id = 'main';
            await supabaseClient.from('items').update({ dimensions: it.dimensions }).eq('id', it.id);
        }
    }

    session.activePhaseId = 'all';
    showToast(`Очередь "${ph.name}" удалена`, 'info');
    renderProjectPhases();
    renderProjectInside();
}

function renderProjectPhases() {
    const container = document.getElementById('projectPhasesContainer');
    if (!container) return;

    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) { container.innerHTML = ''; return; }

    const data = getProjectFlangeData(p);
    const phases = data.phases || [];
    const activePh = session.activePhaseId || 'all';

    const allItems = appState.activeProjectItems;
    const totalQty = allItems.reduce((s, i) => s + (Number(i.qty) || 1), 0);
    const mainQty = allItems.filter(i => (!i.phase_id || i.phase_id === 'main' || i.dimensions?.phase_id === 'main')).reduce((s, i) => s + (Number(i.qty) || 1), 0);

    let html = `
        <button type="button" onclick="selectPhase('all')" class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition btn-press ${
            activePh === 'all' 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
        }">
            Все очереди (${totalQty})
        </button>

        <button type="button" onclick="selectPhase('main')" class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition btn-press ${
            activePh === 'main' 
                ? 'bg-white text-black shadow-sm' 
                : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
        }">
            Основной заказ (${mainQty})
        </button>
    `;

    phases.forEach(ph => {
        const phQty = allItems.filter(i => (i.phase_id || i.dimensions?.phase_id) === ph.id).reduce((s, i) => s + (Number(i.qty) || 1), 0);
        const isSel = (activePh === ph.id);
        html += `
            <div class="inline-flex items-center rounded-xl overflow-hidden border ${isSel ? 'bg-white text-black border-white shadow-sm' : 'bg-white/5 text-zinc-400 border-white/5'}">
                <button type="button" onclick="selectPhase('${ph.id}')" class="px-3 py-1.5 font-bold whitespace-nowrap transition btn-press">
                    ${ph.name} (${phQty})
                </button>
                <button type="button" onclick="deleteSubproject('${ph.id}')" title="Удалить очередь" class="px-2 py-1.5 text-xs font-bold ${isSel ? 'text-black/60 hover:text-rose-600' : 'text-zinc-500 hover:text-rose-400'} transition btn-press">
                    ✕
                </button>
            </div>
        `;
    });

    html += `
        <button type="button" onclick="openSubprojectModal()" class="px-3 py-1.5 rounded-xl font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 whitespace-nowrap transition btn-press flex items-center gap-1">
            <span>＋ Дозаказ</span>
        </button>
    `;

    container.innerHTML = html;
}

function selectPhase(phaseId) {
    triggerHaptic('light');
    session.activePhaseId = phaseId;
    renderProjectPhases();
    renderProjectInside();
}

// ==========================================
// ВНУТРИ ПРОЕКТА И СВОДКА
// ==========================================
async function openInsideProject(id) {
    session.insideProjectId = id;
    session.activePhaseId = 'all';
    session.specSelectionMode = false;
    session.selectedSpecIds = [];

    const p = appState.projects.find(x => x.id === id);
    const titleHeader = document.getElementById('activeProjTitleHeader');
    if (titleHeader) titleHeader.textContent = p ? p.title : 'Проект';

    const statusBadge = document.getElementById('activeProjStatusBadge');
    if (statusBadge && p) {
        const stDef = PROJECT_STATUSES[getProjectStatusKey(p.status_text)] || PROJECT_STATUSES.in_progress;
        statusBadge.textContent = p.status_text || stDef.label;
        statusBadge.className = `text-[10px] px-2 py-0.5 rounded-lg font-bold border transition ${stDef.cls}`;
        statusBadge.onclick = (e) => cycleProjectStatus(p.id, e);
    }

    const cutBadge = document.getElementById('activeProjCutBadge');
    if (cutBadge) cutBadge.classList.toggle('hidden', p?.status_text !== 'Воздуховоды отрезаны');

    await loadProjectDetails(id);
    updateProjectSeamsUI(p);
    populateFormDropdowns();
    selectCategory('duct');
    selectShape('rect');
    renderProjectPhases();
    renderProjectInside();

    if (typeof navigateTo === 'function') {
        navigateTo(SCREENS.PROJECT_DETAIL, { projectId: id });
    }
}

function renderProjectInside() {
    renderProjectPhases();
    renderSummarySection();
    renderSpecification();
}

function toggleSummaryAccordion() {
    triggerHaptic('light');
    const body = document.getElementById('summaryBody');
    const arrow = document.getElementById('summaryArrow');
    if (!body) return;
    const isHidden = body.classList.contains('hidden');
    body.classList.toggle('hidden', !isHidden);
    if (arrow) arrow.textContent = isHidden ? '▼' : '▶';
}

function renderSummarySection() {
    let items = appState.activeProjectItems;
    if (session.activePhaseId && session.activePhaseId !== 'all') {
        items = items.filter(i => (i.phase_id || i.dimensions?.phase_id || 'main') === session.activePhaseId);
    }

    const ducts = items.filter(i => i.category === 'duct');
    const fittings = items.filter(i => i.category === 'fitting');

    const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 1), 0);
    const doneQty = items.filter(i => i.item_status === 'done').reduce((s, i) => s + (Number(i.qty) || 1), 0);
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

    const quickSummary = document.getElementById('activeProjQuickSummary');
    if (quickSummary) {
        quickSummary.textContent = `${totalQty} изд. • ${totalDuctArea.toFixed(1)} м² • Готово: ${pct}%`;
    }

    const dBox = document.getElementById('summaryDuctsBox');
    if (dBox) {
        let dHtml = '<div class="font-bold text-zinc-300 uppercase tracking-wider text-[11px] mb-1">1. Воздуховоды</div>';
        const dRect = ducts.filter(i => i.shape === 'rect');
        if (dRect.length) {
            dHtml += '<div class="text-[11px] font-bold text-zinc-300 mt-1">Прямоугольные:</div>';
            const grouped = groupSummaryDucts(dRect);
            for (let [m, d] of Object.entries(grouped)) {
                dHtml += `<div class="pl-2 text-zinc-400 mono text-xs">${m} | <strong>${d.qty} шт</strong> | <strong class="text-zinc-200">${d.area.toFixed(2)} м²</strong></div>`;
            }
        }
        const dRound = ducts.filter(i => i.shape === 'round');
        if (dRound.length) {
            dHtml += '<div class="text-[11px] font-bold text-zinc-300 mt-2">Круглые:</div>';
            const grouped = groupSummaryDucts(dRound);
            for (let [m, d] of Object.entries(grouped)) {
                dHtml += `<div class="pl-2 text-zinc-400 mono text-xs">${m} | <strong>${d.qty} шт</strong> | <strong class="text-zinc-200">${d.area.toFixed(2)} м²</strong></div>`;
            }
        }
        if (!dRect.length && !dRound.length) dHtml += '<div class="text-zinc-500">Нет воздуховодов</div>';
        dBox.innerHTML = dHtml;
    }

    const fBox = document.getElementById('summaryFittingsBox');
    if (fBox) {
        let fHtml = '<div class="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-1">2. Фасонные изделия</div>';
        const fRect = fittings.filter(i => i.shape === 'rect');
        if (fRect.length) {
            fHtml += '<div class="text-[11px] font-bold text-zinc-300 mt-1">Прямоугольные:</div>';
            const grouped = groupSummaryFittings(fRect);
            for (let [m, q] of Object.entries(grouped)) {
                fHtml += `<div class="pl-2 text-zinc-400 mono text-xs">${m} | <strong class="text-white">${q} шт</strong></div>`;
            }
        }
        const fRound = fittings.filter(i => i.shape === 'round');
        if (fRound.length) {
            fHtml += '<div class="text-[11px] font-bold text-zinc-300 mt-2">Круглые:</div>';
            const grouped = groupSummaryFittings(fRound);
            for (let [m, q] of Object.entries(grouped)) {
                fHtml += `<div class="pl-2 text-zinc-400 mono text-xs">${m} | <strong class="text-white">${q} шт</strong></div>`;
            }
        }
        const fSmooth = fittings.filter(i => i.shape === 'smooth');
        if (fSmooth.length) {
            fHtml += '<div class="text-[11px] font-bold text-zinc-300 mt-2">Плавные:</div>';
            const grouped = groupSummaryFittings(fSmooth);
            for (let [m, q] of Object.entries(grouped)) {
                fHtml += `<div class="pl-2 text-zinc-400 mono text-xs">${m} | <strong class="text-white">${q} шт</strong></div>`;
            }
        }
        if (!fRect.length && !fRound.length && !fSmooth.length) fHtml += '<div class="text-zinc-500">Нет фасонных изделий</div>';
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
