"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDateToServer = normalizeDateToServer;
function normalizeDateToServer(input) {
    if (input == null || input === '')
        return null;
    // aceita "YYYY-MM-DD" (sem hora) e também ISO / Date / timestamp
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [yyyyS, mmS, ddS] = input.split('-');
        const yyyy = Number(yyyyS), mm = Number(mmS), dd = Number(ddS);
        if (!yyyy || !mm || !dd)
            return null;
        // cria Date local no meio-dia para evitar shift de timezone
        const localNoon = new Date(yyyy, mm - 1, dd, 12, 0, 0);
        if (Number.isNaN(localNoon.getTime()))
            return null;
        return localNoon;
    }
    let d;
    if (typeof input === 'number')
        d = new Date(input);
    else if (input instanceof Date)
        d = input;
    else
        d = new Date(String(input));
    if (Number.isNaN(d.getTime()))
        return null;
    return d;
}
