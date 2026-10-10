// Expense Tracker - Web & Python JSON Synchronization
const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Bills: '💡',
  Entertainment: '🎬',
  Healthcare: '💊',
  Other: '📦'
};

const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#8b5cf6',
  Entertainment: '#10b981',
  Healthcare: '#ef4444',
  Other: '#64748b'
};

let chartInstance = null;

// Initial Default State matching expenses.json structure
const DEFAULT_EXPENSES = [
  { id: 1, date: '2026-10-09', amount: 350, category: 'Food', description: 'Healthy lunch' },
  { id: 2, date: '2026-10-08', amount: 1200, category: 'Bills', description: 'Broadband Internet' },
  { id: 3, date: '2026-10-07', amount: 500, category: 'Transport', description: 'Metro & Uber' },
  { id: 4, date: '2026-10-06', amount: 1800, category: 'Shopping', description: 'Groceries' },
  { id: 5, date: '2026-10-05', amount: 650, category: 'Entertainment', description: 'Movie tickets' }
];

let expenses = [];
let monthlyIncome = 45000;

// Load Data from LocalStorage
function loadData() {
  const savedExpenses = localStorage.getItem('expenses_data');
  const savedIncome = localStorage.getItem('expenses_income');

  if (savedExpenses) {
    try {
      expenses = JSON.parse(savedExpenses);
    } catch (_) {
      expenses = [...DEFAULT_EXPENSES];
    }
  } else {
    expenses = [...DEFAULT_EXPENSES];
    saveData();
  }

  if (savedIncome) {
    monthlyIncome = parseFloat(savedIncome) || 0;
  }
}

function saveData() {
  localStorage.setItem('expenses_data', JSON.stringify(expenses));
  localStorage.setItem('expenses_income', monthlyIncome.toString());
}

// DOM Setup & Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  // Set today's date in form
  const dateInput = document.getElementById('input-date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  document.getElementById('input-income').value = monthlyIncome || '';

  // Event Listeners
  document.getElementById('expense-form').addEventListener('submit', handleAddExpense);
  document.getElementById('btn-clear-form').addEventListener('click', handleClearForm);
  document.getElementById('btn-set-income').addEventListener('click', handleSetIncome);
  document.getElementById('input-search').addEventListener('input', renderTransactions);
  document.getElementById('filter-category').addEventListener('change', renderTransactions);
  document.getElementById('btn-export-json').addEventListener('click', exportExpensesJSON);
  document.getElementById('btn-reset-data').addEventListener('click', handleResetData);

  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'tab-charts') {
        renderCharts();
      }
    });
  });

  updateUI();
});

// Add New Expense
function handleAddExpense(e) {
  e.preventDefault();
  const date = document.getElementById('input-date').value;
  const amount = parseFloat(document.getElementById('input-amount').value);
  const category = document.getElementById('select-category').value;
  const description = document.getElementById('input-description').value.trim() || category;

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid positive amount.');
    return;
  }

  const newExpense = {
    id: Date.now(),
    date,
    amount,
    category,
    description
  };

  expenses.unshift(newExpense);
  saveData();
  updateUI();

  // Reset form fields except date
  document.getElementById('input-amount').value = '';
  document.getElementById('input-description').value = '';
}

function handleClearForm() {
  document.getElementById('input-amount').value = '';
  document.getElementById('input-description').value = '';
}

function handleSetIncome() {
  const val = parseFloat(document.getElementById('input-income').value);
  if (!isNaN(val) && val >= 0) {
    monthlyIncome = val;
    saveData();
    updateUI();
  }
}

function deleteExpense(id) {
  expenses = expenses.filter(item => item.id !== id);
  saveData();
  updateUI();
}

function handleResetData() {
  if (confirm('Reset to sample expenses data?')) {
    expenses = [...DEFAULT_EXPENSES];
    monthlyIncome = 45000;
    saveData();
    document.getElementById('input-income').value = monthlyIncome;
    updateUI();
  }
}

// Export JSON matching original Python schema
function exportExpensesJSON() {
  const jsonStr = JSON.stringify(expenses, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expenses.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Update UI
function updateUI() {
  renderSummary();
  renderTransactions();
  renderCharts();
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
}

function renderSummary() {
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = monthlyIncome - totalSpent;

  document.getElementById('display-income').textContent = formatCurrency(monthlyIncome);
  document.getElementById('display-total-expense').textContent = formatCurrency(totalSpent);
  
  const balanceEl = document.getElementById('display-balance');
  balanceEl.textContent = formatCurrency(balance);

  const balanceCard = document.getElementById('card-balance');
  if (balance < 0) {
    balanceEl.style.color = 'var(--danger)';
  } else {
    balanceEl.style.color = 'var(--primary)';
  }

  document.getElementById('display-tx-count').textContent = expenses.length;
}

function renderTransactions() {
  const listEl = document.getElementById('transactions-list');
  const search = document.getElementById('input-search').value.toLowerCase();
  const categoryFilter = document.getElementById('filter-category').value;

  const filtered = expenses.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch = item.description.toLowerCase().includes(search) || 
                          item.category.toLowerCase().includes(search) ||
                          item.date.includes(search);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:2.5rem;color:var(--text-muted);">
        <i class="fa-solid fa-receipt" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>
        No expenses found
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(item => {
    const icon = CATEGORY_ICONS[item.category] || '📦';
    return `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-category-badge">${icon}</div>
          <div>
            <div class="tx-desc">${escapeHtml(item.description)}</div>
            <div class="tx-meta">${item.date} • ${item.category}</div>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount">- ${formatCurrency(item.amount)}</div>
          <button class="tx-del-btn" onclick="deleteExpense(${item.id})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCharts() {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  const categories = Object.keys(totals);
  const dataValues = categories.map(c => totals[c]);
  const backgroundColors = categories.map(c => CATEGORY_COLORS[c] || '#64748b');

  if (chartInstance) {
    chartInstance.destroy();
  }

  if (categories.length === 0) {
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: dataValues,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#131b2e'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      cutout: '65%'
    }
  });

  // Render Legend Breakdown
  const legendEl = document.getElementById('category-legend');
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0) || 1;

  legendEl.innerHTML = categories.map(cat => {
    const amount = totals[cat];
    const pct = ((amount / totalSpent) * 100).toFixed(1);
    const color = CATEGORY_COLORS[cat] || '#64748b';
    const icon = CATEGORY_ICONS[cat] || '📦';

    return `
      <div class="legend-row">
        <div class="legend-left">
          <span class="legend-dot" style="background:${color}"></span>
          <span>${icon} ${cat}</span>
        </div>
        <div>
          <b>${formatCurrency(amount)}</b>
          <span style="color:var(--text-muted);font-size:0.75rem;margin-left:4px;">(${pct}%)</span>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
