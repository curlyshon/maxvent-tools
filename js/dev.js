// ==========================================
// MODULE: dev.js
// Панель разработчика, конструктор изделий, кастомные параметры, архив
// ==========================================

function openDevModal() {
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('devModal').classList.remove('hidden');
    renderDevCatalogs();
    renderCustomFitParamsCheckboxes();
    renderDevFittingsList();
    renderDevUsersStats();
}

function closeDevModal() { document.getElementById('devModal').classList.add('hidden'); }

function renderDevCatalogs() {
    document.getElementById('devMetalsList').innerHTML = appState.metals.map((m, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white flex items-center gap-1">${m} <button onclick="removeCatalogItem('metals', ${i})" class="text-slate-500 hover:text-rose-400">×</button></span>
    `).join('');
    document.getElementById('devThickList').innerHTML = appState.thicknesses.map((t, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white mono flex items-center gap-1">${t} мм <button onclick="removeCatalogItem('thicknesses', ${i})" class="text-slate-500 hover:text-rose-400">×</button></span>
    `).join('');
    document.getElementById('devGroupsList').innerHTML = appState.groups.map((g, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white flex items-center gap-1">${g} <button onclick="removeCatalogItem('groups', ${i})" class="text-slate-500 hover:text-rose-400">×</button></span>
    `).join('');
}

async function addCatalogItem(type, inputId) {
    const inp = document.getElementById(inputId);
    const val = type === 'thicknesses' ? Number(inp.value) : inp.value.trim();
    if (!val) return;
    if (!appState[type].includes(val)) {
        appState[type].push(val);
        inp.value = '';
        await saveGlobalSettings();
        renderDevCatalogs();
    }
}

async function removeCatalogItem(type, idx) {
    appState[type].splice(idx, 1);
    await saveGlobalSettings();
    renderDevCatalogs();
}

async function createNewWorker() {
    const name = document.getElementById('newWorkerName').value.trim();
    const accessCode = document.getElementById('newWorkerCode').value.trim();
    const role = document.getElementById('newWorkerRole').value;

    if (!name || !accessCode) { alert('Укажите имя и код доступа'); return; }

    const { data: newU, error } = await supabaseClient.from('users').insert({
        name, access_code: accessCode, role
    }).select().single();

    if (error) { alert('Ошибка: ' + error.message); return; }

    appState.users.push(newU);
    document.getElementById('newWorkerName').value = '';
    document.getElementById('newWorkerCode').value = '';
    renderDevUsersStats();
    alert(`Работник ${name} успешно создан! Код входа: ${accessCode}`);
}

async function deleteWorker(id) {
    if (!confirm('Удалить этого сотрудника из системы?')) return;
    await supabaseClient.from('users').delete().eq('id', id);
    appState.users = appState.users.filter(x => x.id !== id);
    renderDevUsersStats();
}

function renderDevUsersStats() {
    const box = document.getElementById('devUsersStatsList');
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
                    const unfold = it.shape === 'rect' ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
                    ductsArea += (unfold * (Number(it.l) || 1250) * (Number(it.qty) || 1)) / 1e6;
                } else {
                    fittingsCount += (Number(it.qty) || 1);
                }
            }
        });

        return `
            <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center gap-2">
                <div>
                    <div class="font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>${u.name}</span>
                        <span class="text-blue-400 font-mono text-[11px]">Код: ${u.access_code || '—'}</span>
                        <span class="text-emerald-400 font-mono text-[11px] font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">Заработано: ${earnedTotal.toLocaleString()} ₸</span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-1">Роль: <strong class="text-emerald-400">${u.role === 'developer' ? 'Разработчик' : 'Работник цеха'}</strong> | Выработка: <strong class="text-blue-300 mono">${ductsArea.toFixed(2)} м² воздуховодов</strong>, <strong class="text-amber-300 mono">${fittingsCount} шт изделий</strong></div>
                </div>
                <div class="flex items-center gap-1.5">
                    <button onclick="openWorkerProfileModal('${u.name}')" class="bg-blue-950 border border-blue-800 text-blue-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Кабинет →</button>
                    ${u.access_code !== '7777' ? `<button onclick="deleteWorker(${u.id})" class="bg-rose-950 border border-rose-800 text-rose-300 px-3 py-1.5 rounded-lg text-xs">Удалить</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderCustomFitParamsCheckboxes() {
    const box = document.getElementById('customFitParamsCheckboxes');
    if (!box) return;
    box.innerHTML = ALL_PARAM_DEFS.map(p => `
        <label class="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" name="customParamCheckbox" value="${p.code}" class="rounded text-amber-500">
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
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">${sh.label}:</div>
                <div class="space-y-1.5">
                    ${fittings.map(f => {
                        const paramNames = (f.params || []).map(pCode => {
                            const pDef = ALL_PARAM_DEFS.find(x => x.code === pCode);
                            return pDef ? pDef.label : pCode;
                        }).join(', ');

                        return `
                            <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <div class="space-y-0.5">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-white">${f.name}</span>
                                        <span class="mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">${f.price || 1000} ₸</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400">
                                        Параметры: <span class="text-slate-300">${paramNames || 'нет'}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1">
                                    <button type="button" onclick="editCustomFitting('${sh.code}', '${f.id}')" title="Редактировать изделие" class="bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition">
                                        ✎ Изменить
                                    </button>
                                    <button type="button" onclick="deleteCustomFitting('${sh.code}', '${f.id}')" title="Удалить изделие" class="bg-rose-900/40 hover:bg-rose-800 text-rose-300 hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition">
                                        ✕
                                    </button>
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

    list.innerHTML = htmlParts.length > 0 ? htmlParts.join('') : '<div class="text-slate-500 text-xs py-2 text-center">Изделия не найдены</div>';
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

    const nameInput = document.getElementById('customFitName');
    if (nameInput) nameInput.focus();
}

function cancelEditCustomFitting() {
    document.getElementById('customFitId').value = '';
    document.getElementById('customFitName').value = '';
    document.getElementById('customFitPrice').value = '1000';

    const header = document.getElementById('customFitHeaderTitle');
    if (header) header.textContent = 'Конструктор: Добавить / Настроить вид изделия';

    const btnSave = document.getElementById('btnSaveCustomFit');
    if (btnSave) btnSave.textContent = '+ Сохранить изделие в справочник';

    const btnCancel = document.getElementById('btnCancelCustomFit');
    if (btnCancel) btnCancel.classList.add('hidden');

    document.querySelectorAll('input[name="customParamCheckbox"]').forEach(cb => {
        cb.checked = false;
    });
}

async function saveCustomFitting() {
    const editId = document.getElementById('customFitId').value.trim();
    const name = document.getElementById('customFitName').value.trim();
    const shape = document.getElementById('customFitShape').value;
    const price = Number(document.getElementById('customFitPrice').value) || 1000;
    const params = Array.from(document.querySelectorAll('input[name="customParamCheckbox"]:checked')).map(cb => cb.value);

    if (!name) { alert('Укажите название изделия'); return; }
    if (params.length === 0) { alert('Отметьте хотя бы один параметр'); return; }

    if (!appState.fittings[shape]) appState.fittings[shape] = [];

    if (editId) {
        ['rect', 'round', 'smooth'].forEach(sh => {
            if (appState.fittings[sh]) {
                appState.fittings[sh] = appState.fittings[sh].filter(f => f.id !== editId);
            }
        });
        appState.fittings[shape].push({ id: editId, name, params, price });
        showToast(`Изделие "${name}" успешно обновлено!`, 'success');
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

    if (!label) { alert('Введите русское название параметра'); return; }
    if (!code) { alert('Введите код параметра на английском'); return; }

    if (!/^[a-z0-9_]+$/.test(code)) {
        alert('Код параметра должен содержать только строчные латинские буквы, цифры и знак подчеркивания _');
        return;
    }

    if (ALL_PARAM_DEFS.some(p => p.code === code)) {
        alert(`Параметр с кодом "${code}" уже существует!`);
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

// --- АРХИВ ---
async function exportMonthlyArchive() {
    const now = new Date();
    const monthStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filename = `Maxvent_Archive_${monthStr}.json`;

    const { data: allItems } = await supabaseClient.from('items').select('*');
    const { data: allPay } = await supabaseClient.from('payments').select('*');

    const archiveData = { projects: appState.projects, items: allItems, payments: allPay, settings: appState.fittings };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archiveData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", filename);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

async function startNewMonthClean() {
    const archivedList = appState.projects.filter(p => p.archive_state === 'archived');
    if (archivedList.length === 0) { alert('Нет архивных проектов для удаления.'); return; }
    if (!confirm(`Будет удалено ${archivedList.length} архивных проектов. Активные останутся.`)) return;

    const ids = archivedList.map(p => p.id);
    await supabaseClient.from('projects').delete().in('id', ids);
    appState.projects = appState.projects.filter(p => p.archive_state !== 'archived');
    closeDevModal();
    renderMainMenuProjects();
    alert('Новый месяц начат! Архивные проекты удалены из базы.');
}
