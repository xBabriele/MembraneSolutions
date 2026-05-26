'use strict';

const USERS = {
    admin:    { pass: 'admin123', role: 'admin',   name: 'Mario Rossi', initials: 'MR' },
    operaio1: { pass: 'pass123',  role: 'operaio', name: 'Sara Conti',  initials: 'SC' },
};

const NAV_ADMIN = [
    { sec: 'Monitoraggio' },
    { id: 'dashboard',  icon: 'bi-grid-1x2-fill',         label: 'Dashboard' },
    { id: 'sensori',    icon: 'bi-activity',               label: 'Sensori',         badge: 'anom' },
    { id: 'linee',      icon: 'bi-diagram-3-fill',         label: 'Linee Produzione' },
    { sec: 'Gestione' },
    { id: 'magazzino',  icon: 'bi-box-seam-fill',          label: 'Magazzino' },
    { id: 'ordini',     icon: 'bi-file-earmark-text-fill', label: 'Ordini' },
    { id: 'dipendenti', icon: 'bi-people-fill',            label: 'Dipendenti' },
    { sec: 'Sistema' },
    { id: 'attivita',   icon: 'bi-terminal-fill',          label: 'Attività Live',   badge: 'qpm' },
];

const NAV_OPERAIO = [
    { sec: 'Produzione' },
    { id: 'linee',   icon: 'bi-diagram-3-fill', label: 'Linee Produzione' },
    { id: 'sensori', icon: 'bi-activity',       label: 'Sensori',         badge: 'anom' },
];

const PAGE_TITLES = {
    dashboard:  'Dashboard',
    sensori:    'Monitoraggio Sensori',
    linee:      'Linee di Produzione',
    magazzino:  'Magazzino & Materiali',
    ordini:     'Gestione Ordini',
    dipendenti: 'Dipendenti',
    attivita:   'Attività Live — Query Monitor',
};

window.currentUser = null;
window.simRunning = false;
window.simTimer   = null;

let qTot = 0, qErr = 0, qRun = 0, qpmCount = 0, qpmVal = 0;
const qpmHist = new Array(20).fill(0);
window.qpmHist = qpmHist;

const rnd  = (a, b) => a + Math.random() * (b - a);
const pick = arr  => arr[Math.floor(Math.random() * arr.length)];
const ts   = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const tsD  = () => new Date().toISOString().replace('T', ' ').substring(0, 19);
const dStr = d => d.toISOString().split('T')[0];

const FORNITORI_NOMI = [
    'Forniture Chimiche SRL',
    'Distribuz. Cosmetiche SPA',
    'Alcolici e Derivati',
    'Fragranze Europee',
    'Coloranti Globali',
];

const CLIENTI_NOMI = [
    'Luca Rossi', 'Anna Bianchi', 'Marco Verdi', 'Elena Neri', 'Paolo Gialli',
    'Carlo Ferrari', 'Sofia Russo', 'Giulia Marino', 'Riccardo Esposito', 'Marta Galli',
];

const PAGAMENTI = ['Carta', 'Bonifico', 'PayPal', 'SEPA'];

setInterval(() => {
    const c = document.getElementById('clock');
    if (c) c.textContent = ts();
}, 1000);


const MAX_STORICO = 15;

const DB = {
    nextOA: 1006,
    nextOV: 6,

    ordiniAcquisto: [
        { id: 1, numero: 'OA-1001', data: '10/02/2026', fornitore: 'Forniture Chimiche SRL',    consegna: '20/03/2026', totale: 500, stato: 'IN CORSO', deliverAt: null },
        { id: 2, numero: 'OA-1002', data: '11/02/2026', fornitore: 'Distribuz. Cosmetiche SPA', consegna: '21/03/2026', totale: 300, stato: 'IN CORSO', deliverAt: null },
        { id: 3, numero: 'OA-1003', data: '12/02/2026', fornitore: 'Alcolici e Derivati',        consegna: '22/03/2026', totale: 450, stato: 'ATTESO',   deliverAt: null },
        { id: 4, numero: 'OA-1004', data: '13/02/2026', fornitore: 'Fragranze Europee',          consegna: '23/03/2026', totale: 600, stato: 'IN CORSO', deliverAt: null },
        { id: 5, numero: 'OA-1005', data: '14/02/2026', fornitore: 'Coloranti Globali',          consegna: '24/03/2026', totale: 250, stato: 'ATTESO',   deliverAt: null },
    ],

    ordiniVendita: [
        { id: 1, cliente: 'Luca Rossi',   data: '10/02/2026', totale: 150, fattura: 'FV-001', pagamento: 'Carta' },
        { id: 2, cliente: 'Anna Bianchi', data: '11/02/2026', totale: 200, fattura: 'FV-002', pagamento: 'Bonifico' },
        { id: 3, cliente: 'Marco Verdi',  data: '12/02/2026', totale: 300, fattura: 'FV-003', pagamento: 'Carta' },
        { id: 4, cliente: 'Elena Neri',   data: '13/02/2026', totale: 400, fattura: 'FV-004', pagamento: 'Bonifico' },
        { id: 5, cliente: 'Paolo Gialli', data: '14/02/2026', totale: 250, fattura: 'FV-005', pagamento: 'Carta' },
    ],

    materiali: [
        { id: 1, nome: 'Acqua demineralizzata', costo: 0.50, scorta: 120, scorta_min: 100, fornitori: 3, stato: 'ok' },
        { id: 2, nome: 'Glicerina',             costo: 1.20, scorta: 62,  scorta_min: 50,  fornitori: 2, stato: 'ok' },
        { id: 3, nome: 'Alcol etilico',         costo: 0.80, scorta: 71,  scorta_min: 70,  fornitori: 4, stato: 'soglia' },
        { id: 4, nome: 'Fragranza',             costo: 2.50, scorta: 35,  scorta_min: 30,  fornitori: 2, stato: 'ok' },
        { id: 5, nome: 'Colorante rosso',       costo: 1.00, scorta: 8,   scorta_min: 20,  fornitori: 1, stato: 'esaurito' },
    ],

    miscele: [
        { id: 1, nome: 'A', stato: 'PRONTO',     tempo: 15, comp: ['Acqua demineralizzata', 'Glicerina'] },
        { id: 2, nome: 'B', stato: 'NON PRONTO', tempo: 20, comp: ['Glicerina', 'Alcol etilico'] },
        { id: 3, nome: 'C', stato: 'PRONTO',     tempo: 10, comp: ['Acqua demineralizzata', 'Fragranza'] },
        { id: 4, nome: 'D', stato: 'NON PRONTO', tempo: 25, comp: ['Alcol etilico', 'Colorante rosso'] },
        { id: 5, nome: 'E', stato: 'PRONTO',     tempo: 30, comp: ['Acqua demineralizzata', 'Colorante rosso'] },
    ],

    sensori: [
        { id: 1, tipo: 'Temperatura', val: 25.0, unit: '°C',    macch: 'Miscelatore A',       ip: '192.168.10.101', min: 18,  max: 35,   soglia: 33,   colore: 'amber',  hz: 1.5 },
        { id: 2, tipo: 'Pressione',   val: 1.2,  unit: 'Bar',   macch: 'Miscelatore B',       ip: '192.168.10.102', min: 0.5, max: 2.8,  soglia: 2.5,  colore: 'cyan',   hz: 2.0 },
        { id: 3, tipo: 'Velocità',    val: 1500, unit: 'RPM',   macch: 'Linea Imballaggio 1', ip: '192.168.10.103', min: 800, max: 1800, soglia: 1750, colore: 'green',  hz: 0.5 },
        { id: 4, tipo: 'Umidità',     val: 80,   unit: '%',     macch: 'Linea Etichettatura', ip: '192.168.10.104', min: 40,  max: 95,   soglia: 75,   colore: 'red',    hz: 1.0 },
        { id: 5, tipo: 'Flusso',      val: 30,   unit: 'L/min', macch: 'Macchina Taglio',     ip: '192.168.10.105', min: 10,  max: 48,   soglia: 45,   colore: 'purple', hz: 5.0 },
    ],

    storicoLetture: [
        { ts: '2026-02-11 08:20:00', id: 5, tipo: 'Flusso',      val: 30,   unit: 'L/min', macch: 'Macchina Taglio',     ip: '192.168.10.105', anomalia: false },
        { ts: '2026-02-11 08:15:00', id: 4, tipo: 'Umidità',     val: 80,   unit: '%',     macch: 'Linea Etichettatura', ip: '192.168.10.104', anomalia: true  },
        { ts: '2026-02-11 08:10:00', id: 3, tipo: 'Velocità',    val: 1500, unit: 'RPM',   macch: 'Linea Imballaggio 1', ip: '192.168.10.103', anomalia: false },
        { ts: '2026-02-11 08:05:00', id: 2, tipo: 'Pressione',   val: 1.2,  unit: 'Bar',   macch: 'Miscelatore B',       ip: '192.168.10.102', anomalia: false },
        { ts: '2026-02-11 08:00:00', id: 1, tipo: 'Temperatura', val: 25.0, unit: '°C',    macch: 'Miscelatore A',       ip: '192.168.10.101', anomalia: false },
    ],

    revData: [],
};

