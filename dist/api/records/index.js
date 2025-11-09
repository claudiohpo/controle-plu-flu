"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mongodb_1 = require("../_lib/mongodb");
const dateHelpers_1 = require("../_lib/dateHelpers");
// 🔹 Tipos de precipitação permitidos
const TIPOS_PRECIPITACAO = [
    "Chuva",
    "Trovoada",
    "Orvalho",
    "Nevoeiro",
    "Granizo",
    "Geada",
    "Céu Claro",
    ""
];
async function handler(req, res) {
    try {
        // CORS básico para dev local
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS')
            return res.status(200).end();
        const collection = await (0, mongodb_1.getCollection)();
        // if (req.method === 'GET') {
        //   // ordena por dateISO (se existir) para garantir ordenacao temporal correta
        //   const docs = await collection.find().sort({ date: -1, createdAt: -1 }).toArray();
        //   return res.status(200).json(docs);
        // }
        if (req.method === 'GET') {
            // aceita query params start e end no formato "YYYY-MM-DD" ou ISO
            const query = req.query || {};
            const startRaw = Array.isArray(query.start) ? query.start[0] : query.start;
            const endRaw = Array.isArray(query.end) ? query.end[0] : query.end;
            const filter = {};
            if (startRaw) {
                const startDate = (0, dateHelpers_1.normalizeDateToServer)(startRaw);
                if (!startDate)
                    return res.status(400).json({ error: "Formato de data 'start' inválido" });
                // >= início do dia (normalizeDateToServer já gera um Date válido)
                startDate.setHours(0, 0, 0, 0);
                filter.date = { ...(filter.date || {}), $gte: startDate };
            }
            if (endRaw) {
                const endDateRaw = (0, dateHelpers_1.normalizeDateToServer)(endRaw);
                if (!endDateRaw)
                    return res.status(400).json({ error: "Formato de data 'end' inválido" });
                // para incluir o dia inteiro, ajustamos para 23:59:59.999 do dia
                const endDate = new Date(endDateRaw);
                endDate.setHours(23, 59, 59, 999);
                filter.date = { ...(filter.date || {}), $lte: endDate };
            }
            // se não vierem start/end, retorna tudo (ordenado)
            const docs = await collection.find(filter).sort({ date: -1, createdAt: -1 }).toArray();
            return res.status(200).json(docs);
        }
        if (req.method === 'POST') {
            const body = req.body;
            if (!body?.date)
                return res.status(400).json({ error: "Campo 'date' é obrigatório (YYYY-MM-DD ou ISO)" });
            // normaliza/gera Date para o campo `date`
            const dateObj = (0, dateHelpers_1.normalizeDateToServer)(body.date);
            if (!dateObj)
                return res.status(400).json({ error: "Formato de data inválido" });
            // validação do tipo de precipitação
            if (body.tipoChuva && !TIPOS_PRECIPITACAO.includes(body.tipoChuva)) {
                return res.status(400).json({ error: "Tipo de precipitação inválido" });
            }
            // parse/validação de duracao (se vier)
            const duracaoHorasNum = body.hasOwnProperty("duracaoHoras") && body.duracaoHoras !== "" && body.duracaoHoras !== null
                ? Number(body.duracaoHoras)
                : undefined;
            const duracaoMinutosNum = body.hasOwnProperty("duracaoMinutos") && body.duracaoMinutos !== "" && body.duracaoMinutos !== null
                ? Number(body.duracaoMinutos)
                : undefined;
            if (duracaoHorasNum !== undefined) {
                if (!Number.isInteger(duracaoHorasNum) || duracaoHorasNum < 0 || duracaoHorasNum > 23) {
                    return res.status(400).json({ error: "Campo 'duracaoHoras' inválido (0-23)." });
                }
            }
            if (duracaoMinutosNum !== undefined) {
                if (!Number.isInteger(duracaoMinutosNum) || duracaoMinutosNum < 0 || duracaoMinutosNum > 59) {
                    return res.status(400).json({ error: "Campo 'duracaoMinutos' inválido (0-59)." });
                }
            }
            // Monta objeto $set apenas com campos realmente enviados (evita sobrescrever com vazios)
            const setObj = {};
            // Números: aceitar 0, portanto verificar .hasOwnProperty e != ''
            if (body.hasOwnProperty("nivelManha") && body.nivelManha !== "" && body.nivelManha !== null)
                setObj.nivelManha = Number(body.nivelManha);
            if (body.hasOwnProperty("nivelTarde") && body.nivelTarde !== "" && body.nivelTarde !== null)
                setObj.nivelTarde = Number(body.nivelTarde);
            if (body.hasOwnProperty("chuvaMM") && body.chuvaMM !== "" && body.chuvaMM !== null)
                setObj.chuvaMM = Number(body.chuvaMM);
            // Strings: somente se não-vazias
            if (body.hasOwnProperty("tipoChuva") && typeof body.tipoChuva === "string" && body.tipoChuva.trim() !== "")
                setObj.tipoChuva = body.tipoChuva.trim();
            // Duração (já parseado acima)
            if (duracaoHorasNum !== undefined)
                setObj.duracaoHoras = duracaoHorasNum;
            if (duracaoMinutosNum !== undefined)
                setObj.duracaoMinutos = duracaoMinutosNum;
            // atualiza updatedAt sempre que houver algo para atualizar
            if (Object.keys(setObj).length === 0) {
                // Nenhum campo relevante foi enviado (além da data). Retornar 400 para evitar "atualização vazia".
                return res.status(400).json({ error: "Nenhum campo para atualizar. Envie pelo menos um campo preenchido." });
            }
            setObj.updatedAt = new Date();
            // Campos que só devem ser definidos na criação (setOnInsert)
            const setOnInsert = {
                date: dateObj,
                createdAt: new Date(),
            };
            // Atômico: findOneAndUpdate com upsert para garantir 1 doc por date (melhor junto de índice único)
            const filter = { date: dateObj };
            const result = await collection.findOneAndUpdate(filter, { $set: setObj, $setOnInsert: setOnInsert }, { upsert: true, returnDocument: "after" } // returnDocument:'after' traz doc após atualização/insert
            );
            // result.value contém o documento atualizado/criado
            return res.status(result.lastErrorObject && result.lastErrorObject.upserted ? 201 : 200).json(result.value);
        }
        return res.status(405).json({ error: 'Método não permitido' });
    }
    catch (error) {
        console.error('Erro no endpoint /api/records:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
