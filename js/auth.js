// ==========================================
// MODULE: auth.js
// Авторизация по PIN-коду, переключение Dev-режима и профиль
// ==========================================

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

function isChingisOrDev(userName) {
    if (!userName) return false;
    const lower = String(userName).toLowerCase().trim();
    if (lower.includes('чингис') || lower.includes('chingis')) return true;
    const u = (appState.users || []).find(x => x.name === userName);
    return u && u.role === 'developer';
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

    // Расчет заработка текущего мастера по собранным изделиям
    let userEarnedDone = 0;
    appState.allItems.forEach(it => {
        const p = appState.projects.find(x => x.id === it.project_id);
        if (!p || p.archive_state === 'archived') return;
        if ((it.workers || []).includes(u.name) && it.item_status === 'done') {
            const share = getWorkerItemShareInfo(it, u.name, p);
            userEarnedDone += share.amount;
        }
    });

    const hBadge = document.getElementById('headerEarnedBadge');
    if (hBadge) hBadge.textContent = `${userEarnedDone.toLocaleString()} ₸`;
    const dBadge = document.getElementById('dropEarnedBadge');
    if (dBadge) dBadge.textContent = `${userEarnedDone.toLocaleString()} ₸`;

    renderMainMenuHeroStats();

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

function renderMainMenuHeroStats() {
    const activeProjects = appState.projects.filter(p => (p.archive_state || 'active') === 'active');
    const activeProjIds = new Set(activeProjects.map(p => p.id));
    const activeItems = appState.allItems.filter(it => activeProjIds.has(it.project_id));

    let queueCount = 0;
    let doneCount = 0;
    let ductsArea = 0;

    activeItems.forEach(it => {
        const st = it.item_status || 'queue';
        const q = Number(it.qty) || 1;
        if (st === 'done') {
            doneCount += q;
        } else {
            queueCount += q;
        }

        if (it.category === 'duct') {
            const p = activeProjects.find(x => x.id === it.project_id);
            const seams = getProjectSeams(p);
            const unfold = it.shape === 'rect' 
                ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
            const area = (unfold * Number(it.l || 1250) * q) / 1e6;
            ductsArea += area;
        }
    });

    const elProj = document.getElementById('heroActiveProjectsCount');
    if (elProj) elProj.textContent = activeProjects.length;

    const elQueue = document.getElementById('heroQueueItemsCount');
    if (elQueue) elQueue.textContent = `${queueCount} шт`;

    const elDone = document.getElementById('heroDoneItemsCount');
    if (elDone) elDone.textContent = `${doneCount} шт`;

    const elArea = document.getElementById('heroDuctsAreaTotal');
    if (elArea) elArea.textContent = `${ductsArea.toFixed(1)} м²`;
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
