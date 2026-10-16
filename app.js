// ==========================================
// 100% ОНЛАЙН MAXVENT TOOLS (SUPABASE CLIENT)
// ==========================================
const SUPABASE_URL = "https://anwuikxtqesewifvipaw.supabase.co";
const SUPABASE_KEY = "sb_publishable_7ENnMe3mS3P4dIsNUC3YAQ_ATVta-In";

// Инициализация официального клиента Supabase
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const POPULAR_RECT = [100, 150, 200, 225, 250, 285, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
const POPULAR_DIAM = [100, 125, 140, 150, 160, 180, 200, 225, 250, 280, 300, 315, 355, 400, 450, 500];
const POPULAR_LEN_SILENCER = [500, 600, 1000, 1250];

const DEFAULT_FITTINGS = {
    rect: [
        { id: 'r_trans', name: 'Переход', params: ['w1', 'h1', 'w2', 'h2', 'len', 'flange2'], price: 1000 },
        { id: 'r_bend', name: 'Отвод', params: ['deg', 'w', 'h', 'flange2'], price: 1000 },
        { id: 'r_cap', name: 'Заглушка', params: ['w', 'h', 'flange1'], price: 1000 },
        { id: 'r_inlet', name: 'Врезка', params: ['w', 'h', 'len'], price: 1000 },
        { id: 'r_pipe', name: 'Патрубок', params: ['w', 'h', 'len'], price: 1000 },
        { id: 'r_tee', name: 'Тройник', params: ['tee_rect'], price: 1000 },
        { id: 'r_offset', name: 'Утка', params: ['w', 'h', 'offset', 'flange2'], price: 1000 },
        { id: 'r_cross', name: 'Крестовина', params: ['cross_rect'], price: 1000 },
        { id: 'r_goose', name: 'Гусак', params: ['deg135', 'w', 'h', 'flange1'], price: 1000 },
        { id: 'r_silencer', name: 'Шумоглушитель', params: ['w', 'h', 'len_silencer', 'flange2'], price: 1000 },
        { id: 'r_cowl', name: 'Колпак', params: ['w', 'h', 'flange1'], price: 1000 },
        { id: 'r_filter', name: 'Фильтр-бокс', params: ['w', 'h', 'len', 'flange2'], price: 1000 },
        { id: 'r_damper', name: 'Дроссельный клапан', params: ['w', 'h', 'len', 'flange2'], price: 1000 },
        { id: 'r_hood_ex', name: 'Зонт вытяжной', params: ['hood_type', 'w', 'h', 'len', 'hood_seat'], price: 1000 },
        { id: 'r_hood_bbq', name: 'Зонт мангальный', params: ['w1', 'h1', 'w2', 'h2', 'len', 'flange2'], price: 1000 },
        { id: 'r_grease', name: 'Жироуловитель', params: ['w', 'h', 'len'], price: 1000 },
        { id: 'r_grille', name: 'Наружная решетка', params: ['w', 'h'], price: 1000 }
    ],
    round: [
        { id: 'c_trans', name: 'Переход', params: ['d1', 'd2', 'len'], price: 1000 },
        { id: 'c_bend', name: 'Отвод', params: ['deg', 'd'], price: 1000 },
        { id: 'c_cap', name: 'Заглушка', params: ['d'], price: 1000 },
        { id: 'c_inlet', name: 'Врезка', params: ['d', 'd_main', 'len'], price: 1000 },
        { id: 'c_nipple', name: 'Ниппель', params: ['d', 'len'], price: 1000 },
        { id: 'c_tee', name: 'Тройник', params: ['tee_round'], price: 1000 },
        { id: 'c_offset', name: 'Утка', params: ['d', 'offset'], price: 1000 },
        { id: 'c_cross', name: 'Крестовина', params: ['cross_round'], price: 1000 },
        { id: 'c_goose', name: 'Гусак', params: ['deg135', 'd'], price: 1000 },
        { id: 'c_silencer', name: 'Шумоглушитель', params: ['d', 'len_silencer'], price: 1000 },
        { id: 'c_cowl', name: 'Колпак', params: ['d'], price: 1000 },
        { id: 'c_deflector', name: 'Дефлектор', params: ['d'], price: 1000 },
        { id: 'c_filter', name: 'Фильтр-бокс', params: ['d', 'len'], price: 1000 },
        { id: 'c_damper', name: 'Дроссельный клапан', params: ['d', 'len'], price: 1000 },
        { id: 'c_hood', name: 'Зонт вытяжной', params: ['d1', 'd2', 'len'], price: 1000 }
    ],
    smooth: [
        { id: 's_trans', name: 'Переход', params: ['w1', 'h1', 'd', 'len', 'flange1'], price: 1000 },
        { id: 's_inlet_r2c', name: 'Врезка прямоугольный на круглый', params: ['w', 'h', 'd_main', 'len'], price: 1000 },
        { id: 's_inlet_c2r', name: 'Врезка круглый на прямоугольный', params: ['d', 'len'], price: 1000 },
        { id: 's_tee', name: 'Тройник', params: ['w', 'h', 'd_main', 'flange1'], price: 1000 },
        { id: 's_silencer', name: 'Шумоглушитель', params: ['w', 'h', 'd', 'len_silencer', 'flange1'], price: 1000 },
        { id: 's_hood', name: 'Зонт вытяжной', params: ['w', 'h', 'd', 'len'], price: 1000 },
        { id: 's_ksd', name: 'КСД', params: ['w', 'h', 'len', 'd', 'inlets_cnt'], price: 1000 }
    ]
};

// Сессия и оперативная память текущего экрана
let session = {
    user: null,
    devMode: false,
    projectFilter: 'active',
    clickedProjectId: null,
    insideProjectId: null,
    activeCategory: 'duct',
    activeShape: 'rect',
    selectedSpecIds: [],
    activeNestingKey: null,
    accordionState: {}
};

// Текущие данные проекта
let appConfig = {
    metals: ['Оц.', 'Нерж.', 'Краш.'],
    thicknesses: [0.45, 0.5, 0.6, 0.7, 0.8, 1.0],
    groups: ['Бригада №1', 'Бригада №2', 'Цех (Самовывоз)'],
    fittings: DEFAULT_FITTINGS
};

let currentProjects = [];
let currentProjectItems = [];
let currentProjectPayments = [];
let currentProjectNestings = {};
let standaloneFlange = { rows: [], scraps: [] };

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
async function initApp() {
    const savedUser = localStorage.getItem('mv_online_user');
    if (savedUser) {
        try {
            session.user = JSON.parse(savedUser);
            session.devMode = (session.user.role === 'developer');
        } catch(e){}
    }
    await loadGlobalConfig();
    checkAuthState();
}

async function loadGlobalConfig() {
    try {
        const { data } = await sb.from('app_settings').select('*').eq('id', 'global_config').maybeSingle();
        if (data) {
            if (data.metals) appConfig.metals = data.metals;
            if (data.thicknesses) appConfig.thicknesses = data.thicknesses;
            if (data.groups) appConfig.groups = data.groups;
        }
    } catch (e) {
        console.warn('Config load:', e);
    }
}

// ==========================================
// АВТОРИЗАЦИЯ
// ==========================================
let authMode = 'login';
function setAuthMode(m) {
    authMode = m;
    document.getElementById('authTabLogin').className = m === 'login' ? 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-400 border-b-2 border-blue-500' : 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b-2 border-transparent';
    document.getElementById('authTabRegister').className = m === 'register' ? 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-400 border-b-2 border-blue-500' : 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b-2 border-transparent';
    document.getElementById('regNameWrap').classList.toggle('hidden', m !== 'register');
    document.getElementById('regRoleWrap').classList.toggle('hidden', m !== 'register');
    document.getElementById('authSubmitBtn').textContent = m === 'login' ? 'Войти' : 'Зарегистрироваться';
    document.getElementById('authError').classList.add('hidden');
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const login = document.getElementById('authLogin').value.trim();
    const pass = document.getElementById('authPass').value.trim();
    const err = document.getElementById('authError');

    if (authMode === 'login') {
        const { data, error } = await sb.from('users').select('*').eq('login', login).eq('pass', pass).maybeSingle();
        if (error || !data) {
            err.textContent = 'Неверный логин или пароль';
            err.classList.remove('hidden');
            return;
        }
        session.user = data;
        session.devMode = (data.role === 'developer');
    } else {
        const name = document.getElementById('authName').value.trim() || login;
        const role = document.getElementById('authRoleSelect').value;

        const { data: existing } = await sb.from('users').select('id').eq('login', login).maybeSingle();
        if (existing) {
            err.textContent = 'Пользователь с таким логином уже существует';
            err.classList.remove('hidden');
            return;
        }

        const { data: newUser, error } = await sb.from('users').insert([{ login, pass, name, role }]).select().single();
        if (error) {
            err.textContent = 'Ошибка создания аккаунта: ' + error.message;
            err.classList.remove('hidden');
            return;
        }
        session.user = newUser;
        session.devMode = (role === 'developer');
    }

    localStorage.setItem('mv_online_user', JSON.stringify(session.user));
    checkAuthState();
}

function checkAuthState() {
    const screen = document.getElementById('authScreen');
    if (!session.user) {
        screen.classList.remove('hidden');
    } else {
        screen.classList.add('hidden');
        updateHeaderUI();
        goToMainMenu();
    }
}

function logout() {
    session.user = null;
    localStorage.removeItem('mv_online_user');
    document.getElementById('profileDropdown').classList.add('hidden');
    checkAuthState();
}

function isDev() {
    return (session.user?.role === 'developer' && session.devMode);
}

function toggleDevMode() {
    if (session.user?.role !== 'developer') return;
    session.devMode = !session.devMode;
    updateHeaderUI();
    renderSpecification();
    renderProjectFinance();
}

function updateHeaderUI() {
    const u = session.user;
    if (!u) return;
    document.getElementById('userNameHeader').textContent = u.name;
    document.getElementById('userAvatar').textContent = u.name.charAt(0).toUpperCase();
    document.getElementById('dropUserName').textContent = u.name;
    document.getElementById('dropUserRole').textContent = isDev() ? 'Разработчик (Полный доступ)' : 'Работник цеха';

    const devWrap = document.getElementById('devToggleWrap');
    if (u.role === 'developer') {
        devWrap.classList.remove('hidden');
        devWrap.classList.add('flex');
        document.getElementById('devToggleBtn').className = session.devMode ? "w-8 h-4 bg-blue-600 rounded-full relative transition flex items-center" : "w-8 h-4 bg-slate-700 rounded-full relative transition flex items-center";
        document.getElementById('devToggleKnob').className = session.devMode ? "w-3 h-3 bg-white rounded-full absolute right-0.5 transition" : "w-3 h-3 bg-white rounded-full absolute left-0.5 transition";
    } else {
        devWrap.classList.add('hidden');
    }

    document.getElementById('menuBtnDevSettings').classList.toggle('hidden', !isDev());
    document.getElementById('menuBtnGlobalFinance').classList.toggle('hidden', !isDev());
    document.getElementById('priceInputWrap').classList.toggle('hidden', !isDev());
    document.getElementById('workersAssignWrap').classList.toggle('hidden', !isDev());
    document.getElementById('inTab-finance').classList.toggle('hidden', !isDev());
}

function toggleProfileMenu() {
    document.getElementById('profileDropdown').classList.toggle('hidden');
}

// ==========================================
// ГЛАВНОЕ МЕНЮ И ПРОЕКТЫ
// ==========================================
async function goToMainMenu() {
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('projectScreen').classList.add('hidden');
    document.getElementById('mainMenuScreen').classList.remove('hidden');
    session.clickedProjectId = null;
    await fetchProjectsList();
}

function setProjectFilter(f) {
    session.projectFilter = f;
    session.clickedProjectId = null;
    document.getElementById('btnProjActive').className = f === 'active' ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white' : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400';
    document.getElementById('btnProjArchived').className = f === 'archived' ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white' : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400';
    renderProjectsListUI();
}

async function fetchProjectsList() {
    const { data, error } = await sb.from('projects').select('*').order('id', { ascending: false });
    if (!error && data) {
        currentProjects = data;
    }
    renderProjectsListUI();
}

function renderProjectsListUI() {
    const list = currentProjects.filter(p => (p.archive_state || 'active') === session.projectFilter);
    document.getElementById('projectsBadgeCount').textContent = list.length;

    const container = document.getElementById('projectsButtonsContainer');
    const preview = document.getElementById('projectPreviewCard');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<div class="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs text-slate-500 text-center">Список проектов пуст</div>`;
        preview.classList.add('hidden');
        return;
    }

    list.forEach(p => {
        const isSelected = p.id === session.clickedProjectId;
        const btn = document.createElement('button');
        btn.className = `w-full text-left p-4 rounded-xl border transition flex items-center justify-between ${isSelected ? 'bg-blue-600/15 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'}`;
        btn.onclick = () => {
            session.clickedProjectId = (session.clickedProjectId === p.id) ? null : p.id;
            renderProjectsListUI();
        };
        btn.innerHTML = `
            <div class="truncate pr-2">
                <div class="font-bold text-sm truncate">${p.title}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">${p.group_name || 'Без бригады'} • <span class="text-blue-400">${p.status_text || 'В работе'}</span></div>
            </div>
            <span class="text-slate-500 font-bold">›</span>
        `;
        container.appendChild(btn);
    });

    if (!session.clickedProjectId) {
        preview.classList.add('hidden');
    } else {
        renderProjectPreviewCardOnline(session.clickedProjectId);
    }
}

async function renderProjectPreviewCardOnline(projId) {
    const preview = document.getElementById('projectPreviewCard');
    const p = currentProjects.find(x => x.id === projId);
    if (!p) { preview.classList.add('hidden'); return; }
    preview.classList.remove('hidden');

    const { data: items } = await sb.from('items').select('*').eq('project_id', projId);
    const itemList = items || [];

    const ducts = itemList.filter(i => i.category === 'duct');
    const fittings = itemList.filter(i => i.category === 'fitting');
    const totalDuctQty = ducts.reduce((s, i) => s + i.qty, 0);
    const totalFitQty = fittings.reduce((s, i) => s + i.qty, 0);

    preview.innerHTML = `
        <div class="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-3">
            <div>
                <h3 class="text-base font-black text-white">${p.title}</h3>
                <p class="text-xs text-slate-400 mt-0.5">${p.description || 'Описание не указано'}</p>
            </div>
            <div class="text-right">
                <span class="text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-800 text-blue-400 border border-slate-700">${p.status_text || 'В работе'}</span>
                <div class="text-[11px] text-slate-400 mt-1">${p.group_name || 'Без бригады'}</div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span class="text-slate-400">Воздуховоды:</span> <strong class="text-blue-400 mono">${totalDuctQty} шт</strong>
            </div>
            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span class="text-slate-400">Изделия:</span> <strong class="text-emerald-400 mono">${totalFitQty} шт</strong>
            </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <button onclick="openInsideProject(${p.id})" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition text-center">
                Открыть проект
            </button>
            <button onclick="openProjectModal(${p.id})" class="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-semibold">
                ✎ Редактировать
            </button>
            <button onclick="archiveProjectSafe(${p.id})" class="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-2.5 px-3 rounded-xl text-xs">
                ${p.archive_state === 'archived' ? 'Восстановить' : 'В архив'}
            </button>
            ${isDev() && p.archive_state === 'archived' ? `<button onclick="deleteProjectPermanent(${p.id})" class="bg-rose-900/60 hover:bg-rose-800 text-rose-200 py-2.5 px-3 rounded-xl text-xs">Удалить</button>` : ''}
        </div>
    `;
}

function openProjectModal(editId = null) {
    document.getElementById('modalProjId').value = editId || '';
    document.getElementById('projectModalHeader').textContent = editId ? 'Редактировать проект' : 'Создать проект';
    
    const groupSel = document.getElementById('modalProjGroup');
    groupSel.innerHTML = appConfig.groups.map(g => `<option value="${g}">${g}</option>`).join('');

    if (editId) {
        const p = currentProjects.find(x => x.id === editId);
        if (p) {
            document.getElementById('modalProjTitle').value = p.title;
            document.getElementById('modalProjDesc').value = p.description || '';
            document.getElementById('modalProjGroup').value = p.group_name || appConfig.groups[0];
            document.getElementById('modalProjStatusText').value = p.status_text || 'В работе';
        }
    } else {
        document.getElementById('modalProjTitle').value = '';
        document.getElementById('modalProjDesc').value = '';
        document.getElementById('modalProjStatusText').value = 'В работе';
    }
    document.getElementById('projectModal').classList.remove('hidden');
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.add('hidden');
}

async function saveProjectModal() {
    const title = document.getElementById('modalProjTitle').value.trim();
    if (!title) { alert('Укажите название проекта'); return; }
    const editId = document.getElementById('modalProjId').value;
    const desc = document.getElementById('modalProjDesc').value.trim();
    const group = document.getElementById('modalProjGroup').value;
    const statusText = document.getElementById('modalProjStatusText').value;

    if (editId) {
        await sb.from('projects').update({
            title, description: desc, group_name: group, status_text: statusText, updated_at: new Date()
        }).eq('id', editId);
    } else {
        const { data } = await sb.from('projects').insert([{
            title, description: desc, group_name: group, status_text: statusText
        }]).select().single();
        if (data) session.clickedProjectId = data.id;
    }

    closeProjectModal();
    await fetchProjectsList();
}

async function archiveProjectSafe(id) {
    const p = currentProjects.find(x => x.id === id);
    if (!p) return;
    const newState = p.archive_state === 'archived' ? 'active' : 'archived';
    await sb.from('projects').update({ archive_state: newState }).eq('id', id);
    await fetchProjectsList();
}

async function deleteProjectPermanent(id) {
    if (!confirm('Удалить проект навсегда из базы?')) return;
    await sb.from('projects').delete().eq('id', id);
    session.clickedProjectId = null;
    await fetchProjectsList();
}

// ==========================================
// ВНУТРИ ПРОЕКТА
// ==========================================
async function openInsideProject(id) {
    session.insideProjectId = id;
    session.selectedSpecIds = [];
    document.getElementById('mainMenuScreen').classList.add('hidden');
    document.getElementById('projectScreen').classList.remove('hidden');

    const p = currentProjects.find(x => x.id === id);
    document.getElementById('activeProjTitleHeader').textContent = p ? p.title : 'Проект';
    document.getElementById('activeProjCutBadge').classList.toggle('hidden', p?.status_text !== 'Воздуховоды отрезаны');

    populateFormDropdowns();
    selectCategory('duct');
    selectShape('rect');
    switchInnerTab('items');

    await loadProjectDataOnline(id);
}

async function loadProjectDataOnline(projId) {
    const { data: items } = await sb.from('items').select('*').eq('project_id', projId).order('id');
    currentProjectItems = items || [];

    const { data: payments } = await sb.from('payments').select('*').eq('project_id', projId).order('id');
    currentProjectPayments = payments || [];

    renderProjectInside();
}

function switchInnerTab(tab) {
    ['items', 'flange', 'nesting', 'finance'].forEach(t => {
        const view = document.getElementById('view-' + t);
        const btn = document.getElementById('inTab-' + t);
        if (view) view.classList.toggle('hidden', t !== tab);
        if (btn) {
            btn.className = t === tab ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white whitespace-nowrap" : "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 whitespace-nowrap";
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

// ==========================================
// СВОДКА ПО ПРОЕКТУ
// ==========================================
function toggleSummaryAccordion() {
    const body = document.getElementById('summaryBody');
    const arrow = document.getElementById('summaryArrow');
    const isHidden = body.classList.contains('hidden');
    body.classList.toggle('hidden', !isHidden);
    arrow.textContent = isHidden ? '▼' : '▶';
}

function renderSummarySection() {
    const ducts = currentProjectItems.filter(i => i.category === 'duct');
    const fittings = currentProjectItems.filter(i => i.category === 'fitting');

    document.getElementById('sumTotalDucts').textContent = ducts.reduce((s, i) => s + i.qty, 0) + ' шт';
    document.getElementById('sumTotalFittings').textContent = fittings.reduce((s, i) => s + i.qty, 0) + ' шт';

    const dBox = document.getElementById('summaryDuctsBox');
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

    const fBox = document.getElementById('summaryFittingsBox');
    let fHtml = '<div class="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-1">2. Изделия (Фасонина)</div>';

    const fRect = fittings.filter(i => i.shape === 'rect');
    if (fRect.length) {
        dHtml += '<div class="text-[11px] font-bold text-slate-300 mt-1">Прямоугольные изделия:</div>';
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
    if (!fRect.length && !fRound.length && !fSmooth.length) fHtml += '<div class="text-slate-500">Нет изделий</div>';
    fBox.innerHTML = fHtml;
}

function groupSummaryDucts(arr) {
    const res = {};
    arr.forEach(it => {
        const k = `${it.metal} ${it.thickness} мм`;
        if (!res[k]) res[k] = { qty: 0, area: 0 };
        res[k].qty += it.qty;
        const d = it.dimensions || {};
        const unfold = it.shape === 'rect' ? (2 * ((d.w || 400) + (d.h || 300)) + 41) : Math.round(Math.PI * (d.d || 200) + 22);
        res[k].area += (unfold * (d.l || 1250) * it.qty) / 1e6;
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

// ==========================================
// ФОРМА ДОБАВЛЕНИЯ В СПЕЦИФИКАЦИЮ
// ==========================================
function populateFormDropdowns() {
    const mSel = document.getElementById('inMetal');
    const tSel = document.getElementById('inThickness');
    mSel.innerHTML = appConfig.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    tSel.innerHTML = appConfig.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');

    const fmSel = document.getElementById('specFilterMetal');
    const ftSel = document.getElementById('specFilterThick');
    fmSel.innerHTML = '<option value="all">Все</option>' + appConfig.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    ftSel.innerHTML = '<option value="all">Все</option>' + appConfig.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');
}

function selectCategory(cat) {
    session.activeCategory = cat;
    document.getElementById('btnCatDuct').className = cat === 'duct' ? 'py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-blue-600 text-white' : 'py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-800 text-slate-300';
    document.getElementById('btnCatFitting').className = cat === 'fitting' ? 'py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-blue-600 text-white' : 'py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-800 text-slate-300';

    const smoothBtn = document.getElementById('btnShapeSmooth');
    if (cat === 'duct') {
        smoothBtn.classList.add('hidden');
        if (session.activeShape === 'smooth') selectShape('rect');
    } else {
        smoothBtn.classList.remove('hidden');
    }

    document.getElementById('fittingSelectWrap').classList.toggle('hidden', cat !== 'fitting');
    updateFittingDropdown();
    renderDynamicInputs();
}

function selectShape(sh) {
    session.activeShape = sh;
    ['rect', 'round', 'smooth'].forEach(s => {
        const btn = document.getElementById('btnShape' + s.charAt(0).toUpperCase() + s.slice(1));
        if (btn) btn.className = s === sh ? 'py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white' : 'py-2.5 text-xs font-bold rounded-xl bg-slate-800 text-slate-300';
    });
    updateFittingDropdown();
    renderDynamicInputs();
}

function updateFittingDropdown() {
    if (session.activeCategory !== 'fitting') return;
    const sel = document.getElementById('fittingTypeSelect');
    const list = appConfig.fittings[session.activeShape] || [];
    sel.innerHTML = list.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    renderDynamicInputs();
}

function onFittingTypeChange() {
    renderDynamicInputs();
}

function renderDynamicInputs() {
    const box = document.getElementById('dynamicFieldsBox');
    box.innerHTML = '';

    if (session.activeCategory === 'duct') {
        if (session.activeShape === 'rect') {
            box.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Ширина (А) мм</label>
                        <input type="number" id="f_w" value="400" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_w', POPULAR_RECT)}
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Высота (В) мм</label>
                        <input type="number" id="f_h" value="300" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_h', POPULAR_RECT)}
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Длина (L) мм (по умолчанию 1250)</label>
                        <input type="number" id="f_l" value="1250" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                    </div>
                    <div class="pt-2 border-t border-slate-800">
                        <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Шинка</div>
                        <div class="flex gap-6 text-xs">
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_flange1" checked class="rounded text-blue-600"> <span>Сторона 1</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_flange2" checked class="rounded text-blue-600"> <span>Сторона 2</span></label>
                        </div>
                    </div>
                </div>
            `;
        } else {
            box.innerHTML = `
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Диаметр (Ø) мм</label>
                        <input type="number" id="f_d" value="200" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                        ${renderChipScroller('f_d', POPULAR_DIAM)}
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Длина (L) мм (по умолчанию 1250)</label>
                        <input type="number" id="f_l" value="1250" required class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm mono text-white">
                    </div>
                </div>
            `;
        }
        return;
    }

    const fitId = document.getElementById('fittingTypeSelect').value;
    const fitDef = (appConfig.fittings[session.activeShape] || []).find(f => f.id === fitId) || { params: ['w', 'h', 'len'] };
    let html = '<div class="space-y-3">';

    if (fitDef.params.includes('hood_type')) {
        html += `
            <div>
                <label class="block text-xs text-slate-400 mb-1">Вид зонта</label>
                <select id="f_hood_type" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white">
                    <option value="Пристенный">Пристенный</option>
                    <option value="Островной">Островной</option>
                </select>
            </div>
        `;
    }

    if (fitDef.params.includes('deg')) html += `<div><label class="block text-xs text-slate-400 mb-1">Градус (°)</label><input type="number" id="f_deg" value="90" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('w')) html += `<div><label class="block text-xs text-slate-400 mb-1">Ширина (мм)</label><input type="number" id="f_w" value="400" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('h')) html += `<div><label class="block text-xs text-slate-400 mb-1">Высота (мм)</label><input type="number" id="f_h" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h', POPULAR_RECT)}</div>`;

    if (fitDef.params.includes('w1')) html += `<div><label class="block text-xs text-slate-400 mb-1">Ширина 1 (мм)</label><input type="number" id="f_w1" value="400" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w1', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('h1')) html += `<div><label class="block text-xs text-slate-400 mb-1">Высота 1 (мм)</label><input type="number" id="f_h1" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h1', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('w2')) html += `<div><label class="block text-xs text-slate-400 mb-1">Ширина 2 (мм)</label><input type="number" id="f_w2" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w2', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('h2')) html += `<div><label class="block text-xs text-slate-400 mb-1">Высота 2 (мм)</label><input type="number" id="f_h2" value="250" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h2', POPULAR_RECT)}</div>`;

    if (fitDef.params.includes('d')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр Ø (мм)</label><input type="number" id="f_d" value="200" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d1')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр 1 Ø (мм)</label><input type="number" id="f_d1" value="250" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d1', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d2')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр 2 Ø (мм)</label><input type="number" id="f_d2" value="200" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d2', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d_main')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр магистрали Ø (мм)</label><input type="number" id="f_d_main" value="315" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d_main', POPULAR_DIAM)}</div>`;

    if (fitDef.params.includes('len')) html += `<div><label class="block text-xs text-slate-400 mb-1">Длина L (мм)</label><input type="number" id="f_len" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('hood_seat')) html += `<div><label class="block text-xs text-slate-400 mb-1">Посадочное место (мм)</label><input type="number" id="f_hood_seat" value="100" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('offset')) html += `<div><label class="block text-xs text-slate-400 mb-1">Смещение (мм)</label><input type="number" id="f_offset" value="100" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('inlets_cnt')) html += `<div><label class="block text-xs text-slate-400 mb-1">Кол-во врезок (шт)</label><input type="number" id="f_inlets_cnt" value="2" min="1" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;

    if (fitDef.params.includes('flange1') || fitDef.params.includes('flange2')) {
        html += `
            <div class="pt-2 border-t border-slate-800">
                <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Шинка</div>
                <div class="flex gap-6 text-xs">
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_flange1" checked class="rounded text-blue-600"> <span>Сторона 1</span></label>
                    ${fitDef.params.includes('flange2') ? `<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="f_flange2" checked class="rounded text-blue-600"> <span>Сторона 2</span></label>` : ''}
                </div>
            </div>
        `;
    }

    html += '</div>';
    box.innerHTML = html;
}

function renderChipScroller(targetId, arr) {
    return `
        <div class="chip-scroll mt-1.5">
            ${arr.map(v => `<button type="button" onclick="document.getElementById('${targetId}').value = ${v}" class="chip-btn">${v}</button>`).join('')}
        </div>
    `;
}

// ==========================================
// СОХРАНЕНИЕ В БАЗУ ДАННЫХ SUPABASE (INSERT / UPDATE)
// ==========================================
async function saveProjectItem(e) {
    e.preventDefault();
    if (!session.insideProjectId) return;

    const editId = document.getElementById('editItemId').value;
    const metal = document.getElementById('inMetal').value;
    const thickness = Number(document.getElementById('inThickness').value);
    const qty = Number(document.getElementById('inQty').value) || 1;
    const price = Number(document.getElementById('inPrice').value) || 1000;

    const dimensions = {};
    let itemTitle = 'Изделие';

    if (session.activeCategory === 'duct') {
        itemTitle = session.activeShape === 'rect' ? 'Воздуховод прямой' : 'Воздуховод круглый';
        dimensions.l = Number(document.getElementById('f_l')?.value || 1250);
        if (session.activeShape === 'rect') {
            dimensions.w = Number(document.getElementById('f_w')?.value || 400);
            dimensions.h = Number(document.getElementById('f_h')?.value || 300);
            dimensions.flange1 = !!document.getElementById('f_flange1')?.checked;
            dimensions.flange2 = !!document.getElementById('f_flange2')?.checked;
        } else {
            dimensions.d = Number(document.getElementById('f_d')?.value || 200);
        }
    } else {
        const fitDef = (appConfig.fittings[session.activeShape] || []).find(f => f.id === document.getElementById('fittingTypeSelect').value);
        itemTitle = fitDef ? fitDef.name : 'Изделие';
        if (document.getElementById('f_w')) dimensions.w = Number(document.getElementById('f_w').value);
        if (document.getElementById('f_h')) dimensions.h = Number(document.getElementById('f_h').value);
        if (document.getElementById('f_w1')) dimensions.w1 = Number(document.getElementById('f_w1').value);
        if (document.getElementById('f_h1')) dimensions.h1 = Number(document.getElementById('f_h1').value);
        if (document.getElementById('f_w2')) dimensions.w2 = Number(document.getElementById('f_w2').value);
        if (document.getElementById('f_h2')) dimensions.h2 = Number(document.getElementById('f_h2').value);
        if (document.getElementById('f_d')) dimensions.d = Number(document.getElementById('f_d').value);
        if (document.getElementById('f_d1')) dimensions.d1 = Number(document.getElementById('f_d1').value);
        if (document.getElementById('f_d2')) dimensions.d2 = Number(document.getElementById('f_d2').value);
        if (document.getElementById('f_d_main')) dimensions.d_main = Number(document.getElementById('f_d_main').value);
        if (document.getElementById('f_len')) dimensions.l = Number(document.getElementById('f_len').value);
        if (document.getElementById('f_deg')) dimensions.deg = Number(document.getElementById('f_deg').value);
        if (document.getElementById('f_hood_seat')) dimensions.hood_seat = Number(document.getElementById('f_hood_seat').value);
        if (document.getElementById('f_offset')) dimensions.offset = Number(document.getElementById('f_offset').value);
        if (document.getElementById('f_inlets_cnt')) dimensions.inlets_cnt = Number(document.getElementById('f_inlets_cnt').value);
        if (document.getElementById('f_hood_type')) dimensions.hood_type = document.getElementById('f_hood_type').value;
        if (document.getElementById('f_flange1')) dimensions.flange1 = document.getElementById('f_flange1').checked;
        if (document.getElementById('f_flange2')) dimensions.flange2 = document.getElementById('f_flange2').checked;
    }

    const itemKey = `${session.activeCategory}_${session.activeShape}_${itemTitle}_${JSON.stringify(dimensions)}_${metal}_${thickness}`;

    if (editId) {
        // Редактирование
        await sb.from('items').update({
            title: itemTitle,
            metal,
            thickness,
            qty,
            price,
            dimensions,
            item_key: itemKey
        }).eq('id', editId);
    } else {
        // ПРОВЕРКА НА АВТОСУММИРОВАНИЕ В БАЗЕ
        const existing = currentProjectItems.find(i => i.item_key === itemKey);
        if (existing) {
            await sb.from('items').update({ qty: existing.qty + qty }).eq('id', existing.id);
        } else {
            await sb.from('items').insert([{
                project_id: session.insideProjectId,
                category: session.activeCategory,
                shape: session.activeShape,
                fitting_id: document.getElementById('fittingTypeSelect')?.value || '',
                title: itemTitle,
                metal,
                thickness,
                qty,
                price,
                dimensions,
                item_key: itemKey
            }]);
        }
    }

    resetItemForm();
    await loadProjectDataOnline(session.insideProjectId);
}

function resetItemForm() {
    document.getElementById('editItemId').value = '';
    document.getElementById('formHeaderTitle').textContent = 'Добавить в проект';
    document.getElementById('cancelEditBtn').classList.add('hidden');
    document.getElementById('submitItemBtn').textContent = 'Добавить в спецификацию';
    renderDynamicInputs();
}

// ==========================================
// СПЕЦИФИКАЦИЯ
// ==========================================
function renderSpecification() {
    const filterM = document.getElementById('specFilterMetal').value;
    const filterT = document.getElementById('specFilterThick').value;

    let items = currentProjectItems.filter(it => {
        if (filterM !== 'all' && it.metal !== filterM) return false;
        if (filterT !== 'all' && it.thickness !== Number(filterT)) return false;
        return true;
    });

    const container = document.getElementById('specificationAccordionList');
    container.innerHTML = '';

    const bulkBtn = document.getElementById('bulkDeleteBtn');
    document.getElementById('bulkCount').textContent = session.selectedSpecIds.length;
    bulkBtn.classList.toggle('hidden', session.selectedSpecIds.length === 0);

    if (items.length === 0) {
        container.innerHTML = `<div class="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">По выбранным фильтрам позиции не найдены</div>`;
        return;
    }

    const categories = [
        { id: 'sec_duct_rect', title: 'Воздуховоды прямоугольные', list: items.filter(i => i.category === 'duct' && i.shape === 'rect') },
        { id: 'sec_duct_round', title: 'Воздуховоды круглые', list: items.filter(i => i.category === 'duct' && i.shape === 'round') },
        { id: 'sec_fit_rect', title: 'Изделия прямоугольные', list: items.filter(i => i.category === 'fitting' && i.shape === 'rect') },
        { id: 'sec_fit_round', title: 'Изделия круглые', list: items.filter(i => i.category === 'fitting' && i.shape === 'round') },
        { id: 'sec_fit_smooth', title: 'Изделия плавные', list: items.filter(i => i.category === 'fitting' && i.shape === 'smooth') }
    ];

    categories.forEach(sec => {
        if (sec.list.length === 0) return;
        const isExpanded = session.accordionState[sec.id] !== false;

        const block = document.createElement('div');
        block.className = 'bg-slate-950 border border-slate-800 rounded-xl overflow-hidden';
        block.innerHTML = `
            <button onclick="toggleSectionAccordion('${sec.id}')" class="w-full p-3.5 bg-slate-900/60 border-b border-slate-800/80 flex justify-between items-center text-left hover:bg-slate-900 transition">
                <div class="flex items-center gap-2">
                    <span class="text-blue-400 font-bold text-xs">${isExpanded ? '▼' : '▶'}</span>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-200">${sec.title}</span>
                    <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full mono">${sec.list.length}</span>
                </div>
                <span class="text-xs text-slate-400 mono">Сумма: ${sec.list.reduce((s, i) => s + i.qty, 0)} шт</span>
            </button>
            <div id="${sec.id}_body" class="${isExpanded ? '' : 'hidden'} p-3 space-y-2">
                ${sec.list.map(it => renderSpecItemRow(it)).join('')}
            </div>
        `;
        container.appendChild(block);
    });
}

function toggleSectionAccordion(secId) {
    session.accordionState[secId] = (session.accordionState[secId] === false) ? true : false;
    renderSpecification();
}

function renderSpecItemRow(it) {
    const isSelected = session.selectedSpecIds.includes(it.id);
    const d = it.dimensions || {};
    let descParts = [];

    if (it.shape === 'rect' && it.category === 'duct') {
        descParts.push(`${d.w}×${d.h} мм`);
        descParts.push(`L=${d.l || 1250}`);
        const fl = [];
        if (d.flange1) fl.push('Сторона 1');
        if (d.flange2) fl.push('Сторона 2');
        if (fl.length) descParts.push(`Шинка: ${fl.join(', ')}`);
    } else if (it.shape === 'round' && it.category === 'duct') {
        descParts.push(`Ø${d.d} мм`);
        descParts.push(`L=${d.l || 1250}`);
    } else {
        if (d.hood_type) descParts.push(d.hood_type);
        if (d.deg) descParts.push(`${d.deg}°`);
        if (d.w1 && d.w2) descParts.push(`${d.w1}×${d.h1} → ${d.w2}×${d.h2}`);
        else if (d.w && d.h) descParts.push(`${d.w}×${d.h}`);
        if (d.d1 && d.d2) descParts.push(`Ø${d.d1} → Ø${d.d2}`);
        else if (d.d) descParts.push(`Ø${d.d}`);
        if (d.d_main) descParts.push(`Осн: Ø${d.d_main}`);
        if (d.l) descParts.push(`L=${d.l}`);
        if (d.hood_seat) descParts.push(`Посадка: ${d.hood_seat} мм`);
        if (d.offset) descParts.push(`Смещение: ${d.offset} мм`);
        if (d.inlets_cnt) descParts.push(`Врезок: ${d.inlets_cnt} шт`);
    }

    return `
        <div class="bg-slate-900 border ${isSelected ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'} rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div class="flex items-start gap-3 w-full sm:w-auto">
                <input type="checkbox" onchange="toggleSpecItemSelect(${it.id}, this.checked)" ${isSelected ? 'checked' : ''} class="mt-1 rounded text-blue-600">
                <div>
                    <div class="font-bold text-xs text-white">${it.title}</div>
                    <div class="text-xs text-blue-300 mono mt-0.5">${descParts.join(' | ')}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Металл: <strong class="text-slate-200">${it.metal} ${it.thickness} мм</strong> ${isDev() ? `| Тариф: <span class="mono text-emerald-400">${it.price} ₸</span>` : ''}</div>
                </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div class="text-sm font-black mono text-white">${it.qty} шт</div>
                <div class="flex gap-1">
                    <button onclick="editProjectItem(${it.id})" title="Редактировать" class="bg-slate-800 hover:bg-slate-700 text-blue-400 px-2.5 py-1.5 rounded-lg text-xs">✎</button>
                    <button onclick="deleteSingleItem(${it.id})" title="Удалить" class="bg-slate-800 hover:bg-slate-700 text-rose-400 px-2.5 py-1.5 rounded-lg text-xs">✕</button>
                </div>
            </div>
        </div>
    `;
}

function toggleSpecItemSelect(id, checked) {
    if (checked) {
        if (!session.selectedSpecIds.includes(id)) session.selectedSpecIds.push(id);
    } else {
        session.selectedSpecIds = session.selectedSpecIds.filter(x => x !== id);
    }
    renderSpecification();
}

async function deleteSelectedItems() {
    if (!confirm(`Удалить выбранные позиции (${session.selectedSpecIds.length} шт)?`)) return;
    await sb.from('items').delete().in('id', session.selectedSpecIds);
    session.selectedSpecIds = [];
    await loadProjectDataOnline(session.insideProjectId);
}

async function deleteSingleItem(id) {
    await sb.from('items').delete().eq('id', id);
    await loadProjectDataOnline(session.insideProjectId);
}

function editProjectItem(id) {
    const it = currentProjectItems.find(x => x.id === id);
    if (!it) return;

    document.getElementById('editItemId').value = it.id;
    document.getElementById('formHeaderTitle').textContent = 'Редактировать позицию';
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('submitItemBtn').textContent = 'Сохранить изменения';

    selectCategory(it.category);
    selectShape(it.shape);

    document.getElementById('inMetal').value = it.metal;
    document.getElementById('inThickness').value = it.thickness;
    document.getElementById('inQty').value = it.qty;
    document.getElementById('inPrice').value = it.price;

    renderDynamicInputs();

    const d = it.dimensions || {};
    if (document.getElementById('f_w')) document.getElementById('f_w').value = d.w || 400;
    if (document.getElementById('f_h')) document.getElementById('f_h').value = d.h || 300;
    if (document.getElementById('f_d')) document.getElementById('f_d').value = d.d || 200;
    if (document.getElementById('f_l')) document.getElementById('f_l').value = d.l || 1250;
    if (document.getElementById('f_w1')) document.getElementById('f_w1').value = d.w1 || 400;
    if (document.getElementById('f_h1')) document.getElementById('f_h1').value = d.h1 || 300;
    if (document.getElementById('f_w2')) document.getElementById('f_w2').value = d.w2 || 300;
    if (document.getElementById('f_h2')) document.getElementById('f_h2').value = d.h2 || 250;
    if (document.getElementById('f_d1')) document.getElementById('f_d1').value = d.d1 || 250;
    if (document.getElementById('f_d2')) document.getElementById('f_d2').value = d.d2 || 200;
    if (document.getElementById('f_d_main')) document.getElementById('f_d_main').value = d.d_main || 315;
    if (document.getElementById('f_deg')) document.getElementById('f_deg').value = d.deg || 90;
    if (document.getElementById('f_offset')) document.getElementById('f_offset').value = d.offset || 100;
    if (document.getElementById('f_hood_seat')) document.getElementById('f_hood_seat').value = d.hood_seat || 100;
    if (document.getElementById('f_inlets_cnt')) document.getElementById('f_inlets_cnt').value = d.inlets_cnt || 2;
    if (document.getElementById('f_flange1')) document.getElementById('f_flange1').checked = d.flange1;
    if (document.getElementById('f_flange2')) document.getElementById('f_flange2').checked = d.flange2;

    window.scrollTo({ top: document.getElementById('itemFormCard').offsetTop - 60, behavior: 'smooth' });
}

// ==========================================
// ШИНКА В ПРОЕКТЕ
// ==========================================
function renderProjectFlange() {
    const packLen = Number(document.getElementById('projPackLen').value) || 3000;
    const kerf = Number(document.getElementById('projKerf').value) || 2;
    const roundMode = document.getElementById('projFlangeRound').value;

    const sides = {};
    currentProjectItems.forEach(it => {
        const d = it.dimensions || {};
        if (it.shape === 'rect' || it.shape === 'smooth') {
            const add = (w, h) => {
                const k = `${w}×${h}`;
                sides[k] = (sides[k] || 0) + it.qty;
            };
            if (d.flange1) add(d.w || d.w1 || 400, d.h || d.h1 || 300);
            if (d.flange2 && it.shape === 'rect') add(d.w || d.w2 || 400, d.h || d.h2 || 300);
        }
    });

    document.getElementById('projFlangeOutput').innerHTML = buildFlangeCalculationUI(sides, packLen, kerf, roundMode, []);
}

function buildFlangeCalculationUI(sidesObj, packLen, kerf, roundMode, scrapsList) {
    const cutsNeeded = {};
    for (let [sizeStr, sidesCount] of Object.entries(sidesObj)) {
        const parts = sizeStr.split('×').map(Number);
        const cutW = Math.max(0, parts[0] - 30);
        const cutH = Math.max(0, parts[1] - 30);
        cutsNeeded[cutW] = (cutsNeeded[cutW] || 0) + (2 * sidesCount);
        cutsNeeded[cutH] = (cutsNeeded[cutH] || 0) + (2 * sidesCount);
    }

    if (Object.keys(cutsNeeded).length === 0) {
        return `<div class="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">В проекте нет прямоугольных сторон с шинкой</div>`;
    }

    const packCuts = [];
    const singleTails = [];

    for (let [cutLenStr, qty] of Object.entries(cutsNeeded)) {
        const len = Number(cutLenStr);
        const fullPacks = Math.floor(qty / 10);
        const rem = qty % 10;
        for (let i = 0; i < fullPacks; i++) packCuts.push(len);
        if (rem > 0) {
            if (roundMode === 'up') packCuts.push(len);
            else singleTails.push({ len, qty: rem });
        }
    }

    packCuts.sort((a, b) => b - a);

    const resultPacks = [];
    packCuts.forEach(c => {
        let placed = false;
        for (let p of resultPacks) {
            const used = p.cuts.reduce((s, x) => s + x + kerf, 0);
            if (used + c <= p.totalLen) {
                p.cuts.push(c);
                placed = true;
                break;
            }
        }
        if (!placed) {
            resultPacks.push({ totalLen: packLen, cuts: [c] });
        }
    });

    let html = `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-blue-400 uppercase tracking-wider text-xs">Стороны для сборщика:</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mono">
                ${Object.entries(sidesObj).map(([k, v]) => `<div class="bg-slate-900 p-2 rounded-lg border border-slate-800/80">${k} — <strong class="text-white">${v} сторон</strong></div>`).join('')}
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-emerald-400 uppercase tracking-wider text-xs">Количество шинок (Сторона − 30 мм):</div>
            <div class="flex flex-wrap gap-2 mono">
                ${Object.entries(cutsNeeded).map(([k, v]) => `<span class="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200">${k} мм — <strong class="text-emerald-400">${v} шт</strong></span>`).join('')}
            </div>
        </div>

        <div class="space-y-3">
            <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-white uppercase tracking-wider">Карты реза пачек (1 рез = 10 шинок):</span>
                <span class="text-slate-400">Пачек по 10 хлыстов: <strong class="text-blue-400 mono">${resultPacks.length} шт</strong></span>
            </div>
            <div class="space-y-2.5">
    `;

    resultPacks.forEach((p, idx) => {
        const used = p.cuts.reduce((s, x) => s + x + kerf, 0);
        const rem = p.totalLen - used;
        html += `
            <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div class="flex justify-between text-xs">
                    <span class="font-bold text-white">Пачка №${idx + 1} (${p.totalLen} мм)</span>
                    <span class="text-slate-400">Остаток: <strong class="text-amber-400 mono">${rem} мм</strong></span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${p.cuts.map(c => `<span class="bg-blue-950 border border-blue-700 text-blue-200 px-3 py-1 rounded-lg text-xs mono font-bold">Рез ${c} мм (10 шт)</span>`).join('')}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    return html;
}

