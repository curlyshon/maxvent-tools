// ==========================================
// MODULE: finance.js
// Финансовый учет объектов, платежи и сводные отчеты
// ==========================================

function calculateProjectFinances(projId) {
    const p = appState.projects.find(x => x.id === projId);
    const seams = typeof getProjectSeams === 'function' ? getProjectSeams(p) : { lock_pittsburgh: 32, lock_single: 9, round_seam: 22 };
    
    // Используем позиции проекта (из кэша или активные)
    let items = appState.allItems.filter(x => x.project_id === projId);
    if (items.length === 0 && session.insideProjectId === projId && appState.activeProjectItems.length > 0) {
        items = appState.activeProjectItems;
    }
    
    let payments = appState.allPayments.filter(x => x.project_id === projId);
    if (payments.length === 0 && session.insideProjectId === projId && appState.activeProjectPayments.length > 0) {
        payments = appState.activeProjectPayments;
    }

    let totalSum = 0;
    items.forEach(it => {
        const price = Number(it.price) || 0;
        const qty = Number(it.qty) || 1;
        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' 
                ? (2 * (Number(it.w || 0) + Number(it.h || 0)) + seams.lock_pittsburgh + seams.lock_single) 
                : Math.round(Math.PI * Number(it.d || 0) + seams.round_seam);
            const area = (unfold * Number(it.l || 1250) * qty) / 1e6;
            totalSum += Math.round(area * price);
        } else {
            totalSum += Math.round(qty * price);
        }
    });

    const paid = payments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
    const debt = Math.max(0, totalSum - paid);
    const overpay = Math.max(0, paid - totalSum);
    return { totalSum, paid, debt, overpay, items, payments };
}


function openProjectFinanceModal() {
    triggerHaptic('light');
    const modal = document.getElementById('projectFinanceModal');
    if (modal) { 
        modal.classList.remove('hidden'); 
        if (typeof lockScroll === 'function') lockScroll();
    }
    renderProjectFinance();
}

function closeProjectFinanceModal() {
    triggerHaptic('light');
    const modal = document.getElementById('projectFinanceModal');
    if (modal) { 
        modal.classList.add('hidden'); 
        if (typeof unlockScroll === 'function') unlockScroll();
    }
}

