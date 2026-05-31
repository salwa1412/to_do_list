const API = '/api/todos';

// ===== STATE =====
let editMode = false;
let searchTimeout = null;

// ===== DARK MODE =====
const darkToggle = document.getElementById('darkToggle');
if (localStorage.getItem('dark') === '1') {
  document.body.classList.add('dark');
  darkToggle.textContent = '☀️';
}
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  darkToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('dark', isDark ? '1' : '0');
});

// ===== TOAST =====
function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ===== MODAL =====
function showModal(todo) {
  document.getElementById('modalTitle').textContent = todo.title;
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'done';
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-row"><strong>Deskripsi</strong> ${todo.description || '-'}</div>
    <div class="modal-row"><strong>Kategori</strong> ${todo.category}</div>
    <div class="modal-row"><strong>Prioritas</strong> ${todo.priority}</div>
    <div class="modal-row"><strong>Status</strong> ${todo.status}</div>
    <div class="modal-row"><strong>Due Date</strong> <span class="${isOverdue ? 'due-date overdue' : ''}">${todo.due_date ? formatDate(todo.due_date) : '-'}${isOverdue ? ' ⚠️ Overdue' : ''}</span></div>
    <div class="modal-row"><strong>Dibuat</strong> ${new Date(todo.created_at).toLocaleString('id-ID')}</div>
  `;
  document.getElementById('modal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ===== HELPERS =====
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done') return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

// ===== LOAD STATS =====
async function loadStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const { data } = await res.json();
    document.getElementById('statTotal').textContent = data.total || 0;
    document.getElementById('statPending').textContent = data.pending || 0;
    document.getElementById('statProgress').textContent = data.in_progress || 0;
    document.getElementById('statDone').textContent = data.done || 0;
    document.getElementById('statOverdue').textContent = data.overdue || 0;
  } catch (e) { console.error('Stats error', e); }
}

// ===== LOAD TODOS =====
async function loadTodos() {
  const search = document.getElementById('searchInput').value;
  const status = document.getElementById('filterStatus').value;
  const priority = document.getElementById('filterPriority').value;

  let url = `${API}?`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (status) url += `status=${status}&`;
  if (priority) url += `priority=${priority}&`;

  try {
    const res = await fetch(url);
    const { data } = await res.json();
    renderTodos(data || []);
    loadStats();
  } catch (e) {
    showToast('❌ Gagal memuat data');
    console.error(e);
  }
}

function renderTodos(todos) {
  const list = document.getElementById('todoList');
  const empty = document.getElementById('emptyState');

  if (!todos.length) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = todos.map(todo => {
    const overdue = isOverdue(todo.due_date, todo.status);
    const checkIcon = todo.status === 'done' ? '✓' : '';
    return `
      <div class="todo-card priority-${todo.priority} status-${todo.status}" data-id="${todo.id}">
        <div class="todo-checkbox" onclick="toggleDone(${todo.id}, '${todo.status}')" title="Tandai selesai">${checkIcon}</div>
        <div class="todo-body" onclick="openDetail(${todo.id})" style="cursor:pointer">
          <div class="todo-title">${escapeHtml(todo.title)}</div>
          <div class="todo-meta">
            <span class="badge badge-cat">${todo.category}</span>
            <span class="badge badge-${todo.priority}">${todo.priority}</span>
            <span class="badge badge-${todo.status}">${statusLabel(todo.status)}</span>
            ${todo.due_date ? `<span class="due-date ${overdue ? 'overdue' : ''}">📅 ${formatDate(todo.due_date)}${overdue ? ' ⚠️' : ''}</span>` : ''}
          </div>
        </div>
        <div class="todo-actions">
          <button class="btn-icon" onclick="editTodo(${todo.id})" title="Edit">✏️</button>
          <button class="btn-icon delete" onclick="deleteTodo(${todo.id})" title="Hapus">🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

function statusLabel(s) {
  const m = { pending: 'Pending', in_progress: 'On Progress', done: 'Selesai' };
  return m[s] || s;
}
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== OPEN DETAIL =====
async function openDetail(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    const { data } = await res.json();
    showModal(data);
  } catch (e) { showToast('❌ Gagal memuat detail'); }
}

// ===== TOGGLE DONE =====
async function toggleDone(id, currentStatus) {
  const newStatus = currentStatus === 'done' ? 'pending' : 'done';
  try {
    const res = await fetch(`${API}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (json.success) {
      showToast(newStatus === 'done' ? '✅ Task selesai!' : '↩️ Task di-reopen');
      loadTodos();
    }
  } catch (e) { showToast('❌ Gagal update status'); }
}

// ===== SUBMIT FORM =====
document.getElementById('todoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const body = {
    title: document.getElementById('inputTitle').value,
    description: document.getElementById('inputDesc').value,
    category: document.getElementById('inputCategory').value,
    priority: document.getElementById('inputPriority').value,
    due_date: document.getElementById('inputDueDate').value || null,
    status: document.getElementById('inputStatus').value,
  };

  try {
    const url = id ? `${API}/${id}` : API;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      showToast(id ? '✏️ Task diperbarui!' : '✅ Task ditambahkan!');
      resetForm();
      loadTodos();
    } else {
      showToast('❌ ' + json.message);
    }
  } catch (e) { showToast('❌ Gagal menyimpan'); }
});

// ===== EDIT TODO =====
async function editTodo(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    const { data } = await res.json();
    document.getElementById('editId').value = data.id;
    document.getElementById('inputTitle').value = data.title;
    document.getElementById('inputDesc').value = data.description || '';
    document.getElementById('inputCategory').value = data.category;
    document.getElementById('inputPriority').value = data.priority;
    document.getElementById('inputDueDate').value = data.due_date ? data.due_date.split('T')[0] : '';
    document.getElementById('inputStatus').value = data.status;
    document.getElementById('formTitle').textContent = '✏️ Edit Task';
    document.getElementById('submitBtn').textContent = 'Update Task';
    document.getElementById('cancelBtn').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) { showToast('❌ Gagal memuat data edit'); }
}

// ===== DELETE =====
async function deleteTodo(id) {
  if (!confirm('Yakin hapus task ini?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) { showToast('🗑 Task dihapus'); loadTodos(); }
    else showToast('❌ ' + json.message);
  } catch (e) { showToast('❌ Gagal menghapus'); }
}

// ===== CLEAR DONE =====
document.getElementById('clearDoneBtn').addEventListener('click', async () => {
  if (!confirm('Hapus semua task yang sudah selesai?')) return;
  try {
    const res = await fetch(`${API}/clear-done`, { method: 'DELETE' });
    const json = await res.json();
    showToast('🗑 ' + json.message);
    loadTodos();
  } catch (e) { showToast('❌ Gagal menghapus'); }
});

// ===== CANCEL EDIT =====
document.getElementById('cancelBtn').addEventListener('click', resetForm);
function resetForm() {
  document.getElementById('todoForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('formTitle').textContent = '+ Tambah Task';
  document.getElementById('submitBtn').textContent = 'Simpan Task';
  document.getElementById('cancelBtn').style.display = 'none';
}

// ===== FILTERS =====
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadTodos, 350);
});
document.getElementById('filterStatus').addEventListener('change', loadTodos);
document.getElementById('filterPriority').addEventListener('change', loadTodos);

// ===== INIT =====
loadTodos();
