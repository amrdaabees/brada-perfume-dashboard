/* ============================================
   BRADA PERFUME - Dashboard Application
   ============================================ */

// ==========================================
// DATA STORE
// ==========================================
const Store = {
    get(key) {
        try { return JSON.parse(localStorage.getItem('brada_' + key)) || []; }
        catch { return []; }
    },
    set(key, data) {
        localStorage.setItem('brada_' + key, JSON.stringify(data));
    },
    id() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }
};

// ==========================================
// CONSTANTS
// ==========================================
const CATEGORIES = {
    facebook_ads: 'إعلانات فيسبوك',
    google_ads: 'إعلانات جوجل',
    tiktok_ads: 'إعلانات تيك توك',
    instagram_ads: 'إعلانات انستجرام',
    snapchat_ads: 'إعلانات سناب شات',
    shipping: 'شحن',
    packaging: 'تغليف',
    design: 'تصميم',
    other: 'أخرى'
};

const SOURCES = { owner: 'صاحب المشروع', amr: 'عمرو' };
const TYPES = { daily: 'يومي', monthly: 'شهري' };

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setCurrentDate();
    setDefaultDates();
    setupNavigation();
    setupForms();
    setupFilters();
    refreshAll();
}

function setCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    ['expenseDate', 'saleDate', 'repayDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });
    const first = new Date(); first.setDate(1);
    const fromEl = document.getElementById('reportFrom');
    const toEl = document.getElementById('reportTo');
    if (fromEl) fromEl.value = first.toISOString().split('T')[0];
    if (toEl) toEl.value = today;
}

// ==========================================
// NAVIGATION
// ==========================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${page}`).classList.add('active');
            sidebar.classList.remove('open');
            refreshAll();
        });
    });

    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ==========================================
// FORMS SETUP
// ==========================================
function setupForms() {
    // Expense Form
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const expense = {
            id: Store.id(),
            description: val('expenseDesc'),
            amount: num('expenseAmount'),
            date: val('expenseDate'),
            type: val('expenseType'),
            source: val('expenseSource'),
            category: val('expenseCategory'),
            createdAt: new Date().toISOString()
        };
        const list = Store.get('expenses');
        list.push(expense);
        Store.set('expenses', list);
        e.target.reset(); setDefaultDates();
        showToast('تم إضافة المصروف بنجاح ✅');
        refreshAll();
    });

    // Repayment Form
    document.getElementById('repaymentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const repayment = {
            id: Store.id(),
            to: val('repayTo'),
            amount: num('repayAmount'),
            date: val('repayDate'),
            notes: val('repayNotes'),
            createdAt: new Date().toISOString()
        };
        const list = Store.get('repayments');
        list.push(repayment);
        Store.set('repayments', list);
        e.target.reset(); setDefaultDates();
        showToast('تم تسجيل السداد بنجاح ✅');
        refreshAll();
    });

    // Sales Form
    document.getElementById('salesForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const products = Store.get('products');
        const productId = val('saleProduct');
        const product = products.find(p => p.id === productId);

        const sale = {
            id: Store.id(),
            productId,
            productName: product ? product.name : 'غير محدد',
            productCost: product ? product.cost : 0,
            quantity: parseInt(val('saleQuantity')) || 1,
            price: num('salePrice'),
            date: val('saleDate'),
            customer: {
                name: val('saleCustomerName'),
                phone: val('saleCustomerPhone'),
                address: val('saleCustomerAddress'),
                city: val('saleCustomerCity')
            },
            notes: val('saleNotes'),
            createdAt: new Date().toISOString()
        };

        const sales = Store.get('sales');
        sales.push(sale);
        Store.set('sales', sales);

        // Update stock
        if (product) {
            product.stock = Math.max(0, product.stock - sale.quantity);
            Store.set('products', products);
        }

        e.target.reset(); setDefaultDates();
        showToast('تم تسجيل البيع بنجاح ✅');
        refreshAll();
    });

    // Product Form
    document.getElementById('productForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const product = {
            id: Store.id(),
            name: val('productName'),
            cost: num('productCost'),
            price: num('productPrice'),
            stock: parseInt(val('productStock')) || 0,
            createdAt: new Date().toISOString()
        };
        const list = Store.get('products');
        list.push(product);
        Store.set('products', list);
        e.target.reset();
        showToast('تم إضافة المنتج بنجاح ✅');
        refreshAll();
    });
}

