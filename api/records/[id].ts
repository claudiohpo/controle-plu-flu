import { VercelRequest, VercelResponse } from '@vercel/node';
import { getCollection } from '../_lib/mongodb';
import { ObjectId } from 'mongodb';
import { normalizeDateToServer } from '../_lib/dateHelpers';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const _id = new ObjectId(id);
    const collection = await getCollection();

    if (req.method === 'GET') {
      const doc = await collection.findOne({ _id });
      if (!doc) return res.status(404).json({ error: 'Registro não encontrado' });
      return res.status(200).json(doc);
    }

    if (req.method === 'PUT') {
      const body = req.body as Record<string, unknown>;
      const updateDoc: Record<string, unknown> = {};

      if (body.date) {
        // preserva o valor original e cria dateFormatted/dateISO
        const dateInfo = normalizeDateToServer(body.date);
        if (!dateInfo) return res.status(400).json({ error: 'Formato de data inválido' });
        updateDoc.date = body.date;
        updateDoc.dateFormatted = dateInfo.dateFormatted;
        updateDoc.dateISO = dateInfo.dateISO;
      }

      if (body.nivelManha !== undefined) updateDoc.nivelManha = Number(body.nivelManha);
      if (body.nivelTarde !== undefined) updateDoc.nivelTarde = Number(body.nivelTarde);
      if (body.chuvaMM !== undefined) updateDoc.chuvaMM = Number(body.chuvaMM);
      if (body.tipoChuva !== undefined) {
        if (body.tipoChuva && !TIPOS_PRECIPITACAO.includes(String(body.tipoChuva))) {
          return res.status(400).json({ error: "Tipo de precipitação inválido" });
        }
        updateDoc.tipoChuva = String(body.tipoChuva);
      }

      updateDoc.updatedAt = new Date();

      if (Object.keys(updateDoc).length === 1) { // só updatedAt
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      const result = await collection.findOneAndUpdate(
        { _id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );
      return res.status(200).json(result.value);
    }

    if (req.method === 'DELETE') {
      const result = await collection.deleteOne({ _id });
      if (result.deletedCount === 1) return res.status(200).json({ success: true });
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro no endpoint /api/records/[id]:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
