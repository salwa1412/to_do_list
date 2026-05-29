// public/dashboard.js

// Get token & user from localStorage
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Redirect if not logged in
if (!token) {
  window.location.href = '/login.html';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const greetingEl = document.getElementById('greeting');
  if (greetingEl && user?.nama) {
    greetingEl.innerText = `Halo, ${user.nama} 👋`;
  }
  loadTasks();
});

// ============================================
// VIEW SWITCHING
// ============================================
function switchView(viewName) {
  console.log('🔄 Switching to:', viewName);
  
  const dashboardView = document.getElementById('dashboard-view');
  const allTasksView = document.getElementById('all-tasks-view');
  const menuDashboard = document.getElementById('menu-dashboard');
  const menuAllTasks = document.getElementById('menu-all-tasks');

  if (viewName === 'dashboard') {
    dashboardView.style.display = 'block';
    allTasksView.style.display = 'none';
    if (menuDashboard) menuDashboard.classList.add('active');
    if (menuAllTasks) menuAllTasks.classList.remove('active');
    loadTasks();
  } else if (viewName === 'all-tasks') {
    dashboardView.style.display = 'none';
    allTasksView.style.display = 'block';
    if (menuDashboard) menuDashboard.classList.remove('active');
    if (menuAllTasks) menuAllTasks.classList.add('active');
    loadAllTasks('all');
  }
}

// ============================================
// FILTER BUTTONS
// ============================================
function filterAllTasks(filter) {
  console.log('🔍 Filter:', filter);
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });
  
  loadAllTasks(filter);
}

// ============================================
// LOAD TASKS - DASHBOARD VIEW (Cards)
// ============================================
async function loadTasks() {
  try {
    const response = await fetch('/api/todos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil task');
    }

    const tasks = result.data || [];
    const taskList = document.getElementById('taskList');
    if (taskList) taskList.innerHTML = '';

    let completed = 0, pending = 0, overdue = 0;
    const today = new Date();

    tasks.forEach(task => {
      const title = task.title || task.judul || 'Tanpa Judul';
      const description = task.description || task.deskripsi || '';
      const dueDate = task.due_date || task.tenggat_waktu;
      const status = task.status;
      const priority = task.priority || 'medium';
      const category = task.category || 'General';
      const taskId = task.id;

      if (status === 'done') completed++;
      else {
        pending++;
        if (dueDate && new Date(dueDate) < today) overdue++;
      }

      if (taskList) {
        taskList.innerHTML += `
          <div class="task-card ${status}" data-id="${taskId}">
            <div class="task-info">
              <h3>${escapeHtml(title)}</h3>
              <p>${escapeHtml(description)}</p>
              <div class="task-meta">
                <span class="category-badge">${escapeHtml(category)}</span>
                <span class="priority-badge priority-${priority}">${getPriorityLabel(priority)}</span>
              </div>
              <small>Deadline: ${dueDate ? formatDate(dueDate) : '-'}</small><br>
              <small>Status: ${getStatusLabel(status)}</small>
            </div>
            <div class="task-actions">
              ${status !== 'done' ? `<button class="done-btn" onclick="completeTask('${taskId}')">✓ Selesai</button>` : ''}
              <button class="edit-btn" onclick="editTask('${taskId}')">Edit</button>
              <button class="delete-btn" onclick="deleteTask('${taskId}')">Hapus</button>
            </div>
          </div>
        `;
      }
    });

    updateStat('completedCount', completed);
    updateStat('pendingCount', pending);
    updateStat('overdueCount', overdue);

  } catch (error) {
    console.error('❌ Load tasks error:', error);
    alert('⚠️ ' + error.message);
    if (error.message.includes('token') || error.message.includes('401')) {
      localStorage.clear();
      window.location.href = '/login.html';
    }
  }
}

