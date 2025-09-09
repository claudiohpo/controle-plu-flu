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

function showEmpty(tbody, colCount = 8) { // ajustado para 8 colunas
  tbody.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = colCount;
  td.style.textAlign = "center";
  td.textContent = "Nenhum registro encontrado.";
  tr.appendChild(td);
  tbody.appendChild(tr);
}

let recordsData = [];

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

    recordsData = data;

    const tbody = document.querySelector("#table-register tbody");
    if (!tbody) {
      console.error('Elemento "#table-register tbody" não encontrado no DOM.');
      return;
    }
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      showEmpty(tbody);
      return;
    }

    const frag = document.createDocumentFragment();

    data.forEach((item) => {
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
        item.dateFormatted ??
        item.date ??
        item.data ??
        item.createdAt ??
        item.horario ??
        "";
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

      // // Observações (opcional, pode ser observacoes ou observations)
      // const obsText = item.observacoes ?? item.observations ?? "";
      // const obsTd = document.createElement("td");
      // obsTd.className = "col-obs";
      // obsTd.textContent = obsText;
      // obsTd.title = obsText || "";

      // Torna clicável no mobile/pequenas telas se o texto for longo
      // if (obsText && obsText.length > 40) {
      //   obsTd.setAttribute("role", "clickable");
      //   obsTd.style.cursor = "pointer";
      //   obsTd.addEventListener("click", () => showFullText(obsText));
      // }
      // tr.appendChild(obsTd);

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  } catch (err) {
    console.error("Erro carregando registros:", err);
    alert("Erro ao carregar registros: " + (err.message || err));
  }
}

/* ===== Modal: abrir / preencher / salvar ===== */

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
      item.dateFormatted ??
        item.date ??
        item.data ??
        item.createdAt ??
        item.horario ??
        ""
    );

  const el = (id) => document.getElementById(id);

  if (el("edit-nivelManha")) el("edit-nivelManha").value = item.nivelManha != null ? item.nivelManha : "";
  if (el("edit-nivelTarde")) el("edit-nivelTarde").value = item.nivelTarde != null ? item.nivelTarde : "";
  if (el("edit-chuvaMM")) el("edit-chuvaMM").value = item.chuvaMM != null ? item.chuvaMM : "";

  if (el("edit-duracaoHoras")) el("edit-duracaoHoras").value = item.duracaoHoras != null ? item.duracaoHoras : "";
  if (el("edit-duracaoMinutos")) el("edit-duracaoMinutos").value = item.duracaoMinutos != null ? item.duracaoMinutos : "";

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

document.addEventListener("DOMContentLoaded", () => {
  loadRecords();

  const btnEditar = document.querySelector(".btn.editar");
  const btnExcluir = document.querySelector(".btn.excluir");

  if (btnEditar) {
    btnEditar.addEventListener("click", async () => {
      const selected = document.querySelector('input[name="selecionar"]:checked');
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
      const selected = document.querySelector('input[name="selecionar"]:checked');
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
        loadRecords();
      } catch (err) {
        console.error("Erro ao excluir:", err);
        alert("Erro ao excluir: " + (err.message || err));
      }
    });
  }

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
        loadRecords();
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
