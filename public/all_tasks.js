// public/all_tasks.js

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
  window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllTasks('all');
});

// Load All Tasks for Table View
async function loadAllTasks(filter = 'all') {
  const tbody = document.getElementById('all-tasks-tbody');
  const emptyState = document.getElementById('all-tasks-empty');
  
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">⏳ Memuat data...</td></tr>';
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
      updateStatsSummary([]);
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    renderAllTasksTable(tasks);
    updateStatsSummary(tasks);

  } catch (error) {
    console.error(' Load all tasks error:', error);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;">❌ ${error.message}</td></tr>`;
  }
}

// Render Table (Modern Design + Edit Logic)
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
    
    let daysText = '';
    if (dueDate) {
      const due = new Date(dueDate);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        daysText = `Belum ${diffDays} hari`;
      } else if (diffDays < 0 && status !== 'done') {
        daysText = `Terlambat ${Math.abs(diffDays)} hari`;
      }
    }
    
    const statusBadge = {
      'pending': '<span class="status-badge status-pending"> Belum Selesai</span>',
      'in_progress': '<span class="status-badge status-progress"> Proses</span>',
      'done': '<span class="status-badge status-done">✅ Selesai</span>'
    }[status] || `<span class="status-badge">${status}</span>`;

    const priorityBadge = {
      'low': '<span class="priority-badge priority-low">🟢 Rendah</span>',
      'medium': '<span class="priority-badge priority-medium">🟡 Sedang</span>',
      'high': '<span class="priority-badge priority-high">🔴 Tinggi</span>'
    }[priority] || '<span class="priority-badge">Sedang</span>';

    const dueDisplay = dueDate 
      ? `<div class="deadline-wrapper">
          <span class="deadline-date">📅 ${formatDate(dueDate)}</span>
          ${daysText ? `<span class="deadline-remaining ${isOverdue ? 'overdue' : ''}">${daysText}</span>` : ''}
        </div>`
      : '<span style="color:var(--text-muted)">-</span>';

    const actions = `
      <div class="action-buttons">
        <button class="btn-action edit" onclick="editTask('${taskId}')" title="Edit">✏️</button>
        ${status !== 'done' ? `<button class="btn-action done" onclick="completeTask('${taskId}')" title="Tandai selesai">✓</button>` : ''}
        <button class="btn-action delete" onclick="deleteTask('${taskId}')" title="Hapus">🗑️</button>
      </div>
    `;

    const row = document.createElement('tr');
    if (isOverdue) row.classList.add('row-overdue');

    row.innerHTML = `
      <td class="col-check"><input type="checkbox" class="task-checkbox"></td>
      <td class="col-title">
        <div class="task-title-wrapper">
          <span class="task-dot"></span>
          <span class="task-title-cell">${escapeHtml(title)}</span>
        </div>
      </td>
      <td class="col-desc"><span class="task-desc-cell">${escapeHtml(description)}</span></td>
      <td class="col-status">${statusBadge}</td>
      <td class="col-deadline">${dueDisplay}</td>
      <td class="col-priority">${priorityBadge}</td>
      <td class="col-actions">${actions}</td>
    `;

    tbody.appendChild(row);
  });
}

// Update Stats Summary
function updateStatsSummary(tasks) {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date) < new Date();
  }).length;

  const totalEl = document.getElementById('totalTasksCount');
  const pendingEl = document.getElementById('pendingTasksCount');
  const completedEl = document.getElementById('doneTasksCount');
  const overdueEl = document.getElementById('overdueTasksCount');

  if (totalEl) totalEl.innerText = total;
  if (pendingEl) pendingEl.innerText = pending;
  if (completedEl) completedEl.innerText = completed;
  if (overdueEl) overdueEl.innerText = overdue;

  const showingFromEl = document.getElementById('showing-from');
  const totalTasksEl = document.getElementById('total-tasks');
  
  if (showingFromEl && totalTasksEl) {
    if (total === 0) {
      showingFromEl.innerText = '0';
      totalTasksEl.innerText = '0';
    } else {
      showingFromEl.innerText = `1 - ${total}`;
      totalTasksEl.innerText = total;
    }
  }
}

// Filter Functions
function filterAllTasks(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });
  loadAllTasks(filter);
}

// Complete Task
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
      loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    } else {
      alert(' ' + (data.message || 'Gagal update status'));
    }
  } catch (error) {
    console.error('❌ Complete task error:', error);
  }
}

// ============================================
// EDIT TASK (FUNGSI PERBAIKAN)
// ============================================
async function editTask(taskId) {
  const newTitle = prompt("Masukkan Judul Baru:");
  if (newTitle === null || newTitle.trim() === "") return;
  
  const newDesc = prompt("Masukkan Deskripsi Baru:");
  if (newDesc === null) return;
  
  const newDate = prompt("Masukkan Tanggal Baru (YYYY-MM-DD):");
  if (newDate === null) return;

  try {
    const response = await fetch(`/api/todos/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        judul: newTitle.trim(),
        deskripsi: newDesc.trim(),
        tenggat_waktu: newDate.trim() || null
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      alert("✅ Berhasil!");
      loadAllTasks('all');
    } else {
      alert("❌ Error: " + data.message);
    }
  } catch (err) {
    alert("❌ Gagal koneksi");
    console.error(err);
  }
}

// Delete Task
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
      loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    } else {
      alert('❌ ' + (data.message || 'Gagal hapus tugas'));
    }
  } catch (error) {
    console.error('❌ Delete task error:', error);
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Search
document.getElementById('searchAllTasks')?.addEventListener('input', function() {
  const value = this.value.toLowerCase();
  const rows = document.querySelectorAll('#all-tasks-tbody tr');
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(value) ? '' : 'none';
  });
});

// Helpers
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// Export functions
window.filterAllTasks = filterAllTasks;
window.loadAllTasks = loadAllTasks;
window.renderAllTasksTable = renderAllTasksTable;
window.updateStatsSummary = updateStatsSummary;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.logout = logout;