// ============================================
// LOAD ALL TASKS - TABLE VIEW (With Filter)
// ============================================
async function loadAllTasks(filter = 'all') {
  const tbody = document.getElementById('all-tasks-tbody');
  const emptyState = document.getElementById('all-tasks-empty');
  
  if (!tbody) {
    console.error('❌ Table body not found!');
    return;
  }
  
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">⏳ Memuat data...</td></tr>';
  if (emptyState) emptyState.style.display = 'none';

  try {
    let url = '/api/todos';
    if (filter && filter !== 'all') {
      url += `?status=${filter}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil data');
    }

    const tasks = result.data || [];
    
    if (tasks.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    renderAllTasksTable(tasks);

  } catch (error) {
    console.error('❌ Load all tasks error:', error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#dc2626;">❌ ${error.message}</td></tr>`;
  }
}

// ============================================
// RENDER TABLE
// ============================================
function renderAllTasksTable(tasks) {
  const tbody = document.getElementById('all-tasks-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach(task => {
    const title = task.title || 'Tanpa Judul';
    const description = task.description || '';
    const dueDate = task.due_date;
    const status = task.status;
    const priority = task.priority || 'medium';
    const taskId = task.id;

    const isOverdue = dueDate && new Date(dueDate) < today && status !== 'done';
    
    const statusBadge = {
      'pending': '<span class="badge status-pending">⏳ Belum</span>',
      'in_progress': '<span class="badge status-progress">🔄 Proses</span>',
      'done': '<span class="badge status-done">✅ Selesai</span>'
    }[status] || status;

    const priorityBadge = {
      'low': '<span class="badge priority-low">🟢 Rendah</span>',
      'medium': '<span class="badge priority-medium">🟡 Sedang</span>',
      'high': '<span class="badge priority-high">🔴 Tinggi</span>'
    }[priority] || priority;

    const dueDisplay = dueDate 
      ? `<span class="${isOverdue ? 'overdue' : ''}">${formatDate(dueDate)}</span>`
      : '-';

    const actions = `
      ${status !== 'done' ? `<button class="btn-icon done" onclick="completeTask('${taskId}')" title="Tandai selesai">✓</button>` : ''}
      <button class="btn-icon delete" onclick="deleteTask('${taskId}')" title="Hapus">🗑️</button>
    `;

    const row = document.createElement('tr');
    if (isOverdue) row.classList.add('row-overdue');

    row.innerHTML = `
      <td><strong>${escapeHtml(title)}</strong></td>
      <td><small>${escapeHtml(description.substring(0, 50))}${description.length > 50 ? '...' : ''}</small></td>
      <td>${statusBadge}</td>
      <td>${dueDisplay}</td>
      <td>${priorityBadge}</td>
      <td>${actions}</td>
    `;

    tbody.appendChild(row);
  });
}

// ============================================
// ADD TASK
// ============================================
async function addTask() {
  const judul = document.getElementById('judul')?.value?.trim();
  const deskripsi = document.getElementById('deskripsi')?.value?.trim();
  const tenggat_waktu = document.getElementById('tenggat')?.value;

  if (!judul) {
    alert('Judul wajib diisi');
    return;
  }

  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ judul, deskripsi, tenggat_waktu })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('✅ ' + data.message);
      document.getElementById('judul').value = '';
      document.getElementById('deskripsi').value = '';
      document.getElementById('tenggat').value = '';
      loadTasks();
      if (document.getElementById('all-tasks-view').style.display !== 'none') {
        loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
    } else {
      alert('❌ ' + (data.message || 'Gagal menambah task'));
    }
  } catch (error) {
    console.error('❌ Add task error:', error);
    alert('⚠️ Terjadi kesalahan koneksi');
  }
}

// ============================================
// COMPLETE TASK
// ============================================
async function completeTask(taskId) {
  try {
    const response = await fetch(`/api/todos/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'done' })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      loadTasks();
      if (document.getElementById('all-tasks-view').style.display !== 'none') {
        loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
    } else {
      alert('❌ ' + (data.message || 'Gagal update status'));
    }
  } catch (error) {
    console.error('❌ Complete task error:', error);
  }
}

// ============================================
// EDIT & DELETE
// ============================================
function editTask(taskId) {
  alert('✏️ Edit task ID: ' + taskId + '\n\nFitur edit akan segera tersedia!');
}

async function deleteTask(taskId) {
  if (!confirm('Yakin ingin menghapus tugas ini?')) return;

  try {
    const response = await fetch(`/api/todos/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (response.ok && data.success) {
      alert('✅ ' + data.message);
      loadTasks();
      if (document.getElementById('all-tasks-view').style.display !== 'none') {
        loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
    } else {
      alert('❌ ' + (data.message || 'Gagal hapus task'));
    }
  } catch (error) {
    console.error('❌ Delete task error:', error);
  }
}

// ============================================
// LOGOUT & SEARCH
// ============================================
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

document.getElementById('searchInput')?.addEventListener('input', function() {
  const value = this.value.toLowerCase();
  const cards = document.querySelectorAll('#taskList .task-card');
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(value) ? 'flex' : 'none';
  });
});

// ============================================
// HELPERS
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getStatusLabel(status) {
  return {
    'pending': '⏳ Belum selesai',
    'in_progress': '🔄 Sedang dikerjakan',
    'done': '✅ Selesai'
  }[status] || status;
}

function getPriorityLabel(priority) {
  return {
    'low': '🟢 Rendah',
    'medium': '🟡 Sedang',
    'high': '🔴 Tinggi'
  }[priority] || priority;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function updateStat(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = value;
}

// Export functions to window
window.switchView = switchView;
window.filterAllTasks = filterAllTasks;
window.loadTasks = loadTasks;
window.loadAllTasks = loadAllTasks;
window.renderAllTasksTable = renderAllTasksTable;
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.logout = logout;