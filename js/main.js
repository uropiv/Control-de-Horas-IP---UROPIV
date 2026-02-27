// js/main.js - Conexión real al Web App (GAS)
const GAS_URL = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || "";

async function api(action, payload){
  if(!GAS_URL){
    return {ok:false, error:"GAS_URL no configurada"};
  }
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
    if(!res.ok){
      return {ok:false, error:`HTTP ${res.status}`};
    }
    try {
      return await res.json();
    } catch(parseErr){
      return {ok:false, error:"Respuesta invalida del servidor"};
    }
  } catch (err) {
    return {ok:false, error: String(err)};
  }
}

function setButtonLoading(btn, isLoading, loadingText = "Cargando..."){
  if(!btn) return;
  if(isLoading){
    if(!btn.dataset.originalText){
      btn.dataset.originalText = btn.textContent || "";
    }
    btn.disabled = true;
    btn.classList.add("is-loading");
    btn.textContent = loadingText;
    return;
  }
  btn.disabled = false;
  btn.classList.remove("is-loading");
  if(btn.dataset.originalText){
    btn.textContent = btn.dataset.originalText;
    delete btn.dataset.originalText;
  }
}

async function withButtonLoading(btn, asyncTask, loadingText = "Cargando..."){
  setButtonLoading(btn, true, loadingText);
  try {
    return await asyncTask();
  } finally {
    setButtonLoading(btn, false);
  }
}

function initPasswordToggle(inputId){
  const input = document.getElementById(inputId);
  if(!input || input.dataset.toggleReady === "1") return;
  const wrapper = document.createElement("div");
  wrapper.className = "password-toggle-wrap";
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "password-toggle-btn";
  btn.setAttribute("aria-label", "Mostrar u ocultar PIN");
  btn.textContent = "👁";
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "🙈" : "👁";
  });
  wrapper.appendChild(btn);
  input.dataset.toggleReady = "1";
}


document.addEventListener("DOMContentLoaded", () => {
  // Tabs same
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");

  initPasswordToggle("login-pin");
  initPasswordToggle("reg-pin");
  initPasswordToggle("reg-pin2");

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
    const btn = document.getElementById("btn-register");
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

    const res = await withButtonLoading(
      btn,
      () => api("register", {legajo, apellido, nombre, pin}),
      "Registrando..."
    );
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
    const btn = document.getElementById("btn-login");
    const legajo = document.getElementById("login-legajo").value.trim();
    const pin = document.getElementById("login-pin").value.trim();
    if(!legajo || !pin) return alert("Ingresa legajo y PIN.");

    const res = await withButtonLoading(
      btn,
      () => api("login", {legajo, pin}),
      "Ingresando..."
    );
    if(res.ok){
      // Guardamos token
      const tokenData = {legajo, token: res.token, role: res.role};
      sessionStorage.setItem("auth_token", JSON.stringify(tokenData));
      localStorage.removeItem("auth_token");
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
  sessionStorage.removeItem("auth_token");
  localStorage.removeItem("auth_token");
});