// Genera 30 giorni di fatturato
(function () {
    const base = [150, 200, 300, 400, 250];
    for (let i = 29; i >= 0; i--) {
        const d   = new Date(Date.now() - i * 86400000);
        const rev = Math.round(base.reduce((s, v) => s + v, 0) * (0.7 + Math.random() * 0.8));
        DB.revData.push({ label: dStr(d), val: rev });
    }
})();


async function apiCall(action, body = null) {
    const opts = {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
    };
    if (body) opts.body = JSON.stringify({ action, ...body });
    const url = body ? `/php/api.php` : `/php/api.php?action=${action}`;
    const res  = await fetch(url, opts);
    return res.json();
}
window.apiCall = apiCall;

function buildNav(role) {
    const nav = role === 'admin' ? NAV_ADMIN : NAV_OPERAIO;
    const sn  = document.getElementById('sidebar-nav');
    sn.innerHTML = '';

    nav.forEach(item => {
        if (item.sec) {
            sn.insertAdjacentHTML('beforeend', `<div class="ss">${item.sec}</div>`);
            return;
        }

        let badgeHtml = '';
        if (item.badge === 'anom') badgeHtml = `<span class="badge-a" id="b-anom">1</span>`;
        if (item.badge === 'qpm')  badgeHtml = `<span class="badge-i" id="b-qpm">0/m</span>`;

        sn.insertAdjacentHTML('beforeend',
            `<button class="nb" data-page="${item.id}">
                <i class="bi ${item.icon}"></i>${item.label}${badgeHtml}
            </button>`
        );
    });

    document.querySelectorAll('.nb[data-page]').forEach(btn => {
        btn.addEventListener('click', () => navigate(btn.dataset.page));
    });
}

function navigate(page) {
    document.querySelectorAll('.nb').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');

    document.getElementById('pt').textContent = PAGE_TITLES[page] || page;

    if (page === 'sensori')  renderSensorFull();
    if (page === 'linee')    renderLinee();
    if (page === 'attivita') initQpmChart();
    if (page === 'ordini')   refreshRevChart();
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display          = 'none';
    document.getElementById('l-user').value = '';
    document.getElementById('l-pass').value = '';
    document.getElementById('lerr').style.display = 'none';
}

function showApp(user) {
    window.currentUser = user;
    document.getElementById('sf-av').textContent = user.initials;
    document.getElementById('sf-un').textContent = user.name;
    document.getElementById('sf-ur').textContent = user.role.toUpperCase();

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display          = 'block';

    buildNav(user.role);

    const firstPage = user.role === 'admin' ? 'dashboard' : 'linee';
    navigate(firstPage);
    document.querySelector(`.nb[data-page="${firstPage}"]`)?.classList.add('active');

    initApp();
}

async function checkSession() {
    try {
        const data = await apiCall('check_session');
        if (data.ok && data.user) {
            showApp(data.user);
        } else {
            showLoginScreen();
        }
    } catch {
        showLoginScreen();
    }
}

async function doLogin() {
    const username = document.getElementById('l-user').value.trim();
    const password = document.getElementById('l-pass').value;
    const errEl    = document.getElementById('lerr');

    if (!username || !password) {
        errEl.style.display = 'flex';
        if (errEl.querySelector('span')) errEl.querySelector('span').textContent = 'Compila tutti i campi';
        setTimeout(() => errEl.style.display = 'none', 3000);
        return;
    }

    const btn = document.getElementById('l-btn');
    btn.disabled  = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Accesso in corso…';

    // 1. Prima prova SEMPRE via API (crea la sessione PHP)
    try {
        const data = await apiCall('login', { username, password });
        if (data.ok) {
            showApp(data.user);
            return;
        }
    } catch {
        // API non disponibile → fallback locale
        const ud = USERS[username];
        if (ud && ud.pass === password) {
            btn.disabled  = false;
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Accedi';
            showApp({ username, ...ud });
            return;
        }
    }

    // 2. Credenziali errate
    errEl.style.display = 'flex';
    if (errEl.querySelector('span')) errEl.querySelector('span').textContent = 'Credenziali non valide';
    setTimeout(() => errEl.style.display = 'none', 3500);

    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Accedi';
}

async function doLogout() {
    try { await apiCall('logout', {}); } catch { /* ignora se API non disponibile */ }
    window.currentUser = null;

    window.simRunning = false;
    clearTimeout(window.simTimer);

    showLoginScreen();
}

function sqlHL(s) {
    const KW = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|SET|VALUES|INTO|AND|OR|NOT|NULL|TRUE|FALSE|JOIN|AS|ORDER|BY|LIMIT|COMMIT|BEGIN|IGNORE|DEFAULT|ON|DUPLICATE|KEY)\b/g;
    const TB = /\b(ORDINI_ACQUISTO|ORDINE_VENDITA|RIGHE_ORDINE_VENDITA|MATERIALI_BASE|LETTURE_SENSORI|MISCELE|FATTURE_VENDITA|PAGAMENTI|DIPENDENTI|PRODOTTI|CLIENTI|FORNITORI|LOTTI_PRODUZIONI|MACCHINARI|RIGHE_ORDINE)\b/g;
    return s
        .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="qs2">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g,     '<span class="qnum">$1</span>')
        .replace(TB, '<span class="qt">$&</span>')
        .replace(KW, '<span class="qk">$&</span>');
}

