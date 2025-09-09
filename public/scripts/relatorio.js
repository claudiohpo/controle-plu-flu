const doFetch = (url, opts = {}) => {
  if (typeof fetchWithUser === 'function') return fetchWithUser(url, opts);
  return fetch(url, opts);
}

// formata para "DD-MM-AAAA"
// - se a entrada já for "DD-MM-YYYY" retorna direto
// - se for "YYYY-MM-DD" converte para DD-MM-YYYY
// - se for ISO com hora, usa Date() e extrai data LOCAL
function formatDate(input) {
  if (!input) return '';

  // já está no formato DD-MM-AAAA?
  if (typeof input === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(input)) {
    return input;
  }

  // se for YYYY-MM-DD -> converte sem usar new Date
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yyyy, mm, dd] = input.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  // se for ISO com hora (contém "T"), ou outro formato aceito pelo Date
  let d;
  if (input instanceof Date) d = input;
  else if (typeof input === 'number') d = new Date(input);
  else d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return String(input);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// converte várias formas para "YYYY-MM-DD" (value aceito pelo input[type=date])
// aceita: "YYYY-MM-DD", "DD-MM-YYYY", ISO com hora, Date object
function toInputDate(input) {
  if (!input) return '';

  // se já for YYYY-MM-DD
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  // se for DD-MM-YYYY -> converte para YYYY-MM-DD
  if (typeof input === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  // caso contrário, tenta Date() e extrai DATA LOCAL
  let d;
  if (input instanceof Date) d = input;
  else if (typeof input === 'number') d = new Date(input);
  else d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function extractId(item) {
  const id = item && item._id;
  if (!id && item && item.id) return String(item.id);
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object') {
    if (id.$oid) return id.$oid;
    if (typeof id.toString === 'function') {
      try {
        const s = id.toString();
        if (s && s !== '[object Object]') return s;
      } catch (e) {}
    }
  }
  return JSON.stringify(id);
}

function showEmpty(tbody, colCount = 6) {
  tbody.innerHTML = '';
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = colCount;
  td.style.textAlign = 'center';
  td.textContent = 'Nenhum registro encontrado.';
  tr.appendChild(td);
  tbody.appendChild(tr);
}

let recordsData = [];

async function loadRecords() {
  try {
    const res = await doFetch('/api/records');
    if (!res.ok) {
      let errText = res.statusText;
      try {
        const errBody = await res.json();
        if (errBody && errBody.error) errText = errBody.error;
      } catch (_) {}
      throw new Error('Falha ao carregar: ' + errText);
    }

    const raw = await res.json();
    const data = Array.isArray(raw) ? raw : (Array.isArray(raw.data) ? raw.data : (Array.isArray(raw.records) ? raw.records : []));

    recordsData = data;

    const tbody = document.querySelector('#table-register tbody');
    if (!tbody) {
      console.error('Elemento "#table-register tbody" não encontrado no DOM.');
      return;
    }
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      showEmpty(tbody);
      return;
    }

    const frag = document.createDocumentFragment();

    data.forEach(item => {
      const tr = document.createElement('tr');

      const tdRadio = document.createElement('td');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'selecionar';
      radio.value = extractId(item);
      tdRadio.appendChild(radio);
      tr.appendChild(tdRadio);

      const dateTd = document.createElement('td');
      // PRIORIDADE: dateFormatted (já DD-MM-YYYY). Caso não exista, tenta date/ISO.
      const rawDate = item.dateFormatted ?? item.date ?? item.data ?? item.createdAt ?? item.horario ?? '';
      dateTd.textContent = rawDate ? formatDate(rawDate) : '';
      tr.appendChild(dateTd);

      const nivelManhaTd = document.createElement('td');
      nivelManhaTd.textContent = typeof item.nivelManha === 'number' ? item.nivelManha.toFixed(2) : (item.nivelManha ?? '');
      tr.appendChild(nivelManhaTd);

      const nivelTardeTd = document.createElement('td');
      nivelTardeTd.textContent = typeof item.nivelTarde === 'number' ? item.nivelTarde.toFixed(2) : (item.nivelTarde ?? '');
      tr.appendChild(nivelTardeTd);

      const chuvaMMTd = document.createElement('td');
      chuvaMMTd.textContent = typeof item.chuvaMM === 'number' ? item.chuvaMM.toFixed(1) : (item.chuvaMM ?? '');
      tr.appendChild(chuvaMMTd);

      const tipoChuvaTd = document.createElement('td');
      tipoChuvaTd.textContent = item.tipoChuva ?? '';
      tr.appendChild(tipoChuvaTd);

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);

  } catch (err) {
    console.error('Erro carregando registros:', err);
    alert('Erro ao carregar registros: ' + (err.message || err));
  }
}

/* ===== Modal: abrir / preencher / salvar ===== */

function openEditModal(item) {
  if (!item) return;
  const modal = document.getElementById('edit-modal');

  document.getElementById('edit-id').value = extractId(item);
  document.getElementById('edit-date').value = toInputDate(item.dateFormatted ?? item.date ?? item.data ?? item.createdAt ?? item.horario ?? '');
  document.getElementById('edit-nivelManha').value = (item.nivelManha != null) ? item.nivelManha : '';
  document.getElementById('edit-nivelTarde').value = (item.nivelTarde != null) ? item.nivelTarde : '';
  document.getElementById('edit-chuvaMM').value = (item.chuvaMM != null) ? item.chuvaMM : '';

  const tipoSelect = document.getElementById('edit-tipoChuva');
  const tipoValRaw = item.tipoChuva ?? '';
  let matched = false;
  if (tipoValRaw !== '') {
    const tipoVal = String(tipoValRaw).toLowerCase();
    for (let i = 0; i < tipoSelect.options.length; i++) {
      const opt = tipoSelect.options[i];
      const val = (opt.value || '').toLowerCase();
      const txt = (opt.text || '').toLowerCase();
      if (val === tipoVal || txt === tipoVal) { tipoSelect.selectedIndex = i; matched = true; break; }
    }
  }
  if (!matched) tipoSelect.value = '';

  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    const first = document.getElementById('edit-date');
    if (first) first.focus();
  }, 80);
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  const frm = document.getElementById('edit-form');
  if (frm) frm.reset();
}

