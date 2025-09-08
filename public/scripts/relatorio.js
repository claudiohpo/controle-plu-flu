// async function loadRecords() {
//   try {
//     const res = await fetch('/api/records');
//     if (!res.ok) throw new Error('Falha ao carregar');
//     const data = await res.json();

//     const tbody = document.querySelector('#table-register tbody');
//     tbody.innerHTML = '';

//     data.forEach(item => {
//       const tr = document.createElement('tr');
//       tr.innerHTML = `
//         <td><input type="radio" name="selecionar" value="${item._id}"></td>
//         <td>${item.date ?? ''}</td>
//         <td>${item.nivelManha ?? ''}</td>
//         <td>${item.nivelTarde ?? ''}</td>
//         <td>${item.chuvaMM ?? ''}</td>
//         <td>${item.tipoChuva ?? ''}</td>
//       `;
//       tbody.appendChild(tr);
//     });
//   } catch (err) {
//     console.error(err);
//     alert('Erro ao carregar registros');
//   }
// }

// document.addEventListener('DOMContentLoaded', () => {
//   loadRecords();

//   const btnEditar = document.querySelector('.btn.editar');
//   const btnExcluir = document.querySelector('.btn.excluir');

//   btnEditar.addEventListener('click', async () => {
//     const selected = document.querySelector('input[name="selecionar"]:checked');
//     if (!selected) return alert('Selecione um registro para editar');

//     const id = selected.value;
//     // Exemplo: abre um prompt simples para editar valores (pode trocar por modal)
//     const novoNivelManha = prompt('Novo nível (manhã):');
//     const novoNivelTarde = prompt('Novo nível (tarde):');
//     const novaChuva = prompt('Nova chuva (mm):');
//     const novoTipo = prompt('Novo tipo de precipitação:');

//     const payload = {};
//     if (novoNivelManha !== null) payload.nivelManha = Number(novoNivelManha);
//     if (novoNivelTarde !== null) payload.nivelTarde = Number(novoNivelTarde);
//     if (novaChuva !== null) payload.chuvaMM = Number(novaChuva);
//     if (novoTipo !== null) payload.tipoChuva = novoTipo;

//     if (Object.keys(payload).length === 0) return;

//     const res = await fetch(`/api/records/${id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       return alert('Erro ao editar: ' + (err.error || res.statusText));
//     }
//     alert('Registro atualizado!');
//     loadRecords();
//   });

//   btnExcluir.addEventListener('click', async () => {
//     const selected = document.querySelector('input[name="selecionar"]:checked');
//     if (!selected) return alert('Selecione um registro para excluir.');
//     const id = selected.value;
//     if (!confirm('Confirmar exclusão?')) return;

//     const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       return alert('Erro ao excluir: ' + (err.error || res.statusText));
//     }
//     alert('Registro excluído!');
//     loadRecords();
//   });
// });


// js/relatorio.js — substitua o conteúdo atual por este

// usa fetchWithUser se disponível (preserva compatibilidade com seu projeto)
const doFetch = (url, opts = {}) => {
  if (typeof fetchWithUser === 'function') return fetchWithUser(url, opts);
  return fetch(url, opts);
};

function formatDate(iso) {
  if (!iso) return '';
  // trata objetos Date, strings ISO ou timestamps numéricos
  let d;
  if (iso instanceof Date) d = iso;
  else if (typeof iso === 'number') d = new Date(iso);
  else d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('pt-BR');
}

// tenta extrair um id legível do campo _id (string, { $oid: "..." } ou Object)
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
      } catch (e) {/* ignore */}
    }
  }
  // fallback
  return JSON.stringify(id);
}

// limpa tbody e coloca uma linha "sem dados" que ocupa todas as colunas
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

async function loadRecords() {
  try {
    const res = await doFetch('/api/records');
    if (!res.ok) {
      // tenta ler mensagem de erro do body
      let errText = res.statusText;
      try {
        const errBody = await res.json();
        if (errBody && errBody.error) errText = errBody.error;
      } catch (_) {}
      throw new Error('Falha ao carregar: ' + errText);
    }

    const raw = await res.json();
    // suporte para diferentes shapes: array puro ou { data: [...] } ou { records: [...] }
    const data = Array.isArray(raw) ? raw : (Array.isArray(raw.data) ? raw.data : (Array.isArray(raw.records) ? raw.records : []));

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

    // cria fragmento para renderização eficiente
    const frag = document.createDocumentFragment();

    data.forEach(item => {
      const tr = document.createElement('tr');

      // coluna do radio
      const tdRadio = document.createElement('td');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'selecionar';
      radio.value = extractId(item);
      tdRadio.appendChild(radio);
      tr.appendChild(tdRadio);

      // colunas com segurança (textContent evita XSS)
      const dateTd = document.createElement('td');
      // tenta campos comuns: date, data, createdAt, horario
      const dateVal = item.date ?? item.data ?? item.createdAt ?? item.horario ?? '';
      dateTd.textContent = dateVal ? formatDate(dateVal) : '';
      tr.appendChild(dateTd);

      const nivelManhaTd = document.createElement('td');
      nivelManhaTd.textContent = item.nivelManha ?? '';
      tr.appendChild(nivelManhaTd);

      const nivelTardeTd = document.createElement('td');
      nivelTardeTd.textContent = item.nivelTarde ?? '';
      tr.appendChild(nivelTardeTd);

      const chuvaMMTd = document.createElement('td');
      chuvaMMTd.textContent = item.chuvaMM ?? '';
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

document.addEventListener('DOMContentLoaded', () => {
  loadRecords();

  // pega botões com segurança (se não existir, ignora)
  const btnEditar = document.querySelector('.btn.editar');
  const btnExcluir = document.querySelector('.btn.excluir');

  if (btnEditar) {
    btnEditar.addEventListener('click', async () => {
      const selected = document.querySelector('input[name="selecionar"]:checked');
      if (!selected) return alert('Selecione um registro para editar');

      const id = selected.value;
      const novoNivelManha = prompt('Novo nível (manhã):');
      const novoNivelTarde = prompt('Novo nível (tarde):');
      const novaChuva = prompt('Nova chuva (mm):');
      const novoTipo = prompt('Novo tipo de precipitação:');

      const payload = {};
      if (novoNivelManha !== null) payload.nivelManha = Number(novoNivelManha);
      if (novoNivelTarde !== null) payload.nivelTarde = Number(novoNivelTarde);
      if (novaChuva !== null) payload.chuvaMM = Number(novaChuva);
      if (novoTipo !== null) payload.tipoChuva = novoTipo;

      if (Object.keys(payload).length === 0) return;

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
        loadRecords();
      } catch (err) {
        console.error('Erro ao editar:', err);
        alert('Erro ao editar: ' + (err.message || err));
      }
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
});