function addQuery(sqls, onDone, isErr = false) {
    const id      = 'q' + Date.now() + Math.random().toString(36).slice(2, 5);
    const timeStr = ts();
    const lines   = Array.isArray(sqls) ? sqls : [sqls];
    qpmCount++;

    const rowHtml = `
        <div class="qr qu" id="${id}">
            <div class="qts">${timeStr}</div>
            <div class="qsi qu" id="${id}-i">◌</div>
            <div style="flex:1;min-width:0">
                <div class="qbody">${lines.map(sqlHL).join('<br>')}</div>
                <div class="qres" id="${id}-r"></div>
            </div>
        </div>`;

    const feed = document.getElementById('q-feed');
    if (feed) {
        feed.insertAdjacentHTML('afterbegin', rowHtml);
        while (feed.children.length > 60) feed.lastElementChild.remove();
    }

    // → RUNNING dopo breve pausa visiva
    setTimeout(() => {
        qRun++;
        document.querySelectorAll(`#${id}`)
            .forEach(el => el.className = 'qr rn');
        document.querySelectorAll(`#${id}-i`)
            .forEach(el => { el.className = 'qsi rn'; el.textContent = '↻'; });
        updQStats();
    }, 350 + Math.random() * 300);

    // → ESECUZIONE (8–15 secondi)
    const execMs = 8000 + Math.random() * 7000;

    setTimeout(async () => {
        let serverOk  = true;
        let serverMsg = '';
        let serverAff = 0;

        if (lines.length > 0 && !isErr) {
            try {
                const res = await apiCall('exec_query', { sqls: lines });
                serverOk  = res.ok ?? false;
                serverAff = res.affected ?? 0;
                if (!serverOk) serverMsg = res.error || 'Errore sconosciuto';
            } catch {
                // Backend non disponibile — considera comunque OK per la simulazione locale
                serverOk  = true;
                serverAff = Math.floor(Math.random() * 3) + 1;
            }
        }

        const finalErr = isErr || !serverOk;
        qTot++;
        if (finalErr) qErr++;
        qRun = Math.max(0, qRun - 1);

        const ms   = Math.floor(200 + Math.random() * 800);
        const rows = serverAff || Math.floor(Math.random() * 3) + 1;
        const state = finalErr ? 'er' : 'dn';
        const icoT  = finalErr ? '✗' : '✓';
        const resT  = finalErr
            ? `ERROR: ${serverMsg || 'Operazione fallita'} — ${ms}ms`
            : `Query OK, ${rows} row(s) affected — ${ms}ms`;
        const rCls  = finalErr ? 'er' : 'ok';

        document.querySelectorAll(`#${id}`)
            .forEach(el => el.className = 'qr ' + state);
        document.querySelectorAll(`#${id}-i`)
            .forEach(el => { el.className = 'qsi ' + state; el.textContent = icoT; });
        document.querySelectorAll(`#${id}-r`)
            .forEach(el => { el.className = 'qres ' + rCls; el.textContent = resT; el.style.display = 'block'; });

        document.getElementById('t-qc').textContent = qTot;
        updQStats();

        if (!finalErr && onDone) onDone();

        // Fade-out dopo 6–14 secondi
        const stay = 6000 + Math.random() * 8000;
        setTimeout(() => {
            document.querySelectorAll(`#${id}`).forEach(el => {
                el.classList.add('fx');
                setTimeout(() => el.remove(), 600);
            });
        }, stay);

    }, execMs);
}
window.addQuery = addQuery;
function updQStats() {
    [['at-tot', qTot], ['at-err', qErr], ['at-run', qRun]].forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

setInterval(() => {
    qpmVal = qpmCount; qpmCount = 0;
    qpmHist.push(qpmVal);
    if (qpmHist.length > 20) qpmHist.shift();

    const el  = document.getElementById('at-pm');
    const bEl = document.getElementById('b-qpm');
    if (el)  el.textContent  = qpmVal + ' q/min';
    if (bEl) bEl.textContent = qpmVal + '/m';

    if (window.chartQpm) {
        window.chartQpm.data.datasets[0].data = [...qpmHist];
        window.chartQpm.update('none');
    }
}, 60_000);

const EVENTS = [

    // INSERT lettura sensore singola (peso 5)
    { w: 5, n: 'LETTURA', fn() {
        const s    = pick(DB.sensori);
        const step = (s.max - s.min) * 0.04;
        const newV = parseFloat(Math.min(s.max, Math.max(s.min, s.val + rnd(-step, step))).toFixed(2));
        const wasAnom = s.val > s.soglia;
        const isAnom  = newV > s.soglia;
        return {
            sqls: [`INSERT INTO LETTURE_SENSORI (timeStampLettura, anomalia, valore, idSensore) VALUES ('${tsD()}', ${isAnom ? 1 : 0}, ${newV}, ${s.id})`],
            type: 'ins',
            desc: `Lettura ${s.tipo}: ${newV}${s.unit}${isAnom ? ' ⚠' : ''} — ${s.macch}`,
            apply() {
                s.val = newV;
                DB.storicoLetture.unshift({ ts: tsD(), id: s.id, tipo: s.tipo, val: newV, unit: s.unit, macch: s.macch, ip: s.ip, anomalia: isAnom });
                while (DB.storicoLetture.length > MAX_STORICO) DB.storicoLetture.pop();
                if (isAnom && !wasAnom) showToast(`⚠ Anomalia ${s.tipo}: ${newV}${s.unit}`, 'red');
                refreshSensors();
                renderStorico();
                recalcAnomalies();
            },
        };
    }},

    // INSERT batch letture 3 sensori (peso 2)
    { w: 2, n: 'LETTURA_BATCH', fn() {
        const items = DB.sensori.slice(0, 3).map(s => {
            const step = (s.max - s.min) * 0.025;
            const v    = parseFloat(Math.min(s.max, Math.max(s.min, s.val + rnd(-step, step))).toFixed(2));
            return { s, v, anom: v > s.soglia };
        });
        return {
            sqls: items.map(({ s, v, anom }) =>
                `INSERT INTO LETTURE_SENSORI (timeStampLettura, anomalia, valore, idSensore) VALUES ('${tsD()}', ${anom ? 1 : 0}, ${v}, ${s.id})`
            ),
            type: 'ins',
            desc: `Batch 3 letture: ${items.map(i => i.s.tipo + ' ' + i.v + i.s.unit).join(' | ')}`,
            apply() {
                items.forEach(({ s, v, anom }) => {
                    const was = s.val > s.soglia;
                    s.val = v;
                    DB.storicoLetture.unshift({ ts: tsD(), id: s.id, tipo: s.tipo, val: v, unit: s.unit, macch: s.macch, ip: s.ip, anomalia: anom });
                    if (anom && !was) showToast(`⚠ Anomalia ${s.tipo}: ${v}${s.unit}`, 'red');
                });
                while (DB.storicoLetture.length > MAX_STORICO) DB.storicoLetture.pop();
                refreshSensors();
                renderStorico();
                recalcAnomalies();
            },
        };
    }},

    // UPDATE totale ordine acquisto (peso 3)
    { w: 3, n: 'UPDATE_OA', fn() {
        const candidates = DB.ordiniAcquisto.filter(x => x.stato !== 'CONSEGNATO' && x.stato !== 'ANNULLATO');
        if (!candidates.length) return null;
        const o     = pick(candidates);
        const delta = Math.round(rnd(-80, 120));
        const newT  = Math.max(50, parseFloat((+o.totale + delta).toFixed(2)));
        return {
            sqls: [`UPDATE ORDINI_ACQUISTO SET totaleOrdine = ${newT} WHERE idOrdineAcquisto = ${o.id}`],
            type: 'upd',
            desc: `Ordine ${o.numero}: €${o.totale} → €${newT} (${delta > 0 ? '+' : ''}${delta})`,
            apply() {
                o.totale = newT;
                refreshOrdini();
                refreshKPIs();
                flashRow('oa-' + o.id);
            },
        };
    }},

    // INSERT nuovo ordine acquisto (peso 1)
    { w: 1, n: 'NEW_OA', fn() {
        const id       = DB.nextOA++;
        const numero   = `OA-${id}`;
        const forn     = pick(FORNITORI_NOMI);
        const forniId  = Math.floor(rnd(1, 6));
        const totale   = parseFloat(rnd(150, 750).toFixed(2));
        const today    = dStr(new Date());
        const consegna = dStr(new Date(Date.now() + rnd(14, 35) * 86_400_000));
        const deliverMs = (45 + Math.random() * 90) * 1_000;
        return {
            sqls: [`INSERT INTO ORDINI_ACQUISTO (numeroOrdine, dataOrdine, dataConsegnaPrevista, statoOrdine, totaleOrdine, idFornitoreOrdini) VALUES ('${numero}', '${today}', '${consegna}', 'IN CORSO', ${totale}, ${forniId})`],
            type: 'ins',
            desc: `Nuovo ordine ${numero} — ${forn} — €${totale}`,
            apply() {
                const obj = { id, numero, data: today, fornitore: forn, consegna, totale, stato: 'IN CORSO', deliverAt: Date.now() + deliverMs };
                DB.ordiniAcquisto.unshift(obj);
                if (DB.ordiniAcquisto.length > 12) DB.ordiniAcquisto.pop();
                refreshOrdini();
                refreshKPIs();
                showToast(`🛒 Nuovo ordine ${numero}`, 'am');
            },
        };
    }},

    // INSERT nuovo ordine vendita (peso 2)
    { w: 2, n: 'NEW_OV', fn() {
        const id      = DB.nextOV++;
        const cli     = pick(CLIENTI_NOMI);
        const cliId   = Math.floor(rnd(1, 9));
        const totale  = Math.floor(rnd(80, 600));
        const fat     = 'FV-' + String(id).padStart(3, '0');
        const pag     = pick(PAGAMENTI);
        const today   = dStr(new Date());
        const scadenza = dStr(new Date(Date.now() + 30 * 86_400_000));
        return {
            sqls: [
                `INSERT INTO ORDINE_VENDITA (totaleOrdine, dataOrdine, idCliente) VALUES (${totale}, '${tsD()}', ${cliId})`,
                `INSERT INTO FATTURE_VENDITA (dataScadenzaPagamento, dataEmissione, totaleFattura, numeroOrdine) VALUES ('${scadenza}', '${tsD()}', ${totale}, ${id})`,
            ],
            type: 'ins',
            desc: `Vendita #${id} — ${cli} — €${totale} — ${pag}`,
            apply() {
                DB.ordiniVendita.unshift({ id, cliente: cli, data: today, totale, fattura: fat, pagamento: pag });
                if (DB.ordiniVendita.length > 12) DB.ordiniVendita.pop();
                if (DB.revData.length) DB.revData[DB.revData.length - 1].val += totale;
                refreshOrdini();
                refreshKPIs();
                refreshRevChart();
                showToast(`💰 Vendita #${id} — €${totale}`, 'green');
            },
        };
    }},

    // UPDATE scorta materiale (peso 1)
    { w: 1, n: 'SCORTA', fn() {
        const m     = pick(DB.materiali);
        const delta = Math.floor(rnd(-20, 35));
        const newS  = Math.max(0, m.scorta + delta);
        const st    = newS === 0 ? 'esaurito' : newS < m.scorta_min ? 'soglia' : 'ok';
        return {
            sqls: [`UPDATE MATERIALI_BASE SET scortaMinima = ${newS} WHERE idMaterialeBase = ${m.id}`],
            type: 'upd',
            desc: `Scorta ${m.nome}: ${m.scorta} → ${newS}`,
            apply() {
                m.scorta = newS;
                m.stato  = st;
                refreshMagazzino();
                flashRow('mat-' + m.id);
            },
        };
    }},

    // UPDATE stato miscela (peso 1)
    { w: 1, n: 'MISCELA', fn() {
        const m  = pick(DB.miscele);
        const ns = m.stato === 'PRONTO' ? 'NON PRONTO' : 'PRONTO';
        return {
            sqls: [`UPDATE MISCELE SET statoMiscela = '${ns}' WHERE idMiscela = ${m.id}`],
            type: 'upd',
            desc: `Miscela ${m.nome}: ${m.stato} → ${ns}`,
            apply() {
                m.stato = ns;
                refreshMagazzino();
            },
        };
    }},

    // DELETE ordine consegnato (peso 0.4)
    { w: 0.4, n: 'DEL_OA', fn() {
        const delivered = DB.ordiniAcquisto.filter(o => o.stato === 'CONSEGNATO');
        if (delivered.length < 2) return null;
        const o = pick(delivered);
        return {
            sqls: [`DELETE FROM ORDINI_ACQUISTO WHERE idOrdineAcquisto = ${o.id} AND statoOrdine = 'CONSEGNATO'`],
            type: 'del',
            desc: `Rimosso ordine consegnato ${o.numero} dall'archivio`,
            apply() {
                apiCall('delete_order', { id: o.id }).catch(() => {});
                const idx = DB.ordiniAcquisto.findIndex(x => x.id === o.id);
                if (idx !== -1) DB.ordiniAcquisto.splice(idx, 1);
                refreshOrdini();
            },
        };
    }},
];

setInterval(() => {
    if (!window.simRunning) return;
    const now = Date.now();
    DB.ordiniAcquisto.forEach(o => {
        if (!o.deliverAt || o.stato === 'CONSEGNATO') return;
        if (now < o.deliverAt) return;
        o.deliverAt = null;
        const today = dStr(new Date());
        addQuery(
            [`UPDATE ORDINI_ACQUISTO SET statoOrdine = 'CONSEGNATO', dataConsegnaEffettiva = '${today}' WHERE idOrdineAcquisto = ${o.id}`],
            () => {
                o.stato = 'CONSEGNATO';
                refreshOrdini();
                refreshKPIs();
                flashRow('oa-' + o.id);
                showToast(`✅ Ordine ${o.numero} consegnato`, 'green');

                // Dopo 30–60 secondi: elimina dal DB e dalla lista
                const deleteDelay = (30 + Math.random() * 30) * 1_000;
                setTimeout(() => {
                    if (!window.simRunning) return;
                    addQuery(
                        [`DELETE FROM ORDINI_ACQUISTO WHERE idOrdineAcquisto = ${o.id} AND statoOrdine = 'CONSEGNATO'`],
                        () => {
                            apiCall('delete_order', { id: o.id }).catch(() => {});
                            const idx = DB.ordiniAcquisto.findIndex(x => x.id === o.id);
                            if (idx !== -1) DB.ordiniAcquisto.splice(idx, 1);
                            refreshOrdini();
                            addActivity({ type: 'del', desc: `Ordine ${o.numero} rimosso dall'archivio` });
                        },
                        false
                    );
                }, deleteDelay);
            },
            false
        );
    });
}, 6_000);

setInterval(async () => {
    if (!window.simRunning) return;

    const sensors = DB.sensori.map(s => ({
        id:       s.id,
        val:      s.val,
        anomalia: s.val > s.soglia,
    }));

    const cleanSql  = [`DELETE FROM LETTURE_SENSORI`];
    const batchSqls = sensors.map(s =>
        `INSERT INTO LETTURE_SENSORI (timeStampLettura, anomalia, valore, idSensore) VALUES ('${tsD()}', ${s.anomalia ? 1 : 0}, ${s.val}, ${s.id})`
    );

    addQuery(
        [...cleanSql, ...batchSqls],
        () => {
            DB.storicoLetture = sensors.map(s => {
                const sensor = DB.sensori.find(x => x.id === s.id);
                return {
                    ts:       tsD(),
                    id:       s.id,
                    tipo:     sensor?.tipo  || '—',
                    val:      s.val,
                    unit:     sensor?.unit  || '—',
                    macch:    sensor?.macch || '—',
                    ip:       sensor?.ip    || '—',
                    anomalia: s.anomalia,
                };
            });
            renderStorico();
            addActivity({ type: 'del', desc: `Cleanup letture: eliminati tutti i record, inserito batch di ${sensors.length}` });
            showToast('♻ Cleanup DB: letture azzerata e reinserite', 'am');
        },
        false
    );

    try {
        await apiCall('cleanup_readings', { sensors });
    } catch (e) {
        console.warn('Cleanup readings failed:', e);
    }
}, 90_000);

setInterval(() => {
    if (!window.simRunning) return;
    DB.sensori.forEach(s => {
        const step = (s.max - s.min) * 0.006;
        s.val = parseFloat(Math.min(s.max, Math.max(s.min, s.val + (Math.random() - 0.5) * step * 2)).toFixed(2));
    });
    refreshSensors();
    updateMiniCharts();
    updateDashChart();
}, 2_500);

function pickEvent(forceName) {
    if (forceName) {
        const e = EVENTS.find(ev => ev.n === forceName);
        return e ? e.fn() : null;
    }
    const tot = EVENTS.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * tot;
    for (const e of EVENTS) {
        r -= e.w;
        if (r <= 0) return e.fn();
    }
    return EVENTS[0].fn();
}

function fireEvent(name) {
    const ev = pickEvent(name);
    if (!ev) return;
    addQuery(ev.sqls, () => {
        ev.apply();
        addActivity(ev);
    }, false);
}

function simLoop() {
    if (!window.simRunning) return;
    fireEvent();
    const delay = 8_000 + Math.random() * 7_000;
    window.simTimer = setTimeout(simLoop, delay);
}

function updateStopBtn() {
    const btn  = document.getElementById('btn-stop');
    const ico  = document.getElementById('stop-ico');
    const lbl  = document.getElementById('stop-lbl');
    const dot  = document.getElementById('sim-dot');
    const slbl = document.getElementById('sim-label');
    if (!btn) return;

    if (window.simRunning) {
        btn.classList.remove('stopped');
        if (ico)  ico.className    = 'bi bi-stop-fill';
        if (lbl)  lbl.textContent  = 'STOP';
        if (dot)  dot.className    = 'dot g';
        if (slbl) slbl.textContent = 'SIM ATTIVA';
    } else {
        btn.classList.add('stopped');
        if (ico)  ico.className    = 'bi bi-play-fill';
        if (lbl)  lbl.textContent  = 'RIPRENDI';
        if (dot)  dot.className    = 'dot off';
        if (slbl) slbl.textContent = 'SIM FERMA';
    }
}

window.sim = {
    force(name) {
        if (!window.simRunning) return;
        fireEvent(name);
    },
    start() {
        window.simRunning = true;
        updateStopBtn();
        setTimeout(() => fireEvent('LETTURA'),       800);
        setTimeout(() => fireEvent('LETTURA_BATCH'), 2_500);
        setTimeout(() => fireEvent('NEW_OV'),        4_500);
        setTimeout(simLoop, 9_000);
    },
    stop() {
        window.simRunning = false;
        clearTimeout(window.simTimer);
        updateStopBtn();
    },
    toggle() {
        if (window.simRunning) this.stop(); else this.start();
    },
};

function recalcAnomalies() {
    const count = DB.sensori.filter(s => s.val > s.soglia).length;

    const el  = document.getElementById('k-anom');
    const bEl = document.getElementById('b-anom');
    if (el)  el.textContent  = count;
    if (bEl) bEl.textContent = count;

    const wrap = document.getElementById('dash-alert-wrap');
    if (!wrap) return;

    if (count > 0) {
        const anoms = DB.sensori
            .filter(s => s.val > s.soglia)
            .map(s => `${s.tipo} #${s.id}: ${s.val}${s.unit} (soglia ${s.soglia}${s.unit})`);
        wrap.innerHTML = `
            <div class="alert-strip">
                <i class="bi bi-exclamation-triangle-fill" style="color: var(--red); font-size: 15px; flex-shrink: 0"></i>
                <span><strong>${count} ANOMALI${count > 1 ? 'E' : 'A'}</strong> — ${anoms.join(' · ')}</span>
                <button class="btn-g ms-auto" style="font-size: 10px; padding: 3px 8px" onclick="navigate('sensori')">VEDI</button>
            </div>`;
    } else {
        wrap.innerHTML = `
            <div class="alert-ok">
                <i class="bi bi-check-circle-fill" style="color: var(--green); font-size: 15px; flex-shrink: 0"></i>
                <span><strong>TUTTI I SENSORI NELLA NORMA</strong> — nessuna anomalia attiva</span>
            </div>`;
    }
}

const maxMap = { temp: 50, pres: 3, vel: 2000, umid: 100, flu: 50 };
const keys   = ['temp', 'pres', 'vel', 'umid', 'flu'];
const colMap = {
    amber:  'var(--amber)',
    cyan:   'var(--cyan)',
    green:  'var(--green)',
    red:    'var(--red)',
    purple: 'var(--purple)',
};

function refreshSensors() {
    DB.sensori.forEach((s, i) => {
        const k      = keys[i];
        const pct    = Math.min(100, (s.val / maxMap[k]) * 100);
        const isAnom = s.val > s.soglia;

        const sv  = document.getElementById('sv-' + k);
        const sb  = document.getElementById('sb-' + k);
        const dsc = document.getElementById('dsc-' + k);
        if (sv)  sv.textContent = s.val;
        if (sb)  sb.style.width = pct + '%';
        if (dsc) dsc.classList.toggle('ano', isAnom);

        // Aggiornamento colore umidità (anomalia rossa)
        if (k === 'umid') {
            const nm = document.getElementById('dsc-umid-name');
            if (nm) {
                nm.style.color = isAnom ? 'var(--red)' : 'var(--green)';
                nm.innerHTML   = `<i class="bi bi-droplet-fill"></i> Umidità${isAnom ? ' ⚠' : ''}`;
            }
            const sv2 = document.getElementById('sv-umid');
            if (sv2) sv2.style.color = isAnom ? 'var(--red)' : 'var(--green)';
        }

        // KPI temperatura
        if (k === 'temp') {
            const kt = document.getElementById('k-temp');
            if (kt) kt.textContent = s.val;
        }

        // Aggiorna anche le card full nella pagina sensori
        const fsv = document.getElementById('fsv-' + k);
        const fsb = document.getElementById('fsb-' + k);
        const fsc = document.getElementById('fsc-' + k);
        if (fsv) fsv.textContent = s.val;
        if (fsb) fsb.style.width = pct + '%';
        if (fsc) fsc.classList.toggle('ano', isAnom);
    });
}

function renderSensorFull() {
    const wrap = document.getElementById('sensor-full');
    if (!wrap) return;

    const icons = ['thermometer-half', 'speedometer2', 'fan', 'droplet-fill', 'water'];

    wrap.innerHTML = DB.sensori.map((s, i) => {
        const k      = keys[i];
        const col    = colMap[s.colore];
        const pct    = Math.min(100, (s.val / maxMap[k]) * 100);
        const isAnom = s.val > s.soglia;

        return `
            <div class="col-md-6 col-lg-4">
                <div class="sc ${isAnom ? 'ano' : ''}" id="fsc-${k}">
                    <div class="sc-h">
                        <div>
                            <div class="sc-n" style="color: ${col}">
                                <i class="bi bi-${icons[i]}"></i> ${s.tipo}
                                ${isAnom ? '<i class="bi bi-exclamation-triangle-fill" style="font-size: 11px; color: var(--red)"></i>' : ''}
                            </div>
                            <div style="font-size: 10px; color: var(--t3); font-family: 'Share Tech Mono', monospace">
                                #${s.id} · ${s.hz}Hz · ${s.ip}
                            </div>
                            <div style="font-size: 10px; color: var(--t3); font-family: 'Share Tech Mono', monospace">
                                ${s.macch}
                            </div>
                        </div>
                        <div style="text-align: right">
                            <div class="sc-v" id="fsv-${k}" style="color: ${col}">${s.val}</div>
                            <div class="sc-u">${s.unit}</div>
                        </div>
                    </div>
                    <div class="sc-bw">
                        <div class="sc-b" id="fsb-${k}" style="width: ${pct}%; background: ${col}"></div>
                    </div>
                    <div class="sc-m">
                        <span>MIN ${s.min}${s.unit}</span>
                        <span>MAX ${s.max}${s.unit}</span>
                    </div>
                    <div style="margin-top: 8px">
                        <canvas id="mc-${k}" height="55"></canvas>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 7px; font-size: 10px; font-family: 'Share Tech Mono', monospace; color: var(--t3)">
                        <span>SOGLIA: <span style="color: ${col}">${s.soglia}${s.unit}</span></span>
                        <span>${isAnom ? '<span class="bs warn">ANOMALIA</span>' : '<span class="bs ok">NORMALE</span>'}</span>
                    </div>
                </div>
            </div>`;
    }).join('');

    initMiniCharts();
}

function renderStorico() {
    const tb = document.getElementById('tb-storico');
    if (!tb) return;

    const fTipo = document.getElementById('f-tipo')?.value || '';
    const fAnom = document.getElementById('f-anom')?.value || '';

    let rows = DB.storicoLetture;
    if (fTipo)       rows = rows.filter(r => r.tipo === fTipo);
    if (fAnom === '1') rows = rows.filter(r => r.anomalia);

    tb.innerHTML = rows.map(r => `
        <tr>
            <td class="m" style="font-size: 10.5px">${r.ts}</td>
            <td class="m">#${r.id}</td>
            <td>${r.tipo}</td>
            <td class="m ${r.anomalia ? 'tr' : ''}">${r.val}</td>
            <td class="m">${r.unit}</td>
            <td style="font-size: 11px; color: var(--t3)">${r.macch}</td>
            <td class="m" style="font-size: 10.5px">${r.ip}</td>
            <td>${r.anomalia ? '<span class="bs warn">ANOMALIA</span>' : '<span class="bs ok">OK</span>'}</td>
        </tr>`).join('');

    const cnt = document.getElementById('storico-count');
    if (cnt) cnt.textContent = `${rows.length}/${MAX_STORICO} righe`;
}

const LINEE_META = [
    { k: 'temp', col: 'amber',  num: 'L1', nome: 'Miscelatore A',       modello: 'MX-100', vlan: 10, prot: 'TCP:502', dev: 'SW-01 / Cisco',    lotto: '#001', esito: true,  prog: 72 },
    { k: 'pres', col: 'cyan',   num: 'L2', nome: 'Miscelatore B',       modello: 'MX-200', vlan: 20, prot: 'TCP:503', dev: 'SW-02 / Cisco',    lotto: '#002', esito: false, prog: 45 },
    { k: 'vel',  col: 'green',  num: 'L3', nome: 'Linea Imballaggio',   modello: 'LB-100', vlan: 30, prot: 'UDP:504', dev: 'RT-01 / TP-Link',  lotto: '#003', esito: true,  prog: 88 },
    { k: 'umid', col: 'red',    num: 'L4', nome: 'Linea Etichettatura', modello: 'LE-200', vlan: 40, prot: 'TCP:505', dev: 'SW-03 / Netgear',  lotto: '#004', esito: true,  prog: 60 },
    { k: 'flu',  col: 'purple', num: 'L5', nome: 'Macchina Taglio',     modello: 'MT-50',  vlan: 50, prot: 'UDP:506', dev: 'FW-01 / Fortinet', lotto: '#005', esito: false, prog: 30 },
];

function renderLinee() {
    const wrap = document.getElementById('linee-cards');
    if (!wrap) return;

    wrap.innerHTML = LINEE_META.map((l, i) => {
        const s      = DB.sensori[i];
        const isAnom = s.val > s.soglia;

        return `
            <div class="col-md-6 col-xl-4">
                <div class="lc" style="${isAnom ? 'border-color: rgba(239,68,68,.45)' : ''}">
                    <div class="lc-h">
                        <div style="display: flex; align-items: center; gap: 10px">
                            <span class="lc-n text-${l.col}">${l.num}</span>
                            <div>
                                <div style="font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px">${l.nome}</div>
                                <div style="font-family: 'Share Tech Mono', monospace; font-size: 10px; color: var(--t3)">${l.modello} · VLAN ${l.vlan}</div>
                            </div>
                        </div>
                        ${isAnom
                            ? '<span class="bs warn"><i class="bi bi-exclamation-triangle-fill"></i> ANOMALIA</span>'
                            : '<span class="bs ok"><i class="bi bi-check-circle-fill"></i> ATTIVO</span>'
                        }
                    </div>
                    <div class="lc-b">
                        <div class="lc-r"><span class="lc-l"><i class="bi bi-plug-fill"></i> PROTOCOLLO</span><span class="lc-v">${l.prot}</span></div>
                        <div class="lc-r"><span class="lc-l"><i class="bi bi-layers-fill"></i> LOTTO</span><span class="lc-v">${l.lotto}</span></div>
                        <div class="lc-r"><span class="lc-l"><i class="bi bi-clipboard-check-fill"></i> ESITO</span><span class="lc-v ${l.esito ? 'tg' : 'tr'}">${l.esito ? '✓ PASS' : '✗ FAIL'}</span></div>
                        <div class="lc-r"><span class="lc-l"><i class="bi bi-activity"></i> SENSORE${isAnom ? ' ⚠' : ''}</span><span class="lc-v ${isAnom ? 'tr' : ''}">${s.tipo}: ${s.val}${s.unit}</span></div>
                        <div class="lc-r"><span class="lc-l"><i class="bi bi-hdd-network-fill"></i> DISPOSITIVO</span><span class="lc-v">${l.dev}</span></div>
                        <div class="lc-p">
                            <div class="lc-pb" style="width: ${l.prog}%; background: var(--${l.col})"></div>
                        </div>
                        <div style="font-family: 'Share Tech Mono', monospace; font-size: 10px; color: var(--t3); text-align: right; margin-top: 4px">
                            AVANZAMENTO ${l.prog}%
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function refreshMagazzino() {
    const tb = document.getElementById('tb-mat');
    if (tb) {
        tb.innerHTML = DB.materiali.map(m => {
            const badge = m.stato === 'ok'
                ? '<span class="bs ok"><i class="bi bi-check-circle"></i> Disponibile</span>'
                : m.stato === 'soglia'
                    ? '<span class="bs am"><i class="bi bi-exclamation-circle"></i> Soglia Minima</span>'
                    : '<span class="bs warn"><i class="bi bi-x-circle"></i> Esaurito</span>';
            return `
                <tr data-rowid="mat-${m.id}">
                    <td><strong>${m.nome}</strong></td>
                    <td class="m ta">€${m.costo.toFixed(2)}/u</td>
                    <td class="m">${m.scorta}</td>
                    <td class="m">${m.fornitori}</td>
                    <td>${badge}</td>
                </tr>`;
        }).join('');
    }

    const mc = document.getElementById('miscele-cards');
    if (mc) {
        const cols = ['amber', 'cyan', 'green', 'purple', 'red'];
        mc.innerHTML = DB.miscele.map((m, i) => `
            <div class="col-md-4">
                <div class="panel">
                    <div class="ph">
                        <i class="bi bi-beaker-fill text-${cols[i]}"></i>
                        <span class="ph-t text-${cols[i]}">Miscela ${m.nome}</span>
                        <span class="bs ${m.stato === 'PRONTO' ? 'ok' : 'warn'} ms-auto">
                            ${m.stato === 'PRONTO'
                                ? '<i class="bi bi-check-circle-fill"></i> PRONTO'
                                : '<i class="bi bi-hourglass-split"></i> N/PRONTO'
                            }
                        </span>
                    </div>
                    <div class="pb">
                        <div style="font-family: 'Share Tech Mono', monospace; font-size: 11px; color: var(--t3)">
                            <i class="bi bi-clock"></i> ${m.tempo} min
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--t2)">
                            ${m.comp.map(c => `<div><i class="bi bi-dot"></i>${c}</div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`).join('');
    }

    const ok = DB.materiali.filter(m => m.stato === 'ok').length;
    const kr = document.getElementById('k-mat-ok');    if (kr) kr.textContent = ok;
    const ke = document.getElementById('k-mat-crit');  if (ke) ke.textContent = DB.materiali.length - ok;
    const kp = document.getElementById('k-misc-pronte'); if (kp) kp.textContent = DB.miscele.filter(m => m.stato === 'PRONTO').length;
}

const statoB = stato => ({
    'IN CORSO':   '<span class="bs info"><i class="bi bi-arrow-repeat"></i> In Corso</span>',
    'CONSEGNATO': '<span class="bs ok"><i class="bi bi-check-circle-fill"></i> Consegnato</span>',
    'ATTESO':     '<span class="bs am"><i class="bi bi-hourglass-split"></i> Atteso</span>',
    'ANNULLATO':  '<span class="bs warn"><i class="bi bi-x-circle-fill"></i> Annullato</span>',
})[stato] || `<span class="bs am">${stato}</span>`;

function refreshOrdini() {
    // Dashboard — tabella compatta acquisto
    const td = document.getElementById('tb-oa-d');
    if (td) {
        td.innerHTML = DB.ordiniAcquisto.slice(0, 6).map(o => `
            <tr data-rowid="oa-${o.id}">
                <td class="m">${o.numero}</td>
                <td style="font-size: 12px">${o.fornitore.substring(0, 24)}</td>
                <td class="m ta">€${o.totale}</td>
                <td>${statoB(o.stato)}</td>
            </tr>`).join('');
    }

    // Dashboard — tabella compatta vendita
    const tv = document.getElementById('tb-ov-d');
    if (tv) {
        tv.innerHTML = DB.ordiniVendita.slice(0, 6).map(o => `
            <tr>
                <td class="m">#${o.id}</td>
                <td>${o.cliente}</td>
                <td class="m ta">€${o.totale}</td>
                <td><span class="bs ok">${o.pagamento}</span></td>
            </tr>`).join('');
    }

    // Pagina ordini — tabella completa acquisto
    const taf = document.getElementById('tb-oa-f');
    if (taf) {
        taf.innerHTML = DB.ordiniAcquisto.map(o => `
            <tr data-rowid="oa-${o.id}">
                <td class="m">${o.numero}</td>
                <td class="m">${o.data}</td>
                <td>${o.fornitore}</td>
                <td class="m">${o.consegna}</td>
                <td class="m ta">€${typeof o.totale === 'number' ? o.totale.toFixed(2) : o.totale}</td>
                <td>${statoB(o.stato)}</td>
            </tr>`).join('');
    }

    // Pagina ordini — tabella completa vendita
    const tvf = document.getElementById('tb-ov-f');
    if (tvf) {
        tvf.innerHTML = DB.ordiniVendita.map(o => `
            <tr>
                <td class="m">#${o.id}</td>
                <td>${o.cliente}</td>
                <td class="m">${o.data}</td>
                <td class="m ta">€${o.totale}</td>
                <td class="m">${o.fattura}</td>
                <td><span class="bs ok">${o.pagamento}</span></td>
            </tr>`).join('');
    }
}

function refreshKPIs() {
    const attivi = DB.ordiniAcquisto.filter(o => o.stato !== 'CONSEGNATO' && o.stato !== 'ANNULLATO').length;
    const fatt   = DB.ordiniVendita.reduce((s, o) => s + o.totale, 0);
    const fattM  = DB.revData.reduce((s, d) => s + d.val, 0);

    document.querySelectorAll('#k-oa, #k-oa2').forEach(el => el.textContent = attivi);
    document.querySelectorAll('#k-ov2').forEach(el => el.textContent = DB.ordiniVendita.length);
    document.querySelectorAll('#k-fatt, #k-fatt2').forEach(el => el.textContent = fatt);
    document.querySelectorAll('#k-fatt-m').forEach(el => el.textContent = fattM.toLocaleString('it-IT'));
    document.querySelectorAll('#k-fatt-p').forEach(el => el.textContent = DB.ordiniVendita.length);
}

function flashRow(id) {
    document.querySelectorAll(`[data-rowid="${id}"]`).forEach(el => {
        el.classList.remove('fl');
        void el.offsetWidth;
        el.classList.add('fl');
    });
}

function addActivity(ev) {
    const feed = document.getElementById('act-feed');
    if (!feed) return;

    const ic = {
        ins: '<i class="bi bi-plus-lg"></i>',
        upd: '<i class="bi bi-pencil-fill"></i>',
        del: '<i class="bi bi-trash-fill"></i>',
        sel: '<i class="bi bi-search"></i>',
    };

    feed.insertAdjacentHTML('afterbegin', `
        <div class="ae">
            <div class="ae-i ${ev.type}">${ic[ev.type] || '•'}</div>
            <div class="ae-b">
                <div class="ae-d">${ev.desc}</div>
                <div class="ae-t">${ts()}</div>
            </div>
        </div>`);

    while (feed.children.length > 30) feed.lastElementChild.remove();
}

function showToast(msg, type = 'am') {
    const c = document.getElementById('toast-c');
    const d = document.createElement('div');
    d.className   = 'tm ' + type;
    d.textContent = msg;
    c.appendChild(d);
    setTimeout(() => d.remove(), 4200);
}

document.getElementById('dip-s')?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#t-dip tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

document.getElementById('f-tipo')?.addEventListener('change', renderStorico);
document.getElementById('f-anom')?.addEventListener('change', renderStorico);

const CHART_OPTS = {
    scales: {
        x: {
            ticks: { color: '#4a5568', font: { family: "'Share Tech Mono'", size: 9 }, maxTicksLimit: 8 },
            grid:  { color: 'rgba(255,255,255,.03)' },
        },
        y: {
            ticks: { color: '#4a5568', font: { family: "'Share Tech Mono'", size: 9 } },
            grid:  { color: 'rgba(255,255,255,.03)' },
        },
    },
    plugins: {
        legend: {
            labels: { color: '#8b95a6', font: { family: "'Share Tech Mono'", size: 10 }, boxWidth: 10, padding: 12 },
        },
        tooltip: {
            mode:            'index',
            intersect:       false,
            backgroundColor: '#1e242d',
            borderColor:     '#303848',
            borderWidth:     1,
            titleColor:      '#8b95a6',
            bodyColor:       '#e8eaed',
            titleFont:       { family: "'Share Tech Mono'", size: 10 },
            bodyFont:        { family: "'Share Tech Mono'", size: 11 },
        },
    },
    responsive:          true,
    maintainAspectRatio: false,
    animation:           false,
};

const chartBuf = { labels: [], temp: [], pres: [], umid: [], flu: [] };

for (let i = 14; i >= 0; i--) {
    chartBuf.labels.push('');
    chartBuf.temp.push(+(23 + Math.random() * 3).toFixed(1));
    chartBuf.pres.push(+(1  + Math.random() * .5).toFixed(2));
    chartBuf.umid.push(+(70 + Math.random() * 12).toFixed(1));
    chartBuf.flu.push( +(25 + Math.random() * 10).toFixed(1));
}

let chartMain;

function initMainChart() {
    const ctx = document.getElementById('chartMain');
    if (!ctx || chartMain) return;

    chartMain = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...chartBuf.labels],
            datasets: [
                { label: 'Temp °C',      data: [...chartBuf.temp],             borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.06)', tension: .4, pointRadius: 0, borderWidth: 2 },
                { label: 'Umidità %',    data: [...chartBuf.umid],             borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.05)',   tension: .4, pointRadius: 0, borderWidth: 2 },
                { label: 'Pres. ×10',    data: chartBuf.pres.map(v => v * 10), borderColor: '#22d3ee', backgroundColor: 'transparent',          tension: .4, pointRadius: 0, borderWidth: 1.5, borderDash: [4, 3] },
                { label: 'Flusso L/min', data: [...chartBuf.flu],              borderColor: '#a78bfa', backgroundColor: 'transparent',          tension: .4, pointRadius: 0, borderWidth: 1.5 },
            ],
        },
        options: CHART_OPTS,
    });
}

