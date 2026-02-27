// js/supervisor-page.js
function escapeHtml(value){
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", async () => {
  const auth = requireAuth(true);
  if(!auth) return;
  if(auth.role !== "supervisor"){
    alert("Acceso denegado: necesita rol supervisor.");
    logoutLocal();
    return;
  }

  document.getElementById("btn-logout").addEventListener("click", () => logoutLocal());

  document.getElementById("btn-refresh-all").addEventListener("click", loadAll);
  document.getElementById("btn-search-legajo").addEventListener("click", async () => {
    const leg = document.getElementById("sup-legajo").value.trim();
    if(!leg) return loadAll();
    const res = await api("getUserServices", { token: auth.token, legajo: leg });
    renderServices(res);
  });

  // NUEVO HANDLER --- SUGERENCIA INDIVIDUAL
  document.getElementById("sup-btn-send-suggestion").addEventListener("click", async () => {
    const target = document.getElementById("sup-sug-legajo").value.trim();
    const mensaje = document.getElementById("sup-sug-mensaje").value.trim();
    if(!target || !mensaje) return alert("Completá legajo y mensaje.");

    const res = await api("addSuggestion", { 
      token: auth.token, 
      target_legajo: target, 
      mensaje 
    });

    if(res.ok){
      document.getElementById("sup-sug-msg").textContent = "Sugerencia enviada.";
      document.getElementById("sup-sug-mensaje").value = "";
    } else {
      document.getElementById("sup-sug-msg").textContent = "Error: " + (res.error||"sin detalle");
    }
  });




  async function loadAll(){
    const res = await api("getAllServices", { token: auth.token });
    renderServices(res);
  }

  function renderServices(res){
    const c = document.getElementById("sup-services");
    c.innerHTML = "";
    if(!res.ok) return c.textContent = "Error: " + (res.error||"sin detalle");
    if(!res.services || res.services.length === 0) return c.textContent = "No hay servicios registrados.";
    const t = document.createElement("table");
    t.style.width = "100%";
    t.style.minWidth = "1200px";
    t.innerHTML = `<thead><tr style="text-align:left"><th>ID</th><th>Legajo</th><th>Tipo</th><th>Subtipo</th><th>Fecha</th><th>Horas</th><th>Obs</th><th>Estado</th><th>Motivo baja</th><th>Baja por</th><th>Fecha baja</th></tr></thead>`;
    const body = document.createElement("tbody");
    res.services.forEach(s=>{
      const tr = document.createElement("tr");
      const estado = s.voided ? "ELIMINADO" : "ACTIVO";
      const fechaBaja = s.void_at ? new Date(s.void_at).toLocaleString() : "";
      tr.innerHTML = `<td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.id)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.legajo)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.tipo)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.subtipo || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.fecha_display || s.fecha_iso || (s.fecha ? (new Date(s.fecha)).toLocaleDateString() : ""))}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.horas)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.observaciones || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(estado)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.void_reason || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.void_by || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(fechaBaja)}</td>`;
      body.appendChild(tr);
    });
    t.appendChild(body);
    c.appendChild(t);
  }

  // --- PEGAR AQUÍ EL CÓDIGO DE SUGERENCIAS ---

  // --- SUGERENCIAS: cargar y renderizar para supervisor ---

  // Conectar botón
  const btnLoadSugs = document.getElementById("btn-load-suggestions");
  if(btnLoadSugs) btnLoadSugs.addEventListener("click", loadSuggestions);

  // Cargar sugerencias (llama al backend)
  async function loadSuggestions(){
    const res = await api("getSuggestions", { token: auth.token });
    renderSuggestions(res);
  }

  // Renderizar sugerencias en la tabla (usa la forma que devuelve tu GAS)
  function renderSuggestions(res){
    const c = document.getElementById("sup-suggestions");
    c.innerHTML = "";

    if(!res){
      c.textContent = "Error: respuesta vacía del servidor.";
      return;
    }
    if(!res.ok){
      c.textContent = "Error al cargar sugerencias: " + (res.error || "sin detalle");
      return;
    }

    const list = res.suggestions || [];
    if(list.length === 0){
      c.textContent = "No hay sugerencias enviadas.";
      return;
    }

    const t = document.createElement("table");
    t.style.width = "100%";
    t.style.minWidth = "760px";
    t.innerHTML = `<thead>
      <tr style="text-align:left">
        <th>#</th><th>Legajo destino</th><th>Mensaje</th><th>Fecha</th><th>Estado</th>
      </tr>
    </thead>`;
    const body = document.createElement("tbody");

    list.forEach((s, idx) => {
      const fecha = s.timestamp ? (new Date(s.timestamp)).toLocaleString() : "";
      const estado = s.visto_por_target ? `LEIDO${ s.visto_at ? (" (" + new Date(s.visto_at).toLocaleString() + ")") : "" }` : "NO LEIDO";
      const idCell = s.rowIndex || (idx+1);
      const mensaje = escapeHtml(s.mensaje || "");
      const tr = document.createElement("tr");
      tr.innerHTML = `<td style="padding:6px;border-top:1px solid #eee">${escapeHtml(idCell)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.target_legajo || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${mensaje}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(fecha)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(estado)}</td>`;
      body.appendChild(tr);
    });

    t.appendChild(body);
    c.appendChild(t);
  }

  // (opcional) auto-load al abrir:
    loadSuggestions();


  // carga inicial
  loadAll();
});
