import { VercelRequest, VercelResponse } from '@vercel/node';
import { getCollection } from '../_lib/mongodb';
import { ObjectId } from 'mongodb';
import { normalizeDateToServer } from '../_lib/dateHelpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!req.query?.id) return res.status(400).json({ error: 'ID obrigatório' });
    const _id = new ObjectId(String(req.query.id));
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
        // normaliza a data e armazena como Date no campo 'date'
        const dateObj = normalizeDateToServer(body.date);
        if (!dateObj) return res.status(400).json({ error: 'Formato de data inválido' });
        updateDoc.date = dateObj;
      }

      // Mantém a lógica existente para os outros campos sem alterar comportamento
      if (body.hasOwnProperty('nivelManha')) {
        const val = (body as any).nivelManha;
        updateDoc.nivelManha = val === '' || val === null ? 0 : Number(val) || 0;
      }
      if (body.hasOwnProperty('nivelTarde')) {
        const val = (body as any).nivelTarde;
        updateDoc.nivelTarde = val === '' || val === null ? 0 : Number(val) || 0;
      }
      if (body.hasOwnProperty('chuvaMM')) {
        const val = (body as any).chuvaMM;
        updateDoc.chuvaMM = val === '' || val === null ? 0 : Number(val) || 0;
      }
      if (body.hasOwnProperty('tipoChuva')) updateDoc.tipoChuva = (body as any).tipoChuva || '';
      if (body.hasOwnProperty('duracaoHoras')) updateDoc.duracaoHoras = (body as any).duracaoHoras;
      if (body.hasOwnProperty('duracaoMinutos')) updateDoc.duracaoMinutos = (body as any).duracaoMinutos;

      updateDoc.updatedAt = new Date();

      const result = await collection.findOneAndUpdate(
        { _id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );

      if (!result.value) return res.status(404).json({ error: 'Registro não encontrado' });
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
