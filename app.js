// ==========================================
// ЧАСТЬ 1: ИНИЦИАЛИЗАЦИЯ SUPABASE И КОНСТАНТЫ
// ==========================================
const SUPABASE_URL = "https://anwuikxtqesewifvipaw.supabase.co";
const SUPABASE_KEY = "sb_publishable_7ENnMe3mS3P4dIsNUC3YAQ_ATVta-In";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const POPULAR_RECT = [100, 150, 200, 225, 250, 285, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
const POPULAR_DIAM = [100, 125, 140, 150, 160, 180, 200, 225, 250, 280, 300, 315, 355, 400, 450, 500];
const POPULAR_LEN_SILENCER = [500, 600, 1000, 1250];

const ALL_PARAM_DEFS = [
    { code: 'deg', label: 'Градус (°)' },
    { code: 'deg135', label: 'Градус (по умолч. 135°)' },
    { code: 'hood_type', label: 'Вид зонта (Пристенный/Островной)' },
    { code: 'w', label: 'Ширина (мм)' },
    { code: 'h', label: 'Высота (мм)' },
    { code: 'w1', label: 'Ширина 1 (мм)' },
    { code: 'h1', label: 'Высота 1 (мм)' },
    { code: 'w2', label: 'Ширина 2 (мм)' },
    { code: 'h2', label: 'Высота 2 (мм)' },
    { code: 'd', label: 'Диаметр Ø (мм)' },
    { code: 'd1', label: 'Диаметр 1 Ø (мм)' },
    { code: 'd2', label: 'Диаметр 2 Ø (мм)' },
    { code: 'd_main', label: 'Диаметр осн. воздуховода Ø' },
    { code: 'len', label: 'Длина L (мм)' },
    { code: 'len_silencer', label: 'Длина (500/600/1000/1250)' },
    { code: 'hood_seat', label: 'Длина посадочного места' },
    { code: 'offset', label: 'Смещение (мм)' },
    { code: 'inlets_cnt', label: 'Количество врезок (шт)' },
    { code: 'tee_rect', label: 'Тройник прямоуг. (3 стороны + галочка)' },
    { code: 'cross_rect', label: 'Крестовина прямоуг. (4 стороны + галочка)' },
    { code: 'tee_round', label: 'Тройник круглый (3 диаметра + галочка)' },
    { code: 'cross_round', label: 'Крестовина круглая (4 диаметра + галочка)' },
    { code: 'flange1', label: 'Шинка: Сторона 1' },
    { code: 'flange2', label: 'Шинка: Сторона 1 и Сторона 2' }
];

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
        { id: 's_inlet_r2c', name: 'Врезка прямоуг. на круглый', params: ['w', 'h', 'd_main', 'len'], price: 1000 },
        { id: 's_inlet_c2r', name: 'Врезка круглый на прямоуг.', params: ['d', 'len'], price: 1000 },
        { id: 's_tee', name: 'Тройник', params: ['w', 'h', 'd_main', 'flange1'], price: 1000 },
        { id: 's_silencer', name: 'Шумоглушитель', params: ['w', 'h', 'd', 'len_silencer', 'flange1'], price: 1000 },
        { id: 's_hood', name: 'Зонт вытяжной', params: ['w', 'h', 'd', 'len'], price: 1000 },
        { id: 's_ksd', name: 'КСД', params: ['w', 'h', 'len', 'd', 'inlets_cnt'], price: 1000 }
    ]
};

let appState = {
    users: [],
    metals: ['Оц.', 'Нерж.', 'Краш.'],
    thicknesses: [0.45, 0.5, 0.6, 0.7, 0.8, 1.0],
    groups: ['Бригада №1', 'Бригада №2', 'Цех (Самовывоз)'],
    fittings: JSON.parse(JSON.stringify(DEFAULT_FITTINGS)),
    projects: [],
    allItems: [],
    allPayments: [],
    activeProjectItems: [],
    activeProjectPayments: [],
    activeProjectNestings: {},
    standaloneFlange: { rows: [], scraps: [] }
};

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

// ==========================================
// ЗАГРУЗКА И СИНХРОНИЗАЦИЯ С SUPABASE
// ==========================================
async function loadInitialData() {
    const ind = document.getElementById('cloudIndicator');
    const authSt = document.getElementById('cloudStatusAuth');
    if (ind) { ind.textContent = '● Загрузка из базы...'; ind.className = 'text-[10px] text-amber-400'; }

    try {
        // 1. Загрузка справочников
        let { data: setts } = await supabaseClient.from('app_settings').select('*').eq('id', 'global_config').maybeSingle();
        if (!setts) {
            const { data: created } = await supabaseClient.from('app_settings').insert({
                id: 'global_config',
                metals: appState.metals,
                thicknesses: appState.thicknesses,
                groups: appState.groups,
                fittings: appState.fittings,
                standalone_flange: appState.standaloneFlange
            }).select().single();
            setts = created;
        }
        if (setts) {
            if (Array.isArray(setts.metals) && setts.metals.length) appState.metals = setts.metals;
            if (Array.isArray(setts.thicknesses) && setts.thicknesses.length) appState.thicknesses = setts.thicknesses;
            if (Array.isArray(setts.groups) && setts.groups.length) appState.groups = setts.groups;
            if (setts.fittings && setts.fittings.rect) appState.fittings = setts.fittings;
            if (setts.standalone_flange) appState.standaloneFlange = setts.standalone_flange;
        }

        // 2. Загрузка пользователей (если пусто — создаем админа с кодом 7777)
        let { data: uList } = await supabaseClient.from('users').select('*').order('id', { ascending: true });
        if (!uList || uList.length === 0) {
            const { data: defAdmin } = await supabaseClient.from('users').insert({
                name: 'Владелец (Админ)',
                access_code: '7777',
                role: 'developer'
            }).select().single();
            uList = defAdmin ? [defAdmin] : [];
        }
        appState.users = uList;

        // 3. Загрузка всех проектов, позиций и платежей
        const [pRes, itRes, payRes] = await Promise.all([
            supabaseClient.from('projects').select('*').order('id', { ascending: false }),
            supabaseClient.from('items').select('*').order('id', { ascending: true }),
            supabaseClient.from('payments').select('*').order('id', { ascending: true })
        ]);

        appState.projects = pRes.data || [];
        appState.allItems = (itRes.data || []).map(i => ({ ...i, ...(i.dimensions || {}) }));
        appState.allPayments = payRes.data || [];

        if (ind) { ind.textContent = '● Онлайн (Supabase)'; ind.className = 'text-[10px] text-emerald-400'; }
        if (authSt) authSt.textContent = 'Онлайн-база: подключено ✓';

        checkAuthState();
        refreshCurrentScreen();
    } catch (err) {
        console.error('Supabase load error:', err);
        if (ind) { ind.textContent = '● Ошибка связи с базой'; ind.className = 'text-[10px] text-rose-400'; }
        if (authSt) authSt.textContent = 'Ошибка подключения к базе';
    }
}

async function saveGlobalSettings() {
    await supabaseClient.from('app_settings').upsert({
        id: 'global_config',
        metals: appState.metals,
        thicknesses: appState.thicknesses,
        groups: appState.groups,
        fittings: appState.fittings,
        standalone_flange: appState.standaloneFlange
    });
}

