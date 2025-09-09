// seta data padrão no input (usa data LOCAL)
(function setDefaultDateLocal() {
  const dataInput = document.getElementById('data');
  if (!dataInput) return;
  if (dataInput.value) return;
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  dataInput.value = `${yyyy}-${mm}-${dd}`; // "YYYY-MM-DD"
})();

const form = document.getElementById('registroForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {};
    const data = document.getElementById('data')?.value;
    if (!data) return alert('Informe a data.');

    payload.date = data;

    const nm = document.getElementById('nivelManha')?.value;
    if (nm !== undefined && String(nm).trim() !== '') payload.nivelManha = Number(nm);

    const nt = document.getElementById('nivelTarde')?.value;
    if (nt !== undefined && String(nt).trim() !== '') payload.nivelTarde = Number(nt);

    const chuva = document.getElementById('chuvaMM')?.value;
    if (chuva !== undefined && String(chuva).trim() !== '') payload.chuvaMM = Number(chuva);

    const tipo = document.getElementById('tipoChuva')?.value;
    if (tipo !== undefined) payload.tipoChuva = tipo;

    // const obs = document.getElementById('observacoes')?.value;
    // if (obs !== undefined) payload.observacoes = obs;

    // duracao (front validation)
    const duracaoHorasRaw = document.getElementById('duracaoHoras')?.value;
    const duracaoMinutosRaw = document.getElementById('duracaoMinutos')?.value;

    if (duracaoHorasRaw !== undefined && String(duracaoHorasRaw).trim() !== '') {
      const h = Number(duracaoHorasRaw);
      if (!Number.isInteger(h) || h < 0 || h > 23) {
        return alert('Horas inválidas (0-23).');
      }
      payload.duracaoHoras = h;
    }

    if (duracaoMinutosRaw !== undefined && String(duracaoMinutosRaw).trim() !== '') {
      const m = Number(duracaoMinutosRaw);
      if (!Number.isInteger(m) || m < 0 || m > 59) {
        return alert('Minutos inválidos (0-59).');
      }
      payload.duracaoMinutos = m;
    }

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Erro ao salvar registro');
      }
      alert('Registro salvo com sucesso.');
      form.reset();

      // repõe data atual depois do reset
      const dataInput = document.getElementById('data');
      if (dataInput) {
        const hoje = new Date();
        const yyyy = hoje.getFullYear();
        const mm = String(hoje.getMonth() + 1).padStart(2, '0');
        const dd = String(hoje.getDate()).padStart(2, '0');
        dataInput.value = `${yyyy}-${mm}-${dd}`;
      }
    } catch (error) {
      alert('Erro: ' + (error.message || error));
    }
  });
}
