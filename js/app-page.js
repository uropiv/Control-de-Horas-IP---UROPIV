// js/app-page.js
document.addEventListener("DOMContentLoaded", async () => {
  const auth = requireAuth(true);
  if(!auth) return;

  // Mostrar info usuario
  document.getElementById("user-legajo").textContent = auth.legajo;
  document.getElementById("user-name").textContent = auth.legajo;

  // Logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    logoutLocal();
  });

  // Fecha default hoy
  const today = new Date().toISOString().slice(0,10);
  document.getElementById("ip-fecha").value = today;
  document.getElementById("curso-fecha").value = today;

  // Llenar months select
  const monthSelect = document.getElementById("res-month");
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  months.forEach((m,i)=>{
    const o = document.createElement("option");
    o.value = (i+1);
    o.textContent = m;
    monthSelect.appendChild(o);
  });
  // Default year/month actuales
  document.getElementById("res-year").value = new Date().getFullYear();
  monthSelect.value = new Date().getMonth()+1;

  // Add IP
  document.getElementById("btn-add-ip").addEventListener("click", async () => {
    const subtipo = document.getElementById("ip-subtipo").value.trim();
    const fecha = document.getElementById("ip-fecha").value;
    const horas = Number(document.getElementById("ip-horas").value) || 0;
    const obs = document.getElementById("ip-obs").value.trim();
    if(!fecha || horas <= 0) return alert("Completa fecha y horas.");

    const a = getAuth();
    const res = await api("addService", { token: a.token, legajo: a.legajo, tipo: "IP", subtipo, fecha, horas, observaciones: obs, device: "web" });
    if(res.ok){
      alert("Horas IP registradas.");
      loadServices();
    } else {
      alert("Error: " + (res.error||"sin detalle"));
    }
  });

  // Add Curso
  document.getElementById("btn-add-curso").addEventListener("click", async () => {
    const subtipo = document.getElementById("curso-subtipo").value.trim();
    const fecha = document.getElementById("curso-fecha").value;
    const horas = Number(document.getElementById("curso-horas").value) || 0;
    const obs = document.getElementById("curso-obs").value.trim();
    if(!fecha || horas <= 0) return alert("Completa fecha y horas.");

    const a = getAuth();
    const res = await api("addService", { token: a.token, legajo: a.legajo, tipo: "CURSO", subtipo, fecha, horas, observaciones: obs, device: "web" });
    if(res.ok){
      alert("Curso registrado.");
      loadServices();
    } else {
      alert("Error: " + (res.error||"sin detalle"));
    }
  });

  // Load user's services
  async function loadServices(){
    const a = getAuth();
    const res = await api("getUserServices", { token: a.token, legajo: a.legajo });
    const container = document.getElementById("services-list");
    container.innerHTML = "";
    if(!res.ok) return container.textContent = "Error cargando servicios: " + (res.error||"sin detalle");
    if(!res.services || res.services.length === 0) return container.textContent = "No hay servicios registrados.";
    // table
    const t = document.createElement("table");
    t.style.width = "100%";
    t.style.borderCollapse = "collapse";
    t.innerHTML = `<thead><tr style="text-align:left"><th>ID</th><th>Tipo</th><th>Subtipo</th><th>Fecha</th><th>Horas</th><th>Obs</th></tr></thead>`;
    const body = document.createElement("tbody");
    res.services.forEach(s=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td style="padding:6px;border-top:1px solid #eee">${s.id}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.tipo}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.subtipo || ""}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${(new Date(s.fecha)).toLocaleDateString()}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.horas}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${s.observaciones || ""}</td>`;
      body.appendChild(tr);
    });
    t.appendChild(body);
    container.appendChild(t);
  }

  // Summary
  document.getElementById("btn-get-summary").addEventListener("click", async () => {
    const a = getAuth();
    const year = Number(document.getElementById("res-year").value);
    const month = Number(document.getElementById("res-month").value);
    const res = await api("getMonthlySummary", { token: a.token, legajo: a.legajo, year, month });
    const out = document.getElementById("summary-output");
    if(!res.ok) return out.textContent = "Error: " + (res.error||"sin detalle");
    out.innerHTML = `
      <strong>Año:</strong> ${res.year}  <strong>Mes:</strong> ${res.month} <br/>
      <strong>Total IP:</strong> ${res.total_ip} h <br/>
      <strong>Total Cursos:</strong> ${res.total_cursos} h <br/>
      <strong>Recargo disponible:</strong> ${res.recargo_disponible} h <br/>
      <strong>Detalle:</strong> ${JSON.stringify(res.detalle)}
    `;
  });

  // Inicial carga
  loadServices();
});