async function loadProjectDetails(projectId) {
    try {
        const [itRes, payRes, nestRes] = await Promise.all([
            supabaseClient.from('items').select('*').eq('project_id', projectId).order('id', { ascending: true }),
            supabaseClient.from('payments').select('*').eq('project_id', projectId).order('id', { ascending: true }),
            supabaseClient.from('nestings').select('*').eq('project_id', projectId)
        ]);

        appState.activeProjectItems = (itRes.data || []).map(i => ({
            ...i,
            ...(i.dimensions || {})
        }));
        appState.activeProjectPayments = payRes.data || [];

        // Синхронизируем с глобальным кэшем
        appState.allItems = appState.allItems.filter(x => x.project_id !== projectId).concat(appState.activeProjectItems);
        appState.allPayments = appState.allPayments.filter(x => x.project_id !== projectId).concat(appState.activeProjectPayments);

        appState.activeProjectNestings = {};
        (nestRes.data || []).forEach(n => {
            appState.activeProjectNestings[n.metal_key] = { sheets: n.sheets };
        });
    } catch (e) {
        console.error('Error loading project details:', e);
    }
}

// ==========================================
// АВТОРИЗАЦИЯ СТРОГО ПО КОДУ ДОСТУПА
// ==========================================
async function handleAuthSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('authCodeInput').value.trim();
    const err = document.getElementById('authError');
    err.classList.add('hidden');

    const u = appState.users.find(x => String(x.access_code || x.pass || '').trim() === code);
    if (!u) {
        err.textContent = 'Неверный код доступа. Обратитесь к руководителю цеха.';
        err.classList.remove('hidden');
        return;
    }

    session.user = u;
    session.devMode = (u.role === 'developer');
    localStorage.setItem('mv_online_session', JSON.stringify({ userId: u.id, devMode: session.devMode }));
    document.getElementById('authCodeInput').value = '';
    checkAuthState();
}

function checkAuthState() {
    const screen = document.getElementById('authScreen');
    if (!session.user) {
        const saved = localStorage.getItem('mv_online_session');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const found = appState.users.find(u => u.id === parsed.userId);
                if (found) {
                    session.user = found;
                    session.devMode = (found.role === 'developer') ? parsed.devMode : false;
                }
            } catch (e) {}
        }
    }

    if (!session.user) {
        screen.classList.remove('hidden');
    } else {
        screen.classList.add('hidden');
        updateHeaderUI();
        if (document.getElementById('projectScreen').classList.contains('hidden')) {
            goToMainMenu();
        }
    }
}

function logout() {
    session.user = null;
    localStorage.removeItem('mv_online_session');
    document.getElementById('profileDropdown').classList.add('hidden');
    checkAuthState();
}

function isDev() {
    return session.user?.role === 'developer' && session.devMode;
}

function toggleDevMode() {
    if (session.user?.role !== 'developer') return;
    session.devMode = !session.devMode;
    localStorage.setItem('mv_online_session', JSON.stringify({ userId: session.user.id, devMode: session.devMode }));
    updateHeaderUI();
    refreshCurrentScreen();
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
    document.getElementById('inTab-finance').classList.toggle('hidden', !isDev());
}

function toggleProfileMenu() {
    document.getElementById('profileDropdown').classList.toggle('hidden');
}

async function openProfileEditModal() {
    document.getElementById('profileDropdown').classList.add('hidden');
    const newName = prompt('Введите ваше новое имя:', session.user.name);
    if (newName && newName.trim()) {
        const trimmed = newName.trim();
        session.user.name = trimmed;
        await supabaseClient.from('users').update({ name: trimmed }).eq('id', session.user.id);
        const u = appState.users.find(x => x.id === session.user.id);
        if (u) u.name = trimmed;
        updateHeaderUI();
    }
}

function refreshCurrentScreen() {
    if (!document.getElementById('projectScreen').classList.contains('hidden')) {
        renderProjectInside();
    } else {
        renderMainMenuProjects();
    }
}

// ==========================================
// ГЛАВНОЕ МЕНЮ И ПРОЕКТЫ
// ==========================================
function goToMainMenu() {
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('projectScreen').classList.add('hidden');
    document.getElementById('mainMenuScreen').classList.remove('hidden');
    session.clickedProjectId = null;
    renderMainMenuProjects();
}

function setProjectFilter(f) {
    session.projectFilter = f;
    session.clickedProjectId = null;
    document.getElementById('btnProjActive').className = f === 'active' ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white' : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400';
    document.getElementById('btnProjArchived').className = f === 'archived' ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white' : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400';
    renderMainMenuProjects();
}

function toggleProjectsSection() {
    document.getElementById('projectsMainGrid').classList.toggle('hidden');
}

