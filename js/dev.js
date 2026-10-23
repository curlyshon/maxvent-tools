// ==========================================
// MODULE: dev.js
// Админ-меню руководителя, конструктор изделий, справочники с изменением очередности,
// заметки цеха, ежемесячный экспорт и безопасный песочница-просмотрщик архивов
// ==========================================

function renderDevDashboard() {
    renderDevCatalogs();
    renderCustomFitParamsCheckboxes();
    renderDevFittingsList();
    renderDevUsersStats();
    loadShopNotesUI();
    if (typeof renderGlobalFinanceReport === 'function') {
        renderGlobalFinanceReport();
    }
}

// ==========================================
// СПРАВОЧНИКИ ЦЕХА С ИЗМЕНЕНИЕМ ОЧЕРЕДНОСТИ
// ==========================================
function renderDevCatalogs() {
    const mBox = document.getElementById('devMetalsList');
    if (mBox) {
        mBox.innerHTML = appState.metals.map((m, i) => `
            <div class="bg-[#18181f] border border-white/10 px-3 py-1.5 rounded-xl text-white flex items-center justify-between text-xs">
                <span class="font-bold truncate">${m}</span>
                <div class="flex items-center gap-1">
                    <button type="button" onclick="moveCatalogItem('metals', ${i}, -1)" ${i === 0 ? 'disabled class="opacity-20 text-zinc-500"' : 'class="text-zinc-300 hover:text-white btn-press"'} title="Вверх">▲</button>
                    <button type="button" onclick="moveCatalogItem('metals', ${i}, 1)" ${i === appState.metals.length - 1 ? 'disabled class="opacity-20 text-zinc-500"' : 'class="text-zinc-300 hover:text-white btn-press"'} title="Вниз">▼</button>
                    <button type="button" onclick="removeCatalogItem('metals', ${i})" class="text-zinc-500 hover:text-rose-400 font-bold ml-1 btn-press">×</button>
                </div>
            </div>
        `).join('');
    }

    const tBox = document.getElementById('devThickList');
    if (tBox) {
        tBox.innerHTML = appState.thicknesses.map((t, i) => `
            <div class="bg-[#18181f] border border-white/10 px-3 py-1.5 rounded-xl text-white flex items-center justify-between text-xs mono">
                <span class="font-bold">${t} мм</span>
                <div class="flex items-center gap-1">
                    <button type="button" onclick="moveCatalogItem('thicknesses', ${i}, -1)" ${i === 0 ? 'disabled class="opacity-20 text-zinc-500"' : 'class="text-zinc-300 hover:text-white btn-press"'} title="Вверх">▲</button>
                    <button type="button" onclick="moveCatalogItem('thicknesses', ${i}, 1)" ${i === appState.thicknesses.length - 1 ? 'disabled class="opacity-20 text-zinc-500"' : 'class="text-zinc-300 hover:text-white btn-press"'} title="Вниз">▼</button>
                    <button type="button" onclick="removeCatalogItem('thicknesses', ${i})" class="text-zinc-500 hover:text-rose-400 font-bold ml-1 btn-press">×</button>
                </div>
            </div>
        `).join('');
    }

    const gBox = document.getElementById('devGroupsList');
    if (gBox) {
        gBox.innerHTML = appState.groups.map((g, i) => `
            <div class="bg-[#18181f] border border-white/10 px-3 py-1.5 rounded-xl text-white flex items-center justify-between text-xs">
                <span class="font-bold truncate">${g}</span>
                <div class="flex items-center gap-1">
                    <button type="button" onclick="moveCatalogItem('groups', ${i}, -1)" ${i === 0 ? 'disabled class="opacity-20 text-zinc-500"' : 'class="text-zinc-300 hover:text-white btn-press"'} title="Вверх">▲</button>
                    <button type="button" onclick="moveCatalogItem('groups', ${i}, 1)" ${i === appState.groups.length - 1 ? 'disabled class="opacity-20 text-zinc-500"' : 'class="text-zinc-300 hover:text-white btn-press"'} title="Вниз">▼</button>
                    <button type="button" onclick="removeCatalogItem('groups', ${i})" class="text-zinc-500 hover:text-rose-400 font-bold ml-1 btn-press">×</button>
                </div>
            </div>
        `).join('');
    }
}