function updateDashChart() {
    if (!chartMain) return;

    const s = DB.sensori;
    ['labels', 'temp', 'pres', 'umid', 'flu'].forEach(k => {
        if (chartBuf[k].length > 30) chartBuf[k].shift();
    });

    chartBuf.labels.push('');
    chartBuf.temp.push(s[0].val);
    chartBuf.pres.push(s[1].val);
    chartBuf.umid.push(s[3].val);
    chartBuf.flu.push(s[4].val);

    chartMain.data.labels           = [...chartBuf.labels];
    chartMain.data.datasets[0].data = [...chartBuf.temp];
    chartMain.data.datasets[1].data = [...chartBuf.umid];
    chartMain.data.datasets[2].data = chartBuf.pres.map(v => v * 10);
    chartMain.data.datasets[3].data = [...chartBuf.flu];
    chartMain.update('none');
}

let chartRev;

function initRevChart() {
    const ctx = document.getElementById('chartRev');
    if (!ctx) return;
    if (chartRev) chartRev.destroy();

    const labels = DB.revData.map(d => d.label);
    const data   = DB.revData.map(d => d.val);
    const max    = Math.max(...data);
    const colors = data.map(v =>
        v === max      ? 'rgba(245,158,11,.85)' :
        v > max * 0.75 ? 'rgba(34,197,94,.55)'  :
                         'rgba(167,139,250,.45)'
    );

    chartRev = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: 'Fatturato (€)', data, backgroundColor: colors, borderColor: 'transparent', borderRadius: 3 }],
        },
        options: {
            ...CHART_OPTS,
            plugins: { ...CHART_OPTS.plugins, legend: { display: false } },
            scales:  {
                ...CHART_OPTS.scales,
                x: {
                    ticks: { color: '#4a5568', font: { family: "'Share Tech Mono'", size: 8.5 }, maxRotation: 60, maxTicksLimit: 15 },
                    grid:  { display: false },
                },
            },
        },
    });
}

