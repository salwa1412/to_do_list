document
.getElementById("registerForm")
.addEventListener("submit",
async function(e){

  e.preventDefault();

  const nama =
    document.getElementById("name").value;

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const confirmPassword =
    document.getElementById("confirmPassword").value;

  if(password !== confirmPassword){
    alert("Password tidak sama");
    return;
  }

  const response =
    await fetch('/api/auth/register',{

    method:'POST',

    headers:{
      'Content-Type':'application/json'
    },

    body:JSON.stringify({
      nama,
      email,
      password
    })

  });

  const data =
    await response.json();

  if(response.ok){

    alert(data.message);

    window.location.href =
      '/login.html';

  }else{

    alert(data.message);

  }

});