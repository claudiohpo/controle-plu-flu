export type DateInfo = {
  dateFormatted: string; // "DD-MM-YYYY"
  dateISO: string;       // full ISO (UTC)
  rawInput?: any;
} | null;

/**
 * Normaliza várias formas de entrada de data e retorna:
 *  - dateFormatted: "DD-MM-YYYY" (string)
 *  - dateISO: ISO string (UTC) gerada a partir de um horário local seguro (meio-dia)
 *
 * Aceita:
 *  - "YYYY-MM-DD" (input date)
 *  - ISO com hora "2025-09-08T12:00:00Z"
 *  - timestamp numérico
 */
export function normalizeDateToServer(input: any): DateInfo {
  if (input == null || input === '') return null;

  // se já for no formato yyyy-mm-dd (sem hora)
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yyyyS, mmS, ddS] = input.split('-');
    const yyyy = Number(yyyyS), mm = Number(mmS), dd = Number(ddS);
    if (!yyyy || !mm || !dd) return null;
    // cria Date local no meio-dia para evitar shift de timezone
    const localNoon = new Date(yyyy, mm - 1, dd, 12, 0, 0);
    const dateISO = localNoon.toISOString();
    const dateFormatted = `${String(dd).padStart(2,'0')}-${String(mm).padStart(2,'0')}-${yyyy}`;
    return { dateFormatted, dateISO, rawInput: input };
  }

  // outros formatos (ISO com hora, timestamp, Date)
  let d: Date;
  if (typeof input === 'number') d = new Date(input);
  else if (input instanceof Date) d = input;
  else d = new Date(String(input));

  if (Number.isNaN(d.getTime())) return null;

  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth() + 1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const dateFormatted = `${dd}-${mm}-${yyyy}`;
  const dateISO = d.toISOString();
  return { dateFormatted, dateISO, rawInput: input };
}