async function moveCatalogItem(type, idx, direction) {
    triggerHaptic('light');
    const arr = appState[type];
    if (!arr) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= arr.length) return;

    const temp = arr[idx];
    arr[idx] = arr[targetIdx];
    arr[targetIdx] = temp;

    await saveGlobalSettings();
    renderDevCatalogs();
    populateFormDropdowns();
    showToast('Порядок обновлен', 'success');
}

async function addCatalogItem(type, inputId) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const val = type === 'thicknesses' ? Number(inp.value) : inp.value.trim();
    if (!val) return;

    if (!appState[type].includes(val)) {
        appState[type].push(val);
        inp.value = '';
        await saveGlobalSettings();
        renderDevCatalogs();
        populateFormDropdowns();
        showToast(`Добавлено в справочник: ${val}`, 'success');
    }
}

async function removeCatalogItem(type, idx) {
    triggerHaptic('warning');
    const val = appState[type][idx];
    if (!confirm(`Удалить "${val}" из справочника?`)) return;

    appState[type].splice(idx, 1);
    await saveGlobalSettings();
    renderDevCatalogs();
    populateFormDropdowns();
    showToast(`Удалено: ${val}`, 'info');
}

// ==========================================
// ЗАМЕТКИ ДЛЯ ЦЕХА (ШПАРГАЛКА РАСХОДНИКОВ)
// ==========================================
function loadShopNotesUI() {
    const textarea = document.getElementById('shopNotesTextarea');
    if (textarea) {
        textarea.value = appState.shopNotes || '';
    }
}

async function saveShopNotes() {
    triggerHaptic('medium');
    const textarea = document.getElementById('shopNotesTextarea');
    if (!textarea) return;

    const notes = textarea.value.trim();
    appState.shopNotes = notes;
    await saveGlobalSettings();
    showToast('Заметки цеха сохранены ✓', 'success');
}

// ==========================================
// РАБОТНИКИ ЦЕХА И ПИН-КОДЫ
// ==========================================
async function createNewWorker() {
    const name = document.getElementById('newWorkerName')?.value.trim();
    const accessCode = document.getElementById('newWorkerCode')?.value.trim();
    const role = document.getElementById('newWorkerRole')?.value || 'worker';

    if (!name || !accessCode) {
        showToast('Укажите имя и пин-код работника', 'warning');
        return;
    }

    const { data: newU, error } = await supabaseClient.from('users').insert({
        name, access_code: accessCode, role
    }).select().single();

    if (error) {
        showToast('Ошибка создания: ' + error.message, 'error');
        return;
    }

    appState.users.push(newU);
    document.getElementById('newWorkerName').value = '';
    document.getElementById('newWorkerCode').value = '';
    renderDevUsersStats();
    showToast(`Работник ${name} создан! Пин: ${accessCode}`, 'success');
}

async function deleteWorker(id) {
    const u = appState.users.find(x => x.id === id);
    if (!confirm(`Удалить работника "${u ? u.name : id}" из системы?`)) return;

    triggerHaptic('warning');
    await supabaseClient.from('users').delete().eq('id', id);
    appState.users = appState.users.filter(x => x.id !== id);
    renderDevUsersStats();
    showToast('Работник удален', 'info');
}

