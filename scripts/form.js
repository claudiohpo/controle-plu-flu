document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = document.getElementById('data').value;
  const nivelManha = parseFloat(document.getElementById('nivelManha').value) || 0;
  const nivelTarde = parseFloat(document.getElementById('nivelTarde').value) || 0;
  const chuvaMM = parseFloat(document.getElementById('chuvaMM').value) || 0;
  const tipoChuva = document.getElementById('tipoChuva').value;

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
  } catch (error) {
    alert('Erro: ' + error.message);
  }
});