function refreshRevChart() {
    if (!chartRev) return;
    chartRev.data.datasets[0].data = DB.revData.map(d => d.val);
    const max = Math.max(...DB.revData.map(d => d.val));
    chartRev.data.datasets[0].backgroundColor = DB.revData.map(d =>
        d.val === max      ? 'rgba(245,158,11,.85)' :
        d.val > max * 0.75 ? 'rgba(34,197,94,.55)'  :
                             'rgba(167,139,250,.45)'
    );
    chartRev.update('none');
}

let chartQpm;
window.chartQpm = null;

function initQpmChart() {
    const ctx = document.getElementById('chartQpm');
    if (!ctx || chartQpm) return;

    chartQpm = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: qpmHist.map((_, i) => i),
            datasets: [{
                data:            [...qpmHist],
                backgroundColor: 'rgba(245,158,11,.35)',
                borderColor:     'var(--amber)',
                borderWidth:     1,
                borderRadius:    2,
            }],
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            animation:           false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales:  {
                x: { display: false },
                y: { ticks: { color: '#4a5568', font: { family: "'Share Tech Mono'", size: 9 } }, grid: { color: 'rgba(255,255,255,.03)' } },
            },
        },
    });

    window.chartQpm = chartQpm;
}

const miniInst = {};
const miniHist = { temp: [], pres: [], vel: [], umid: [], flu: [] };

