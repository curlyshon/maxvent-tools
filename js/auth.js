// ==========================================
// MODULE: auth.js
// Авторизация по PIN-коду, переключение Dev-режима и профиль
// ==========================================

// ==========================================
// АВТОРИЗАЦИЯ СТРОГО ПО КОДУ ДОСТУПА И ЦИФРОВОЙ КЛАВИАТУРЕ
// ==========================================
let currentAuthPin = '';

function pressAuthPin(digit) {
    triggerHaptic('light');
    if (currentAuthPin.length < 6) {
        currentAuthPin += String(digit);
        updateAuthPinUI();
        const err = document.getElementById('authError');
        if (err) err.classList.add('hidden');

        // Проверяем, подошел ли пин-код
        const u = appState.users.find(x => String(x.access_code || x.pass || '').trim() === currentAuthPin);
        if (u) {
            triggerHaptic('success');
            session.user = u;
            session.devMode = (u.role === 'developer');
            localStorage.setItem('mv_online_session', JSON.stringify({ userId: u.id, devMode: session.devMode }));
            clearAuthPin();
            checkAuthState();
            return;
        }

        if (currentAuthPin.length >= 4) {
            setTimeout(() => {
                const checkAgain = appState.users.find(x => String(x.access_code || x.pass || '').trim() === currentAuthPin);
                if (!checkAgain && currentAuthPin.length >= 4) {
                    triggerHaptic('warning');
                    if (err) {
                        err.textContent = 'Неверный код доступа';
                        err.classList.remove('hidden');
                    }
                    setTimeout(() => clearAuthPin(), 600);
                }
            }, 250);
        }
    }
}

function backspaceAuthPin() {
    triggerHaptic('light');
    currentAuthPin = currentAuthPin.slice(0, -1);
    updateAuthPinUI();
}

function clearAuthPin() {
    currentAuthPin = '';
    updateAuthPinUI();
}

function updateAuthPinUI() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`pinDot-${i}`);
        if (dot) {
            if (i <= currentAuthPin.length) {
                dot.className = 'w-4 h-4 rounded-full bg-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all';
            } else {
                dot.className = 'w-4 h-4 rounded-full border-2 border-white/20 bg-transparent transition-all';
            }
        }
    }
    const input = document.getElementById('authCodeInput');
    if (input) input.value = currentAuthPin;
}

async function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    const code = (document.getElementById('authCodeInput')?.value || currentAuthPin).trim();
    const err = document.getElementById('authError');
    if (err) err.classList.add('hidden');

    const u = appState.users.find(x => String(x.access_code || x.pass || '').trim() === code);
    if (!u) {
        if (err) {
            err.textContent = 'Неверный код доступа. Обратитесь к руководителю цеха.';
            err.classList.remove('hidden');
        }
        triggerHaptic('warning');
        return;
    }

    triggerHaptic('success');
    session.user = u;
    session.devMode = (u.role === 'developer');
    localStorage.setItem('mv_online_session', JSON.stringify({ userId: u.id, devMode: session.devMode }));
    clearAuthPin();
    checkAuthState();
}

function checkAuthState() {
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
        if (typeof navigateTo === 'function') {
            navigateTo(SCREENS.AUTH);
        } else {
            document.getElementById('screen-auth')?.classList.remove('hidden');
        }
    } else {
        updateHeaderUI();
        if (typeof navigateTo === 'function') {
            if (currentScreenId === SCREENS.AUTH) {
                navigateTo(SCREENS.MENU);
            }
        }
    }
}

function logout() {
    triggerHaptic('light');
    session.user = null;
    localStorage.removeItem('mv_online_session');
    const drop = document.getElementById('profileDropdown');
    if (drop) drop.classList.add('hidden');
    clearAuthPin();
    if (typeof navigateTo === 'function') {
        navigateTo(SCREENS.AUTH);
    }
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

    if (document.getElementById('userNameHeader')) document.getElementById('userNameHeader').textContent = u.name;
    if (document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = u.name.charAt(0).toUpperCase();
    if (document.getElementById('dropUserName')) document.getElementById('dropUserName').textContent = u.name;
    if (document.getElementById('dropUserRole')) document.getElementById('dropUserRole').textContent = isDev() ? 'Разработчик (Полный доступ)' : 'Работник цеха';

    // Главное меню профиль
    if (document.getElementById('menuUserName')) document.getElementById('menuUserName').textContent = u.name;
    if (document.getElementById('menuUserAvatar')) document.getElementById('menuUserAvatar').textContent = u.name.charAt(0).toUpperCase();
    if (document.getElementById('menuUserRole')) document.getElementById('menuUserRole').textContent = isDev() ? 'Разработчик' : 'Работник цеха';
    if (document.getElementById('menuAdminBtn')) document.getElementById('menuAdminBtn').classList.toggle('hidden', u.role !== 'developer');

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
    const heroEarned = document.getElementById('heroWorkerEarned');
    if (heroEarned) heroEarned.textContent = `${userEarnedDone.toLocaleString()} ₸`;
    const menuEarned = document.getElementById('menuEarnedAmount');
    if (menuEarned) menuEarned.textContent = `${userEarnedDone.toLocaleString()} ₸`;

    renderMainMenuHeroStats();

    const devWrap = document.getElementById('devToggleWrap');
    if (devWrap) {
        if (u.role === 'developer') {
            devWrap.classList.remove('hidden');
            devWrap.classList.add('flex');
            const devBtn = document.getElementById('devToggleBtn');
            if (devBtn) devBtn.className = session.devMode ? "w-8 h-4 bg-blue-600 rounded-full relative transition flex items-center" : "w-8 h-4 bg-slate-700 rounded-full relative transition flex items-center";
            const devKnob = document.getElementById('devToggleKnob');
            if (devKnob) devKnob.className = session.devMode ? "w-3 h-3 bg-white rounded-full absolute right-0.5 transition" : "w-3 h-3 bg-white rounded-full absolute left-0.5 transition";
        } else {
            devWrap.classList.add('hidden');
        }
    }

    if (document.getElementById('menuBtnDevSettings')) document.getElementById('menuBtnDevSettings').classList.toggle('hidden', !isDev());
    if (document.getElementById('menuBtnGlobalFinance')) document.getElementById('menuBtnGlobalFinance').classList.toggle('hidden', !isDev());
    if (document.getElementById('priceInputWrap')) document.getElementById('priceInputWrap').classList.toggle('hidden', !isDev());
    if (document.getElementById('inTab-finance')) document.getElementById('inTab-finance').classList.toggle('hidden', !isDev());
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
    if (typeof currentScreenId !== 'undefined') {
        if (currentScreenId === SCREENS.PROJECT_DETAIL && session.insideProjectId) {
            renderProjectInside();
        } else if (currentScreenId === SCREENS.PROJECTS) {
            renderMainMenuProjects();
        } else if (currentScreenId === SCREENS.MENU) {
            renderMainMenuSummary();
        } else if (currentScreenId === SCREENS.FLANGE) {
            if (flangeSource === 'project' && session.insideProjectId) renderProjectFlange();
            else renderStandaloneFlange();
        } else if (currentScreenId === SCREENS.WORKER) {
            renderWorkerProfileContent();
        } else if (currentScreenId === SCREENS.ADMIN) {
            renderDevDashboard();
        } else if (currentScreenId === SCREENS.NESTING) {
            renderProjectNesting();
        }
    } else {
        renderMainMenuProjects();
    }
}