function exportFlangeText(mode) {
    let text = `MAXVENT TOOLS — НАРЯД НА ШИНКУ\n`;
    document.querySelectorAll('#projFlangeOutput .grid div').forEach(d => text += `- ${d.textContent.trim()}\n`);
    navigator.clipboard.writeText(text);
    alert('Наряд скопирован в буфер обмена!');
}

// ==========================================
// 2D РАСКРОЙ ЛИСТА
// ==========================================
function renderProjectNesting() {
    const ducts = currentProjectItems.filter(i => i.category === 'duct');
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
        tabs.innerHTML = `<span class="text-xs text-slate-500">В проекте нет воздуховодов для раскроя</span>`;
        document.getElementById('nestingDuctsSelectionBox').innerHTML = '';
        document.getElementById('nestingVisualizerBox').innerHTML = '';
        return;
    }

    if (!session.activeNestingKey || !queues[session.activeNestingKey]) {
        session.activeNestingKey = keys[0];
    }

    keys.forEach(k => {
        const btn = document.createElement('button');
        btn.className = `px-3.5 py-2 rounded-xl text-xs font-bold ${k === session.activeNestingKey ? 'bg-blue-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-300'}`;
        btn.textContent = `${k} (${queues[k].reduce((s, i) => s + i.qty, 0)} шт)`;
        btn.onclick = () => { session.activeNestingKey = k; renderProjectNesting(); };
        tabs.appendChild(btn);
    });

    const currentDucts = queues[session.activeNestingKey];
    const selBox = document.getElementById('nestingDuctsSelectionBox');
    selBox.innerHTML = `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div class="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span class="font-bold text-white">Воздуховоды в раскрой:</span>
                <span class="text-slate-400">Лист: <strong class="text-blue-400 mono">2500 × 1250 мм</strong></span>
            </div>
            <div class="space-y-2">
                ${currentDucts.map(d => {
                    const dim = d.dimensions || {};
                    const unfold = d.shape === 'rect' ? (2 * ((dim.w || 400) + (dim.h || 300)) + 41) : Math.round(Math.PI * (dim.d || 200) + 22);
                    const name = d.shape === 'rect' ? `${dim.w}×${dim.h}` : `Ø${dim.d}`;
                    return `
                        <div class="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                            <span class="font-bold text-white">${name} <span class="text-slate-400 font-normal">(${unfold} ×${dim.l || 1250} мм)</span></span>
                            <span class="font-bold mono text-blue-300">${d.qty} шт</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="pt-2 flex justify-end">
                <button onclick="calculateNesting2D()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl">
                    Рассчитать раскрой
                </button>
            </div>
        </div>
    `;
}

function calculateNesting2D() {
    const ducts = currentProjectItems.filter(i => i.category === 'duct' && `${i.metal} ${i.thickness} мм` === session.activeNestingKey);
    const partsToCut = [];
    ducts.forEach(d => {
        const dim = d.dimensions || {};
        const unfoldL = d.shape === 'rect' ? (2 * ((dim.w || 400) + (dim.h || 300)) + 41) : Math.round(Math.PI * (dim.d || 200) + 22);
        const name = d.shape === 'rect' ? `${dim.w}×${dim.h}` : `Ø${dim.d}`;
        for (let i = 0; i < d.qty; i++) {
            partsToCut.push({ label: name, cutL: unfoldL, cutW: dim.l || 1250 });
        }
    });

    const sheetL = 2500;
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
            sheets.push({ parts: [pt] });
        }
    });

    const box = document.getElementById('nestingVisualizerBox');
    let html = `
        <div class="text-xs font-bold text-white uppercase tracking-wider mb-2">Всего листов 2500×1250: ${sheets.length} шт</div>
        <div class="space-y-4">
    `;

    sheets.forEach((s, idx) => {
        const usedL = s.parts.reduce((sum, item) => sum + item.cutL, 0);
        const remL = sheetL - usedL;

        html += `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div class="flex justify-between text-xs">
                    <span class="font-bold text-white">Лист №${idx + 1}</span>
                    <span class="text-slate-400">Остаток: <strong class="text-amber-400 mono">${remL} мм</strong></span>
                </div>
                <div class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 flex h-24 overflow-hidden relative">
                    ${s.parts.map(pt => {
                        const widthPct = (pt.cutL / sheetL) * 100;
                        return `
                            <div style="width: ${widthPct}%" class="h-full bg-blue-900/60 border-r border-blue-500/80 p-1 flex flex-col justify-between overflow-hidden">
                                <div class="text-[11px] font-bold text-white truncate">${pt.label}</div>
                                <div class="text-[9px] mono text-blue-200 truncate">${pt.cutL} мм</div>
                            </div>
                        `;
                    }).join('')}
                    ${remL > 0 ? `<div style="width: ${(remL / sheetL) * 100}%" class="h-full bg-amber-950/30 flex items-center justify-center text-[10px] text-amber-400 mono truncate">Остаток ${remL} мм</div>` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    box.innerHTML = html;
}