// ==========================================
// FILTERS
// ==========================================
function setupFilters() {
    ['filterExpenseSource', 'filterExpenseType', 'filterExpenseCategory'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderExpensesTable);
    });
    document.getElementById('customerSearch').addEventListener('input', renderCustomersTable);
}

// ==========================================
// REFRESH ALL
// ==========================================
function refreshAll() {
    refreshDashboard();
    renderExpensesTable();
    renderRepaymentsTable();
    renderSalesTable();
    renderProductsTable();
    renderCustomersTable();
    populateProductSelect();
    refreshProfits();
    refreshBalances();
    renderBestSellers('bestSellers');
    renderBestSellers('salesBestSellers');
}

// ==========================================
// BALANCE CALCULATIONS
// ==========================================
function getBalances() {
    const expenses = Store.get('expenses');
    const repayments = Store.get('repayments');

    const ownerTotal = expenses.filter(e => e.source === 'owner').reduce((s, e) => s + e.amount, 0);
    const amrTotal = expenses.filter(e => e.source === 'amr').reduce((s, e) => s + e.amount, 0);
    const ownerPaid = repayments.filter(r => r.to === 'owner').reduce((s, r) => s + r.amount, 0);
    const amrPaid = repayments.filter(r => r.to === 'amr').reduce((s, r) => s + r.amount, 0);

    return {
        ownerTotal, amrTotal, ownerPaid, amrPaid,
        ownerRemaining: ownerTotal - ownerPaid,
        amrRemaining: amrTotal - amrPaid
    };
}

function refreshBalances() {
    const b = getBalances();

    // Dashboard balances
    setText('dash_ownerTotal', fmt(b.ownerTotal));
    setText('dash_ownerPaid', fmt(b.ownerPaid));
    setText('dash_ownerRemaining', fmt(b.ownerRemaining));
    setText('dash_amrTotal', fmt(b.amrTotal));
    setText('dash_amrPaid', fmt(b.amrPaid));
    setText('dash_amrRemaining', fmt(b.amrRemaining));

    // Repayments page balances
    setText('rep_ownerTotal', fmt(b.ownerTotal));
    setText('rep_ownerPaid', fmt(b.ownerPaid));
    setText('rep_ownerRemaining', fmt(b.ownerRemaining));
    setText('rep_amrTotal', fmt(b.amrTotal));
    setText('rep_amrPaid', fmt(b.amrPaid));
    setText('rep_amrRemaining', fmt(b.amrRemaining));

    // Profits page balances
    setText('p_ownerExp', fmt(b.ownerTotal));
    setText('p_ownerPaid', fmt(b.ownerPaid));
    setText('p_ownerRem', fmt(b.ownerRemaining));
    setText('p_amrExp', fmt(b.amrTotal));
    setText('p_amrPaid', fmt(b.amrPaid));
    setText('p_amrRem', fmt(b.amrRemaining));

    const totalExp = b.ownerTotal + b.amrTotal;
    setText('p_ownerPct', totalExp > 0 ? ((b.ownerTotal / totalExp) * 100).toFixed(1) + '%' : '0%');
    setText('p_amrPct', totalExp > 0 ? ((b.amrTotal / totalExp) * 100).toFixed(1) + '%' : '0%');
}

