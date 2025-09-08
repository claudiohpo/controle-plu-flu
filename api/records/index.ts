import { VercelRequest, VercelResponse } from '@vercel/node';
import { getCollection } from '../_lib/mongodb';
import { Document } from 'mongodb';

interface Registro extends Document {
  date: string;         // "YYYY-MM-DD"
  nivelManha: number;
  nivelTarde: number;
  chuvaMM: number;
  tipoChuva: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS básico para dev local
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const collection = await getCollection<Registro>();

    if (req.method === 'GET') {
      const docs = await collection.find().sort({ date: -1, createdAt: -1 }).toArray();
      return res.status(200).json(docs);
    }

    if (req.method === 'POST') {
      const body = req.body as Partial<Registro>;
      if (!body?.date) return res.status(400).json({ error: "Campo 'date' é obrigatório (YYYY-MM-DD)" });

      const doc: Registro = {
        date: body.date,
        nivelManha: Number(body.nivelManha) || 0,
        nivelTarde: Number(body.nivelTarde) || 0,
        chuvaMM: Number(body.chuvaMM) || 0,
        tipoChuva: body.tipoChuva || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(doc);
      const inserted = await collection.findOne({ _id: result.insertedId });
      return res.status(201).json(inserted);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro no endpoint /api/records:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
