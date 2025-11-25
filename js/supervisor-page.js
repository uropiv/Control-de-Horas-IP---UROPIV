// js/supervisor-page.js
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

  document.getElementById("btn-add-suggest").addEventListener("click", async () => {
    const text = document.getElementById("sup-suggest-text").value.trim();
    if(!text) return alert("Escribí algo antes de enviar.");
    const res = await api("suggestion", { token: auth.token, text });
    if(res.ok){
      document.getElementById("sup-msg").textContent = "Sugerencia enviada.";
      document.getElementById("sup-suggest-text").value = "";
    } else {
      document.getElementById("sup-msg").textContent = "Error: " + (res.error||"sin detalle");
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
    t.innerHTML = `<thead><tr style="text-align:left"><th>ID</th><th>Legajo</th><th>Tipo</th><th>Subtipo</th><th>Fecha</th><th>Horas</th><th>Obs</th></tr></thead>`;
    const body = document.createElement("tbody");
    res.services.forEach(s=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td style="padding:6px;border-top:1px solid #eee">${s.id}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.legajo}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.tipo}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.subtipo || ""}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${(new Date(s.fecha)).toLocaleDateString()}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.horas}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.observaciones || ""}</td>`;
      body.appendChild(tr);
    });
    t.appendChild(body);
    c.appendChild(t);
  }

  // carga inicial
  loadAll();
});
