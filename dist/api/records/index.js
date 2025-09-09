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
        if (req.method === 'GET') {
            // ordena por dateISO (se existir) para garantir ordenacao temporal correta
            const docs = await collection.find().sort({ dateISO: -1, createdAt: -1 }).toArray();
            return res.status(200).json(docs);
        }
        if (req.method === 'POST') {
            const body = req.body;
            if (!body?.date)
                return res.status(400).json({ error: "Campo 'date' é obrigatório (YYYY-MM-DD ou ISO)" });
            // normaliza/gera dateFormatted e dateISO
            const dateInfo = (0, dateHelpers_1.normalizeDateToServer)(body.date);
            if (!dateInfo)
                return res.status(400).json({ error: "Formato de data inválido" });
            // 🔹 validação do tipo de precipitação
            if (body.tipoChuva && !TIPOS_PRECIPITACAO.includes(body.tipoChuva)) {
                return res.status(400).json({ error: "Tipo de precipitação inválido" });
            }
            // parse e validação de duração (opcional)
            const duracaoHorasNum = body.duracaoHoras !== undefined && body.duracaoHoras !== null
                ? Number(body.duracaoHoras)
                : undefined;
            const duracaoMinutosNum = body.duracaoMinutos !== undefined && body.duracaoMinutos !== null
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
            const doc = {
                date: body.date,
                dateFormatted: dateInfo.dateFormatted,
                dateISO: dateInfo.dateISO,
                nivelManha: Number(body.nivelManha) || 0,
                nivelTarde: Number(body.nivelTarde) || 0,
                chuvaMM: Number(body.chuvaMM) || 0,
                tipoChuva: body.tipoChuva || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                duracaoHoras: duracaoHorasNum,
                duracaoMinutos: duracaoMinutosNum,
            };
            const result = await collection.insertOne(doc);
            const inserted = await collection.findOne({ _id: result.insertedId });
            return res.status(201).json(inserted);
        }
        return res.status(405).json({ error: 'Método não permitido' });
    }
    catch (error) {
        console.error('Erro no endpoint /api/records:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