// ==========================================
// ФИНАНСЫ ПРОЕКТА
// ==========================================
function calculateProjectFinances() {
    let totalSum = 0;
    currentProjectItems.forEach(it => {
        const d = it.dimensions || {};
        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' ? (2 * ((d.w || 400) + (d.h || 300)) + 41) : Math.round(Math.PI * (d.d || 200) + 22);
            const area = (unfold * (d.l || 1250) * it.qty) / 1e6;
            totalSum += Math.round(area * it.price);
        } else {
            totalSum += Math.round(it.qty * it.price);
        }
    });

    const paid = currentProjectPayments.reduce((s, pay) => s + pay.amount, 0);
    const debt = Math.max(0, totalSum - paid);
    return { totalSum, paid, debt };
}

function renderProjectFinance() {
    const fin = calculateProjectFinances();
    const body = document.getElementById('projFinanceBody');
    body.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-xs text-slate-400">Стоимость заказа:</div>
                <div class="text-xl font-bold mono text-white mt-1">${fin.totalSum.toLocaleString()} ₸</div>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-xs text-slate-400">Оплачено:</div>
                <div class="text-xl font-bold mono text-emerald-400 mt-1">${fin.paid.toLocaleString()} ₸</div>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-xs text-slate-400">Остаток долга:</div>
                <div class="text-xl font-bold mono text-amber-400 mt-1">${fin.debt.toLocaleString()} ₸</div>
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div class="font-bold text-white text-xs uppercase tracking-wider">Зафиксировать платеж</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" id="payAmountInput" placeholder="Сумма (₸)" class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs mono text-white font-bold">
                <input type="text" id="payNoteInput" placeholder="Примечание" class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                <button onclick="addProjectPaymentOnline()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg py-2">
                    + Внести платеж
                </button>
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-white text-xs uppercase tracking-wider">История платежей:</div>
            <div class="space-y-1.5 mono">
                ${currentProjectPayments.map(pay => `
                    <div class="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <div><span class="text-slate-400">${pay.payment_date}</span> — <strong class="text-emerald-400">${pay.amount.toLocaleString()} ₸</strong> <span class="text-slate-400">(${pay.note || '—'})</span></div>
                        <button onclick="deletePaymentOnline(${pay.id})" class="text-slate-500 hover:text-rose-400 font-bold px-2">✕</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function addProjectPaymentOnline() {
    const amt = Number(document.getElementById('payAmountInput').value);
    const note = document.getElementById('payNoteInput').value.trim();
    if (!amt || amt <= 0) return;

    await sb.from('payments').insert([{
        project_id: session.insideProjectId,
        amount: amt,
        note
    }]);

    await loadProjectDataOnline(session.insideProjectId);
}

async function deletePaymentOnline(id) {
    await sb.from('payments').delete().eq('id', id);
    await loadProjectDataOnline(session.insideProjectId);
}

// ==========================================
// ГЛОБАЛЬНЫЙ ФИНАНСОВЫЙ ОТЧЕТ
// ==========================================
async function openGlobalFinanceModal() {
    document.getElementById('profileDropdown').classList.add('hidden');
    const modal = document.getElementById('globalFinanceModal');
    modal.classList.remove('hidden');

    const { data: allItems } = await sb.from('items').select('*');
    const { data: allPayments } = await sb.from('payments').select('*');

    let grandTotal = 0;
    (allItems || []).forEach(it => {
        const d = it.dimensions || {};
        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' ? (2 * ((d.w || 400) + (d.h || 300)) + 41) : Math.round(Math.PI * (d.d || 200) + 22);
            grandTotal += Math.round(((unfold * (d.l || 1250) * it.qty) / 1e6) * it.price);
        } else {
            grandTotal += Math.round(it.qty * it.price);
        }
    });

    const grandPaid = (allPayments || []).reduce((s, p) => s + p.amount, 0);
    const grandDebt = Math.max(0, grandTotal - grandPaid);

    document.getElementById('globalFinanceContent').innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-slate-400">Сумма заказов:</div>
                <div class="text-xl font-bold mono text-white mt-1">${grandTotal.toLocaleString()} ₸</div>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-slate-400">Всего оплачено:</div>
                <div class="text-xl font-bold mono text-emerald-400 mt-1">${grandPaid.toLocaleString()} ₸</div>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-slate-400">Общий остаток долга:</div>
                <div class="text-xl font-bold mono text-amber-400 mt-1">${grandDebt.toLocaleString()} ₸</div>
            </div>
        </div>
    `;
}

function closeGlobalFinanceModal() {
    document.getElementById('globalFinanceModal').classList.add('hidden');
}

// ==========================================
// АВТОНОМНЫЙ КАЛЬКУЛЯТОР ШИНКИ
// ==========================================
function openStandaloneFlange() {
    document.getElementById('standaloneFlangeModal').classList.remove('hidden');
    renderStandaloneFlange();
}

function closeStandaloneFlange() {
    document.getElementById('standaloneFlangeModal').classList.add('hidden');
}

function addStandaloneFlangeRow() {
    const w = Number(document.getElementById('stW').value);
    const h = Number(document.getElementById('stH').value);
    const sides = Number(document.getElementById('stSides').value);
    const qty = Number(document.getElementById('stQty').value);
    if (!w || !h || !sides || !qty) return;

    const totalSides = sides * qty;
    const existing = standaloneFlange.rows.find(r => r.w === w && r.h === h);
    if (existing) {
        existing.totalSides += totalSides;
    } else {
        standaloneFlange.rows.push({ w, h, totalSides });
    }
    renderStandaloneFlange();
}

function clearStandaloneFlange() {
    standaloneFlange.rows = [];
    renderStandaloneFlange();
}

function renderStandaloneFlange() {
    const packLen = Number(document.getElementById('stPackLen').value) || 3000;
    const kerf = Number(document.getElementById('stKerf').value) || 2;
    const roundMode = document.getElementById('stRound').value;

    const sidesObj = {};
    standaloneFlange.rows.forEach(r => {
        const k = `${r.w}×${r.h}`;
        sidesObj[k] = (sidesObj[k] || 0) + r.totalSides;
    });

    document.getElementById('stFlangeOutput').innerHTML = buildFlangeCalculationUI(sidesObj, packLen, kerf, roundMode, []);
}

// ==========================================
// МЕНЮ РАЗРАБОТЧИКА И ЭКСПОРТ АРХИВА
// ==========================================
function openDevModal() {
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('devModal').classList.remove('hidden');
    renderDevCatalogs();
}

function closeDevModal() {
    document.getElementById('devModal').classList.add('hidden');
}

function renderDevCatalogs() {
    document.getElementById('devMetalsList').innerHTML = appConfig.metals.map((m, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white flex items-center gap-1">${m} <button onclick="removeCatalogItem('metals', ${i})" class="text-slate-500 hover:text-rose-400">×</button></span>
    `).join('');
    document.getElementById('devThickList').innerHTML = appConfig.thicknesses.map((t, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white mono flex items-center gap-1">${t} мм <button onclick="removeCatalogItem('thicknesses', ${i})" class="text-slate-500 hover:text-rose-400">×</button></span>
    `).join('');
    document.getElementById('devGroupsList').innerHTML = appConfig.groups.map((g, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white flex items-center gap-1">${g} <button onclick="removeCatalogItem('groups', ${i})" class="text-slate-500 hover:text-rose-400">×</button></span>
    `).join('');
}

async function addCatalogItem(type, inputId) {
    const inp = document.getElementById(inputId);
    const val = type === 'thicknesses' ? Number(inp.value) : inp.value.trim();
    if (!val || appConfig[type].includes(val)) return;

    appConfig[type].push(val);
    inp.value = '';
    await sb.from('app_settings').upsert({ id: 'global_config', [type]: appConfig[type] });
    renderDevCatalogs();
}

async function removeCatalogItem(type, idx) {
    appConfig[type].splice(idx, 1);
    await sb.from('app_settings').upsert({ id: 'global_config', [type]: appConfig[type] });
    renderDevCatalogs();
}

async function exportMonthlyArchive() {
    const { data: projects } = await sb.from('projects').select('*');
    const { data: items } = await sb.from('items').select('*');
    const { data: payments } = await sb.from('payments').select('*');

    const fullArchive = { projects, items, payments, exportedAt: new Date() };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullArchive, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `Maxvent_Archive_${new Date().toISOString().slice(0,7)}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
}

async function startNewMonthClean() {
    if (!confirm('Удалить из облака все архивные проекты? Активные заказы останутся в работе.')) return;
    await sb.from('projects').delete().eq('archive_state', 'archived');
    closeDevModal();
    await fetchProjectsList();
    alert('Архивные проекты очищены!');
}

// Запуск
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});