// ==========================================
// DASHBOARD
// ==========================================
function refreshDashboard() {
    const expenses = Store.get('expenses');
    const sales = Store.get('sales');
    const today = new Date().toISOString().split('T')[0];

    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const totalSales = sales.reduce((s, sa) => s + (sa.price * sa.quantity), 0);
    const totalCost = sales.reduce((s, sa) => s + (sa.productCost * sa.quantity), 0);
    const todayExp = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);

    setText('totalExpenses', fmt(totalExp));
    setText('totalSales', fmt(totalSales));
    setText('totalProfits', fmt(totalSales - totalExp - totalCost));
    setText('todayExpenses', fmt(todayExp));

    renderRecentTransactions();
    renderWeeklyChart();
    renderExpensesPieChart();
}

function renderRecentTransactions() {
    const expenses = Store.get('expenses');
    const sales = Store.get('sales');
    let txns = [];

    expenses.forEach(e => txns.push({
        date: e.date, type: 'مصروف', typeClass: 'badge-expense',
        desc: e.description, amount: e.amount, isExpense: true,
        source: SOURCES[e.source], sourceClass: e.source === 'owner' ? 'badge-owner' : 'badge-amr'
    }));

    sales.forEach(s => txns.push({
        date: s.date, type: 'بيع', typeClass: 'badge-sale',
        desc: s.productName + (s.customer?.name ? ` — ${s.customer.name}` : ''),
        amount: s.price * s.quantity, isExpense: false,
        source: '-', sourceClass: ''
    }));

    txns.sort((a, b) => new Date(b.date) - new Date(a.date));
    txns = txns.slice(0, 10);

    const tbody = document.getElementById('recentTransactions');
    if (!txns.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عمليات بعد</p></td></tr>';
        return;
    }

    tbody.innerHTML = txns.map(t => `<tr>
        <td>${fmtDate(t.date)}</td>
        <td><span class="badge ${t.typeClass}">${t.type}</span></td>
        <td>${t.desc}</td>
        <td style="font-weight:800;color:${t.isExpense ? 'var(--danger)' : 'var(--success)'}">
            ${t.isExpense ? '-' : '+'}${fmt(t.amount)}
        </td>
        <td>${t.sourceClass ? `<span class="badge ${t.sourceClass}">${t.source}</span>` : '-'}</td>
    </tr>`).join('');
}

// ==========================================
// BEST SELLERS
// ==========================================
function renderBestSellers(containerId) {
    const sales = Store.get('sales');
    const productMap = {};

    sales.forEach(s => {
        if (!productMap[s.productName]) {
            productMap[s.productName] = { name: s.productName, count: 0, revenue: 0 };
        }
        productMap[s.productName].count += s.quantity;
        productMap[s.productName].revenue += s.price * s.quantity;
    });

    const sorted = Object.values(productMap).sort((a, b) => b.count - a.count);
    const container = document.getElementById(containerId);

    if (!sorted.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-medal"></i><p>لا توجد مبيعات بعد</p></div>';
        return;
    }

    const rankClasses = ['gold', 'silver', 'bronze'];

    container.innerHTML = sorted.slice(0, 6).map((p, i) => `
        <div class="best-seller-card">
            <div class="bs-rank ${rankClasses[i] || 'normal'}">${i + 1}</div>
            <div class="bs-icon"><i class="fas fa-spray-can"></i></div>
            <div class="bs-name">${p.name}</div>
            <div class="bs-count">${p.count}</div>
            <div class="bs-label">قطعة مباعة</div>
            <div style="font-size:0.8rem;color:var(--success);font-weight:700;margin-top:4px">${fmt(p.revenue)}</div>
        </div>
    `).join('');
}

// ==========================================
// CHARTS
// ==========================================
let charts = {};

function destroyChart(name) {
    if (charts[name]) { charts[name].destroy(); charts[name] = null; }
}

function renderWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    destroyChart('weekly');

    const expenses = Store.get('expenses');
    const sales = Store.get('sales');
    const labels = [], expD = [], salD = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }));
        expD.push(expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0));
        salD.push(sales.filter(s => s.date === ds).reduce((s, sa) => s + (sa.price * sa.quantity), 0));
    }

    charts.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'المصروفات', data: expD, backgroundColor: 'rgba(255,23,68,0.7)', borderColor: '#FF1744', borderWidth: 2, borderRadius: 8 },
                { label: 'المبيعات', data: salD, backgroundColor: 'rgba(0,200,83,0.7)', borderColor: '#00C853', borderWidth: 2, borderRadius: 8 }
            ]
        },
        options: chartOptions()
    });
}

function renderExpensesPieChart() {
    const ctx = document.getElementById('expensesPieChart');
    if (!ctx) return;
    destroyChart('pie');

    const expenses = Store.get('expenses');
    const catData = {};
    expenses.forEach(e => {
        const c = CATEGORIES[e.category] || e.category;
        catData[c] = (catData[c] || 0) + e.amount;
    });

    const labels = Object.keys(catData);
    const data = Object.values(catData);
    if (!labels.length) { labels.push('لا توجد بيانات'); data.push(1); }

    const colors = ['#FF1744', '#2979FF', '#00C853', '#FFB300', '#AA00FF', '#00BCD4', '#FF6D00', '#607D8B', '#E91E63'];

    charts.pie = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 3, borderColor: '#fff' }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo', weight: 'bold', size: 11 }, padding: 12 } } } }
    });
}

function renderMonthlyProfitChart() {
    const ctx = document.getElementById('monthlyProfitChart');
    if (!ctx) return;
    destroyChart('monthly');

    const expenses = Store.get('expenses');
    const sales = Store.get('sales');
    const months = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months[key] = { sales: 0, expenses: 0 };
    }

    expenses.forEach(e => { const k = e.date.substring(0, 7); if (months[k]) months[k].expenses += e.amount; });
    sales.forEach(s => { const k = s.date.substring(0, 7); if (months[k]) months[k].sales += s.price * s.quantity; });

    const labels = Object.keys(months).map(k => {
        const [y, m] = k.split('-');
        return new Date(y, m - 1).toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });
    });

    charts.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'المبيعات', data: Object.values(months).map(m => m.sales), borderColor: '#00C853', backgroundColor: 'rgba(0,200,83,0.1)', fill: true, tension: 0.4, borderWidth: 3, pointRadius: 5 },
                { label: 'المصروفات', data: Object.values(months).map(m => m.expenses), borderColor: '#FF1744', backgroundColor: 'rgba(255,23,68,0.1)', fill: true, tension: 0.4, borderWidth: 3, pointRadius: 5 },
                { label: 'الربح', data: Object.values(months).map(m => m.sales - m.expenses), borderColor: '#AA00FF', backgroundColor: 'rgba(170,0,255,0.1)', fill: true, tension: 0.4, borderWidth: 3, pointRadius: 5 }
            ]
        },
        options: chartOptions()
    });
}

function renderSourceChart() {
    const ctx = document.getElementById('sourceChart');
    if (!ctx) return;
    destroyChart('source');

    const b = getBalances();

    charts.source = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['صاحب المشروع', 'عمرو'],
            datasets: [{ data: [b.ownerTotal || 0, b.amrTotal || 0], backgroundColor: ['#8B1A1A', '#2979FF'], borderWidth: 3, borderColor: '#fff' }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo', weight: 'bold', size: 13 }, padding: 20 } } } }
    });
}

function chartOptions() {
    return {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Cairo', weight: 'bold' } } } },
        scales: {
            y: { beginAtZero: true, ticks: { font: { family: 'Cairo' } } },
            x: { ticks: { font: { family: 'Cairo' } } }
        }
    };
}

