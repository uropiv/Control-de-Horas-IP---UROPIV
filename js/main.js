// js/main.js - Conexión real al Web App (GAS)
const GAS_URL = "https://script.google.com/macros/s/AKfycbxyI_z7ExGUn-McHbLcmrxx-Sw0RFhVRxtEiw6EVEFcrPTkyvHVsCbDnOT35dugDBeyNw/exec";

async function api(action, payload){
  const url = GAS_URL + "?action=" + encodeURIComponent(action);

  // Construimos URLSearchParams (convierte todo a strings)
  const body = new URLSearchParams();
  // incluimos la action en el body también por seguridad (no obligatorio)
  body.append("action", action);
  for (const k in payload){
    if(payload[k] === undefined || payload[k] === null) continue;
    // Si es objeto, lo pasamos a string JSON
    if(typeof payload[k] === "object"){
      body.append(k, JSON.stringify(payload[k]));
    } else {
      body.append(k, String(payload[k]));
    }
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      // Este Content-Type es uno "simple" y evita preflight
      headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body: body.toString()
    });
    // Respuesta viene como JSON (Apps Script devuelve JSON)
    return await res.json();
  } catch (err) {
    return {ok:false, error: String(err)};
  }
}


document.addEventListener("DOMContentLoaded", () => {
  // Tabs same
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

  // Register with backend
  document.getElementById("btn-register").addEventListener("click", async () => {
    const legajo = document.getElementById("reg-legajo").value.trim();
    const apellido = document.getElementById("reg-apellido").value.trim();
    const nombre = document.getElementById("reg-nombre").value.trim();
    const pin = document.getElementById("reg-pin").value.trim();
    const pin2 = document.getElementById("reg-pin2").value.trim();

    if(!legajo || !apellido || !nombre || !pin || !pin2){
      return alert("Completa todos los campos para registrarte.");
    }
    if(pin !== pin2) return alert("Los PIN no coinciden.");
    if(pin.length < 4 || pin.length > 6) return alert("PIN: entre 4 y 6 dígitos.");

    const res = await api("register", {legajo, apellido, nombre, pin});
    if(res.ok){
      alert("Registro creado correctamente. Ahora iniciá sesión.");
      tabLogin.click();
      document.getElementById("login-legajo").value = legajo;
    } else {
      alert("Error: " + (res.error || "no info"));
    }
  });

  // Login with backend
  document.getElementById("btn-login").addEventListener("click", async () => {
    const legajo = document.getElementById("login-legajo").value.trim();
    const pin = document.getElementById("login-pin").value.trim();
    if(!legajo || !pin) return alert("Ingresa legajo y PIN.");

    const res = await api("login", {legajo, pin});
    if(res.ok){
      // Guardamos token
      const tokenData = {legajo, token: res.token, role: res.role};
      localStorage.setItem("auth_token", JSON.stringify(tokenData));
      alert("Login OK. Redirigiendo...");
      // Redirigir según rol (aún no creamos app.html/supervisor.html)
      if(res.role === "supervisor"){
        window.location.href = "supervisor.html";
      } else {
        window.location.href = "app.html";
      }
    } else {
      alert("Login fallido: " + (res.error || "no info"));
    }
  });

  // Al cargar index: limpiar sesión (requisito)
  localStorage.removeItem("auth_token");
});
