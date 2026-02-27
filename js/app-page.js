// js/app-page.js
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

  const state = {
    pendingDeleteId: null,
    deletingService: false,
    pendingEditId: null,
    editingService: false,
    servicesById: {}
  };
  const userSuggestionsEl = document.getElementById("user-suggestions");
  const servicesListEl = document.getElementById("services-list");
  const summaryOutputEl = document.getElementById("summary-output");

  document.getElementById("user-legajo").textContent = auth.legajo;
  document.getElementById("user-name").textContent = auth.legajo;
  document.getElementById("btn-logout").addEventListener("click", async (e) => {
    await logoutLocal(e.currentTarget);
  });

  const today = new Date().toISOString().slice(0,10);
  document.getElementById("ip-fecha").value = today;
  document.getElementById("curso-fecha").value = today;

  const monthSelect = document.getElementById("res-month");
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  months.forEach((m, i) => {
    const o = document.createElement("option");
    o.value = String(i + 1);
    o.textContent = m;
    monthSelect.appendChild(o);
  });
  document.getElementById("res-year").value = new Date().getFullYear();
  monthSelect.value = String(new Date().getMonth() + 1);

  function ensureDeleteModal(){
    if(document.getElementById("delete-service-modal")) return;
    const modal = document.createElement("div");
    modal.id = "delete-service-modal";
    modal.className = "modal-backdrop hidden";
    modal.innerHTML = `
      <div class="modal-card">
        <h3>Eliminar servicio</h3>
        <p class="small">Esta accion dara de baja el registro. Debes indicar el motivo.</p>
        <label class="small">Motivo obligatorio
          <textarea id="delete-reason-input" maxlength="300" placeholder="Ej: carga duplicada, error de fecha, etc."></textarea>
        </label>
        <div id="delete-reason-error" class="small warning hidden"></div>
        <div id="delete-reason-loading" class="small hidden">Procesando eliminacion...</div>
        <div class="actions" style="margin-top:10px">
          <button id="delete-cancel-btn" type="button" class="secondary-btn">Cancelar</button>
          <button id="delete-confirm-btn" type="button" class="delete-service-btn">Confirmar eliminacion</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("delete-cancel-btn").addEventListener("click", closeDeleteModal);
    document.getElementById("delete-confirm-btn").addEventListener("click", confirmDeleteService);
    modal.addEventListener("click", (e) => {
      if(e.target === modal) closeDeleteModal();
    });
  }

  function ensureEditModal(){
    if(document.getElementById("edit-service-modal")) return;
    const modal = document.createElement("div");
    modal.id = "edit-service-modal";
    modal.className = "modal-backdrop hidden";
    modal.innerHTML = `
      <div class="modal-card">
        <h3>Editar servicio</h3>
        <p class="small">Actualiza los datos y deja motivo obligatorio para auditoria.</p>
        <label class="small">Subtipo
          <input id="edit-subtipo-input" type="text" maxlength="120" />
        </label>
        <label class="small">Fecha
          <input id="edit-fecha-input" type="date" />
        </label>
        <label class="small">Horas
          <input id="edit-horas-input" type="number" min="0.5" step="0.5" />
        </label>
        <label class="small">Observaciones
          <input id="edit-observaciones-input" type="text" maxlength="250" />
        </label>
        <label class="small">Motivo de la edicion (obligatorio)
          <textarea id="edit-reason-input" maxlength="300" placeholder="Ej: error de carga de horas o fecha"></textarea>
        </label>
        <div id="edit-reason-error" class="small warning hidden"></div>
        <div id="edit-reason-loading" class="small hidden">Procesando actualizacion...</div>
        <div class="actions" style="margin-top:10px">
          <button id="edit-cancel-btn" type="button" class="secondary-btn">Cancelar</button>
          <button id="edit-confirm-btn" type="button">Guardar cambios</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("edit-cancel-btn").addEventListener("click", closeEditModal);
    document.getElementById("edit-confirm-btn").addEventListener("click", confirmEditService);
    modal.addEventListener("click", (e) => {
      if(e.target === modal) closeEditModal();
    });
  }

  function openDeleteModal(serviceId){
    if(state.deletingService) return;
    state.pendingDeleteId = serviceId;
    ensureDeleteModal();
    const modal = document.getElementById("delete-service-modal");
    const input = document.getElementById("delete-reason-input");
    const error = document.getElementById("delete-reason-error");
    const loading = document.getElementById("delete-reason-loading");
    const confirmBtn = document.getElementById("delete-confirm-btn");
    const cancelBtn = document.getElementById("delete-cancel-btn");
    input.value = "";
    error.textContent = "";
    error.classList.add("hidden");
    loading.classList.add("hidden");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirmar eliminacion";
    cancelBtn.disabled = false;
    input.disabled = false;
    modal.classList.remove("hidden");
    input.focus();
  }

  function closeDeleteModal(){
    if(state.deletingService) return;
    const modal = document.getElementById("delete-service-modal");
    if(modal) modal.classList.add("hidden");
    state.pendingDeleteId = null;
  }

  function openEditModal(serviceId){
    if(state.editingService) return;
    const service = state.servicesById[serviceId];
    if(!service) return;
    state.pendingEditId = serviceId;
    ensureEditModal();
    const modal = document.getElementById("edit-service-modal");
    const subtipoInput = document.getElementById("edit-subtipo-input");
    const fechaInput = document.getElementById("edit-fecha-input");
    const horasInput = document.getElementById("edit-horas-input");
    const obsInput = document.getElementById("edit-observaciones-input");
    const reasonInput = document.getElementById("edit-reason-input");
    const error = document.getElementById("edit-reason-error");
    const loading = document.getElementById("edit-reason-loading");
    const confirmBtn = document.getElementById("edit-confirm-btn");
    const cancelBtn = document.getElementById("edit-cancel-btn");

    subtipoInput.value = service.subtipo || "";
    fechaInput.value = service.fecha_iso || "";
    horasInput.value = String(service.horas || "");
    obsInput.value = service.observaciones || "";
    reasonInput.value = "";
    error.textContent = "";
    error.classList.add("hidden");
    loading.classList.add("hidden");
    confirmBtn.disabled = false;
    cancelBtn.disabled = false;
    subtipoInput.disabled = false;
    fechaInput.disabled = false;
    horasInput.disabled = false;
    obsInput.disabled = false;
    reasonInput.disabled = false;
    modal.classList.remove("hidden");
    reasonInput.focus();
  }

  function closeEditModal(){
    if(state.editingService) return;
    const modal = document.getElementById("edit-service-modal");
    if(modal) modal.classList.add("hidden");
    state.pendingEditId = null;
  }

  async function confirmDeleteService(){
    if(state.deletingService) return;
    const serviceId = state.pendingDeleteId;
    const input = document.getElementById("delete-reason-input");
    const error = document.getElementById("delete-reason-error");
    const loading = document.getElementById("delete-reason-loading");
    const confirmBtn = document.getElementById("delete-confirm-btn");
    const cancelBtn = document.getElementById("delete-cancel-btn");
    const reason = (input.value || "").trim();
    if(!reason){
      error.textContent = "Debes colocar un motivo para eliminar.";
      error.classList.remove("hidden");
      return;
    }
    if(reason.length < 5){
      error.textContent = "El motivo debe tener al menos 5 caracteres.";
      error.classList.remove("hidden");
      return;
    }
    state.deletingService = true;
    error.classList.add("hidden");
    loading.classList.remove("hidden");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Eliminando...";
    cancelBtn.disabled = true;
    input.disabled = true;

    try {
      const res = await api("deleteService", { token: auth.token, id: serviceId, reason });
      if(!res.ok){
        error.textContent = "No se pudo eliminar: " + (res.error || "sin detalle");
        error.classList.remove("hidden");
        return;
      }
      state.deletingService = false;
      closeDeleteModal();
      await loadServices();
      await loadSummary();
    } finally {
      state.deletingService = false;
      loading.classList.add("hidden");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirmar eliminacion";
      cancelBtn.disabled = false;
      input.disabled = false;
    }
  }

  async function confirmEditService(){
    if(state.editingService) return;
    const serviceId = state.pendingEditId;
    if(!serviceId){
      return;
    }
    const subtipoInput = document.getElementById("edit-subtipo-input");
    const fechaInput = document.getElementById("edit-fecha-input");
    const horasInput = document.getElementById("edit-horas-input");
    const obsInput = document.getElementById("edit-observaciones-input");
    const reasonInput = document.getElementById("edit-reason-input");
    const error = document.getElementById("edit-reason-error");
    const loading = document.getElementById("edit-reason-loading");
    const confirmBtn = document.getElementById("edit-confirm-btn");
    const cancelBtn = document.getElementById("edit-cancel-btn");

    const reason = (reasonInput.value || "").trim();
    if(!reason){
      error.textContent = "Debes colocar un motivo para editar.";
      error.classList.remove("hidden");
      return;
    }
    if(reason.length < 5){
      error.textContent = "El motivo debe tener al menos 5 caracteres.";
      error.classList.remove("hidden");
      return;
    }
    const fecha = (fechaInput.value || "").trim();
    const horas = Number(horasInput.value || 0);
    if(!fecha){
      error.textContent = "Debes indicar una fecha valida.";
      error.classList.remove("hidden");
      return;
    }
    if(horas <= 0){
      error.textContent = "Las horas deben ser mayores a 0.";
      error.classList.remove("hidden");
      return;
    }

    state.editingService = true;
    error.classList.add("hidden");
    loading.classList.remove("hidden");
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    subtipoInput.disabled = true;
    fechaInput.disabled = true;
    horasInput.disabled = true;
    obsInput.disabled = true;
    reasonInput.disabled = true;

    try {
      const res = await withButtonLoading(
        confirmBtn,
        () => api("updateService", {
          token: auth.token,
          id: serviceId,
          subtipo: (subtipoInput.value || "").trim(),
          fecha,
          horas,
          observaciones: (obsInput.value || "").trim(),
          reason
        }),
        "Guardando..."
      );
      if(!res.ok){
        error.textContent = "No se pudo actualizar: " + (res.error || "sin detalle");
        error.classList.remove("hidden");
        return;
      }
      state.editingService = false;
      closeEditModal();
      await loadServices();
      await loadSummary();
    } finally {
      state.editingService = false;
      loading.classList.add("hidden");
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      subtipoInput.disabled = false;
      fechaInput.disabled = false;
      horasInput.disabled = false;
      obsInput.disabled = false;
      reasonInput.disabled = false;
    }
  }

  async function loadServices(){
    servicesListEl.innerHTML = "";
    const res = await api("getUserServices", { token: auth.token, legajo: auth.legajo });
    if(!res.ok) return servicesListEl.textContent = "Error cargando servicios: " + (res.error || "sin detalle");
    if(!res.services || res.services.length === 0) return servicesListEl.textContent = "No hay servicios registrados.";

    const activeServices = res.services.filter(s => !s.voided);
    state.servicesById = {};
    activeServices.forEach((s) => { state.servicesById[s.id] = s; });
    if(activeServices.length === 0) return servicesListEl.textContent = "No hay servicios activos (todos fueron eliminados).";

    const t = document.createElement("table");
    t.style.minWidth = "860px";
    t.innerHTML = `<thead><tr style="text-align:left"><th>ID</th><th>Tipo</th><th>Subtipo</th><th>Fecha</th><th>Horas</th><th>Obs</th><th>Acciones</th></tr></thead>`;
    const body = document.createElement("tbody");

    activeServices.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.id)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.tipo)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.subtipo || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.fecha_display || s.fecha_iso || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.horas)}</td>
                      <td style="padding:6px;border-top:1px solid #eee">${escapeHtml(s.observaciones || "")}</td>
                      <td style="padding:6px;border-top:1px solid #eee">
                        <button class="edit-service-btn open-edit-service-btn" data-id="${escapeHtml(s.id)}">Editar</button>
                        <button class="delete-service-btn open-delete-service-btn" data-id="${escapeHtml(s.id)}">Eliminar</button>
                      </td>`;
      body.appendChild(tr);
    });

    t.appendChild(body);
    servicesListEl.appendChild(t);
  }

  async function loadSummary(triggerBtn = null){
    const year = Number(document.getElementById("res-year").value);
    const month = Number(document.getElementById("res-month").value);
    summaryOutputEl.textContent = "Cargando...";
    const summaryCall = () => api("getMonthlySummary", { token: auth.token, legajo: auth.legajo, year, month });
    const res = triggerBtn
      ? await withButtonLoading(triggerBtn, summaryCall, "Calculando...")
      : await summaryCall();
    if(!res.ok){
      summaryOutputEl.textContent = "Error: " + (res.error || "sin detalle");
      return;
    }

    const total_ip = Number(res.total_ip || 0);
    const total_cursos = Number(res.total_cursos || 0);
    const total_consumed = Number(res.total_consumed || (total_ip + total_cursos));
    const course_allocation = Number(res.course_allocation || 0);
    const course_excess = Number(res.course_excess || Math.max(0, total_cursos - course_allocation));
    const recargo_disponible = Number(res.recargo_disponible ?? res.recargo_effective ?? Math.max(0, 40 - total_consumed));

    summaryOutputEl.innerHTML = `
      <strong>Año:</strong> ${res.year}  <strong>Mes:</strong> ${res.month} <br/>
      <strong>Total IP:</strong> ${total_ip} h <br/>
      <strong>Total Cursos:</strong> ${total_cursos} h (curso asignado: ${course_allocation} h, excedente: ${course_excess} h) <br/>
      <strong>Total consumido:</strong> ${total_consumed} h <br/>
      <strong id="recargo-label">Recargo disponible:</strong> ${recargo_disponible} h <br/>
      <strong>Detalle:</strong> ${escapeHtml(JSON.stringify(res.detalle))}
    `;

    const base = 40;
    document.getElementById("label-ip").textContent = `${total_ip} / ${base} h`;
    document.getElementById("label-curso").textContent = `${total_cursos} / ${base} h`;
    document.getElementById("label-total").textContent = `${total_consumed} / ${base} h`;

    document.getElementById("bar-ip").style.width = Math.min(100, (total_ip / base) * 100) + "%";
    document.getElementById("bar-curso").style.width = Math.min(100, (total_cursos / base) * 100) + "%";
    document.getElementById("bar-total").style.width = Math.min(100, (total_consumed / base) * 100) + "%";

    if(recargo_disponible <= 0){
      const recargoLabel = document.getElementById("recargo-label");
      if(recargoLabel) recargoLabel.classList.add("warning");
      const note = document.createElement("div");
      note.className = "warning";
      note.style.marginTop = "8px";
      note.textContent = "ATENCION: Se supero o se completo el cupo mensual de 40 horas.";
      summaryOutputEl.appendChild(note);
    }
  }

  async function loadSuggestions(){
    userSuggestionsEl.textContent = "Cargando...";
    const res = await api("getUserSuggestions", { token: auth.token });
    if(!res.ok) return userSuggestionsEl.textContent = "Error: " + (res.error || "sin detalle");
    if(!res.suggestions || res.suggestions.length === 0) return userSuggestionsEl.textContent = "No tenes sugerencias.";

    userSuggestionsEl.innerHTML = "";
    res.suggestions.forEach((s) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      const rowIndex = Number(s.rowIndex || 0);
      const seen = s.visto_por_target
        ? `(Leida: ${s.visto_at ? escapeHtml(new Date(s.visto_at).toLocaleString()) : ""})`
        : `<button data-row="${rowIndex}" class="mark-read-btn">Marcar leida</button>`;
      div.innerHTML = `
        <strong>De:</strong> ${escapeHtml(s.nombre_autor)} ${escapeHtml(s.apellido_autor)} (${escapeHtml(s.legajo_autor)})
        - <em>${escapeHtml(new Date(s.timestamp).toLocaleString())}</em><br/>
        <div style="margin-top:6px">${escapeHtml(s.mensaje)}</div>
        <div style="margin-top:6px" class="small">${seen}</div>
      `;
      userSuggestionsEl.appendChild(div);
    });
  }

  async function submitService(tipo){
    const isIp = tipo === "IP";
    const btn = document.getElementById(isIp ? "btn-add-ip" : "btn-add-curso");
    const subtipoEl = document.getElementById(isIp ? "ip-subtipo" : "curso-subtipo");
    const fechaEl = document.getElementById(isIp ? "ip-fecha" : "curso-fecha");
    const horasEl = document.getElementById(isIp ? "ip-horas" : "curso-horas");
    const obsEl = document.getElementById(isIp ? "ip-obs" : "curso-obs");
    const msgEl = document.getElementById(isIp ? "msg-add-ip" : "msg-add-curso");

    msgEl.textContent = "";
    const payload = {
      token: auth.token,
      legajo: auth.legajo,
      tipo,
      subtipo: subtipoEl.value.trim(),
      fecha: fechaEl.value,
      horas: Number(horasEl.value) || 0,
      observaciones: obsEl.value.trim(),
      device: "web"
    };
    if(!payload.fecha || payload.horas <= 0){
      msgEl.textContent = "Completa fecha y horas correctamente.";
      return;
    }
    try{
      const res = await withButtonLoading(
        btn,
        () => api("addService", payload),
        "Guardando..."
      );
      if(!res.ok){
        msgEl.textContent = "Error al registrar: " + (res.error || "sin detalle");
        return;
      }
      msgEl.textContent = isIp ? "Horas IP registradas correctamente." : "Curso registrado correctamente.";
      subtipoEl.value = "";
      horasEl.value = "4";
      obsEl.value = "";
      await loadServices();
      await loadSummary();
    } catch(err){
      msgEl.textContent = "Error de conexion: " + String(err);
    }
  }

  document.getElementById("btn-add-ip").addEventListener("click", () => submitService("IP"));
  document.getElementById("btn-add-curso").addEventListener("click", () => submitService("CURSO"));
  document.getElementById("btn-get-summary").addEventListener("click", (e) => loadSummary(e.currentTarget));

  document.addEventListener("click", async (e) => {
    const target = e.target;
    if(target.classList.contains("mark-read-btn")){
      const res = await api("markSuggestionRead", { token: auth.token, rowIndex: target.dataset.row });
      if(!res.ok) return alert("Error: " + (res.error || "sin detalle"));
      await loadSuggestions();
      return;
    }
    if(target.classList.contains("open-delete-service-btn")){
      openDeleteModal(target.dataset.id || "");
      return;
    }
    if(target.classList.contains("open-edit-service-btn")){
      openEditModal(target.dataset.id || "");
    }
  });

  await loadServices();
  await loadSummary();
  await loadSuggestions();
});