function renderMainMenuProjects() {
    const list = appState.projects.filter(p => (p.archive_state || 'active') === session.projectFilter);
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
        btn.onclick = async () => {
            session.clickedProjectId = (session.clickedProjectId === p.id) ? null : p.id;
            if (session.clickedProjectId) {
                await loadProjectDetails(p.id);
            }
            renderMainMenuProjects();
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
        <div class="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-3">
            <div>
                <h3 class="text-base font-black text-white">${p.title}</h3>
                <p class="text-xs text-slate-400 mt-0.5">${p.description || 'Описание не указано'}</p>
            </div>
            <div class="text-right">
                <span class="text-xs px-2.5 py-1 rounded-lg font-bold ${p.status_text === 'Воздуховоды отрезаны' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-blue-400 border border-slate-700'}">${p.status_text || 'В работе'}</span>
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

        <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div class="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">Состав проекта:</div>
            ${treeHtml || '<div class="text-slate-500">В проекте пока нет позиций</div>'}
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
                if (it.shape === 'rect') dimText = `${it.w}х${it.h} | L=${it.l || 1250}`;
                else if (it.shape === 'round') dimText = `Ø${it.d} | L=${it.l || 1250}`;
                else dimText = `${it.w1 || it.w}х${it.h1 || it.h} → Ø${it.d}`;
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
        await supabaseClient.from('projects').update({
            title, description: desc, group_name: group, status_text: statusText, updated_at: new Date().toISOString()
        }).eq('id', Number(editId));

        const p = appState.projects.find(x => x.id === Number(editId));
        if (p) {
            p.title = title;
            p.description = desc;
            p.group_name = group;
            p.status_text = statusText;
        }
    } else {
        const { data: newP } = await supabaseClient.from('projects').insert({
            title, description: desc, group_name: group, status_text: statusText, archive_state: 'active', flange_scraps: []
        }).select().single();

        if (newP) {
            appState.projects.unshift(newP);
            session.clickedProjectId = newP.id;
            await loadProjectDetails(newP.id);
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
    } else {
        p.archive_state = 'active';
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
    renderMainMenuProjects();
}

// ==========================================
// ВНУТРИ ПРОЕКТА И СВОДКА
// ==========================================
async function openInsideProject(id) {
    session.insideProjectId = id;
    session.selectedSpecIds = [];
    document.getElementById('mainMenuScreen').classList.add('hidden');
    document.getElementById('projectScreen').classList.remove('hidden');

    const p = appState.projects.find(x => x.id === id);
    document.getElementById('activeProjTitleHeader').textContent = p ? p.title : 'Проект';
    document.getElementById('activeProjCutBadge').classList.toggle('hidden', p?.status_text !== 'Воздуховоды отрезаны');

    await loadProjectDetails(id);
    populateFormDropdowns();
    selectCategory('duct');
    selectShape('rect');
    switchInnerTab('items');
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

function toggleSummaryAccordion() {
    const body = document.getElementById('summaryBody');
    const arrow = document.getElementById('summaryArrow');
    const isHidden = body.classList.contains('hidden');
    body.classList.toggle('hidden', !isHidden);
    arrow.textContent = isHidden ? '▼' : '▶';
}

function renderSummarySection() {
    const ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    const fittings = appState.activeProjectItems.filter(i => i.category === 'fitting');

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
    if (!fRect.length && !fRound.length && !fSmooth.length) fHtml += '<div class="text-slate-500">Нет изделий</div>';
    fBox.innerHTML = fHtml;
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

// ==========================================
// ФОРМА ДОБАВЛЕНИЯ И РЕДАКТИРОВАНИЯ ПОЗИЦИЙ
// ==========================================
function populateFormDropdowns() {
    const mSel = document.getElementById('inMetal');
    const tSel = document.getElementById('inThickness');
    mSel.innerHTML = appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    tSel.innerHTML = appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');

    const fmSel = document.getElementById('specFilterMetal');
    const ftSel = document.getElementById('specFilterThick');
    fmSel.innerHTML = '<option value="all">Все</option>' + appState.metals.map(m => `<option value="${m}">${m}</option>`).join('');
    ftSel.innerHTML = '<option value="all">Все</option>' + appState.thicknesses.map(t => `<option value="${t}">${t} мм</option>`).join('');

    const wBox = document.getElementById('workersCheckboxes');
    wBox.innerHTML = appState.users.map(u => `
        <label class="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" name="assignWorker" value="${u.name}" ${session.user && session.user.name === u.name ? 'checked' : ''} class="rounded text-blue-600">
            <span class="text-slate-300 font-medium">${u.name}</span>
        </label>
    `).join('');
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
    const list = appState.fittings[session.activeShape] || [];
    sel.innerHTML = list.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    if (list.length > 0) onFittingTypeChange();
}

function onFittingTypeChange() {
    const fitId = document.getElementById('fittingTypeSelect').value;
    const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === fitId);
    if (fitDef && fitDef.price) {
        document.getElementById('inPrice').value = fitDef.price;
    }
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
    const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === fitId) || { params: ['w', 'h', 'len'] };
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
    if (fitDef.params.includes('deg135')) html += `<div><label class="block text-xs text-slate-400 mb-1">Градус (°)</label><input type="number" id="f_deg" value="135" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;

    if (fitDef.params.includes('w')) html += `<div><label class="block text-xs text-slate-400 mb-1">Ширина (мм)</label><input type="number" id="f_w" value="400" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('h')) html += `<div><label class="block text-xs text-slate-400 mb-1">Высота (мм)</label><input type="number" id="f_h" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h', POPULAR_RECT)}</div>`;

    if (fitDef.params.includes('w1')) html += `<div><label class="block text-xs text-slate-400 mb-1">Ширина 1 (мм)</label><input type="number" id="f_w1" value="400" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w1', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('h1')) html += `<div><label class="block text-xs text-slate-400 mb-1">Высота 1 (мм)</label><input type="number" id="f_h1" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h1', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('w2')) html += `<div><label class="block text-xs text-slate-400 mb-1">Ширина 2 (мм)</label><input type="number" id="f_w2" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_w2', POPULAR_RECT)}</div>`;
    if (fitDef.params.includes('h2')) html += `<div><label class="block text-xs text-slate-400 mb-1">Высота 2 (мм)</label><input type="number" id="f_h2" value="250" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_h2', POPULAR_RECT)}</div>`;

    if (fitDef.params.includes('d')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр Ø (мм)</label><input type="number" id="f_d" value="200" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d1')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр 1 Ø (мм)</label><input type="number" id="f_d1" value="250" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d1', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d2')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр 2 Ø (мм)</label><input type="number" id="f_d2" value="200" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d2', POPULAR_DIAM)}</div>`;
    if (fitDef.params.includes('d_main')) html += `<div><label class="block text-xs text-slate-400 mb-1">Диаметр основного воздуховода Ø (мм)</label><input type="number" id="f_d_main" value="315" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_d_main', POPULAR_DIAM)}</div>`;

    if (fitDef.params.includes('len')) html += `<div><label class="block text-xs text-slate-400 mb-1">Длина L (мм)</label><input type="number" id="f_len" value="300" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('len_silencer')) html += `<div><label class="block text-xs text-slate-400 mb-1">Длина L (мм)</label><input type="number" id="f_len" value="1000" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white">${renderChipScroller('f_len', POPULAR_LEN_SILENCER)}</div>`;
    if (fitDef.params.includes('hood_seat')) html += `<div><label class="block text-xs text-slate-400 mb-1">Длина посадочного места (мм)</label><input type="number" id="f_hood_seat" value="100" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('offset')) html += `<div><label class="block text-xs text-slate-400 mb-1">Смещение (мм)</label><input type="number" id="f_offset" value="100" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;
    if (fitDef.params.includes('inlets_cnt')) html += `<div><label class="block text-xs text-slate-400 mb-1">Количество врезок (шт)</label><input type="number" id="f_inlets_cnt" value="2" min="1" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 mono text-white"></div>`;

    if (fitDef.params.includes('tee_rect')) {
        html += `
            <div class="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_tee_same" onchange="toggleSameCheck('tee_rect', this.checked)" class="rounded text-blue-600"> <span>Все стороны одинакового размера</span></label>
                <div><label class="block text-[11px] text-slate-400">Сторона 1 (А1×В1)</label><input type="text" id="f_ts1" value="400x300" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_ts2"><label class="block text-[11px] text-slate-400">Сторона 2 (А2×В2)</label><input type="text" id="f_ts2" value="300x300" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_ts3"><label class="block text-[11px] text-slate-400">Сторона 3 (А3×В3)</label><input type="text" id="f_ts3" value="400x300" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
            </div>
        `;
    }

    if (fitDef.params.includes('cross_rect')) {
        html += `
            <div class="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_cross_same" onchange="toggleSameCheck('cross_rect', this.checked)" class="rounded text-blue-600"> <span>Все 4 стороны одинакового размера</span></label>
                <div><label class="block text-[11px] text-slate-400">Сторона 1 (А1×В1)</label><input type="text" id="f_cs1" value="400x300" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cs2"><label class="block text-[11px] text-slate-400">Сторона 2 (А2×В2)</label><input type="text" id="f_cs2" value="400x300" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cs3"><label class="block text-[11px] text-slate-400">Сторона 3 (А3×В3)</label><input type="text" id="f_cs3" value="400x300" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cs4"><label class="block text-[11px] text-slate-400">Сторона 4 (А4×В4)</label><input type="text" id="f_cs4" value="400x300" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
            </div>
        `;
    }

    if (fitDef.params.includes('tee_round')) {
        html += `
            <div class="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_tee_r_same" onchange="toggleSameCheck('tee_round', this.checked)" class="rounded text-blue-600"> <span>Все диаметры одинаковые</span></label>
                <div><label class="block text-[11px] text-slate-400">Ø1 (мм)</label><input type="number" id="f_tr1" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_tr2"><label class="block text-[11px] text-slate-400">Ø2 (мм)</label><input type="number" id="f_tr2" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_tr3"><label class="block text-[11px] text-slate-400">Ø3 (мм)</label><input type="number" id="f_tr3" value="250" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
            </div>
        `;
    }

    if (fitDef.params.includes('cross_round')) {
        html += `
            <div class="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label class="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" id="f_cross_r_same" onchange="toggleSameCheck('cross_round', this.checked)" class="rounded text-blue-600"> <span>Все 4 диаметра одинаковые</span></label>
                <div><label class="block text-[11px] text-slate-400">Ø1 (мм)</label><input type="number" id="f_cr1" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cr2"><label class="block text-[11px] text-slate-400">Ø2 (мм)</label><input type="number" id="f_cr2" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cr3"><label class="block text-[11px] text-slate-400">Ø3 (мм)</label><input type="number" id="f_cr3" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
                <div id="wrap_cr4"><label class="block text-[11px] text-slate-400">Ø4 (мм)</label><input type="number" id="f_cr4" value="200" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mono text-white"></div>
            </div>
        `;
    }

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

