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

// Summary con barras de progreso y totales
document.getElementById("btn-get-summary").addEventListener("click", async () => {
  const a = getAuth();
  const year = Number(document.getElementById("res-year").value);
  const month = Number(document.getElementById("res-month").value);
  const out = document.getElementById("summary-output");
  out.textContent = "Cargando...";
  const res = await api("getMonthlySummary", { token: a.token, legajo: a.legajo, year, month });
  if(!res.ok){
    out.textContent = "Error: " + (res.error||"sin detalle");
    return;
  }

  // Totales desde backend
  const total_ip = Number(res.total_ip || 0);
  const total_cursos = Number(res.total_cursos || 0);
  const total_consumed = Number(res.total_consumed || (total_ip + total_cursos));
  const course_allocation = Number(res.course_allocation || 0);
  const course_excess = Number(res.course_excess || Math.max(0, total_cursos - course_allocation));
  const recargo_disponible = Number(res.recargo_disponible || Math.max(0, 40 - total_consumed));

  // Mostrar texto con totales
  out.innerHTML = `
    <strong>Año:</strong> ${res.year}  <strong>Mes:</strong> ${res.month} <br/>
    <strong>Total IP:</strong> ${total_ip} h <br/>
    <strong>Total Cursos:</strong> ${total_cursos} h (curso asignado: ${course_allocation} h, excedente: ${course_excess} h) <br/>
    <strong>Total consumido:</strong> ${total_consumed} h <br/>
    <strong>Recargo disponible:</strong> ${recargo_disponible} h <br/>
    <strong>Detalle:</strong> ${JSON.stringify(res.detalle)}
  `;

  // Actualizar barras de progreso (base = 40 h)
  const base = 40;
  const pctIp = Math.min(100, (total_ip / base) * 100);
  const pctCurso = Math.min(100, (total_cursos / base) * 100);
  const pctTotal = Math.min(100, (total_consumed / base) * 100);

  // Labels
  document.getElementById("label-ip").textContent = `${total_ip} / ${base} h`;
  document.getElementById("label-curso").textContent = `${total_cursos} / ${base} h`;
  document.getElementById("label-total").textContent = `${total_consumed} / ${base} h`;

  // Bars
  const barIp = document.getElementById("bar-ip");
  const barCurso = document.getElementById("bar-curso");
  const barTotal = document.getElementById("bar-total");

  // establecer anchos (animación CSS)
  barIp.style.width = pctIp + "%";
  barCurso.style.width = pctCurso + "%";
  barTotal.style.width = pctTotal + "%";

  // Indicador visual de alerta si se supera o queda en 0 recargo disponible
  if(recargo_disponible <= 0){
    // resaltamos el texto del recargo
    out.querySelector("strong:nth-of-type(5)").classList?.add?.("warning");
    // y mostramos nota
    const note = document.createElement("div");
    note.className = "warning";
    note.style.marginTop = "8px";
    note.textContent = "ATENCIÓN: Se superó o se completó el cupo mensual de 40 horas.";
    out.appendChild(note);
  }
});


  // Inicial carga
  loadServices();
});
