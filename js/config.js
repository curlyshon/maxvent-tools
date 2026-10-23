// ==========================================
// MODULE: config.js
// Конфигурация, Supabase клиент, глобальное состояние и базовые утилиты
// ==========================================

// ==========================================
// HAPTIC FEEDBACK (ТАКТИЛЬНЫЙ ОТКЛИК НА СМАРТФОНЕ)
// ==========================================
function triggerHaptic(type = 'light') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            if (type === 'light') navigator.vibrate(10);
            else if (type === 'medium') navigator.vibrate(22);
            else if (type === 'success') navigator.vibrate([15, 40, 25]);
            else if (type === 'warning') navigator.vibrate([25, 40, 25]);
        } catch (_) {}
    }
}

// ==========================================
// SCROLL LOCKING HELPERS
// ==========================================
let activeModalCount = 0;
function lockScroll() {
    activeModalCount++;
    document.body.classList.add('overflow-hidden');
    document.documentElement.classList.add('overflow-hidden');
}
function unlockScroll() {
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (activeModalCount === 0) {
        document.body.classList.remove('overflow-hidden');
        document.documentElement.classList.remove('overflow-hidden');
    }
}

// ==========================================
// CALCULATION HELPERS
// ==========================================
function calcDuctArea(it, project = null) {
    if (!it || it.category !== 'duct') return 0;
    const p = project || appState.projects.find(x => x.id === it.project_id);
    const seams = typeof getProjectSeams === 'function' ? getProjectSeams(p) : { lock_pittsburgh: 32, lock_single: 9, round_seam: 22 };
    const unfold = it.shape === 'rect'
        ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single)
        : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
    return (unfold * Number(it.l || 1250)) / 1e6;
}

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
    { code: 'tee_rect', label: 'Тройник прямоуг. (3 рамки)' },
    { code: 'cross_rect', label: 'Крестовина прямоуг. (4 рамки)' },
    { code: 'tee_round', label: 'Тройник круглый (3 диаметра)' },
    { code: 'cross_round', label: 'Крестовина круглая (4 диаметра)' },
    { code: 'flange1', label: 'Рамка 1' },
    { code: 'flange2', label: 'Рамка 1 и Рамка 2' }
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
    standaloneFlange: { rows: [], scraps: [], pack_qty: 10 }
};

let session = {
    user: null,
    devMode: false,
    projectFilter: 'active',
    clickedProjectId: null,
    insideProjectId: null,
    activePhaseId: null, // Подпроекты / Дозаказы
    activeCategory: 'duct',
    activeShape: 'rect',
    specSelectionMode: false, // Режим выделения деталей
    selectedSpecIds: [],
    activeNestingKey: null,
    activeNestingScraps: [], // Обрезки листа 2D
    accordionState: {},
    nestingCustomModes: {},
    workerSplitMode: 'equal',
    workerProfSelectedUser: null,
    workerProfActiveTab: 'by-project',
    workerSharesState: {},
    workerAccordions: {},
    archiveSandboxData: null // Безопасный просмотр архива (песочница)
};