function toggleSameCheck(type, isChecked) {
    if (type === 'tee_rect') {
        document.getElementById('wrap_ts2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_ts3').style.display = isChecked ? 'none' : 'block';
    } else if (type === 'cross_rect') {
        document.getElementById('wrap_cs2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cs3').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cs4').style.display = isChecked ? 'none' : 'block';
    } else if (type === 'tee_round') {
        document.getElementById('wrap_tr2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_tr3').style.display = isChecked ? 'none' : 'block';
    } else if (type === 'cross_round') {
        document.getElementById('wrap_cr2').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cr3').style.display = isChecked ? 'none' : 'block';
        document.getElementById('wrap_cr4').style.display = isChecked ? 'none' : 'block';
    }
}

// ==========================================
// СОХРАНЕНИЕ ИЗДЕЛИЯ В SUPABASE С АВТОСУММИРОВАНИЕМ
// ==========================================
async function saveProjectItem(e) {
    e.preventDefault();
    const projId = session.insideProjectId;
    if (!projId) return;

    const editId = document.getElementById('editItemId').value;
    const metal = document.getElementById('inMetal').value;
    const thickness = Number(document.getElementById('inThickness').value);
    const qty = Number(document.getElementById('inQty').value) || 1;
    const price = Number(document.getElementById('inPrice').value) || 1000;
    const workers = Array.from(document.querySelectorAll('input[name="assignWorker"]:checked')).map(cb => cb.value);

    let title = '';
    let itemKey = '';
    let dims = {};

    if (session.activeCategory === 'duct') {
        title = session.activeShape === 'rect' ? 'Воздуховод прямой' : 'Воздуховод круглый';
        dims.l = Number(document.getElementById('f_l')?.value || 1250);
        if (session.activeShape === 'rect') {
            dims.w = Number(document.getElementById('f_w')?.value || 400);
            dims.h = Number(document.getElementById('f_h')?.value || 300);
            dims.flange1 = !!document.getElementById('f_flange1')?.checked;
            dims.flange2 = !!document.getElementById('f_flange2')?.checked;
            itemKey = `duct_rect_${dims.w}_${dims.h}_${dims.l}_${dims.flange1}_${dims.flange2}_${metal}_${thickness}`;
        } else {
            dims.d = Number(document.getElementById('f_d')?.value || 200);
            itemKey = `duct_round_${dims.d}_${dims.l}_${metal}_${thickness}`;
        }
    } else {
        const fitDef = (appState.fittings[session.activeShape] || []).find(f => f.id === document.getElementById('fittingTypeSelect').value);
        title = fitDef ? fitDef.name : 'Изделие';
        dims.fittingId = fitDef ? fitDef.id : 'custom';

        if (document.getElementById('f_hood_type')) dims.hood_type = document.getElementById('f_hood_type').value;
        if (document.getElementById('f_deg')) dims.deg = Number(document.getElementById('f_deg').value);
        if (document.getElementById('f_w')) dims.w = Number(document.getElementById('f_w').value);
        if (document.getElementById('f_h')) dims.h = Number(document.getElementById('f_h').value);
        if (document.getElementById('f_w1')) dims.w1 = Number(document.getElementById('f_w1').value);
        if (document.getElementById('f_h1')) dims.h1 = Number(document.getElementById('f_h1').value);
        if (document.getElementById('f_w2')) dims.w2 = Number(document.getElementById('f_w2').value);
        if (document.getElementById('f_h2')) dims.h2 = Number(document.getElementById('f_h2').value);
        if (document.getElementById('f_d')) dims.d = Number(document.getElementById('f_d').value);
        if (document.getElementById('f_d1')) dims.d1 = Number(document.getElementById('f_d1').value);
        if (document.getElementById('f_d2')) dims.d2 = Number(document.getElementById('f_d2').value);
        if (document.getElementById('f_d_main')) dims.d_main = Number(document.getElementById('f_d_main').value);
        if (document.getElementById('f_len')) dims.l = Number(document.getElementById('f_len').value);
        if (document.getElementById('f_hood_seat')) dims.hood_seat = Number(document.getElementById('f_hood_seat').value);
        if (document.getElementById('f_offset')) dims.offset = Number(document.getElementById('f_offset').value);
        if (document.getElementById('f_inlets_cnt')) dims.inlets_cnt = Number(document.getElementById('f_inlets_cnt').value);
        if (document.getElementById('f_flange1')) dims.flange1 = document.getElementById('f_flange1').checked;
        if (document.getElementById('f_flange2')) dims.flange2 = document.getElementById('f_flange2').checked;

        if (document.getElementById('f_tee_same')?.checked) {
            dims.descDetail = `Все стороны: ${document.getElementById('f_ts1').value}`;
        } else if (document.getElementById('f_ts1')) {
            dims.descDetail = `${document.getElementById('f_ts1').value} / ${document.getElementById('f_ts2').value} / ${document.getElementById('f_ts3').value}`;
        }
        if (document.getElementById('f_cross_same')?.checked) {
            dims.descDetail = `Все стороны: ${document.getElementById('f_cs1').value}`;
        } else if (document.getElementById('f_cs1')) {
            dims.descDetail = `${document.getElementById('f_cs1').value} / ${document.getElementById('f_cs2').value} / ${document.getElementById('f_cs3').value} / ${document.getElementById('f_cs4').value}`;
        }
        if (document.getElementById('f_tee_r_same')?.checked) {
            dims.descDetail = `Все Ø${document.getElementById('f_tr1').value}`;
        } else if (document.getElementById('f_tr1')) {
            dims.descDetail = `Ø${document.getElementById('f_tr1').value} / Ø${document.getElementById('f_tr2').value} / Ø${document.getElementById('f_tr3').value}`;
        }
        if (document.getElementById('f_cross_r_same')?.checked) {
            dims.descDetail = `Все Ø${document.getElementById('f_cr1').value}`;
        } else if (document.getElementById('f_cr1')) {
            dims.descDetail = `Ø${document.getElementById('f_cr1').value} / Ø${document.getElementById('f_cr2').value} / Ø${document.getElementById('f_cr3').value} / Ø${document.getElementById('f_cr4').value}`;
        }

        itemKey = `fit_${title}_${dims.w || 0}_${dims.h || 0}_${dims.w1 || 0}_${dims.h1 || 0}_${dims.w2 || 0}_${dims.h2 || 0}_${dims.d || 0}_${dims.d1 || 0}_${dims.d2 || 0}_${dims.d_main || 0}_${dims.l || 0}_${dims.deg || 0}_${dims.offset || 0}_${dims.hood_seat || 0}_${dims.inlets_cnt || 0}_${dims.flange1}_${dims.flange2}_${dims.descDetail || ''}_${metal}_${thickness}`;
    }

    if (editId) {
        await supabaseClient.from('items').update({
            item_key: itemKey,
            category: session.activeCategory,
            shape: session.activeShape,
            title,
            metal,
            thickness,
            qty,
            price,
            workers,
            dimensions: dims
        }).eq('id', Number(editId));
    } else {
        const existing = appState.activeProjectItems.find(i => i.item_key === itemKey);
        if (existing) {
            const newQty = existing.qty + qty;
            const mergedWorkers = Array.from(new Set([...(existing.workers || []), ...workers]));
            await supabaseClient.from('items').update({
                qty: newQty,
                workers: mergedWorkers
            }).eq('id', existing.id);
        } else {
            await supabaseClient.from('items').insert({
                project_id: projId,
                item_key: itemKey,
                category: session.activeCategory,
                shape: session.activeShape,
                title,
                metal,
                thickness,
                qty,
                price,
                workers,
                dimensions: dims
            });
        }
    }

    await supabaseClient.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projId);
    await loadProjectDetails(projId);
    resetItemForm();
    renderProjectInside();
}

