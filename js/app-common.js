// js/app-common.js
const GAS_URL = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || "";

// Función que envía application/x-www-form-urlencoded para evitar CORS preflight
async function api(action, payload = {}){
  if(!GAS_URL){
    return {ok:false, error:"GAS_URL no configurada"};
  }
  const url = GAS_URL + "?action=" + encodeURIComponent(action);
  const body = new URLSearchParams();
  body.append("action", action);
  for (const k in payload){
    if(payload[k] === undefined || payload[k] === null) continue;
    if(typeof payload[k] === "object"){
      body.append(k, JSON.stringify(payload[k]));
    } else {
      body.append(k, String(payload[k]));
    }
  }
  try {
    const res = await fetch(url, {
      method: "POST",
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

/* --- Session helpers: guardamos token en localStorage como auth_token --- */
/* auth_token = {legajo, token, role} */
function getAuth(){
  try {
    return JSON.parse(localStorage.getItem("auth_token") || "null");
  } catch(e){
    return null;
  }
}
function requireAuth(redirectIfMissing = true){
  const a = getAuth();
  if(!a){
    if(redirectIfMissing) window.location.href = "index.html";
    return null;
  }
  return a;
}
async function logoutLocal(triggerButton = null){
  setButtonLoading(triggerButton, true, "Cerrando sesion...");
  const a = getAuth();
  if(a && a.token){
    // llamar logout al backend (intento silencioso)
    try {
      await api("logout", {token: a.token});
    } catch(e){
      // no bloqueamos cierre local
    }
  }
  localStorage.removeItem("auth_token");
  window.location.href = "index.html";
}
