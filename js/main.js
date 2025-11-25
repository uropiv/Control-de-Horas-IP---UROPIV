// js/main.js - Lógica mínima para alternar formularios y guardar token local (simulado).
// Por ahora NO hace llamadas al backend; cuando tengamos GAS lo conectamos.

document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    formLogin.classList.remove("hidden");
    formRegister.classList.add("hidden");
  });
  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    formRegister.classList.remove("hidden");
    formLogin.classList.add("hidden");
  });

  // Botones
  document.getElementById("btn-register").addEventListener("click", async () => {
    const legajo = document.getElementById("reg-legajo").value.trim();
    const apellido = document.getElementById("reg-apellido").value.trim();
    const nombre = document.getElementById("reg-nombre").value.trim();
    const pin = document.getElementById("reg-pin").value.trim();
    const pin2 = document.getElementById("reg-pin2").value.trim();

    // Validaciones básicas
    if(!legajo || !apellido || !nombre || !pin || !pin2){
      return alert("Completa todos los campos para registrarte.");
    }
    if(pin !== pin2){
      return alert("Los PIN no coinciden.");
    }
    if(pin.length < 4 || pin.length > 6){
      return alert("PIN: entre 4 y 6 dígitos.");
    }

    // Simulación de registro: guardamos en localStorage (temporal)
    const user = {legajo, apellido, nombre, pin};
    localStorage.setItem("mock_user_" + legajo, JSON.stringify(user));
    alert("Registro simulado guardado en el navegador. Cuando conectemos el backend se validará en el servidor.");
    // Cambiar a login
    tabLogin.click();
    document.getElementById("login-legajo").value = legajo;
  });

  document.getElementById("btn-login").addEventListener("click", async () => {
    const legajo = document.getElementById("login-legajo").value.trim();
    const pin = document.getElementById("login-pin").value.trim();

    if(!legajo || !pin) return alert("Ingresa legajo y PIN.");

    // Simulación de login:
    const stored = localStorage.getItem("mock_user_" + legajo);
    if(!stored){
      return alert("Usuario no encontrado (esto es simulación). Primero registrate.");
    }
    const user = JSON.parse(stored);
    if(user.pin !== pin){
      return alert("PIN incorrecto (simulación).");
    }

    // Guardamos token simple en localStorage
    const tokenData = {legajo, nombre:user.nombre, apellido:user.apellido, role: "user", token: "local-" + Date.now()};
    localStorage.setItem("auth_token", JSON.stringify(tokenData));
    alert("Login simulado OK. Ahora irías a la interfaz principal.");
    // En la próxima etapa crearemos app.html y supervisor.html y redireccionaremos.
    // Por ahora sólo mostramos la info en consola:
    console.log("Usuario logueado:", tokenData);
  });

  // Al cargar index: limpiar sesión (requisito: "al volver a login se cierra sesión")
  localStorage.removeItem("auth_token");
});
