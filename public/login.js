document
.getElementById("loginForm")
.addEventListener("submit",
async function(e){

  e.preventDefault();

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  try{

    const response =
      await fetch('/api/auth/login', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        email,
        password
      })

    });

    const data =
      await response.json();

    if(response.ok){

      // simpan token JWT
      localStorage.setItem(
        'token',
        data.token
      );

      // simpan data user
      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      alert('Login berhasil');

      // pindah halaman
      window.location.href =
        '/dashboard.html';

    }else{

      alert(data.message);

    }

  }catch(error){

    console.log(error);

    alert('Terjadi kesalahan server');

  }

});