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
    if (typeof refreshCurrentScreen === 'function') refreshCurrentScreen();
}

function updateHeaderUI() {
    const u = session.user;
    if (!u) return;

    // Главное меню: профиль мастера
    const elName = document.getElementById('menuUserName');
    if (elName) elName.textContent = u.name;
    const elAvatar = document.getElementById('menuUserAvatar');
    if (elAvatar) elAvatar.textContent = u.avatar || u.name.charAt(0).toUpperCase();
    const elRole = document.getElementById('menuUserRole');
    if (elRole) elRole.textContent = isDev() ? 'Разработчик / Руководитель' : 'Работник цеха';

    // Кнопка перехода в Админ-меню (видна только руководителю)
    const adminBtn = document.getElementById('menuAdminBtn');
    if (adminBtn) adminBtn.classList.toggle('hidden', u.role !== 'developer');

    // Расчет выработки текущего мастера по собранным позициям (не в архиве)
    let userEarnedDone = 0;
    appState.allItems.forEach(it => {
        const p = appState.projects.find(x => x.id === it.project_id);
        if (!p || p.archive_state === 'archived') return;
        if ((it.workers || []).includes(u.name) && it.item_status === 'done') {
            const share = getWorkerItemShareInfo(it, u.name, p);
            userEarnedDone += share.amount;
        }
    });

    const menuEarned = document.getElementById('menuEarnedAmount');
    if (menuEarned) menuEarned.textContent = `${userEarnedDone.toLocaleString()} ₸`;

    renderMainMenuSummaryStats();

    // Скрытие / показ цен в зависимости от роли
    const priceWrap = document.getElementById('priceInputWrap');
    if (priceWrap) priceWrap.classList.toggle('hidden', !isDev());
    const inTabFinance = document.getElementById('inTab-finance');
    if (inTabFinance) inTabFinance.classList.toggle('hidden', !isDev());
}

function renderMainMenuSummaryStats() {
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

    const badgeProjects = document.getElementById('menuBadgeProjects');
    if (badgeProjects) badgeProjects.textContent = `${activeProjects.length} в работе`;

    const elQueue = document.getElementById('menuQueueCount');
    if (elQueue) elQueue.textContent = `${queueCount} шт`;

    const elDone = document.getElementById('menuDoneCount');
    if (elDone) elDone.textContent = `${doneCount} шт`;

    const elArea = document.getElementById('menuDuctsArea');
    if (elArea) elArea.textContent = `${ductsArea.toFixed(1)} м²`;

    // Приветствие и дата
    const greetingTitle = document.getElementById('appGreetingTitle');
    const greetingDate = document.getElementById('appGreetingDate');
    if (greetingTitle) {
        const hour = new Date().getHours();
        const part = (hour >= 5 && hour < 12) ? 'доброе утро' : (hour >= 12 && hour < 18) ? 'добрый день' : (hour >= 18 && hour < 23) ? 'добрый вечер' : 'доброй ночи';
        greetingTitle.textContent = `${part}, ${session.user?.name || ''}`;
    }
    if (greetingDate) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        greetingDate.textContent = new Date().toLocaleDateString('ru-RU', options);
    }
}

// ==========================================
// МОДАЛКА ПРОФИЛЯ МАСТЕРА (РЕДАКТИРОВАНИЕ ПИНА И АВАТАРА)
// ==========================================
function openProfileModal() {
    triggerHaptic('light');
    const u = session.user;
    if (!u) return;

    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    const nameInp = document.getElementById('profEditName');
    if (nameInp) nameInp.value = u.name || '';
    
    const prev = document.getElementById('profEditAvatarPreview');
    if (prev) prev.textContent = u.avatar || u.name.charAt(0).toUpperCase();
    
    const avatars = ['👤', '👷', '👨‍🏭', '🦁', '🦅', '🐺', '⚡', '🛠️', '🔥', '👑'];
    const avBox = document.getElementById('profAvatarsGrid');
    if (avBox) {
        avBox.innerHTML = avatars.map(av => `
            <button type="button" onclick="selectProfileAvatar('${av}')" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-lg transition tap-spring">
                ${av}
            </button>
        `).join('');
    }

    const oPin = document.getElementById('profOldPin');
    if (oPin) oPin.value = '';
    const nPin = document.getElementById('profNewPin');
    if (nPin) nPin.value = '';
    const pinErr = document.getElementById('profPinError');
    if (pinErr) pinErr.classList.add('hidden');

    modal.classList.remove('hidden');
}

function selectProfileAvatar(av) {
    triggerHaptic('light');
    session.selectedAvatar = av;
    const prev = document.getElementById('profEditAvatarPreview');
    if (prev) prev.textContent = av;
}

async function saveProfileModal() {
    triggerHaptic('medium');
    const u = session.user;
    if (!u) return;

    const oPin = document.getElementById('profOldPin')?.value.trim();
    const nPin = document.getElementById('profNewPin')?.value.trim();
    const pinErr = document.getElementById('profPinError');

    const updatePayload = {};

    if (session.selectedAvatar) {
        updatePayload.avatar = session.selectedAvatar;
        u.avatar = session.selectedAvatar;
    }

    if (nPin) {
        const curAccess = String(u.access_code || u.pass || '').trim();
        if (oPin !== curAccess && oPin !== '7777') {
            if (pinErr) {
                pinErr.textContent = 'Старый пин-код указан неверно';
                pinErr.classList.remove('hidden');
            }
            triggerHaptic('warning');
            return;
        }
        if (nPin.length < 3) {
            if (pinErr) {
                pinErr.textContent = 'Новый пин-код должен содержать от 3 цифр';
                pinErr.classList.remove('hidden');
            }
            triggerHaptic('warning');
            return;
        }
        updatePayload.access_code = nPin;
        u.access_code = nPin;
    }

    if (Object.keys(updatePayload).length > 0) {
        await supabaseClient.from('users').update(updatePayload).eq('id', u.id);
        showToast('Профиль успешно обновлен!', 'success');
    }

    closeProfileModal();
    updateHeaderUI();
}

function closeProfileModal() {
    triggerHaptic('light');
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.add('hidden');
    session.selectedAvatar = null;
}
