// public/dashboard.js

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
  window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const greetingEl = document.getElementById('greeting');
  if (greetingEl && user?.nama) {
    greetingEl.innerText = `Halo, ${user.nama} 👋`;
  }
  loadTasks();
});

// View Switching
function switchView(viewName) {
  const dashboardView = document.getElementById('dashboard-view');
  const allTasksView = document.getElementById('all-tasks-view');
  const menuDashboard = document.getElementById('menu-dashboard');
  const menuAllTasks = document.getElementById('menu-all-tasks');

  if (viewName === 'dashboard') {
    dashboardView.style.display = 'block';
    allTasksView.style.display = 'none';
    menuDashboard.classList.add('active');
    menuAllTasks.classList.remove('active');
    loadTasks();
  } else if (viewName === 'all-tasks') {
    dashboardView.style.display = 'none';
    allTasksView.style.display = 'block';
    menuDashboard.classList.remove('active');
    menuAllTasks.classList.add('active');
    loadAllTasks('all');
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

// Add Task
async function addTask() {
  const judulInput = document.getElementById('judul');
  const deskripsiInput = document.getElementById('deskripsi');
  const tenggatInput = document.getElementById('tenggat');
  
  const judul = judulInput?.value?.trim();
  const deskripsi = deskripsiInput?.value?.trim();
  const tenggat_waktu = tenggatInput?.value;

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
      body: JSON.stringify({ 
        judul, 
        deskripsi, 
        tenggat_waktu,
        prioritas: 'medium'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('✅ ' + data.message);
      
      if (judulInput) judulInput.value = '';
      if (deskripsiInput) deskripsiInput.value = '';
      if (tenggatInput) tenggatInput.value = '';
      
      loadTasks();
      
      const allTasksView = document.getElementById('all-tasks-view');
      if (allTasksView && allTasksView.style.display !== 'none') {
        loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
    } else {
      alert('❌ ' + (data.message || 'Gagal menambah tugas'));
    }
  } catch (error) {
    console.error('❌ Add task error:', error);
    alert('⚠️ Terjadi kesalahan koneksi');
  }
}

// Load Tasks for Dashboard
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
      throw new Error(result.message || 'Gagal mengambil tugas');
    }

    const tasks = result.data || [];
    const taskList = document.getElementById('taskList');
    if (taskList) taskList.innerHTML = '';

    let completed = 0, pending = 0, overdue = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(task => {
      const title = task.title || task.judul || 'Tanpa Judul';
      const description = task.description || task.deskripsi || '';
      const dueDate = task.due_date || task.tenggat_waktu;
      const status = task.status;
      const priority = task.priority || 'medium';
      const category = task.category || 'General';
      const taskId = task.id;

      if (status === 'done') {
        completed++;
      } else {
        pending++;
        if (dueDate && new Date(dueDate) < today) {
          overdue++;
        }
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
    console.error('❌ Load all tasks error:', error);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;">❌ ${error.message}</td></tr>`;
  }
}

// Render Table
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
      'pending': '<span class="status-badge pending">⏳ Belum Selesai</span>',
      'in_progress': '<span class="status-badge in_progress">🔄 Proses</span>',
      'done': '<span class="status-badge done">✅ Selesai</span>'
    }[status] || `<span class="status-badge pending">${status}</span>`;

    const priorityDot = {
      'low': '<span class="priority-dot low"></span>',
      'medium': '<span class="priority-dot medium"></span>',
      'high': '<span class="priority-dot high"></span>'
    }[priority] || '<span class="priority-dot medium"></span>';
    
    const priorityLabel = {
      'low': 'Rendah',
      'medium': 'Sedang',
      'high': 'Tinggi'
    }[priority] || 'Sedang';

    const dueDisplay = dueDate 
      ? `<div class="deadline-wrapper">
          <span class="deadline-date">📅 ${formatDate(dueDate)}</span>
          ${daysText ? `<span class="deadline-remaining ${isOverdue ? 'overdue' : ''}">${daysText}</span>` : ''}
        </div>`
      : '<span style="color:var(--text-muted)">-</span>';

    const actions = `
      <div class="action-buttons">
        <button class="btn-action edit" onclick="editTask('${taskId}')" title="Edit">✏️</button>
        ${status !== 'done' ? `<button class="btn-action done" onclick="completeTask('${taskId}')" title="Tandai selesai">✓ Selesai</button>` : ''}
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
      <td class="col-priority">
        <div class="priority-wrapper">
          ${priorityDot}
          <span>${priorityLabel}</span>
        </div>
      </td>
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

  const totalEl = document.getElementById('stat-total');
  const pendingEl = document.getElementById('stat-pending');
  const completedEl = document.getElementById('stat-completed');
  const overdueEl = document.getElementById('stat-overdue');

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
      loadTasks();
      const allTasksView = document.getElementById('all-tasks-view');
      if (allTasksView && allTasksView.style.display !== 'none') {
        loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
    } else {
      alert('❌ ' + (data.message || 'Gagal update status'));
    }
  } catch (error) {
    console.error('❌ Complete task error:', error);
  }
}

// Edit Task
<<<<<<< HEAD
function editTask(taskId) {
  alert('✏️ Edit task ID: ' + taskId + '\n\nFitur edit akan segera tersedia!');
}

=======
async function editTask(taskId) {

  try {

    const response =
      await fetch(`/api/todos/${taskId}`,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

    const result =
      await response.json();

    if(!result.success){
      alert('Task tidak ditemukan');
      return;
    }

    const task = result.data;

    document.getElementById('editTaskId').value =
      task.id;

    document.getElementById('editJudul').value =
      task.title || '';

    document.getElementById('editDeskripsi').value =
      task.description || '';

    document.getElementById('editTenggat').value =
      task.due_date
        ? task.due_date.split('T')[0]
        : '';

    document.getElementById('editModal')
      .style.display = 'flex';

  } catch(error){

    console.error(error);
    alert('Gagal mengambil data task');

  }

}
>>>>>>> e601499 (Update dashboard UI and edit modal)
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
      loadTasks();
      const allTasksView = document.getElementById('all-tasks-view');
      if (allTasksView && allTasksView.style.display !== 'none') {
        loadAllTasks(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
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
document.getElementById('searchInput')?.addEventListener('input', function() {
  const value = this.value.toLowerCase();
  const cards = document.querySelectorAll('#taskList .task-card');
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(value) ? 'flex' : 'none';
  });
});

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

<<<<<<< HEAD
=======
function closeEditModal(){
  document.getElementById('editModal')
    .style.display = 'none';
}

async function saveEditTask(){

  const taskId =
    document.getElementById('editTaskId').value;

  const judul =
    document.getElementById('editJudul').value;

  const deskripsi =
    document.getElementById('editDeskripsi').value;

  const tenggat =
    document.getElementById('editTenggat').value;

  try{

    const response =
      await fetch(`/api/todos/${taskId}`,{

        method:'PUT',

        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },

        body:JSON.stringify({

          judul,
          deskripsi,
          tenggat_waktu:
            tenggat || null

        })

      });

    const result =
      await response.json();

    if(result.success){

      alert('✅ Task berhasil diupdate');

      closeEditModal();

      loadTasks();

      loadAllTasks(
        document.querySelector('.filter-btn.active')
          ?.dataset.filter || 'all'
      );

    }else{

      alert('❌ ' + result.message);

    }

  }catch(error){

    console.error(error);
    alert('Gagal update task');

  }

}
>>>>>>> e601499 (Update dashboard UI and edit modal)
// Export functions
window.switchView = switchView;
window.filterAllTasks = filterAllTasks;
window.loadTasks = loadTasks;
window.loadAllTasks = loadAllTasks;
window.renderAllTasksTable = renderAllTasksTable;
window.updateStatsSummary = updateStatsSummary;
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.editTask = editTask;
<<<<<<< HEAD
=======
window.saveEditTask = saveEditTask;
window.closeEditModal = closeEditModal;
>>>>>>> e601499 (Update dashboard UI and edit modal)
window.logout = logout;