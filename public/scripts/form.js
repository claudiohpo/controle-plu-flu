// seta data padrão no input (usa data LOCAL, evita timezone)
(function setDefaultDateLocal() {
  const dataInput = document.getElementById('data');
  if (!dataInput) return;
  if (dataInput.value) return; // não sobrescrever se já tiver valor
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  dataInput.value = `${yyyy}-${mm}-${dd}`; // "YYYY-MM-DD"
})();

document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = document.getElementById('data').value; // "YYYY-MM-DD"
  const nivelManha = parseFloat(document.getElementById('nivelManha').value) || 0;
  const nivelTarde = parseFloat(document.getElementById('nivelTarde').value) || 0;
  const chuvaMM = parseFloat(document.getElementById('chuvaMM').value) || 0;
  const tipoChuva = document.getElementById('tipoChuva').value;

  // envia 'YYYY-MM-DD' ao backend; backend normaliza e cria dateFormatted (DD-MM-YYYY)
  const body = { date: data, nivelManha, nivelTarde, chuvaMM, tipoChuva };

  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao salvar');
    }
    alert('Registro salvo com sucesso!');
    document.getElementById('registroForm').reset();

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
    alert('Erro: ' + error.message);
  }
});
