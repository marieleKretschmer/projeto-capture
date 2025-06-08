const Tesseract = require('tesseract.js');
const path = require('path');
const pool = require('../db');
const fs = require('fs/promises');

exports.processImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhuma imagem enviada' });
  }
  const imagePath = path.resolve(req.file.path);
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'por');

    const cleanedText = text
      .replace(/-\n/g, '')    // Remove hifens seguidos de quebra de linha
      .replace(/\n/g, ' ')    // Substitui todas quebras de linha por espaço
      .replace(/\s+/g, ' ')   // Reduz múltiplos espaços para um único espaço
      .trim();
    const delta = {
      ops: cleanedText
        .split('\n')
        .map((linha) => ({ insert: linha + '\n' }))
    };
    return res.json({ delta });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao processar imagem', error: err.message });
  } finally {
    await fs.unlink(imagePath);
  }
};

exports.listOcr = async (req, res) => {
  try {
    const usuario_id = req.user?.id;
    const { page = 1, limit = 10, busca = '' } = req.query;

    if (!usuario_id || usuario_id === 0) {
      return res.status(400).json({ message: 'ID do usuário inválido ou não fornecido.' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [usuario_id];
    let whereClause = `WHERE usuario_id = $1`;

    if (busca.trim() !== '') {
      params.push(`%${busca.toLowerCase()}%`);
      whereClause += ` AND (LOWER(titulo) LIKE $2 OR LOWER(texto_extraido) LIKE $2)`;
    }

    const registrosQuery = `
      SELECT * FROM registroocr
      ${whereClause}
      ORDER BY data_criacao DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit);
    params.push(offset);

    const registros = await pool.query(registrosQuery, params);

    const totalParams = [usuario_id];
    let totalWhere = `WHERE usuario_id = $1`;

    if (busca.trim() !== '') {
      totalParams.push(`%${busca.toLowerCase()}%`);
      totalWhere += ` AND (LOWER(titulo) LIKE $2 OR LOWER(texto_extraido) LIKE $2)`;
    }

    const totalQuery = `SELECT COUNT(*) FROM registroocr ${totalWhere}`;
    const total = await pool.query(totalQuery, totalParams);

    res.status(200).json({
      registros: registros.rows,
      total: parseInt(total.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar registros OCR' });
  }
};


exports.saveOCR = async (req, res) => {
  try {
    const usuario_id = req.user?.id;

    if (!usuario_id || usuario_id === 0) {
      return res.status(400).json({ message: 'ID do usuário inválido ou não fornecido.' });
    }

    const { texto_extraido, comentario, titulo } = req.body;

    if (!texto_extraido || !titulo) {
      return res.status(400).json({ message: 'Texto extraído e título são obrigatórios.' });
    }

    await pool.query(
      'INSERT INTO registroocr (usuario_id, texto_extraido, comentario, titulo) VALUES ($1, $2, $3, $4)',
      [usuario_id, texto_extraido, comentario, titulo]
    );

    res.status(201).json({ message: 'Registro OCR salvo com sucesso.' });

  } catch (err) {
    console.error('Erro ao salvar registro OCR:', err);
    res.status(500).json({ message: 'Erro ao salvar registro OCR' });
  }
};

exports.updateOCR = async (req, res) => {
  try {
    const usuario_id = req.user?.id;
    const { id } = req.params;
    const { texto_extraido, comentario, titulo } = req.body;

    if (!usuario_id || usuario_id === 0) {
      return res.status(400).json({ message: 'ID do usuário inválido ou não fornecido.' });
    }

    if (!texto_extraido || !titulo) {
      return res.status(400).json({ message: 'Texto extraído e título são obrigatórios.' });
    }

    const result = await pool.query(
      `UPDATE registroocr 
       SET texto_extraido = $1, comentario = $2, titulo = $3 
       WHERE id = $4 AND usuario_id = $5`,
      [texto_extraido, comentario, titulo, id, usuario_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Registro não encontrado ou não pertence ao usuário.' });
    }

    res.json({ message: 'Registro atualizado com sucesso.' });

  } catch (err) {
    console.error('Erro ao atualizar registro OCR:', err);
    res.status(500).json({ message: 'Erro ao atualizar registro OCR' });
  }
};

exports.getOCRById = async (req, res) => {
  try {
    const usuario_id = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, texto_extraido, comentario, titulo FROM registroocr WHERE id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registro não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar registro OCR por ID:', err);
    res.status(500).json({ message: 'Erro ao buscar registro OCR.' });
  }
};

exports.deleteOCR = async (req, res) => {
  const usuario_id = req.user?.id;
  const id = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM registroocr WHERE id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Registro não encontrado ou não autorizado.' });
    }

    res.status(200).json({ message: 'Registro excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir registro OCR.' });
  }
};

