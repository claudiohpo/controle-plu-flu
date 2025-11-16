const doFetch = (url, opts = {}) => {
  if (typeof fetchWithUser === "function") return fetchWithUser(url, opts);
  return fetch(url, opts);
};

function showFullText(text) {
  // versão simples e compatível com mobile - substitua por modal custom se quiser
  if (!text) return;
  alert(text);
}

// formata para "DD-MM-AAAA"
function formatDate(input) {
  if (!input) return "";

  if (typeof input === "string" && /^\d{2}-\d{2}-\d{4}$/.test(input)) {
    return input;
  }

  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yyyy, mm, dd] = input.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }

  let d;
  if (input instanceof Date) d = input;
  else if (typeof input === "number") d = new Date(input);
  else d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return String(input);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// converte para YYYY-MM-DD (value aceitável para input[type=date])
function toInputDate(input) {
  if (!input) return "";

  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input))
    return input;

  if (typeof input === "string" && /^\d{2}-\d{2}-\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  let d;
  if (input instanceof Date) d = input;
  else if (typeof input === "number") d = new Date(input);
  else d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function extractId(item) {
  const id = item && item._id;
  if (!id && item && item.id) return String(item.id);
  if (typeof id === "string") return id;
  if (id && typeof id === "object") {
    if (id.$oid) return id.$oid;
    if (typeof id.toString === "function") {
      try {
        const s = id.toString();
        if (s && s !== "[object Object]") return s;
      } catch (e) {}
    }
  }
  return JSON.stringify(id);
}

function showEmpty(tbody, colCount = 7) {
  // ajustado para 7 colunas (conforme tabela)
  tbody.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = colCount;
  td.style.textAlign = "center";
  td.textContent = "Nenhum registro encontrado.";
  tr.appendChild(td);
  tbody.appendChild(tr);
}

let recordsData = []; // armazena todos os registros recebidos do backend

/* ------------------ Controles de mês (estado + helpers) ------------------ */

// estado do mês atualmente exibido (iniciado no mês atual, dia 1)
let currentMonthDate = new Date();
currentMonthDate.setDate(1);

// parse robusto de várias formas de data que seu backend pode trazer
function parseToDate(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  // se já é Date
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  // se número (timestamp)
  if (typeof raw === "number") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  // string: YYYY-MM-DD
  if (typeof raw === "string") {
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [yyyy, mm, dd] = s.split("-");
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split("-");
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
    // fallback: tenta Date constructor (pode aceitar ISO com hora)
    const d2 = new Date(s);
    return isNaN(d2.getTime()) ? null : d2;
  }
  return null;
}

function formatMonthDisplay(d) {
  const months = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro"
  ];
  if (!d || !(d instanceof Date)) return "";
  const m = d.getMonth();
  const y = d.getFullYear();
  return months[m].charAt(0).toUpperCase() + months[m].slice(1) + " " + y;
}

