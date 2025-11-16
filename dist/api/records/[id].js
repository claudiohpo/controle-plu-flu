"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mongodb_1 = require("../_lib/mongodb");
const mongodb_2 = require("mongodb");
const dateHelpers_1 = require("../_lib/dateHelpers");
async function handler(req, res) {
    try {
        if (!req.query?.id)
            return res.status(400).json({ error: 'ID obrigatório' });
        const _id = new mongodb_2.ObjectId(String(req.query.id));
        const collection = await (0, mongodb_1.getCollection)();
        if (req.method === 'GET') {
            const doc = await collection.findOne({ _id });
            if (!doc)
                return res.status(404).json({ error: 'Registro não encontrado' });
            return res.status(200).json(doc);
        }
        if (req.method === 'PUT') {
            const body = req.body;
            const updateDoc = {};
            if (body.date) {
                // normaliza a data e armazena como Date no campo 'date'
                const dateObj = (0, dateHelpers_1.normalizeDateToServer)(body.date);
                if (!dateObj)
                    return res.status(400).json({ error: 'Formato de data inválido' });
                updateDoc.date = dateObj;
            }
            // Mantém a lógica existente para os outros campos sem alterar comportamento
            if (body.hasOwnProperty('nivelManha')) {
                const val = body.nivelManha;
                updateDoc.nivelManha = val === '' || val === null ? 0 : Number(val) || 0;
            }
            if (body.hasOwnProperty('nivelTarde')) {
                const val = body.nivelTarde;
                updateDoc.nivelTarde = val === '' || val === null ? 0 : Number(val) || 0;
            }
            if (body.hasOwnProperty('chuvaMM')) {
                const val = body.chuvaMM;
                updateDoc.chuvaMM = val === '' || val === null ? 0 : Number(val) || 0;
            }
            if (body.hasOwnProperty('tipoChuva')) {
                // Validação: pode ser string ou array
                let tiposToValidate = [];
                const tipoValue = body.tipoChuva;
                if (Array.isArray(tipoValue)) {
                    tiposToValidate = tipoValue;
                }
                else if (typeof tipoValue === "string") {
                    tiposToValidate = [tipoValue];
                }
                for (const tipo of tiposToValidate) {
                    const TIPOS_PERMITIDOS = ["Chuva", "Trovoada", "Orvalho", "Nevoeiro", "Granizo", "Geada", "Céu Claro", ""];
                    if (!TIPOS_PERMITIDOS.includes(tipo)) {
                        return res.status(400).json({ error: `Tipo de precipitação inválido: "${tipo}"` });
                    }
                }
                updateDoc.tipoChuva = tipoValue || '';
            }
            if (body.hasOwnProperty('duracaoHoras'))
                updateDoc.duracaoHoras = body.duracaoHoras;
            if (body.hasOwnProperty('duracaoMinutos'))
                updateDoc.duracaoMinutos = body.duracaoMinutos;
            updateDoc.updatedAt = new Date();
            const result = await collection.findOneAndUpdate({ _id }, { $set: updateDoc }, { returnDocument: 'after' });
            if (!result.value)
                return res.status(404).json({ error: 'Registro não encontrado' });
            return res.status(200).json(result.value);
        }
        if (req.method === 'DELETE') {
            const result = await collection.deleteOne({ _id });
            if (result.deletedCount === 1)
                return res.status(200).json({ success: true });
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        return res.status(405).json({ error: 'Método não permitido' });
    }
    catch (error) {
        console.error('Erro no endpoint /api/records/[id]:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