function renderDevUsersStats() {
    const box = document.getElementById('devUsersStatsList');
    if (!box) return;

    box.innerHTML = appState.users.map(u => {
        let ductsArea = 0;
        let fittingsCount = 0;
        let earnedTotal = 0;

        appState.allItems.forEach(it => {
            if ((it.workers || []).includes(u.name)) {
                const shareInfo = getWorkerItemShareInfo(it, u.name);
                if (it.item_status === 'done') {
                    earnedTotal += shareInfo.amount;
                }
                if (it.category === 'duct') {
                    const seams = { lock_pittsburgh: 32, lock_single: 9, round_seam: 22 };
                    const unfold = it.shape === 'rect' 
                        ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                        : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
                    ductsArea += (unfold * (Number(it.l) || 1250) * (Number(it.qty) || 1)) / 1e6;
                } else {
                    fittingsCount += (Number(it.qty) || 1);
                }
            }
        });

        return `
            <div class="bg-[#18181f] border border-white/5 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div class="font-extrabold text-white flex items-center gap-2 flex-wrap">
                        <span>${u.name}</span>
                        <span class="text-zinc-400 font-mono text-[11px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">ПИН: ${u.access_code || '—'}</span>
                        <span class="text-emerald-400 font-mono text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">Выработка: ${earnedTotal.toLocaleString()} ₸</span>
                    </div>
                    <div class="text-[11px] text-zinc-400 mt-1">
                        Роль: <strong class="text-white">${u.role === 'developer' ? 'Разработчик / Руководитель' : 'Работник цеха'}</strong> | Собрано: <strong class="text-white mono">${ductsArea.toFixed(1)} м²</strong>, <strong class="text-white mono">${fittingsCount} шт</strong>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <button type="button" onclick="openWorkerProfileModal('${u.name}')" class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition btn-press">Кабинет →</button>
                    ${u.role !== 'developer' ? `<button type="button" onclick="deleteWorker(${u.id})" class="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition btn-press">✕</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// КОНСТРУКТОР ИЗДЕЛИЙ
// ==========================================
function renderCustomFitParamsCheckboxes() {
    const box = document.getElementById('customFitParamsCheckboxes');
    if (!box) return;
    box.innerHTML = ALL_PARAM_DEFS.map(p => `
        <label class="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-xs btn-press">
            <input type="checkbox" name="customParamCheckbox" value="${p.code}" class="rounded text-white accent-white">
            <span class="truncate">${p.label}</span>
        </label>
    `).join('');
}

function renderDevFittingsList() {
    const list = document.getElementById('devFittingsList');
    if (!list) return;

    const shapes = [
        { code: 'rect', label: 'Прямоугольные' },
        { code: 'round', label: 'Круглые' },
        { code: 'smooth', label: 'Плавные переходы' }
    ];

    let totalCount = 0;
    const htmlParts = [];

    shapes.forEach(sh => {
        const fittings = appState.fittings[sh.code] || [];
        totalCount += fittings.length;
        if (fittings.length === 0) return;

        htmlParts.push(`
            <div class="pt-2">
                <div class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">${sh.label}:</div>
                <div class="space-y-1.5">
                    ${fittings.map(f => {
                        const paramNames = (f.params || []).map(pCode => {
                            const pDef = ALL_PARAM_DEFS.find(x => x.code === pCode);
                            return pDef ? pDef.label : pCode;
                        }).join(', ');

                        return `
                            <div class="bg-[#18181f] border border-white/5 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <div class="space-y-0.5">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-white">${f.name}</span>
                                        <span class="mono text-emerald-400 font-bold bg-[#121217] px-2 py-0.5 rounded-lg border border-white/5">${f.price || 1000} ₸</span>
                                    </div>
                                    <div class="text-[10px] text-zinc-400">Параметры: <span class="text-zinc-300">${paramNames || 'нет'}</span></div>
                                </div>
                                <div class="flex items-center gap-1">
                                    <button type="button" onclick="editCustomFitting('${sh.code}', '${f.id}')" title="Редактировать" class="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-lg text-xs font-bold transition btn-press">✎</button>
                                    <button type="button" onclick="deleteCustomFitting('${sh.code}', '${f.id}')" title="Удалить" class="bg-rose-500/20 text-rose-300 px-2 py-1 rounded-lg text-xs font-bold transition btn-press">✕</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `);
    });

    const badge = document.getElementById('devFittingsCountBadge');
    if (badge) badge.textContent = `${totalCount} шт`;
    list.innerHTML = htmlParts.length > 0 ? htmlParts.join('') : '<div class="text-zinc-500 text-xs py-2 text-center">Изделия не найдены</div>';
}

function editCustomFitting(shape, id) {
    const list = appState.fittings[shape] || [];
    const fit = list.find(f => f.id === id);
    if (!fit) return;

    document.getElementById('customFitId').value = fit.id;
    document.getElementById('customFitName').value = fit.name;
    document.getElementById('customFitShape').value = shape;
    document.getElementById('customFitPrice').value = fit.price || 1000;

    const header = document.getElementById('customFitHeaderTitle');
    if (header) header.textContent = `Редактирование: ${fit.name}`;
    const btnSave = document.getElementById('btnSaveCustomFit');
    if (btnSave) btnSave.textContent = '✓ Сохранить изменения';
    const btnCancel = document.getElementById('btnCancelCustomFit');
    if (btnCancel) btnCancel.classList.remove('hidden');

    const fitParams = new Set(fit.params || []);
    document.querySelectorAll('input[name="customParamCheckbox"]').forEach(cb => {
        cb.checked = fitParams.has(cb.value);
    });
}

function cancelEditCustomFitting() {
    document.getElementById('customFitId').value = '';
    document.getElementById('customFitName').value = '';
    document.getElementById('customFitPrice').value = '1000';

    const header = document.getElementById('customFitHeaderTitle');
    if (header) header.textContent = 'Конструктор: Настроить вид изделия';
    const btnSave = document.getElementById('btnSaveCustomFit');
    if (btnSave) btnSave.textContent = '+ Сохранить изделие в справочник';
    const btnCancel = document.getElementById('btnCancelCustomFit');
    if (btnCancel) btnCancel.classList.add('hidden');

    document.querySelectorAll('input[name="customParamCheckbox"]').forEach(cb => {
        cb.checked = false;
    });
}

async function saveCustomFitting() {
    const editId = document.getElementById('customFitId')?.value.trim();
    const name = document.getElementById('customFitName')?.value.trim();
    const shape = document.getElementById('customFitShape')?.value || 'rect';
    const price = Number(document.getElementById('customFitPrice')?.value) || 1000;
    const params = Array.from(document.querySelectorAll('input[name="customParamCheckbox"]:checked')).map(cb => cb.value);

    if (!name) { showToast('Укажите название изделия', 'warning'); return; }
    if (params.length === 0) { showToast('Отметьте хотя бы один параметр', 'warning'); return; }

    if (!appState.fittings[shape]) appState.fittings[shape] = [];

    if (editId) {
        ['rect', 'round', 'smooth'].forEach(sh => {
            if (appState.fittings[sh]) {
                appState.fittings[sh] = appState.fittings[sh].filter(f => f.id !== editId);
            }
        });
        appState.fittings[shape].push({ id: editId, name, params, price });
        showToast(`Изделие "${name}" обновлено!`, 'success');
    } else {
        const newId = 'cust_' + Date.now();
        appState.fittings[shape].push({ id: newId, name, params, price });
        showToast(`Изделие "${name}" добавлено в справочник!`, 'success');
    }

    await saveGlobalSettings();
    updateFittingDropdown();
    renderDevFittingsList();
    cancelEditCustomFitting();
}

async function deleteCustomFitting(shape, id) {
    const fit = (appState.fittings[shape] || []).find(f => f.id === id);
    const fitName = fit ? fit.name : 'изделие';
    if (!confirm(`Удалить "${fitName}" из справочника изделий?`)) return;

    appState.fittings[shape] = (appState.fittings[shape] || []).filter(f => f.id !== id);
    await saveGlobalSettings();
    updateFittingDropdown();
    renderDevFittingsList();
    showToast(`"${fitName}" удалено`, 'info');
}

async function addNewCustomParam() {
    const labelInp = document.getElementById('newParamLabel');
    const codeInp = document.getElementById('newParamCode');
    const label = (labelInp?.value || '').trim();
    let code = (codeInp?.value || '').trim().toLowerCase().replace(/\s+/g, '_');

    if (!label) { showToast('Введите название параметра', 'warning'); return; }
    if (!code) { showToast('Введите код параметра на английском', 'warning'); return; }

    if (!/^[a-z0-9_]+$/.test(code)) {
        showToast('Код параметра должен содержать только латиницу, цифры и _', 'warning');
        return;
    }

    if (ALL_PARAM_DEFS.some(p => p.code === code)) {
        showToast(`Параметр с кодом "${code}" уже существует!`, 'warning');
        return;
    }

    const newParam = { code, label };
    ALL_PARAM_DEFS.push(newParam);

    if (!appState.fittings.__custom_params) {
        appState.fittings.__custom_params = [];
    }
    appState.fittings.__custom_params.push(newParam);

    await saveGlobalSettings();
    renderCustomFitParamsCheckboxes();

    if (labelInp) labelInp.value = '';
    if (codeInp) codeInp.value = '';

    showToast(`Параметр "${label}" (${code}) добавлен!`, 'success');
}

// ==========================================
// ЕЖЕМЕСЯЧНАЯ АРХИВАЦИЯ И БЕЗОПАСНАЯ ПЕСОЧНИЦА
// ==========================================
async function exportMonthlyArchive() {
    triggerHaptic('medium');
    const now = new Date();
    const monthStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filename = `Maxvent_Complete_Backup_${monthStr}.json`;

    showToast('Подготовка полного архива базы данных...', 'info');

    const { data: allItems } = await supabaseClient.from('items').select('*');
    const { data: allPay } = await supabaseClient.from('payments').select('*');
    const { data: allNest } = await supabaseClient.from('nestings').select('*');

    const archiveData = {
        meta: {
            exported_at: new Date().toISOString(),
            version: '2.0-cloud',
            system: 'Maxvent Tools'
        },
        projects: appState.projects,
        items: allItems || [],
        payments: allPay || [],
        nestings: allNest || [],
        settings: {
            metals: appState.metals,
            thicknesses: appState.thicknesses,
            groups: appState.groups,
            fittings: appState.fittings,
            shopNotes: appState.shopNotes
        },
        users: appState.users.map(u => ({ id: u.id, name: u.name, role: u.role, access_code: u.access_code }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archiveData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", filename);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    showToast(`Архив сохранен: ${filename}`, 'success');
}

function loadArchiveSandbox(event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    triggerHaptic('medium');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.projects || !Array.isArray(data.projects)) {
                showToast('Ошибка: неверный формат файла архива', 'error');
                return;
            }

            session.archiveSandboxData = data;

            // Подменяем данные локально в памяти для безопасного просмотра
            appState.projects = data.projects;
            appState.allItems = data.items || [];
            appState.allPayments = data.payments || [];
            if (data.settings) {
                if (data.settings.metals) appState.metals = data.settings.metals;
                if (data.settings.thicknesses) appState.thicknesses = data.settings.thicknesses;
                if (data.settings.groups) appState.groups = data.settings.groups;
                if (data.settings.fittings) appState.fittings = data.settings.fittings;
                if (data.settings.shopNotes) appState.shopNotes = data.settings.shopNotes;
            }

            // Показываем желтый предупреждающий баннер песочницы
            const banner = document.getElementById('archiveSandboxBanner');
            const titleEl = document.getElementById('archiveSandboxTitle');
            if (banner) banner.classList.remove('hidden');
            if (titleEl) titleEl.textContent = `Вы просматриваете архив месяца: ${file.name} (Режим только чтение)`;

            showToast(`Архив "${file.name}" загружен для просмотра!`, 'success');
            navigateTo(SCREENS.PROJECTS);
        } catch (err) {
            showToast('Ошибка чтения архива: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

async function exitArchiveSandbox() {
    triggerHaptic('medium');
    session.archiveSandboxData = null;
    const banner = document.getElementById('archiveSandboxBanner');
    if (banner) banner.classList.add('hidden');

    showToast('Возврат к рабочей базе Supabase...', 'info');
    await loadInitialData();
    navigateTo(SCREENS.MENU);
    showToast('Рабочий режим восстановлен', 'success');
}

async function startNewMonthClean() {
    triggerHaptic('warning');
    // Находим проекты, которые либо уже сданы, либо в архиве и не имеют долгов
    const candidates = [];
    for (const p of appState.projects) {
        if (p.archive_state === 'archived' || p.status_text === 'Готово' || p.status_text === 'Сдан') {
            await loadProjectDetails(p.id);
            const fin = calculateProjectFinances(p.id);
            if (fin.debt <= 0) {
                candidates.push(p);
            }
        }
    }

    if (candidates.length === 0) {
        alert('Нет завершенных и полностью оплаченных объектов для очистки.\nВсе ваши активные и неоплаченные проекты останутся нетронутыми.');
        return;
    }

    const confirmMsg = `Найдено ${candidates.length} завершенных и 100% оплаченных проектов без долга.\n\nПеред удалением убедитесь, что вы нажали «Скачать архив месяца»!\n\nОчистить эти ${candidates.length} проектов из базы?`;
    if (!confirm(confirmMsg)) return;

    const ids = candidates.map(p => p.id);
    await supabaseClient.from('items').delete().in('project_id', ids);
    await supabaseClient.from('payments').delete().in('project_id', ids);
    await supabaseClient.from('nestings').delete().in('project_id', ids);
    await supabaseClient.from('projects').delete().in('id', ids);

    appState.projects = appState.projects.filter(p => !ids.includes(p.id));
    appState.allItems = appState.allItems.filter(it => !ids.includes(it.project_id));
    appState.allPayments = appState.allPayments.filter(pay => !ids.includes(pay.project_id));

    showToast(`Успешно очищено ${ids.length} завершенных проектов. Приложение обновлено на новый месяц!`, 'success');
    renderMainMenuProjects();
    updateHeaderUI();
}
