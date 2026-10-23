// ==========================================
// MODULE: router.js
// Централизованная навигация между экранами приложения Maxvent Tools
// ==========================================

const SCREENS = {
    AUTH: 'screen-auth',
    MENU: 'screen-menu',
    PROJECTS: 'screen-projects',
    PROJECT_DETAIL: 'screen-project-detail',
    FLANGE: 'screen-flange',
    WORKER: 'screen-worker',
    ADMIN: 'screen-admin',
    NESTING: 'screen-nesting'
};

let currentScreenId = SCREENS.AUTH;
const screenHistory = [];
let flangeSource = 'menu'; // 'menu' or 'project'

function navigateTo(screenId, options = {}) {
    if (!screenId) return;

    triggerHaptic('light');

    // Если переходим не назад, сохраняем историю переходов
    if (!options.isBack && currentScreenId && currentScreenId !== SCREENS.AUTH && currentScreenId !== screenId) {
        screenHistory.push(currentScreenId);
    }

    // Скрываем все экраны
    document.querySelectorAll('.app-screen').forEach(el => {
        el.classList.add('hidden');
    });

    // Показываем целевой экран
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    currentScreenId = screenId;

    // Вызываем хуки входа на экран
    onScreenEnter(screenId, options);
}

function goBack() {
    triggerHaptic('light');
    if ((currentScreenId === SCREENS.FLANGE || currentScreenId === SCREENS.NESTING) && session.insideProjectId) {
        navigateTo(SCREENS.PROJECT_DETAIL, { isBack: true });
        return;
    }
    if (screenHistory.length > 0) {
        const prev = screenHistory.pop();
        navigateTo(prev, { isBack: true });
    } else {
        navigateTo(SCREENS.MENU, { isBack: true });
    }
}

function onScreenEnter(screenId, options = {}) {
    // Обновление состояния в зависимости от активного экрана
    if (screenId === SCREENS.MENU) {
        updateHeaderUI();
        renderMainMenuSummary();
    } else if (screenId === SCREENS.PROJECTS) {
        renderMainMenuProjects();
    } else if (screenId === SCREENS.PROJECT_DETAIL) {
        if (options.projectId && options.projectId !== session.insideProjectId) {
            openInsideProject(options.projectId);
        } else if (session.insideProjectId) {
            renderProjectInside();
        }
    } else if (screenId === SCREENS.FLANGE) {
        const isProj = !!(options.fromProject && session.insideProjectId);
        flangeSource = isProj ? 'project' : 'menu';
        const stWrap = document.getElementById('flangeStandaloneSection');
        const prWrap = document.getElementById('flangeProjectSection');
        const titleEl = document.getElementById('flangeScreenTitle');

        if (isProj) {
            const p = appState.projects.find(x => x.id === session.insideProjectId);
            if (titleEl) titleEl.textContent = `Шинка: ${p ? p.title : 'Проект'}`;
            if (stWrap) stWrap.classList.add('hidden');
            if (prWrap) prWrap.classList.remove('hidden');
            renderProjectFlange();
        } else {
            if (titleEl) titleEl.textContent = 'Калькулятор шинки (1D)';
            if (stWrap) stWrap.classList.remove('hidden');
            if (prWrap) prWrap.classList.add('hidden');
            renderStandaloneFlange();
        }
    } else if (screenId === SCREENS.WORKER) {
        renderWorkerProfileContent();
    } else if (screenId === SCREENS.ADMIN) {
        renderDevDashboard();
    } else if (screenId === SCREENS.NESTING) {
        renderProjectNesting();
    }
}

// Рендер сводки на экране Главного Меню
function renderMainMenuSummary() {
    const activeProjects = appState.projects.filter(p => (p.archive_state || 'active') === 'active');
    const badgeProjects = document.getElementById('menuBadgeProjects');
    if (badgeProjects) {
        badgeProjects.textContent = `${activeProjects.length} в работе`;
    }

    const totalQty = appState.allItems.reduce((s, i) => s + (i.qty || 0), 0);
    const doneQty = appState.allItems.filter(i => i.item_status === 'done').reduce((s, i) => s + (i.qty || 0), 0);
    const totalArea = appState.allItems.filter(i => i.category === 'duct').reduce((s, i) => s + ((calcDuctArea(i) || 0) * (i.qty || 0)), 0);

    const mDuctsArea = document.getElementById('menuDuctsArea');
    if (mDuctsArea) mDuctsArea.textContent = `${totalArea.toFixed(1)} м²`;

    const mQueueCount = document.getElementById('menuQueueCount');
    if (mQueueCount) mQueueCount.textContent = `${totalQty - doneQty} шт`;

    const mDoneCount = document.getElementById('menuDoneCount');
    if (mDoneCount) mDoneCount.textContent = `${doneQty} шт`;

    // Выработка текущего мастера за сегодня
    if (session.user) {
        const stats = calculateWorkerEarned(session.user.name, 'today');
        const badgeEarned = document.getElementById('menuEarnedAmount');
        if (badgeEarned) badgeEarned.textContent = `${formatMoney(stats.earnedDone)} ₸`;
    }
}
