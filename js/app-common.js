// js/app-common.js
// Reemplaza la URL por tu Web App URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbwpt4RKy39QdsCw-tyKQ9sFx8kGKLT5KSB4Ec4PmtEcAIC6ISwXb1AMxP2ap8ObQhxSzg/exec";

// Función que envía application/x-www-form-urlencoded para evitar CORS preflight
async function api(action, payload = {}){
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
    return await res.json();
  } catch (err) {
    return {ok:false, error: String(err)};
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
function logoutLocal(){
  const a = getAuth();
  if(a && a.token){
    // llamar logout al backend (intento silencioso)
    api("logout", {token: a.token}).catch(()=>{});
  }
  localStorage.removeItem("auth_token");
  window.location.href = "index.html";
}