// ==========================================
// EXPENSES TABLE
// ==========================================
function renderExpensesTable() {
    let expenses = Store.get('expenses');
    const sf = val('filterExpenseSource'), tf = val('filterExpenseType'), cf = val('filterExpenseCategory');
    if (sf !== 'all') expenses = expenses.filter(e => e.source === sf);
    if (tf !== 'all') expenses = expenses.filter(e => e.type === tf);
    if (cf !== 'all') expenses = expenses.filter(e => e.category === cf);
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('expensesTable');
    if (!expenses.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-receipt"></i><p>لا توجد مصروفات</p></td></tr>';
        return;
    }

    tbody.innerHTML = expenses.map(e => `<tr>
        <td>${fmtDate(e.date)}</td>
        <td>${e.description}</td>
        <td style="font-weight:800;color:var(--danger)">${fmt(e.amount)}</td>
        <td><span class="badge ${e.type === 'daily' ? 'badge-daily' : 'badge-monthly'}">${TYPES[e.type]}</span></td>
        <td><span class="badge ${e.source === 'owner' ? 'badge-owner' : 'badge-amr'}">${SOURCES[e.source]}</span></td>
        <td>${CATEGORIES[e.category] || e.category}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteItem('expenses','${e.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
}

// ==========================================
// REPAYMENTS TABLE
// ==========================================
function renderRepaymentsTable() {
    const repayments = Store.get('repayments');
    repayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('repaymentsTable');
    if (!repayments.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-hand-holding-usd"></i><p>لا يوجد سجل سداد</p></td></tr>';
        return;
    }

    tbody.innerHTML = repayments.map(r => `<tr>
        <td>${fmtDate(r.date)}</td>
        <td><span class="badge ${r.to === 'owner' ? 'badge-owner' : 'badge-amr'}">${SOURCES[r.to]}</span></td>
        <td style="font-weight:800;color:var(--success)">${fmt(r.amount)}</td>
        <td>${r.notes || '-'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteItem('repayments','${r.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
}

// ==========================================
// SALES TABLE
// ==========================================
function renderSalesTable() {
    const sales = Store.get('sales');
    sales.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('salesTable');
    if (!sales.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-shopping-bag"></i><p>لا توجد مبيعات</p></td></tr>';
        return;
    }

    tbody.innerHTML = sales.map(s => `<tr>
        <td>${fmtDate(s.date)}</td>
        <td style="font-weight:700">${s.productName}</td>
        <td>${s.quantity}</td>
        <td>${fmt(s.price)}</td>
        <td style="font-weight:800;color:var(--success)">${fmt(s.price * s.quantity)}</td>
        <td>${s.customer?.name || '-'}</td>
        <td>${s.customer?.phone || '-'}</td>
        <td>${s.customer?.city || '-'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteItem('sales','${s.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
}

// ==========================================
// PRODUCTS TABLE
// ==========================================
function renderProductsTable() {
    const products = Store.get('products');
    const sales = Store.get('sales');

    const tbody = document.getElementById('productsTable');
    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-box-open"></i><p>لا توجد منتجات</p></td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => {
        const margin = p.price - p.cost;
        const pct = p.cost > 0 ? ((margin / p.cost) * 100).toFixed(1) : 0;
        const sold = sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0);
        return `<tr>
            <td style="font-weight:700">${p.name}</td>
            <td>${fmt(p.cost)}</td>
            <td>${fmt(p.price)}</td>
            <td style="font-weight:800;color:${margin >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(margin)}</td>
            <td><span class="badge ${margin >= 0 ? 'badge-sale' : 'badge-expense'}">${pct}%</span></td>
            <td>${p.stock}</td>
            <td>${sold}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteItem('products','${p.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    }).join('');
}

function populateProductSelect() {
    const products = Store.get('products');
    const select = document.getElementById('saleProduct');
    select.innerHTML = '<option value="">اختر المنتج</option>';
    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} — ${fmt(p.price)} (متاح: ${p.stock})`;
        select.appendChild(opt);
    });
}

// ==========================================
// CUSTOMERS TABLE
// ==========================================
function renderCustomersTable() {
    const sales = Store.get('sales');
    const searchTerm = (val('customerSearch') || '').toLowerCase();

    // Group by phone or name
    const customerMap = {};
    sales.forEach(s => {
        const key = s.customer?.phone || s.customer?.name || 'unknown';
        if (!customerMap[key]) {
            customerMap[key] = {
                name: s.customer?.name || '-',
                phone: s.customer?.phone || '-',
                city: s.customer?.city || '-',
                address: s.customer?.address || '-',
                orders: 0,
                total: 0,
                lastOrder: s.date,
                products: new Set()
            };
        }
        const c = customerMap[key];
        c.orders += 1;
        c.total += s.price * s.quantity;
        if (s.date > c.lastOrder) c.lastOrder = s.date;
        c.products.add(s.productName);
        // Update details if newer
        if (s.customer?.name) c.name = s.customer.name;
        if (s.customer?.city) c.city = s.customer.city;
        if (s.customer?.address) c.address = s.customer.address;
    });

    let customers = Object.values(customerMap);

    if (searchTerm) {
        customers = customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.phone.includes(searchTerm)
        );
    }

    customers.sort((a, b) => b.total - a.total);

    const tbody = document.getElementById('customersTable');
    if (!customers.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-users"></i><p>لا يوجد عملاء</p></td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(c => `<tr>
        <td style="font-weight:700">${c.name}</td>
        <td>${c.phone}</td>
        <td>${c.city}</td>
        <td>${c.address}</td>
        <td style="text-align:center;font-weight:700">${c.orders}</td>
        <td style="font-weight:800;color:var(--success)">${fmt(c.total)}</td>
        <td>${fmtDate(c.lastOrder)}</td>
        <td style="font-size:0.8rem">${[...c.products].join('، ')}</td>
    </tr>`).join('');
}

// ==========================================
// PROFITS
// ==========================================
function refreshProfits() {
    const expenses = Store.get('expenses');
    const sales = Store.get('sales');

    const totalSales = sales.reduce((s, sa) => s + (sa.price * sa.quantity), 0);
    const totalCost = sales.reduce((s, sa) => s + (sa.productCost * sa.quantity), 0);
    const totalAds = expenses.reduce((s, e) => s + e.amount, 0);

    setText('profitTotalSales', fmt(totalSales));
    setText('profitTotalCost', fmt(totalCost));
    setText('profitTotalAds', fmt(totalAds));
    setText('profitNet', fmt(totalSales - totalCost - totalAds));

    renderMonthlyProfitChart();
    renderSourceChart();
}

// ==========================================
// REPORTS
// ==========================================
function generateReport() {
    const from = val('reportFrom'), to = val('reportTo');
    const expenses = Store.get('expenses').filter(e => e.date >= from && e.date <= to);
    const sales = Store.get('sales').filter(s => s.date >= from && s.date <= to);
    const repayments = Store.get('repayments').filter(r => r.date >= from && r.date <= to);

    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const totalSal = sales.reduce((s, sa) => s + (sa.price * sa.quantity), 0);
    const totalCost = sales.reduce((s, sa) => s + (sa.productCost * sa.quantity), 0);
    const ownerExp = expenses.filter(e => e.source === 'owner').reduce((s, e) => s + e.amount, 0);
    const amrExp = expenses.filter(e => e.source === 'amr').reduce((s, e) => s + e.amount, 0);
    const ownerPaid = repayments.filter(r => r.to === 'owner').reduce((s, r) => s + r.amount, 0);
    const amrPaid = repayments.filter(r => r.to === 'amr').reduce((s, r) => s + r.amount, 0);
    const profit = totalSal - totalExp - totalCost;

    document.getElementById('reportSummary').innerHTML = `
        <div class="report-metric"><div class="label">إجمالي المبيعات</div><div class="value" style="color:var(--success)">${fmt(totalSal)}</div></div>
        <div class="report-metric"><div class="label">إجمالي المصروفات</div><div class="value" style="color:var(--danger)">${fmt(totalExp)}</div></div>
        <div class="report-metric"><div class="label">تكلفة المنتجات</div><div class="value" style="color:var(--warning)">${fmt(totalCost)}</div></div>
        <div class="report-metric"><div class="label">صافي الربح</div><div class="value" style="color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(profit)}</div></div>
        <div class="report-metric"><div class="label">مصروفات صاحب المشروع</div><div class="value">${fmt(ownerExp)}</div></div>
        <div class="report-metric"><div class="label">سداد صاحب المشروع</div><div class="value" style="color:var(--success)">${fmt(ownerPaid)}</div></div>
        <div class="report-metric"><div class="label">مصروفات عمرو</div><div class="value">${fmt(amrExp)}</div></div>
        <div class="report-metric"><div class="label">سداد عمرو</div><div class="value" style="color:var(--success)">${fmt(amrPaid)}</div></div>
    `;

    document.getElementById('reportExpenses').innerHTML = expenses.length === 0
        ? '<tr><td colspan="5" class="empty-state"><p>لا توجد مصروفات</p></td></tr>'
        : expenses.map(e => `<tr>
            <td>${fmtDate(e.date)}</td><td>${e.description}</td>
            <td style="font-weight:800">${fmt(e.amount)}</td>
            <td><span class="badge ${e.source === 'owner' ? 'badge-owner' : 'badge-amr'}">${SOURCES[e.source]}</span></td>
            <td>${CATEGORIES[e.category] || e.category}</td>
        </tr>`).join('');

    document.getElementById('reportSales').innerHTML = sales.length === 0
        ? '<tr><td colspan="5" class="empty-state"><p>لا توجد مبيعات</p></td></tr>'
        : sales.map(s => `<tr>
            <td>${fmtDate(s.date)}</td><td>${s.productName}</td>
            <td>${s.customer?.name || '-'}</td><td>${s.quantity}</td>
            <td style="font-weight:800">${fmt(s.price * s.quantity)}</td>
        </tr>`).join('');
}

function exportCSV() {
    const from = val('reportFrom'), to = val('reportTo');
    const expenses = Store.get('expenses').filter(e => e.date >= from && e.date <= to);
    const sales = Store.get('sales').filter(s => s.date >= from && s.date <= to);

    let csv = '\uFEFF';
    csv += 'التاريخ,النوع,الوصف,المبلغ,المصدر,التصنيف,العميل,الموبايل,المحافظة\n';

    expenses.forEach(e => {
        csv += `${e.date},مصروف,"${e.description}",${e.amount},${SOURCES[e.source]},${CATEGORIES[e.category]},-,-,-\n`;
    });

    sales.forEach(s => {
        csv += `${s.date},بيع,"${s.productName}",${s.price * s.quantity},-,-,"${s.customer?.name || ''}","${s.customer?.phone || ''}","${s.customer?.city || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Brada_Report_${from}_${to}.csv`;
    link.click();
    showToast('تم تصدير التقرير بنجاح 📊');
}

// ==========================================
// DELETE
// ==========================================
function deleteItem(collection, id) {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('show');
    document.getElementById('confirmDelete').onclick = () => {
        let items = Store.get(collection);
        items = items.filter(item => item.id !== id);
        Store.set(collection, items);
        closeModal();
        showToast('تم الحذف بنجاح 🗑️');
        refreshAll();
    };
}

function closeModal() {
    document.getElementById('deleteModal').classList.remove('show');
}

// ==========================================
// UTILITIES
// ==========================================
function val(id) { return document.getElementById(id)?.value || ''; }
function num(id) { return parseFloat(val(id)) || 0; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

function fmt(amount) {
    return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ج.م';
}

function fmtDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