function resetItemForm() {
    document.getElementById('editItemId').value = '';
    document.getElementById('formHeaderTitle').textContent = 'Добавить в проект';
    document.getElementById('cancelEditBtn').classList.add('hidden');
    document.getElementById('submitItemBtn').textContent = 'Добавить в спецификацию';
    renderDynamicInputs();
}

// ==========================================
// СПЕЦИФИКАЦИЯ ИЗДЕЛИЙ
// ==========================================
function renderSpecification() {
    const filterM = document.getElementById('specFilterMetal').value;
    const filterT = document.getElementById('specFilterThick').value;

    let items = appState.activeProjectItems.filter(it => {
        if (filterM !== 'all' && it.metal !== filterM) return false;
        if (filterT !== 'all' && Number(it.thickness) !== Number(filterT)) return false;
        return true;
    });

    const container = document.getElementById('specificationAccordionList');
    container.innerHTML = '';

    const bulkBtn = document.getElementById('bulkDeleteBtn');
    const bulkCount = document.getElementById('bulkCount');
    bulkCount.textContent = session.selectedSpecIds.length;
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
    let descParts = [];

    if (it.shape === 'rect' && it.category === 'duct') {
        descParts.push(`${it.w}×${it.h} мм`);
        descParts.push(`L=${it.l || 1250}`);
        const fl = [];
        if (it.flange1) fl.push('Сторона 1');
        if (it.flange2) fl.push('Сторона 2');
        if (fl.length) descParts.push(`Шинка: ${fl.join(', ')}`);
    } else if (it.shape === 'round' && it.category === 'duct') {
        descParts.push(`Ø${it.d} мм`);
        descParts.push(`L=${it.l || 1250}`);
    } else {
        if (it.hood_type) descParts.push(it.hood_type);
        if (it.deg) descParts.push(`${it.deg}°`);
        if (it.descDetail) descParts.push(it.descDetail);
        if (it.w1 && it.w2) descParts.push(`${it.w1}×${it.h1} → ${it.w2}×${it.h2}`);
        else if (it.w && it.h) descParts.push(`${it.w}×${it.h}`);
        if (it.d1 && it.d2) descParts.push(`Ø${it.d1} → Ø${it.d2}`);
        else if (it.d) descParts.push(`Ø${it.d}`);
        if (it.d_main) descParts.push(`Осн: Ø${it.d_main}`);
        if (it.l) descParts.push(`L=${it.l}`);
        if (it.hood_seat) descParts.push(`Посадка: ${it.hood_seat} мм`);
        if (it.offset) descParts.push(`Смещение: ${it.offset} мм`);
        if (it.inlets_cnt) descParts.push(`Врезок: ${it.inlets_cnt} шт`);
    }

    const workersHtml = (it.workers && it.workers.length) ? `<div class="text-[10px] text-amber-400 mt-0.5">Мастера: ${it.workers.join(', ')}</div>` : '';

    return `
        <div class="bg-slate-900 border ${isSelected ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800'} rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div class="flex items-start gap-3 w-full sm:w-auto">
                <input type="checkbox" onchange="toggleSpecItemSelect(${it.id}, this.checked)" ${isSelected ? 'checked' : ''} class="mt-1 rounded text-blue-600">
                <div>
                    <div class="font-bold text-xs text-white">${it.title}</div>
                    <div class="text-xs text-blue-300 mono mt-0.5">${descParts.join(' | ')}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Металл: <strong class="text-slate-200">${it.metal} ${it.thickness} мм</strong> ${isDev() ? `| Тариф: <span class="mono text-emerald-400">${it.price} ₸</span>` : ''}</div>
                    ${workersHtml}
                </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div class="text-sm font-black mono text-white">${it.qty} шт</div>
                <div class="flex gap-1">
                    <button onclick="duplicateWithModal(${it.id})" title="Дублировать с изменением" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold">⧉</button>
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
    await supabaseClient.from('items').delete().in('id', session.selectedSpecIds);
    session.selectedSpecIds = [];
    await loadProjectDetails(session.insideProjectId);
    renderProjectInside();
}

async function deleteSingleItem(id) {
    await supabaseClient.from('items').delete().eq('id', id);
    session.selectedSpecIds = session.selectedSpecIds.filter(x => x !== id);
    await loadProjectDetails(session.insideProjectId);
    renderProjectInside();
}

function duplicateWithModal(id) {
    const it = appState.activeProjectItems.find(x => x.id === id);
    if (!it) return;

    editProjectItem(id);
    document.getElementById('editItemId').value = '';
    document.getElementById('formHeaderTitle').textContent = `Дубликат: ${it.title} (измените нужные параметры)`;
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('submitItemBtn').textContent = '+ Создать дубликат';
    window.scrollTo({ top: document.getElementById('itemFormCard').offsetTop - 60, behavior: 'smooth' });
}

function editProjectItem(id) {
    const it = appState.activeProjectItems.find(x => x.id === id);
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

    if (it.fittingId) document.getElementById('fittingTypeSelect').value = it.fittingId;
    renderDynamicInputs();

    if (document.getElementById('f_w')) document.getElementById('f_w').value = it.w || 400;
    if (document.getElementById('f_h')) document.getElementById('f_h').value = it.h || 300;
    if (document.getElementById('f_d')) document.getElementById('f_d').value = it.d || 200;
    if (document.getElementById('f_l')) document.getElementById('f_l').value = it.l || 1250;
    if (document.getElementById('f_w1')) document.getElementById('f_w1').value = it.w1 || 400;
    if (document.getElementById('f_h1')) document.getElementById('f_h1').value = it.h1 || 300;
    if (document.getElementById('f_w2')) document.getElementById('f_w2').value = it.w2 || 300;
    if (document.getElementById('f_h2')) document.getElementById('f_h2').value = it.h2 || 250;
    if (document.getElementById('f_d1')) document.getElementById('f_d1').value = it.d1 || 250;
    if (document.getElementById('f_d2')) document.getElementById('f_d2').value = it.d2 || 200;
    if (document.getElementById('f_d_main')) document.getElementById('f_d_main').value = it.d_main || 315;
    if (document.getElementById('f_deg')) document.getElementById('f_deg').value = it.deg || 90;
    if (document.getElementById('f_offset')) document.getElementById('f_offset').value = it.offset || 100;
    if (document.getElementById('f_hood_seat')) document.getElementById('f_hood_seat').value = it.hood_seat || 100;
    if (document.getElementById('f_inlets_cnt')) document.getElementById('f_inlets_cnt').value = it.inlets_cnt || 2;
    if (document.getElementById('f_flange1')) document.getElementById('f_flange1').checked = !!it.flange1;
    if (document.getElementById('f_flange2')) document.getElementById('f_flange2').checked = !!it.flange2;

    document.querySelectorAll('input[name="assignWorker"]').forEach(cb => {
        cb.checked = (it.workers || []).includes(cb.value);
    });

    window.scrollTo({ top: document.getElementById('itemFormCard').offsetTop - 60, behavior: 'smooth' });
}
// ==========================================
// ЧАСТЬ 3: ШИНКА, РАСКРОЙ 2D, ФИНАНСЫ И ПАНЕЛЬ РАЗРАБОТЧИКА
// ==========================================

// --- ШИНКА ---
async function addFlangeScrap(target) {
    const inp = target === 'project' ? document.getElementById('projScrapLenInput') : document.getElementById('stScrapInput');
    const len = Number(inp.value);
    if (!len || len < 100) return;

    if (target === 'project') {
        const p = appState.projects.find(x => x.id === session.insideProjectId);
        if (!p.flange_scraps) p.flange_scraps = [];
        p.flange_scraps.push(len);
        await supabaseClient.from('projects').update({ flange_scraps: p.flange_scraps }).eq('id', p.id);
        renderProjectFlange();
    } else {
        appState.standaloneFlange.scraps.push(len);
        await saveGlobalSettings();
        renderStandaloneFlange();
    }
    inp.value = '';
}

async function removeFlangeScrap(target, idx) {
    if (target === 'project') {
        const p = appState.projects.find(x => x.id === session.insideProjectId);
        p.flange_scraps.splice(idx, 1);
        await supabaseClient.from('projects').update({ flange_scraps: p.flange_scraps }).eq('id', p.id);
        renderProjectFlange();
    } else {
        appState.standaloneFlange.scraps.splice(idx, 1);
        await saveGlobalSettings();
        renderStandaloneFlange();
    }
}

function renderProjectFlange() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;

    const scrapBox = document.getElementById('projScrapChips');
    scrapBox.innerHTML = (p.flange_scraps || []).map((s, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-200 mono flex items-center gap-1.5">
            ${s} мм (пачка) <button onclick="removeFlangeScrap('project', ${i})" class="text-slate-500 hover:text-rose-400 font-bold">×</button>
        </span>
    `).join('');

    const packLen = Number(document.getElementById('projPackLen').value) || 3000;
    const kerf = Number(document.getElementById('projKerf').value) || 2;
    const roundMode = document.getElementById('projFlangeRound').value;

    const sides = {};
    appState.activeProjectItems.forEach(it => {
        if (it.category === 'fitting' || it.category === 'duct') {
            const add = (w, h) => {
                const k = `${w}×${h}`;
                sides[k] = (sides[k] || 0) + it.qty;
            };
            if (it.shape === 'rect' || it.shape === 'smooth') {
                if (it.flange1) add(it.w || it.w1 || 400, it.h || it.h1 || 300);
                if (it.flange2 && it.shape === 'rect') add(it.w || it.w2 || 400, it.h || it.h2 || 300);
            }
        }
    });

    document.getElementById('projFlangeOutput').innerHTML = buildFlangeCalculationUI(sides, packLen, kerf, roundMode, p.flange_scraps || []);
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
        return `<div class="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">В проекте нет сторон с включенной шинкой</div>`;
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
    const availablePacks = [...(scrapsList || []).map(l => ({ len: l, isScrap: true }))];
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
            const scrap = availablePacks.shift();
            const totalLen = scrap ? scrap.len : packLen;
            resultPacks.push({ totalLen, isScrap: !!scrap, cuts: [c] });
        }
    });

    let html = `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-blue-400 uppercase tracking-wider text-xs">Стороны для сборщика (готовые рамки):</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mono">
                ${Object.entries(sidesObj).map(([k, v]) => `<div class="bg-slate-900 p-2 rounded-lg border border-slate-800/80">${k} — <strong class="text-white">${v} сторон</strong></div>`).join('')}
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-emerald-400 uppercase tracking-wider text-xs">Количество заготовок шинки (Сторона − 30 мм):</div>
            <div class="flex flex-wrap gap-2 mono">
                ${Object.entries(cutsNeeded).map(([k, v]) => `<span class="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200">${k} мм — <strong class="text-emerald-400">${v} шт</strong></span>`).join('')}
            </div>
        </div>

        <div class="space-y-3">
            <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-white uppercase tracking-wider">Карты реза пачек (1 рез = 10 шинок):</span>
                <span class="text-slate-400">Всего пачек: <strong class="text-blue-400 mono">${resultPacks.length} шт</strong> (${resultPacks.length * 10} хлыстов)</span>
            </div>
            <div class="space-y-2.5">
    `;

    resultPacks.forEach((p, idx) => {
        const used = p.cuts.reduce((s, x) => s + x + kerf, 0);
        const rem = p.totalLen - used;
        html += `
            <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div class="flex justify-between text-xs">
                    <span class="font-bold text-white">${p.isScrap ? '✂ Обрезок пачки' : `Пачка №${idx + 1}`} (${p.totalLen} мм)</span>
                    <span class="text-slate-400">Деловой остаток: <strong class="text-amber-400 mono">${rem} мм</strong></span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${p.cuts.map(c => `<span class="bg-blue-950 border border-blue-700 text-blue-200 px-3 py-1 rounded-lg text-xs mono font-bold">Рез ${c} мм (10 шт)</span>`).join('')}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;

    if (singleTails.length > 0) {
        html += `
            <div class="bg-amber-950/30 border border-amber-800/60 p-4 rounded-xl text-xs space-y-2">
                <div class="font-bold text-amber-300 uppercase tracking-wider">Памятка: Хвостики на штучный дорез (некратные 10 шт):</div>
                <div class="flex flex-wrap gap-2 mono">
                    ${singleTails.map(t => `<span class="bg-amber-900/40 text-amber-200 px-3 py-1 rounded-lg">${t.len} мм — ${t.qty} шт</span>`).join('')}
                </div>
            </div>
        `;
    }

    return html;
}

function exportFlangeText(mode) {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    let text = `MAXVENT TOOLS — НАРЯД НА ШИНКУ\nОбъект: ${mode === 'project' ? p.title : 'Автономный расчет'}\n\n`;
    document.querySelectorAll(mode === 'project' ? '#projFlangeOutput .grid div' : '#stFlangeOutput .grid div').forEach(d => {
        text += `- ${d.textContent.trim()}\n`;
    });
    navigator.clipboard.writeText(text);
    alert('Наряд на шинку скопирован в буфер обмена!');
}

// --- 2D РАСКРОЙ ЛИСТА ---
function renderProjectNesting() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;

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
                <span class="text-slate-400">Формат: <strong class="text-blue-400 mono">Лист 2500 × 1250 мм</strong></span>
            </div>
            <div class="space-y-2">
                ${currentDucts.map(d => {
                    const unfold = d.shape === 'rect' ? (2 * (d.w + d.h) + 41) : Math.round(Math.PI * d.d + 22);
                    const name = d.shape === 'rect' ? `${d.w}×${d.h}` : `Ø${d.d}`;
                    return `
                        <div class="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                            <div class="flex items-center gap-3">
                                <input type="checkbox" id="nestDuctCheck_${d.id}" checked class="rounded text-blue-600">
                                <div>
                                    <span class="font-bold text-white">${name}</span>
                                    <span class="text-slate-400 ml-2 mono">Развертка: <strong class="text-blue-300">${unfold} ×${d.l || 1250} мм</strong></span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-slate-400">Штук:</span>
                                <input type="number" id="nestDuctQty_${d.id}" value="${d.qty}" min="1" max="${d.qty}" class="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center mono text-white font-bold">
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="pt-2 flex justify-end">
                <button onclick="calculateAndSaveNesting()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl">
                    Сделать оптимальный раскрой
                </button>
            </div>
        </div>
    `;

    renderNestingResult(p);
}

async function calculateAndSaveNesting() {
    const projId = session.insideProjectId;
    const p = appState.projects.find(x => x.id === projId);
    const ducts = appState.activeProjectItems.filter(i => i.category === 'duct');
    const currentDucts = ducts.filter(d => `${d.metal} ${d.thickness} мм` === session.activeNestingKey);

    const partsToCut = [];
    currentDucts.forEach(d => {
        const isChecked = document.getElementById(`nestDuctCheck_${d.id}`)?.checked;
        const qty = Number(document.getElementById(`nestDuctQty_${d.id}`)?.value || 0);
        if (isChecked && qty > 0) {
            const unfoldL = d.shape === 'rect' ? (2 * (d.w + d.h) + 41) : Math.round(Math.PI * d.d + 22);
            const name = d.shape === 'rect' ? `${d.w}×${d.h}` : `Ø${d.d}`;
            for (let i = 0; i < qty; i++) {
                partsToCut.push({ title: d.title, label: name, cutL: unfoldL, cutW: d.l || 1250 });
            }
        }
    });

    if (partsToCut.length === 0) { alert('Выберите хотя бы один воздуховод'); return; }

    const sheetL = 2500;
    const sheets = [];
    partsToCut.forEach(pt => {
        let placed = false;
        for (let s of sheets) {
            const used = s.parts.reduce((sum, item) => sum + item.cutL, 0);
            if (used + pt.cutL <= sheetL) { s.parts.push(pt); placed = true; break; }
        }
        if (!placed) sheets.push({ parts: [pt], cutDone: false });
    });

    await supabaseClient.from('nestings').upsert({
        project_id: projId,
        metal_key: session.activeNestingKey,
        sheets,
        updated_at: new Date().toISOString()
    }, { onConflict: 'project_id,metal_key' });

    await loadProjectDetails(projId);
    renderNestingResult(p);
}

function renderNestingResult(p) {
    const box = document.getElementById('nestingVisualizerBox');
    const nestingData = appState.activeProjectNestings[session.activeNestingKey];

    if (!nestingData || !nestingData.sheets || nestingData.sheets.length === 0) {
        box.innerHTML = `<div class="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">Нажмите «Сделать оптимальный раскрой», чтобы рассчитать карты</div>`;
        return;
    }

    const sheets = nestingData.sheets;
    const sheetL = 2500;
    const allDone = sheets.every(s => s.cutDone);

    let html = `
        <div class="flex flex-wrap justify-between items-center gap-2">
            <div class="text-xs">
                <span class="font-bold text-white uppercase tracking-wider">Карты раскроя листа:</span>
                <span class="text-slate-400 ml-2">Всего листов 2500×1250: <strong class="text-blue-400 mono">${sheets.length} шт</strong></span>
            </div>
            <button onclick="finishCuttingWork()" class="${allDone ? 'bg-emerald-600' : 'bg-slate-800'} text-white text-xs font-bold px-4 py-2 rounded-xl">
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
                        <span>Лист №${idx + 1} (2500 × 1250 мм) — ${s.cutDone ? '<span class="text-emerald-400">Отрезан</span>' : '<span class="text-slate-400">В процессе</span>'}</span>
                    </label>
                    <span class="text-slate-400">Остаток: <strong class="text-amber-400 mono">${remL} × 1250 мм</strong></span>
                </div>
                <div class="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 flex h-24 overflow-hidden relative">
                    ${s.parts.map(pt => `
                        <div style="width: ${(pt.cutL / sheetL) * 100}%" class="h-full bg-blue-900/60 border-r border-blue-500/80 p-1 flex flex-col justify-between overflow-hidden">
                            <div class="text-[11px] font-bold text-white truncate">${pt.label}</div>
                            <div class="text-[9px] mono text-blue-200 truncate">${pt.cutL} мм</div>
                        </div>
                    `).join('')}
                    ${remL > 0 ? `<div style="width: ${(remL / sheetL) * 100}%" class="h-full bg-amber-950/30 flex items-center justify-center text-[10px] text-amber-400 mono truncate px-1">Остаток ${remL} мм</div>` : ''}
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
    alert('Статус проекта обновлен: «Воздуховоды отрезаны»!');
}

// --- ФИНАНСЫ И ПЕЧАТЬ PDF-ОТЧЕТОВ ---
function calculateProjectFinances(projId) {
    const items = appState.allItems.filter(x => x.project_id === projId);
    const payments = appState.allPayments.filter(x => x.project_id === projId);

    let totalSum = 0;
    items.forEach(it => {
        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' ? (2 * (it.w + it.h) + 41) : Math.round(Math.PI * it.d + 22);
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

function renderProjectFinance() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;
    const fin = calculateProjectFinances(p.id);

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
                <div class="text-xs text-slate-400">${fin.overpay > 0 ? 'Переплата:' : 'Остаток долга:'}</div>
                <div class="text-xl font-bold mono ${fin.overpay > 0 ? 'text-blue-400' : 'text-amber-400'} mt-1">
                    ${fin.overpay > 0 ? `+${fin.overpay.toLocaleString()} ₸` : `${fin.debt.toLocaleString()} ₸`}
                </div>
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div class="font-bold text-white text-xs uppercase tracking-wider">Зафиксировать платеж</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" id="payAmountInput" placeholder="Сумма (₸)" class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs mono text-white font-bold">
                <input type="text" id="payNoteInput" placeholder="Примечание (Kaspi, нал)" class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                <button onclick="addProjectPayment()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg py-2">
                    + Внести платеж
                </button>
            </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="font-bold text-white text-xs uppercase tracking-wider">История платежей объекта:</div>
            <div class="space-y-1.5 mono">
                ${(fin.payments && fin.payments.length) ? fin.payments.map((pay, i) => `
                    <div class="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <div><span class="text-slate-400">${pay.pay_date}</span> — <strong class="text-emerald-400">${Number(pay.amount).toLocaleString()} ₸</strong> <span class="text-slate-400">(${pay.note || '—'})</span></div>
                        <button onclick="deletePayment(${pay.id})" class="text-slate-500 hover:text-rose-400 font-bold px-2">✕</button>
                    </div>
                `).join('') : '<div class="text-slate-500 text-xs">Платежей не зафиксировано</div>'}
            </div>
        </div>
    `;
}

async function addProjectPayment() {
    const projId = session.insideProjectId;
    const amt = Number(document.getElementById('payAmountInput').value);
    const note = document.getElementById('payNoteInput').value.trim();
    if (!amt || amt <= 0) return;

    const today = new Date().toISOString().split('T')[0];
    await supabaseClient.from('payments').insert({ project_id: projId, pay_date: today, amount: amt, note });
    await loadProjectDetails(projId);
    renderProjectFinance();
}

async function deletePayment(payId) {
    await supabaseClient.from('payments').delete().eq('id', payId);
    await loadProjectDetails(session.insideProjectId);
    renderProjectFinance();
}

// Печать чистого PDF-отчета по проекту
function printProjectFinancialReport() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;
    const fin = calculateProjectFinances(p.id);

    let ductsArea = 0;
    let fittingsQty = 0;
    fin.items.forEach(it => {
        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' ? (2 * (it.w + it.h) + 41) : Math.round(Math.PI * it.d + 22);
            ductsArea += (unfold * (it.l || 1250) * it.qty) / 1e6;
        } else {
            fittingsQty += it.qty;
        }
    });

    const printArea = document.getElementById('printReportArea');
    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #000;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between;">
                <div>
                    <h2 style="margin: 0; font-size: 22px; font-weight: bold;">MAXVENT TOOLS</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Финансовый отчет и ведомость по объекту</p>
                </div>
                <div style="text-align: right; font-size: 13px;">
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                    <div>Статус: <b>${p.status_text || 'В работе'}</b></div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px;">Объект: ${p.title}</h3>
                <p style="margin: 0; font-size: 13px; color: #444;">Монтажная бригада: ${p.group_name || '—'}</p>
                <p style="margin: 3px 0 0 0; font-size: 13px; color: #444;">Описание: ${p.description || '—'}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr style="background: #f1f5f9;">
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Показатель</th>
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Значение</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">Общая площадь воздуховодов</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold;">${ductsArea.toFixed(2)} м²</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">Количество фасонных изделий</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold;">${fittingsQty} шт</td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">Сметная стоимость заказа</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold;">${fin.totalSum.toLocaleString()} ₸</td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">Внесено оплат</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #16a34a; font-weight: bold;">${fin.paid.toLocaleString()} ₸</td>
                </tr>
                <tr style="background: #fef2f2;">
                    <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">Остаток задолженности</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">${fin.debt.toLocaleString()} ₸</td>
                </tr>
            </table>

            <h4 style="font-size: 14px; margin-bottom: 8px;">История оплат:</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr style="background: #f1f5f9;">
                    <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Дата</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Сумма</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Примечание</th>
                </tr>
                ${fin.payments.length ? fin.payments.map(pay => `
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 6px;">${pay.pay_date}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-weight: bold;">${Number(pay.amount).toLocaleString()} ₸</td>
                        <td style="border: 1px solid #cbd5e1; padding: 6px;">${pay.note || '—'}</td>
                    </tr>
                `).join('') : '<tr><td colspan="3" style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; color: #666;">Платежей нет</td></tr>'}
            </table>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px;">
                <div>Руководитель: ___________________</div>
                <div>Заказчик: ___________________</div>
            </div>
        </div>
    `;
    window.print();
}

function printGlobalFinancialReport() {
    window.print();
}

async function openGlobalFinanceModal() {
    document.getElementById('profileDropdown').classList.add('hidden');
    const modal = document.getElementById('globalFinanceModal');
    modal.classList.remove('hidden');

    const content = document.getElementById('globalFinanceContent');
    let grandTotal = 0;
    let grandPaid = 0;
    let grandDebt = 0;

    const rows = appState.projects.map(p => {
        const fin = calculateProjectFinances(p.id);
        grandTotal += fin.totalSum;
        grandPaid += fin.paid;
        grandDebt += fin.debt;
        return `
            <tr class="border-b border-slate-800 hover:bg-slate-950">
                <td class="p-3 font-bold text-white">${p.title} <span class="text-[10px] text-slate-500 block">${p.group_name || '—'}</span></td>
                <td class="p-3 mono">${fin.totalSum.toLocaleString()} ₸</td>
                <td class="p-3 mono text-emerald-400">${fin.paid.toLocaleString()} ₸</td>
                <td class="p-3 mono ${fin.debt > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}">${fin.debt.toLocaleString()} ₸</td>
                <td class="p-3"><span class="text-[10px] px-2 py-0.5 rounded font-bold ${p.archive_state === 'archived' ? 'bg-slate-800 text-slate-400' : 'bg-blue-950 text-blue-300'}">${p.archive_state === 'archived' ? 'Архив' : 'Активен'}</span></td>
            </tr>
        `;
    }).join('');

    content.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div class="text-slate-400">Сумма всех заказов:</div>
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
        <div class="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-900 border-b border-slate-800 uppercase text-slate-400">
                    <tr><th class="p-3">Объект</th><th class="p-3">Смета</th><th class="p-3">Оплачено</th><th class="p-3">Долг</th><th class="p-3">Статус</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function closeGlobalFinanceModal() {
    document.getElementById('globalFinanceModal').classList.add('hidden');
}

// --- АВТОНОМНЫЙ КАЛЬКУЛЯТОР ШИНКИ ---
function openStandaloneFlange() { document.getElementById('standaloneFlangeModal').classList.remove('hidden'); renderStandaloneFlange(); }
function closeStandaloneFlange() { document.getElementById('standaloneFlangeModal').classList.add('hidden'); }

async function addStandaloneFlangeRow() {
    const w = Number(document.getElementById('stW').value);
    const h = Number(document.getElementById('stH').value);
    const sides = Number(document.getElementById('stSides').value);
    const qty = Number(document.getElementById('stQty').value);
    if (!w || !h || !sides || !qty) return;

    const totalSides = sides * qty;
    const existing = appState.standaloneFlange.rows.find(r => r.w === w && r.h === h);
    if (existing) existing.totalSides += totalSides;
    else appState.standaloneFlange.rows.push({ w, h, totalSides });

    await saveGlobalSettings();
    renderStandaloneFlange();
}

async function clearStandaloneFlange() {
    appState.standaloneFlange.rows = [];
    appState.standaloneFlange.scraps = [];
    await saveGlobalSettings();
    renderStandaloneFlange();
}

function renderStandaloneFlange() {
    const scrapBox = document.getElementById('stScrapChips');
    scrapBox.innerHTML = (appState.standaloneFlange.scraps || []).map((s, i) => `
        <span class="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200 mono flex items-center gap-1">
            ${s} мм <button onclick="removeFlangeScrap('standalone', ${i})" class="text-rose-400 font-bold">×</button>
        </span>
    `).join('');

    const packLen = Number(document.getElementById('stPackLen').value) || 3000;
    const kerf = Number(document.getElementById('stKerf').value) || 2;
    const roundMode = document.getElementById('stRound').value;

    const sidesObj = {};
    appState.standaloneFlange.rows.forEach(r => {
        const k = `${r.w}×${r.h}`;
        sidesObj[k] = (sidesObj[k] || 0) + r.totalSides;
    });

    document.getElementById('stFlangeOutput').innerHTML = buildFlangeCalculationUI(sidesObj, packLen, kerf, roundMode, appState.standaloneFlange.scraps || []);
}

// --- ПАНЕЛЬ РАЗРАБОТЧИКА И РАБОТНИКИ ---
function openDevModal() {
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('devModal').classList.remove('hidden');
    renderDevCatalogs();
    renderCustomFitParamsCheckboxes();
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

        appState.allItems.forEach(it => {
            if ((it.workers || []).includes(u.name)) {
                if (it.category === 'duct') {
                    const unfold = it.shape === 'rect' ? (2 * (it.w + it.h) + 41) : Math.round(Math.PI * it.d + 22);
                    ductsArea += (unfold * (it.l || 1250) * it.qty) / 1e6;
                } else {
                    fittingsCount += it.qty;
                }
            }
        });

        return `
            <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                <div>
                    <div class="font-bold text-white">${u.name} <span class="text-blue-400 font-mono text-[11px] ml-2">Код: ${u.access_code || '—'}</span></div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Роль: <strong class="text-emerald-400">${u.role === 'developer' ? 'Разработчик' : 'Работник цеха'}</strong> | Выработка: <strong class="text-blue-300 mono">${ductsArea.toFixed(2)} м² воздуховодов</strong>, <strong class="text-amber-300 mono">${fittingsCount} шт изделий</strong></div>
                </div>
                ${u.access_code !== '7777' ? `<button onclick="deleteWorker(${u.id})" class="bg-rose-950 border border-rose-800 text-rose-300 px-3 py-1.5 rounded-lg text-xs">Удалить</button>` : ''}
            </div>
        `;
    }).join('');
}

function renderCustomFitParamsCheckboxes() {
    const box = document.getElementById('customFitParamsCheckboxes');
    box.innerHTML = ALL_PARAM_DEFS.map(p => `
        <label class="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input type="checkbox" name="customParamCheckbox" value="${p.code}" class="rounded text-amber-500">
            <span class="truncate">${p.label}</span>
        </label>
    `).join('');
}

async function saveCustomFitting() {
    const name = document.getElementById('customFitName').value.trim();
    const shape = document.getElementById('customFitShape').value;
    const price = Number(document.getElementById('customFitPrice').value) || 1000;
    const params = Array.from(document.querySelectorAll('input[name="customParamCheckbox"]:checked')).map(cb => cb.value);

    if (!name) { alert('Укажите название изделия'); return; }
    if (params.length === 0) { alert('Отметьте хотя бы один параметр'); return; }

    const newId = 'cust_' + Date.now();
    if (!appState.fittings[shape]) appState.fittings[shape] = [];
    appState.fittings[shape].push({ id: newId, name, params, price });

    await saveGlobalSettings();
    alert(`Изделие "${name}" сохранено в справочник!`);
    document.getElementById('customFitName').value = '';
    document.querySelectorAll('input[name="customParamCheckbox"]').forEach(cb => cb.checked = false);
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

// ==========================================
// СТАРТ ПРИЛОЖЕНИЯ
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
});