document.addEventListener('DOMContentLoaded', () => {
  loadRecords();

  const btnEditar = document.querySelector('.btn.editar');
  const btnExcluir = document.querySelector('.btn.excluir');

  if (btnEditar) {
    btnEditar.addEventListener('click', async () => {
      const selected = document.querySelector('input[name="selecionar"]:checked');
      if (!selected) return alert('Selecione um registro para editar');
      const id = selected.value;
      const item = recordsData.find(r => extractId(r) === id);
      if (!item) {
        try {
          const res = await doFetch(`/api/records/${encodeURIComponent(id)}`);
          if (res.ok) {
            const body = await res.json();
            const single = (body && typeof body === 'object' && !Array.isArray(body)) ? body : (Array.isArray(body) && body[0]) ? body[0] : null;
            if (single) return openEditModal(single);
          }
        } catch (e) {
          console.error('Erro buscando registro único:', e);
        }
        return alert('Registro não encontrado para edição.');
      }
      openEditModal(item);
    });
  }

  if (btnExcluir) {
    btnExcluir.addEventListener('click', async () => {
      const selected = document.querySelector('input[name="selecionar"]:checked');
      if (!selected) return alert('Selecione um registro para excluir.');
      const id = selected.value;
      if (!confirm('Confirmar exclusão?')) return;

      try {
        const res = await doFetch(`/api/records/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) {
          let errText = res.statusText;
          try { const errBody = await res.json(); if (errBody && errBody.error) errText = errBody.error; } catch(e) {}
          throw new Error(errText);
        }
        alert('Registro excluído!');
        loadRecords();
      } catch (err) {
        console.error('Erro ao excluir:', err);
        alert('Erro ao excluir: ' + (err.message || err));
      }
    });
  }

  const editForm = document.getElementById('edit-form');
  const cancelBtn = document.getElementById('cancel-edit');
  const editModal = document.getElementById('edit-modal');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeEditModal();
    });
  }

  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-id').value;
      const payload = {};

      const dateVal = document.getElementById('edit-date').value;
      if (dateVal) payload.date = dateVal; // envia YYYY-MM-DD

      const nm = document.getElementById('edit-nivelManha').value;
      const nt = document.getElementById('edit-nivelTarde').value;
      const chuva = document.getElementById('edit-chuvaMM').value;
      const tipo = document.getElementById('edit-tipoChuva').value;

      if (nm !== '') payload.nivelManha = Number(nm);
      if (nt !== '') payload.nivelTarde = Number(nt);
      if (chuva !== '') payload.chuvaMM = Number(chuva);
      if (tipo !== '') payload.tipoChuva = tipo;

      if (Object.keys(payload).length === 0) return alert('Nenhuma alteração informada.');

      try {
        const res = await doFetch(`/api/records/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          let errText = res.statusText;
          try { const errBody = await res.json(); if (errBody && errBody.error) errText = errBody.error; } catch(e) {}
          throw new Error(errText);
        }

        alert('Registro atualizado!');
        closeEditModal();
        loadRecords();
      } catch (err) {
        console.error('Erro ao enviar edição:', err);
        alert('Erro ao editar: ' + (err.message || err));
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('edit-modal');
      if (modal && modal.getAttribute('aria-hidden') === 'false') closeEditModal();
    }
  });
});
