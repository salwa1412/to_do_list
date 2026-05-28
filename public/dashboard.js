const token =
  localStorage.getItem('token');

const user =
  JSON.parse(
    localStorage.getItem('user')
  );

// kalau belum login
if(!token){
  window.location.href =
    '/login.html';
}

// greeting user
document
.getElementById('greeting')
.innerText =
`Halo, ${user.nama} 👋`;


// LOAD TASK
async function loadTasks(){

  try{

    const response =
      await fetch('/api/task', {

      method:'GET',

      headers:{
        Authorization:
          `Bearer ${token}`
      }

    });

    const tasks =
      await response.json();

    const taskList =
      document.getElementById(
        'taskList'
      );

    taskList.innerHTML = '';

    let completed = 0;
    let pending = 0;
    let overdue = 0;

    const today =
      new Date();

    tasks.forEach(task => {

      if(task.status === true){
        completed++;
      }else{
        pending++;

        if(
          task.tenggat_waktu &&
          new Date(
            task.tenggat_waktu
          ) < today
        ){
          overdue++;
        }
      }

      taskList.innerHTML += `
        <div class="task-card">

          <div class="task-info">

            <h3>
              ${task.judul}
            </h3>

            <p>
              ${task.deskripsi ?? ''}
            </p>

            <small>
              Deadline:
              ${
                task.tenggat_waktu
                ? new Date(
                  task.tenggat_waktu
                ).toLocaleDateString(
                  'id-ID'
                )
                : '-'
              }
            </small>

            <br>

            <small>
              Status:
              ${
                task.status
                ? '✅ Selesai'
                : '⏳ Belum selesai'
              }
            </small>

          </div>

          <div class="task-actions">

            ${
              !task.status
              ? `
              <button
                class="done-btn"
                onclick="completeTask(
                  ${task.id},
                  '${task.judul}',
                  '${task.deskripsi}',
                  '${task.tenggat_waktu}'
                )"
              >
                Selesai
              </button>
              `
              : ''
            }

            <button
              class="delete-btn"
              onclick="deleteTask(
                ${task.id}
              )"
            >
              Hapus
            </button>

          </div>

        </div>
      `;

    });

    // statistik
    document
    .getElementById(
      'completedCount'
    ).innerText =
      completed;

    document
    .getElementById(
      'pendingCount'
    ).innerText =
      pending;

    document
    .getElementById(
      'overdueCount'
    ).innerText =
      overdue;

  }catch(error){

    console.log(error);

    alert(
      'Gagal mengambil task'
    );

  }

}


// TAMBAH TASK
async function addTask(){

  const judul =
    document
    .getElementById(
      'judul'
    ).value;

  const deskripsi =
    document
    .getElementById(
      'deskripsi'
    ).value;

  const tenggat_waktu =
    document
    .getElementById(
      'tenggat'
    ).value;

  if(!judul){
    alert(
      'Judul wajib diisi'
    );
    return;
  }

  try{

    const response =
      await fetch('/api/task', {

      method:'POST',

      headers:{
        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${token}`
      },

      body:JSON.stringify({

        judul,
        deskripsi,
        kategori_id:1,
        tenggat_waktu

      })

    });

    const data =
      await response.json();

    if(response.ok){

      alert(
        'Task berhasil ditambah'
      );

      document
      .getElementById(
        'judul'
      ).value = '';

      document
      .getElementById(
        'deskripsi'
      ).value = '';

      document
      .getElementById(
        'tenggat'
      ).value = '';

      loadTasks();

    }else{

      alert(
        data.message
      );

    }

  }catch(error){

    console.log(error);

  }

}


// CHECKLIST TASK
async function completeTask(
  id,
  judul,
  deskripsi,
  tenggat_waktu
){

  try{

    const response =
      await fetch(
        `/api/task/${id}`,
      {

      method:'PUT',

      headers:{
        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${token}`
      },

      body:JSON.stringify({

        judul,
        deskripsi,
        status:true,
        tenggat_waktu,
        kategori_id:1

      })

    });

    if(response.ok){

      loadTasks();

    }

  }catch(error){

    console.log(error);

  }

}


// DELETE TASK
async function deleteTask(id){

  const confirmDelete =
    confirm(
      'Hapus task ini?'
    );

  if(!confirmDelete)
    return;

  try{

    const response =
      await fetch(
        `/api/task/${id}`,
      {

      method:'DELETE',

      headers:{
        Authorization:
          `Bearer ${token}`
      }

    });

    if(response.ok){

      loadTasks();

    }

  }catch(error){

    console.log(error);

  }

}


// LOGOUT
function logout(){

  localStorage.removeItem(
    'token'
  );

  localStorage.removeItem(
    'user'
  );

  window.location.href =
    '/login.html';
}


// SEARCH TASK
document
.getElementById(
  'searchInput'
)
.addEventListener(
'input',
function(){

  const value =
    this.value.toLowerCase();

  const cards =
    document.querySelectorAll(
      '.task-card'
    );

  cards.forEach(card => {

    const text =
      card.innerText
      .toLowerCase();

    card.style.display =
      text.includes(value)
      ? 'flex'
      : 'none';

  });

});


// pertama kali load
loadTasks();
