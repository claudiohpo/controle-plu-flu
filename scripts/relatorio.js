async function loadRecords() {
  try {
    const res = await fetch('/api/records');
    if (!res.ok) throw new Error('Falha ao carregar');
    const data = await res.json();

    const tbody = document.querySelector('#table-register tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="radio" name="selecionar" value="${item._id}"></td>
        <td>${item.date ?? ''}</td>
        <td>${item.nivelManha ?? ''}</td>
        <td>${item.nivelTarde ?? ''}</td>
        <td>${item.chuvaMM ?? ''}</td>
        <td>${item.tipoChuva ?? ''}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar registros');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadRecords();

  const btnEditar = document.querySelector('.btn.editar');
  const btnExcluir = document.querySelector('.btn.excluir');

  btnEditar.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="selecionar"]:checked');
    if (!selected) return alert('Selecione um registro para editar');

    const id = selected.value;
    // Exemplo: abre um prompt simples para editar valores (pode trocar por modal)
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

    const res = await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert('Erro ao editar: ' + (err.error || res.statusText));
    }
    alert('Registro atualizado!');
    loadRecords();
  });

  btnExcluir.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="selecionar"]:checked');
    if (!selected) return alert('Selecione um registro para excluir.');
    const id = selected.value;
    if (!confirm('Confirmar exclusão?')) return;

    const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert('Erro ao excluir: ' + (err.error || res.statusText));
    }
    alert('Registro excluído!');
    loadRecords();
  });
});