// ==========================================
// СИСТЕМА УВЕДОМЛЕНИЙ (TOASTS) И ХЕЛПЕРЫ
// ==========================================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const bgColors = {
        success: 'bg-emerald-950/95 border-emerald-600 text-emerald-200',
        error: 'bg-rose-950/95 border-rose-600 text-rose-200',
        warning: 'bg-amber-950/95 border-amber-600 text-amber-200',
        info: 'bg-[#18181f] border-zinc-700 text-zinc-200'
    };
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    const cls = bgColors[type] || bgColors.info;
    const ic = icons[type] || icons.info;
    toast.className = `${cls} pointer-events-auto border px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0 max-w-sm`;
    toast.innerHTML = `<span class="font-black text-sm">${ic}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

function parseFlangeScrapItem(s, defCount) {
    if (typeof s === 'number') return { len: s, count: defCount };
    if (typeof s === 'object' && s !== null) {
        return { len: Number(s.len) || 1000, count: Number(s.count) || defCount };
    }
    if (typeof s === 'string') {
        const mLen = s.match(/len\s*=\s*(\d+)/i);
        const mCnt = s.match(/count\s*=\s*(\d+)/i);
        if (mLen) return { len: Number(mLen[1]), count: mCnt ? Number(mCnt[1]) : defCount };
        const num = Number(s);
        if (!isNaN(num) && num > 0) return { len: num, count: defCount };
    }
    return { len: 1000, count: defCount };
}

// Хелперы припусков фальцев и пачек шинки для проекта
function getProjectFlangeData(p) {
    const def = { scraps: [], seams: { lock_pittsburgh: 32, lock_single: 9, round_seam: 22 }, pack_qty: 10, pack_len: 3000, kerf: 2, phases: [] };
    if (!p || !p.flange_scraps) return def;
    if (Array.isArray(p.flange_scraps)) {
        return {
            ...def,
            scraps: p.flange_scraps.map(s => parseFlangeScrapItem(s, 10))
        };
    }
    if (typeof p.flange_scraps === 'object' && p.flange_scraps !== null) {
        const fs = p.flange_scraps;
        const pQty = Number(fs.pack_qty) || 10;
        return {
            ...fs,
            scraps: (fs.scraps || []).map(s => parseFlangeScrapItem(s, pQty)),
            seams: fs.seams || def.seams,
            pack_qty: pQty,
            pack_len: Number(fs.pack_len) || 3000,
            kerf: fs.kerf !== undefined ? Number(fs.kerf) : 2,
            phases: Array.isArray(fs.phases) ? fs.phases : []
        };
    }
    return def;
}

function getProjectSeams(p) {
    return getProjectFlangeData(p).seams;
}

function getProjectPackQty(p) {
    return getProjectFlangeData(p).pack_qty;
}

async function saveProjectFlangeData(p, flangeData) {
    p.flange_scraps = flangeData;
    await supabaseClient.from('projects').update({ flange_scraps: flangeData, updated_at: new Date().toISOString() }).eq('id', p.id);
}

function openProjectSeamsModal() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;
    const data = getProjectFlangeData(p);
    document.getElementById('quickSeamBig').value = data.seams.lock_pittsburgh;
    document.getElementById('quickSeamSmall').value = data.seams.lock_single;
    document.getElementById('quickSeamRound').value = data.seams.round_seam;
    document.getElementById('quickPackQty').value = data.pack_qty;
    document.getElementById('projectSeamsModal').classList.remove('hidden');
    if (typeof lockScroll === 'function') lockScroll();
}

function closeProjectSeamsModal() {
    triggerHaptic('light');
    document.getElementById('projectSeamsModal').classList.add('hidden');
    if (typeof unlockScroll === 'function') unlockScroll();
}

async function saveProjectSeamsModal() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;
    const big = Number(document.getElementById('quickSeamBig').value) || 32;
    const small = Number(document.getElementById('quickSeamSmall').value) || 9;
    const round = Number(document.getElementById('quickSeamRound').value) || 22;
    const packQty = Number(document.getElementById('quickPackQty').value) || 10;

    const data = getProjectFlangeData(p);
    data.seams = { lock_pittsburgh: big, lock_single: small, round_seam: round };
    data.pack_qty = packQty;

    await saveProjectFlangeData(p, data);
    closeProjectSeamsModal();
    updateProjectSeamsUI(p);
    showToast(`Фальцы проекта сохранены: ${big}+${small} мм!`, 'success');
    renderProjectInside();
    if (typeof currentScreenId !== 'undefined' && currentScreenId === SCREENS.NESTING) {
        renderProjectNesting();
    }
}

function updateProjectSeamsUI(p) {
    if (!p) return;
    const data = getProjectFlangeData(p);
    const label = document.getElementById('activeProjSeamsLabel');
    if (label) label.textContent = `${data.seams.lock_pittsburgh}+${data.seams.lock_single} мм`;
    const packInp = document.getElementById('settPackQty');
    if (packInp) packInp.value = data.pack_qty;
}

function swapDims(id1, id2) {
    const el1 = document.getElementById(id1);
    const el2 = document.getElementById(id2);
    if (!el1 || !el2) return;
    const tmp = el1.value;
    el1.value = el2.value;
    el2.value = tmp;
    updateFrameLabels();
    showToast(`Размеры изменены: ${el1.value} × ${el2.value} мм`, 'info');
}

function getItemFrames(it) {
    if (it.frames && Array.isArray(it.frames) && it.frames.length) {
        return it.frames;
    }
    if (it.frames && typeof it.frames === 'string' && it.frames.trim().length > 0) {
        const parts = it.frames.trim().split(/\s+/).map(s => s.replace('x', '×')).filter(Boolean);
        if (parts.length) return parts;
    }
    const frames = [];
    if (it.shape === 'rect' || it.shape === 'smooth') {
        if ((it.fittingId === 'r_tee' || it.title === 'Тройник') && it.descDetail) {
            const raw = it.descDetail.replace('Все стороны:', '').replace('Все 3 рамки:', '').trim();
            const parts = raw.split('/').map(s => s.trim().replace('x', '×')).filter(Boolean);
            if (parts.length) return parts;
        }
        if ((it.fittingId === 'r_cross' || it.title === 'Крестовина') && it.descDetail) {
            const raw = it.descDetail.replace('Все стороны:', '').replace('Все 4 рамки:', '').trim();
            const parts = raw.split('/').map(s => s.trim().replace('x', '×')).filter(Boolean);
            if (parts.length) return parts;
        }
        const w1 = it.w1 || it.w || 400;
        const h1 = it.h1 || it.h || 300;
        const w2 = it.w2 || it.w || 400;
        const h2 = it.h2 || it.h || 300;
        if (it.flange1) frames.push(`${w1}×${h1}`);
        if (it.flange2 && it.shape === 'rect') frames.push(`${w2}×${h2}`);
    }
    return frames;
}

function closeAllModals() {
    [
        'itemFormModal', 'profileModal', 'projectModal', 'projectSettingsModal',
        'subprojectModal', 'projectSeamsModal', 'flangeSettingsModal', 'flangeAddScrapModal',
        'nestingAddScrapModal', 'bulkEditModal', 'projectFinanceModal', 'profileDropdown'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
    });
    if (typeof unlockScroll === 'function') unlockScroll();
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
});

// ==========================================
// ЗАГРУЗКА И СИНХРОНИЗАЦИЯ С SUPABASE
// ==========================================
function updateCloudIndicatorUI(status) {
    const ind = document.getElementById('cloudIndicator');
    const dot = document.getElementById('cloudDotIndicator');
    const authSt = document.getElementById('cloudStatusAuth');
    const menuDot = document.getElementById('cloudDotIndicatorMenu');
    const menuSt = document.getElementById('cloudStatusMenu');

    if (status === 'connecting') {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
        if (menuDot) menuDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
        if (ind) { ind.textContent = '🔄 Подключение...'; ind.className = 'text-[10px] text-amber-400 font-medium cursor-pointer'; }
        if (authSt) authSt.textContent = '🔄 Подключение к базе...';
        if (menuSt) menuSt.textContent = '🔄 Подключение...';
    } else if (status === 'loading') {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400';
        if (menuDot) menuDot.className = 'w-2 h-2 rounded-full bg-amber-400';
        if (ind) { ind.textContent = '● Загрузка...'; ind.className = 'text-[10px] text-amber-400 font-medium cursor-pointer'; }
        if (authSt) authSt.textContent = '● Загрузка данных...';
        if (menuSt) menuSt.textContent = '● Загрузка...';
    } else if (status === 'online') {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
        if (menuDot) menuDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
        if (ind) { ind.textContent = '🟢 Онлайн'; ind.className = 'text-[10px] text-emerald-400 font-medium cursor-pointer'; }
        if (authSt) authSt.textContent = '🟢 Supabase: Онлайн (Синхронизировано)';
        if (menuSt) menuSt.textContent = 'База онлайн';
    } else if (status === 'error') {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-rose-500';
        if (menuDot) menuDot.className = 'w-2 h-2 rounded-full bg-rose-500';
        if (ind) { ind.textContent = '🔴 Офлайн'; ind.className = 'text-[10px] text-rose-400 font-medium cursor-pointer'; }
        if (authSt) authSt.textContent = '🔴 Ошибка связи (Нажмите для повтора)';
        if (menuSt) menuSt.textContent = '🔴 Офлайн';
    }
}

function formatDateShort(val) {
    if (!val) return '—';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) {
        return '—';
    }
}

function formatDateTimeShort(val) {
    if (!val) return '—';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + 
               d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
        return '—';
    }
}

async function manualReconnectDatabase() {
    triggerHaptic('medium');
    updateCloudIndicatorUI('connecting');
    await loadInitialData();
}

async function loadInitialData() {
    updateCloudIndicatorUI('loading');

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
            if (setts.fittings && setts.fittings.rect) {
                appState.fittings = setts.fittings;
                if (Array.isArray(setts.fittings.__custom_params)) {
                    setts.fittings.__custom_params.forEach(p => {
                        if (p && p.code && !ALL_PARAM_DEFS.some(x => x.code === p.code)) {
                            ALL_PARAM_DEFS.push(p);
                        }
                    });
                }
            }
            if (setts.standalone_flange) appState.standaloneFlange = setts.standalone_flange;
        }

        // 2. Загрузка пользователей
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
            supabaseClient.from('projects').select('*').order('order_index', { ascending: true, nullsFirst: false }),
            supabaseClient.from('items').select('*').order('id', { ascending: true }),
            supabaseClient.from('payments').select('*').order('id', { ascending: true })
        ]);

        let projs = pRes.data || [];
        try {
            const savedOrder = JSON.parse(localStorage.getItem('mv_projects_order') || '[]');
            if (Array.isArray(savedOrder) && savedOrder.length > 0) {
                const orderMap = new Map(savedOrder.map(x => [x.id, x.order_index]));
                projs.forEach(p => {
                    if (orderMap.has(p.id)) p.order_index = orderMap.get(p.id);
                });
            }
        } catch (_) {}
        projs.sort((a, b) => (a.order_index ?? 999999) - (b.order_index ?? 999999));
        appState.projects = projs;
        appState.allItems = (itRes.data || []).map(i => ({
            ...i,
            ...(i.dimensions || {}),
            phase_id: i.dimensions?.phase_id || 'main',
            item_status: i.dimensions?.item_status || 'queue'
        }));
        appState.allPayments = payRes.data || [];

        updateCloudIndicatorUI('online');

        checkAuthState();
        if (typeof onScreenEnter === 'function' && typeof currentScreenId !== 'undefined' && currentScreenId) onScreenEnter(currentScreenId);
    } catch (err) {
        console.error('Supabase load error:', err);
        updateCloudIndicatorUI('error');
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
            ...(i.dimensions || {}),
            phase_id: i.dimensions?.phase_id || 'main',
            item_status: i.dimensions?.item_status || 'queue'
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