function renderProjectFinance() {
    const p = appState.projects.find(x => x.id === session.insideProjectId);
    if (!p) return;
    const fin = calculateProjectFinances(p.id);

    const body = document.getElementById('projFinanceBody');
    body.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-[#09090b] p-4 rounded-xl border border-white/10">
                <div class="text-xs text-zinc-400">Стоимость заказа:</div>
                <div class="text-xl font-bold mono text-white mt-1">${fin.totalSum.toLocaleString()} ₸</div>
            </div>
            <div class="bg-[#09090b] p-4 rounded-xl border border-white/10">
                <div class="text-xs text-zinc-400">Оплачено:</div>
                <div class="text-xl font-bold mono text-emerald-400 mt-1">${fin.paid.toLocaleString()} ₸</div>
            </div>
            <div class="bg-[#09090b] p-4 rounded-xl border border-white/10">
                <div class="text-xs text-zinc-400">${fin.overpay > 0 ? 'Переплата:' : 'Остаток долга:'}</div>
                <div class="text-xl font-bold mono ${fin.overpay > 0 ? 'text-zinc-300' : 'text-amber-400'} mt-1">
                    ${fin.overpay > 0 ? `+${fin.overpay.toLocaleString()} ₸` : `${fin.debt.toLocaleString()} ₸`}
                </div>
            </div>
        </div>

        <div class="bg-[#09090b] p-4 rounded-xl border border-white/10 space-y-3">
            <div class="font-bold text-white text-xs uppercase tracking-wider">Зафиксировать платеж</div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" id="payAmountInput" placeholder="Сумма (₸)" class="bg-[#121217] border border-white/10 rounded-lg px-3 py-2 text-xs mono text-white font-bold">
                <input type="text" id="payNoteInput" placeholder="Примечание (Kaspi, нал)" class="bg-[#121217] border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                <button onclick="addProjectPayment()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg py-2">
                    + Внести платеж
                </button>
            </div>
        </div>

        <div class="bg-[#09090b] p-4 rounded-xl border border-white/10 space-y-2">
            <div class="font-bold text-white text-xs uppercase tracking-wider">История платежей объекта:</div>
            <div class="space-y-1.5 mono">
                ${(fin.payments && fin.payments.length) ? fin.payments.map((pay) => `
                    <div class="flex justify-between items-center bg-[#121217] p-2.5 rounded-lg border border-white/10 text-xs">
                        <div><span class="text-zinc-400">${pay.pay_date}</span> — <strong class="text-emerald-400">${Number(pay.amount).toLocaleString()} ₸</strong> <span class="text-zinc-400">(${pay.note || '—'})</span></div>
                        <button onclick="deletePayment(${pay.id})" class="text-zinc-500 hover:text-rose-400 font-bold px-2">✕</button>
                    </div>
                `).join('') : '<div class="text-zinc-500 text-xs">Платежей не зафиксировано</div>'}
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
    const seams = getProjectSeams(p);
    const fin = calculateProjectFinances(p.id);

    let ductsArea = 0;
    let fittingsQty = 0;
    fin.items.forEach(it => {
        if (it.category === 'duct') {
            const unfold = it.shape === 'rect' ? (2 * (it.w + it.h) + seams.lock_pittsburgh + seams.lock_single) : Math.round(Math.PI * it.d + seams.round_seam);
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
    let grandTotal = 0;
    let grandPaid = 0;
    let grandDebt = 0;

    const rows = appState.projects.map(p => {
        const fin = calculateProjectFinances(p.id);
        grandTotal += fin.totalSum;
        grandPaid += fin.paid;
        grandDebt += fin.debt;
        return `
            <tr>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${p.title} <span style="display:block; font-size: 10px; color: #666;">${p.group_name || '—'}</span></td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${fin.totalSum.toLocaleString()} ₸</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; color: #16a34a; font-weight: bold;">${fin.paid.toLocaleString()} ₸</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; ${fin.debt > 0 ? 'color: #dc2626; font-weight: bold;' : 'color: #666;'}">${fin.debt.toLocaleString()} ₸</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${p.archive_state === 'archived' ? 'Архив' : 'Активен'}</td>
            </tr>
        `;
    }).join('');

    const printArea = document.getElementById('printReportArea');
    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #000;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between;">
                <div>
                    <h2 style="margin: 0; font-size: 22px; font-weight: bold;">MAXVENT TOOLS</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Сводный финансовый отчет по всем объектам</p>
                </div>
                <div style="text-align: right; font-size: 13px;">
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr style="background: #f8fafc;">
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Сумма всех заказов</th>
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${grandTotal.toLocaleString()} ₸</th>
                </tr>
                <tr style="background: #f8fafc;">
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Всего оплачено</th>
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #16a34a;">${grandPaid.toLocaleString()} ₸</th>
                </tr>
                <tr style="background: #fef2f2;">
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Общий остаток долга</th>
                    <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #dc2626;">${grandDebt.toLocaleString()} ₸</th>
                </tr>
            </table>

            <h4 style="font-size: 14px; margin-bottom: 8px;">Реестр объектов:</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Объект</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Смета</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Оплачено</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Долг</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">Статус</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
    window.print();
}

function renderGlobalFinanceReport() {
    const content = document.getElementById('globalFinanceContent');
    if (!content) return;
    let grandTotal = 0;
    let grandPaid = 0;
    let grandDebt = 0;

    const rows = appState.projects.map(p => {
        const fin = calculateProjectFinances(p.id);
        grandTotal += fin.totalSum;
        grandPaid += fin.paid;
        grandDebt += fin.debt;
        return `
            <tr class="border-b border-white/5 hover:bg-white/5">
                <td class="p-3 font-bold text-white">${p.title} <span class="text-[10px] text-zinc-500 block">${p.group_name || '—'}</span></td>
                <td class="p-3 mono">${fin.totalSum.toLocaleString()} ₸</td>
                <td class="p-3 mono text-emerald-400">${fin.paid.toLocaleString()} ₸</td>
                <td class="p-3 mono ${fin.debt > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}">${fin.debt.toLocaleString()} ₸</td>
                <td class="p-3"><span class="text-[10px] px-2 py-0.5 rounded font-bold ${p.archive_state === 'archived' ? 'bg-zinc-800 text-zinc-400' : 'bg-white/10 text-zinc-200'}">${p.archive_state === 'archived' ? 'Архив' : 'Активен'}</span></td>
            </tr>
        `;
    }).join('');

    content.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-[#18181f] p-4 rounded-2xl border border-white/5">
                <div class="text-zinc-400">Сумма всех заказов:</div>
                <div class="text-xl font-bold mono text-white mt-1">${grandTotal.toLocaleString()} ₸</div>
            </div>
            <div class="bg-[#18181f] p-4 rounded-2xl border border-white/5">
                <div class="text-zinc-400">Всего оплачено:</div>
                <div class="text-xl font-bold mono text-emerald-400 mt-1">${grandPaid.toLocaleString()} ₸</div>
            </div>
            <div class="bg-[#18181f] p-4 rounded-2xl border border-white/5">
                <div class="text-zinc-400">Общий остаток долга:</div>
                <div class="text-xl font-bold mono text-amber-400 mt-1">${grandDebt.toLocaleString()} ₸</div>
            </div>
        </div>
        <div class="overflow-x-auto bg-[#18181f] rounded-2xl border border-white/5">
            <table class="w-full text-left text-xs">
                <thead class="bg-[#121217] border-b border-white/5 uppercase text-zinc-400">
                    <tr><th class="p-3">Объект</th><th class="p-3">Смета</th><th class="p-3">Оплачено</th><th class="p-3">Долг</th><th class="p-3">Статус</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function openGlobalFinanceModal() {
    if (typeof navigateTo === 'function') {
        navigateTo(SCREENS.ADMIN);
    }
}

function closeGlobalFinanceModal() {
    if (typeof goBack === 'function') {
        goBack();
    }
}

