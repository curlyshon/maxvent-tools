// ==========================================
// MODULE: main.js
// Точка входа (инициализация приложения)
// ==========================================

function updateGreetingHeader() {
    const titleEl = document.getElementById('appGreetingTitle');
    const dateEl = document.getElementById('appGreetingDate');
    if (!titleEl) return;

    const now = new Date();
    const hour = now.getHours();
    let greeting = 'добрый день.';
    if (hour >= 5 && hour < 12) greeting = 'доброе утро.';
    else if (hour >= 12 && hour < 18) greeting = 'добрый день.';
    else if (hour >= 18 && hour < 23) greeting = 'добрый вечер.';
    else greeting = 'доброй ночи.';

    titleEl.textContent = greeting;

    if (dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        dateEl.textContent = now.toLocaleDateString('ru-RU', options);
    }
}

function openInsideFlangeOrModal() {
    if (session.insideProjectId) {
        switchInnerTab('flange');
    } else {
        openStandaloneFlange();
    }
}

function openInsideSpecOrFirst() {
    if (session.insideProjectId) {
        switchInnerTab('items');
    } else {
        const firstActive = appState.projects.find(p => (p.archive_state || 'active') === 'active');
        if (firstActive) {
            openInsideProject(firstActive.id);
        } else {
            openProjectModal();
        }
    }
}

function handleQuickAddAction() {
    if (session.insideProjectId) {
        switchInnerTab('items');
        const fBox = document.getElementById('itemForm');
        if (fBox) {
            fBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const inW = document.getElementById('f_w') || document.getElementById('f_d') || document.getElementById('inQty');
            if (inW) setTimeout(() => inW.focus(), 300);
        }
    } else {
        openProjectModal();
    }
}

// ==========================================
// СТАРТ ПРИЛОЖЕНИЯ
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    updateGreetingHeader();
    loadInitialData();
});