/* ----- renderização da tabela a partir de um array (reaproveita sua lógica) ----- */
function renderRowsFromArray(dataArray) {
  const tbody = document.querySelector("#table-register tbody");
  if (!tbody) {
    console.error('Elemento "#table-register tbody" não encontrado no DOM.');
    return;
  }
  tbody.innerHTML = "";

  if (!dataArray || dataArray.length === 0) {
    showEmpty(tbody, 7); // mantém 7 colunas
    return;
  }

  const frag = document.createDocumentFragment();

  dataArray.forEach((item) => {
    const tr = document.createElement("tr");

    // radio/select
    const tdRadio = document.createElement("td");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selecionar";
    radio.value = extractId(item);
    tdRadio.appendChild(radio);
    tr.appendChild(tdRadio);

    // Data
    const dateTd = document.createElement("td");
    dateTd.className = "col-date";
    const rawDate =
      item.date ?? item.data ?? item.createdAt ?? item.horario ?? "";
    dateTd.textContent = rawDate ? formatDate(rawDate) : "";
    dateTd.title = dateTd.textContent || "";
    tr.appendChild(dateTd);

    // Nivel manhã
    const nivelManhaTd = document.createElement("td");
    nivelManhaTd.className = "col-num";
    nivelManhaTd.textContent =
      typeof item.nivelManha === "number"
        ? item.nivelManha.toFixed(2)
        : item.nivelManha ?? "";
    nivelManhaTd.title = nivelManhaTd.textContent || "";
    tr.appendChild(nivelManhaTd);

    // Nivel tarde
    const nivelTardeTd = document.createElement("td");
    nivelTardeTd.className = "col-num";
    nivelTardeTd.textContent =
      typeof item.nivelTarde === "number"
        ? item.nivelTarde.toFixed(2)
        : item.nivelTarde ?? "";
    nivelTardeTd.title = nivelTardeTd.textContent || "";
    tr.appendChild(nivelTardeTd);

    // Chuva (mm)
    const chuvaMMTd = document.createElement("td");
    chuvaMMTd.className = "col-num";
    chuvaMMTd.textContent =
      typeof item.chuvaMM === "number"
        ? item.chuvaMM.toFixed(1)
        : item.chuvaMM ?? "";
    chuvaMMTd.title = chuvaMMTd.textContent || "";
    tr.appendChild(chuvaMMTd);

    // Duração (hh:mm)
    const duracaoTd = document.createElement("td");
    duracaoTd.className = "col-dur";
    if (item.duracaoHoras != null || item.duracaoMinutos != null) {
      const h =
        item.duracaoHoras != null
          ? String(item.duracaoHoras).padStart(2, "0")
          : "00";
      const m =
        item.duracaoMinutos != null
          ? String(item.duracaoMinutos).padStart(2, "0")
          : "00";
      duracaoTd.textContent = `${h}:${m}`;
    } else {
      duracaoTd.textContent = "";
    }
    duracaoTd.title = duracaoTd.textContent || "";
    tr.appendChild(duracaoTd);

    // Tipo
    const tipoChuvaTd = document.createElement("td");
    tipoChuvaTd.className = "col-tipo";
    tipoChuvaTd.textContent = item.tipoChuva ?? "";
    tipoChuvaTd.title = tipoChuvaTd.textContent || "";
    tr.appendChild(tipoChuvaTd);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

function normalizeToNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const normalized = Number(trimmed.replace(",", "."));
    return Number.isFinite(normalized) ? normalized : null;
  }
  return null;
}

function calculateMonthlyStats(dataArray) {
  const rainValues = [];
  const morningValues = [];
  const afternoonValues = [];

  dataArray.forEach((item) => {
    const rain = normalizeToNumber(item.chuvaMM);
    if (rain !== null) rainValues.push(rain);

    const morning = normalizeToNumber(item.nivelManha);
    if (morning !== null) morningValues.push(morning);

    const afternoon = normalizeToNumber(item.nivelTarde);
    if (afternoon !== null) afternoonValues.push(afternoon);
  });

  const totalRain = rainValues.reduce((sum, value) => sum + value, 0);
  const rainyDays = rainValues.filter((value) => value >= 1).length;
  const rainMax = rainValues.length ? Math.max(...rainValues) : null;

  const morningMin = morningValues.length ? Math.min(...morningValues) : null;
  const morningMax = morningValues.length ? Math.max(...morningValues) : null;
  const afternoonMin = afternoonValues.length
    ? Math.min(...afternoonValues)
    : null;
  const afternoonMax = afternoonValues.length
    ? Math.max(...afternoonValues)
    : null;

  return {
    totalRain,
    rainyDays,
    rainMax,
    morningMin,
    morningMax,
    afternoonMin,
    afternoonMax,
  };
}

function formatNumeric(value, decimals, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(decimals)}${suffix}`;
}

function updateMonthlySummary(dataArray) {
  const summaryEl = document.getElementById("monthly-summary");
  if (!summaryEl) return;

  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    summaryEl.innerHTML =
      '<p class="summary-empty">Sem registros para este mês.</p>';
    return;
  }

  const stats = calculateMonthlyStats(dataArray);

  const rainTotalText = formatNumeric(stats.totalRain, 1, " mm");
  const rainMaxText = formatNumeric(stats.rainMax, 1, " mm");
  const morningRange = `mín ${formatNumeric(stats.morningMin, 2, " m")} / máx ${formatNumeric(stats.morningMax, 2, " m")}`;
  const afternoonRange = `mín ${formatNumeric(stats.afternoonMin, 2, " m")} / máx ${formatNumeric(stats.afternoonMax, 2, " m")}`;

  summaryEl.innerHTML = `
    <h3>Resumo do mês</h3>
    <ul>
      <li><span>Total de chuva:</span> <strong>${rainTotalText}</strong></li>
      <li><span>Dias com chuva &gt;= 1.0 mm:</span> <strong>${stats.rainyDays}</strong></li>
      <li><span>Chuva máxima:</span> <strong>${rainMaxText}</strong></li>
      <li><span>Nível do rio (Manhã):</span> <strong>${morningRange}</strong></li>
      <li><span>Nível do rio (Tarde):</span> <strong>${afternoonRange}</strong></li>
    </ul>
  `;
}

/* ----- render da tabela filtrada pelo mês atual (preserva ordem original de recordsData) ----- */
function renderTableForMonth(monthDate) {
  if (!Array.isArray(recordsData)) {
    renderRowsFromArray([]);
    updateMonthlySummary([]);
    return;
  }
  const targetYear = monthDate.getFullYear();
  const targetMonth = monthDate.getMonth();

  // filtro que preserva ordem do array original
  const filtered = recordsData.filter((item) => {
    const raw =
      item.date ?? item.data ?? item.createdAt ?? item.horario ?? null;
    const d = parseToDate(raw);
    if (!d) return false;
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  renderRowsFromArray(filtered);
  updateMonthlySummary(filtered);
}

/* ----- inicializa controles do mês (botões) ----- */
function initMonthControls() {
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");
  const todayBtn = document.getElementById("today-month");
  const display = document.getElementById("current-month-display");

  function updateDisplay() {
    if (display) display.textContent = formatMonthDisplay(currentMonthDate);
  }

  // ações dos botões
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
      updateDisplay();
      renderTableForMonth(currentMonthDate);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      updateDisplay();
      renderTableForMonth(currentMonthDate);
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      currentMonthDate = new Date();
      currentMonthDate.setDate(1);
      updateDisplay();
      renderTableForMonth(currentMonthDate);
    });
  }

  // inicializa texto e render (se já houver recordsData será filtrado; se não, loadRecords fará a primeira render)
  updateDisplay();
  renderTableForMonth(currentMonthDate);
}

/* ----- nova versão de loadRecords: só busca e guarda, e delega render a renderTableForMonth ----- */
async function loadRecords() {
  try {
    const res = await doFetch("/api/records");
    if (!res.ok) {
      let errText = res.statusText;
      try {
        const errBody = await res.json();
        if (errBody && errBody.error) errText = errBody.error;
      } catch (_) {}
      throw new Error("Falha ao carregar: " + errText);
    }

    const raw = await res.json();
    const data = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.data)
      ? raw.data
      : Array.isArray(raw.records)
      ? raw.records
      : [];

    recordsData = data; // mantém array para edição/exclusão/etc.

    // renderiza o mês atual (manterá a ordenação original do array retornado)
    renderTableForMonth(currentMonthDate);
  } catch (err) {
    console.error("Erro carregando registros:", err);
    alert("Erro ao carregar registros: " + (err.message || err));
  }
}

/* ------------------ Modal de edição: abrir / preencher / salvar ------------------ */

function openEditModal(item) {
  if (!item) return;
  const modal = document.getElementById("edit-modal");
  if (!modal) {
    console.error("Modal de edição não encontrado (#edit-modal).");
    return;
  }

  const editIdEl = document.getElementById("edit-id");
  if (editIdEl) editIdEl.value = extractId(item);

  const editDateEl = document.getElementById("edit-date");
  if (editDateEl)
    editDateEl.value = toInputDate(
      item.date ?? item.data ?? item.createdAt ?? item.horario ?? ""
    );

  const el = (id) => document.getElementById(id);

  if (el("edit-nivelManha"))
    el("edit-nivelManha").value =
      item.nivelManha != null ? item.nivelManha : "";
  if (el("edit-nivelTarde"))
    el("edit-nivelTarde").value =
      item.nivelTarde != null ? item.nivelTarde : "";
  if (el("edit-chuvaMM"))
    el("edit-chuvaMM").value = item.chuvaMM != null ? item.chuvaMM : "";

  if (el("edit-duracaoHoras"))
    el("edit-duracaoHoras").value =
      item.duracaoHoras != null ? item.duracaoHoras : "";
  if (el("edit-duracaoMinutos"))
    el("edit-duracaoMinutos").value =
      item.duracaoMinutos != null ? item.duracaoMinutos : "";

  const tipoSelect = document.getElementById("edit-tipoChuva");
  const tipoValRaw = item.tipoChuva ?? "";
  let matched = false;
  if (tipoSelect && tipoValRaw !== "") {
    const tipoVal = String(tipoValRaw).toLowerCase();
    for (let i = 0; i < tipoSelect.options.length; i++) {
      const opt = tipoSelect.options[i];
      const val = (opt.value || "").toLowerCase();
      const txt = (opt.text || "").toLowerCase();
      if (val === tipoVal || txt === tipoVal) {
        tipoSelect.selectedIndex = i;
        matched = true;
        break;
      }
    }
  }
  if (tipoSelect && !matched) tipoSelect.value = "";

  modal.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    const first = document.getElementById("edit-date");
    if (first) first.focus();
  }, 80);
}

function closeEditModal() {
  const modal = document.getElementById("edit-modal");
  if (modal) modal.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  const frm = document.getElementById("edit-form");
  if (frm) frm.reset();
}

/* ------------------ DOM ready: inicializações (load, botões, modais) ------------------ */

document.addEventListener("DOMContentLoaded", () => {
  // inicializa controles do mês e carrega registros
  initMonthControls();
  loadRecords();

  // editar / excluir - seleciona radio e usa recordsData para abrir modal
  const btnEditar = document.querySelector(".btn.editar");
  const btnExcluir = document.querySelector(".btn.excluir");

  if (btnEditar) {
    btnEditar.addEventListener("click", async () => {
      const selected = document.querySelector(
        'input[name="selecionar"]:checked'
      );
      if (!selected) return alert("Selecione um registro para editar");
      const id = selected.value;
      const item = recordsData.find((r) => extractId(r) === id);
      if (!item) {
        try {
          const res = await doFetch(`/api/records/${encodeURIComponent(id)}`);
          if (res.ok) {
            const body = await res.json();
            const single =
              body && typeof body === "object" && !Array.isArray(body)
                ? body
                : Array.isArray(body) && body[0]
                ? body[0]
                : null;
            if (single) return openEditModal(single);
          }
        } catch (e) {
          console.error("Erro buscando registro único:", e);
        }
        return alert("Registro não encontrado para edição.");
      }
      openEditModal(item);
    });
  }

  if (btnExcluir) {
    btnExcluir.addEventListener("click", async () => {
      const selected = document.querySelector(
        'input[name="selecionar"]:checked'
      );
      if (!selected) return alert("Selecione um registro para excluir.");
      const id = selected.value;
      if (!confirm("Confirmar exclusão?")) return;

      try {
        const res = await doFetch(`/api/records/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          let errText = res.statusText;
          try {
            const errBody = await res.json();
            if (errBody && errBody.error) errText = errBody.error;
          } catch (e) {}
          throw new Error(errText);
        }
        alert("Registro excluído!");
        // recarrega todos os registros e re-renderiza mês atual
        await loadRecords();
      } catch (err) {
        console.error("Erro ao excluir:", err);
        alert("Erro ao excluir: " + (err.message || err));
      }
    });
  }

  // modal editar: botões e submit
  const editForm = document.getElementById("edit-form");
  const cancelBtn = document.getElementById("cancel-edit");
  const editModal = document.getElementById("edit-modal");

  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeEditModal();
    });
  }

  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idEl = document.getElementById("edit-id");
      const id = idEl ? idEl.value : null;
      if (!id) return alert("ID do registro ausente.");
      const payload = {};

      const dateValEl = document.getElementById("edit-date");
      const dateVal = dateValEl ? dateValEl.value : "";
      if (dateVal) payload.date = dateVal;

      const nmEl = document.getElementById("edit-nivelManha");
      const ntEl = document.getElementById("edit-nivelTarde");
      const chuvaEl = document.getElementById("edit-chuvaMM");
      const tipoEl = document.getElementById("edit-tipoChuva");

      const nm = nmEl ? nmEl.value : "";
      const nt = ntEl ? ntEl.value : "";
      const chuva = chuvaEl ? chuvaEl.value : "";
      const tipo = tipoEl ? tipoEl.value : "";

      const ehEl = document.getElementById("edit-duracaoHoras");
      const emEl = document.getElementById("edit-duracaoMinutos");
      const eh = ehEl ? ehEl.value : undefined;
      const em = emEl ? emEl.value : undefined;

      if (nm !== "") payload.nivelManha = Number(nm);
      if (nt !== "") payload.nivelTarde = Number(nt);
      if (chuva !== "") payload.chuvaMM = Number(chuva);
      if (tipo !== "") payload.tipoChuva = tipo;

      if (eh !== undefined && String(eh).trim() !== "") {
        const v = Number(eh);
        if (!Number.isInteger(v) || v < 0 || v > 23)
          return alert("Horas inválidas (0-23).");
        payload.duracaoHoras = v;
      }

      if (em !== undefined && String(em).trim() !== "") {
        const v2 = Number(em);
        if (!Number.isInteger(v2) || v2 < 0 || v2 > 59)
          return alert("Minutos inválidos (0-59).");
        payload.duracaoMinutos = v2;
      }

      if (Object.keys(payload).length === 0)
        return alert("Nenhuma alteração informada.");

      try {
        const res = await doFetch(`/api/records/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let errText = res.statusText;
          try {
            const errBody = await res.json();
            if (errBody && errBody.error) errText = errBody.error;
          } catch (e) {}
          throw new Error(errText);
        }

        alert("Registro atualizado!");
        closeEditModal();
        // recarrega os registros para manter consistência e re-renderiza mês atual
        await loadRecords();
      } catch (err) {
        console.error("Erro ao enviar edição:", err);
        alert("Erro ao editar: " + (err.message || err));
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("edit-modal");
      if (modal && modal.getAttribute("aria-hidden") === "false")
        closeEditModal();
    }
  });
});

/* ------------------ Gerar PDF (modal + lógica) ------------------ */

// Helpers para PDF (reaproveitar lógica já existente)
function formatDuration(item) {
  const hasHours = item && item.duracaoHoras != null;
  const hasMinutes = item && item.duracaoMinutos != null;

  const h = hasHours ? Number(item.duracaoHoras) : null;
  const m = hasMinutes ? Number(item.duracaoMinutos) : null;

  const hIsValid = h !== null && !Number.isNaN(h);
  const mIsValid = m !== null && !Number.isNaN(m);

  if (!hIsValid && !mIsValid) return "";

  const bothZero = (hIsValid ? h === 0 : true) && (mIsValid ? m === 0 : true);
  if (bothZero) return "";

  const hh = hIsValid ? String(h).padStart(2, "0") : "00";
  const mm = mIsValid ? String(m).padStart(2, "0") : "00";
  return `${hh}:${mm}`;
}

function getDateForRow(item) {
  if (!item) return "";
  const candidate =
    (item.date !== undefined && item.date !== null ? item.date : null) ||
    (item.data !== undefined && item.data !== null ? item.data : null) ||
    (item.createdAt !== undefined && item.createdAt !== null ? item.createdAt : null) ||
    (item.horario !== undefined && item.horario !== null ? item.horario : null) ||
    "";
  return formatDate(candidate);
}

function toDisplayDateSlash(input) {
  if (!input) return "";
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yyyy, mm, dd] = input.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  if (typeof input === "string" && /^\d{2}-\d{2}-\d{4}$/.test(input)) {
    return input.replace(/-/g, "/");
  }
  const d = new Date(input);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return String(input);
}

function toFileDateHyphen(input) {
  if (!input) return "";
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yyyy, mm, dd] = input.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  if (typeof input === "string" && /^\d{2}-\d{2}-\d{4}$/.test(input)) {
    return input;
  }
  const d = new Date(input);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return String(input).replace(/\//g, "-");
}

document.addEventListener("DOMContentLoaded", () => {
  // elementos do modal
  const pdfModal = document.getElementById("pdf-modal");
  const pdfForm = document.getElementById("pdf-form");
  const btnPdfOpen = document.querySelector(".btn.pdf"); // botão "Gerar PDF" na página
  const btnPdfCancel = document.getElementById("pdf-cancel");
  const btnPdfGenerate = document.getElementById("pdf-generate");
  const inputStart = document.getElementById("pdf-start");
  const inputEnd = document.getElementById("pdf-end");

  function openPdfModal() {
    if (!pdfModal) {
      console.error("[PDF] pdfModal não encontrado no DOM.");
      return;
    }
    pdfModal.setAttribute("aria-hidden", "false");
    pdfModal.style.display = "flex";
    if (inputStart) inputStart.focus();
  }

  function closePdfModal() {
    if (!pdfModal) return;
    pdfModal.setAttribute("aria-hidden", "true");
    pdfModal.style.display = "none";
    if (pdfForm) pdfForm.reset();
  }

  if (btnPdfOpen) {
    btnPdfOpen.addEventListener("click", (e) => {
      e.preventDefault();
      openPdfModal();
    });
  }
  if (btnPdfCancel) {
    btnPdfCancel.addEventListener("click", (e) => {
      e.preventDefault();
      closePdfModal();
    });
  }

  if (pdfModal) {
    pdfModal.addEventListener("click", (e) => {
      if (e.target === pdfModal) {
        closePdfModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (pdfModal && pdfModal.getAttribute("aria-hidden") === "false")
        closePdfModal();
    }
  });

  async function generatePdfHandler() {
    if (!inputStart || !inputEnd)
      return alert("Inputs do modal não encontrados");
    const start = inputStart.value;
    const end = inputEnd.value;
    if (!start || !end) return alert("Escolha as datas de início e fim.");
    if (start > end)
      return alert("A data inicial não pode ser posterior à data final.");

    try {
      // solicita os dados ao backend (ajuste: endpoint api/records aceita start & end)
      const qs = `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(
        end
      )}`;
      const res = await doFetch(`/api/records${qs}`);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || res.statusText);
      }
      const data = await res.json();

      // monta tabela (idêntica à vista no HTML — cabeçalhos em duas linhas)
      const container = document.createElement("div");
      container.style.padding = "12px";

      const title = document.createElement("h3");
      title.textContent = `Marcações de: ${toDisplayDateSlash(
        start
      )} a ${toDisplayDateSlash(end)}`;
      title.style.textAlign = "center";
      title.style.marginBottom = "16px";
      title.style.fontWeight = "bold";
      title.style.fontSize = "18px";

      container.appendChild(title);

      const table = document.createElement("table");
      table.className = "pdf-table";
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.fontSize = "12px";
      table.style.textAlign = "center";

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th rowspan="2" style="border:1px solid #ccc;padding:6px;text-align:center;">Data</th>
          <th colspan="2" style="border:1px solid #ccc;padding:6px;text-align:center;">Nível do Rio <span class="unidade">(metros)</span></th>
          <th rowspan="2" style="border:1px solid #ccc;padding:6px;text-align:center;">Chuva<br><span class="unidade">(mm)</span></th>
          <th rowspan="2" style="border:1px solid #ccc;padding:6px;text-align:center;">Duração<br><span class="unidade">(hh:mm)</span></th>
          <th rowspan="2" style="border:1px solid #ccc;padding:6px;text-align:center;">Fenômenos</th>
        </tr>
        <tr>
          <th style="border:1px solid #ccc;padding:6px;text-align:center;">Manhã</th>
          <th style="border:1px solid #ccc;padding:6px;text-align:center;">Tarde</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");

      // ordena asc por date para leitura natural
      data.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
      });

      const stats = calculateMonthlyStats(data);

      data.forEach((item) => {
        const tr = document.createElement("tr");

        // Data
        const tdDate = document.createElement("td");
        tdDate.style.border = "1px solid #ccc";
        tdDate.style.padding = "6px";
        tdDate.style.textAlign = "center";
        tdDate.textContent = getDateForRow(item);
        tr.appendChild(tdDate);

        // Manhã
        const tdManha = document.createElement("td");
        tdManha.style.border = "1px solid #ccc";
        tdManha.style.padding = "6px";
        tdManha.style.textAlign = "center";
        tdManha.textContent =
          item.nivelManha != null ? String(item.nivelManha) : "";
        tr.appendChild(tdManha);

        // Tarde
        const tdTarde = document.createElement("td");
        tdTarde.style.border = "1px solid #ccc";
        tdTarde.style.padding = "6px";
        tdTarde.style.textAlign = "center";
        tdTarde.textContent =
          item.nivelTarde != null ? String(item.nivelTarde) : "";
        tr.appendChild(tdTarde);

        // Chuva
        const tdChuva = document.createElement("td");
        tdChuva.style.border = "1px solid #ccc";
        tdChuva.style.padding = "6px";
        tdChuva.style.textAlign = "center";
        tdChuva.textContent = item.chuvaMM != null ? String(item.chuvaMM) : "";
        tr.appendChild(tdChuva);

        // Duração
        const tdDur = document.createElement("td");
        tdDur.style.border = "1px solid #ccc";
        tdDur.style.padding = "6px";
        tdDur.style.textAlign = "center";
        tdDur.textContent = formatDuration(item);
        tr.appendChild(tdDur);

        // Fenômenos
        const tdFen = document.createElement("td");
        tdFen.style.border = "1px solid #ccc";
        tdFen.style.padding = "6px";
        tdFen.style.textAlign = "center";
        tdFen.textContent = item.tipoChuva || "";
        tr.appendChild(tdFen);

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      container.appendChild(table);
      document.body.appendChild(container); // precisa estar no DOM para html2pdf capturar

      // opções do html2pdf (A4 retrato)
      const opt = {
        margin: 10 / 25.4, // 10mm
        filename: `Marcações_${toFileDateHyphen(start)}_a_${toFileDateHyphen(
          end
        )}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
      };

      // gera e salva

            const summary = document.createElement("div");
            summary.className = "monthly-summary pdf-summary";

            const rainTotalText = formatNumeric(stats.totalRain, 1, " mm");
            const rainMaxText = formatNumeric(stats.rainMax, 1, " mm");
            const morningRange = `mín ${formatNumeric(stats.morningMin, 2, " m")} / máx ${
              formatNumeric(stats.morningMax, 2, " m")
            }`;
            const afternoonRange = `mín ${formatNumeric(
              stats.afternoonMin,
              2,
              " m"
            )} / máx ${formatNumeric(stats.afternoonMax, 2, " m")}`;

            summary.innerHTML = `
              <h3>Resumo do período</h3>
              <ul>
                <li><span>Total de chuva:</span> <strong>${rainTotalText}</strong></li>
                <li><span>Dias com chuva &gt;= 1.0 mm:</span> <strong>${stats.rainyDays}</strong></li>
                <li><span>Chuva máxima:</span> <strong>${rainMaxText}</strong></li>
                <li><span>Nível do rio (Manhã):</span> <strong>${morningRange}</strong></li>
                <li><span>Nível do rio (Tarde):</span> <strong>${afternoonRange}</strong></li>
              </ul>
            `;

            container.appendChild(summary);
      await html2pdf().set(opt).from(container).save();

      // limpa
      document.body.removeChild(container);
      closePdfModal();
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF: " + (err.message || err));
    }
  }

  if (btnPdfGenerate) {
    btnPdfGenerate.addEventListener("click", (e) => {
      e.preventDefault();
      generatePdfHandler();
    });
  }
});