function initMiniCharts() {
    const cols = { temp: '#f59e0b', pres: '#22d3ee', vel: '#22c55e', umid: '#ef4444', flu: '#a78bfa' };

    keys.forEach((k, i) => {
        const cvs = document.getElementById('mc-' + k);
        if (!cvs) return;

        if (miniInst[k]) miniInst[k].destroy();

        if (!miniHist[k].length) {
            const s = DB.sensori[i];
            for (let j = 0; j < 20; j++) {
                miniHist[k].push(+(s.min + Math.random() * (s.max - s.min)).toFixed(2));
            }
        }

        miniInst[k] = new Chart(cvs, {
            type: 'line',
            data: {
                labels:   miniHist[k].map((_, j) => j),
                datasets: [{
                    data:            [...miniHist[k]],
                    borderColor:     cols[k],
                    backgroundColor: 'transparent',
                    tension:         .4,
                    pointRadius:     0,
                    borderWidth:     1.5,
                }],
            },
            options: {
                responsive:          true,
                maintainAspectRatio: false,
                animation:           false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales:  { x: { display: false }, y: { display: false } },
            },
        });
    });
}

function updateMiniCharts() {
    keys.forEach((k, i) => {
        const h = miniHist[k];
        if (!h.length) return;

        h.push(DB.sensori[i].val);
        if (h.length > 30) h.shift();

        const mc = miniInst[k];
        if (mc) {
            mc.data.datasets[0].data = [...h];
            mc.data.labels           = h.map((_, j) => j);
            mc.update('none');
        }
    });
}

function initApp() {
    refreshOrdini();
    refreshMagazzino();
    refreshKPIs();
    renderStorico();
    recalcAnomalies();
    initMainChart();
    initRevChart();

    sim.start();
}

document.addEventListener('DOMContentLoaded', () => {

    // Login
    document.getElementById('l-btn')
        .addEventListener('click', doLogin);
    document.getElementById('l-pass')
        .addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    // Logout
    document.getElementById('btn-logout')
        .addEventListener('click', doLogout);

    // Stop/Riprendi simulazione
    document.getElementById('btn-stop')?.addEventListener('click', () => {
        sim.toggle();
        showToast(
            window.simRunning ? '▶ Simulazione ripresa' : '⏸ Simulazione sospesa',
            window.simRunning ? 'green' : 'am'
        );
    });

    // Verifica sessione PHP esistente (o mostra login)
    checkSession();
});