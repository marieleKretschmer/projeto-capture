const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

// Funções para gerar tokens
function generateAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });
}

exports.getUser = async (req, res) => {
  try {
    const usuario_id = req.user?.id;
    if (!usuario_id) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const result = await pool.query(
      'SELECT nome, email FROM usuario WHERE id = $1',
      [usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const user = result.rows[0];
    res.status(200).json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ message: 'Erro ao buscar dados do usuário.' });
  }
};

exports.register = async (req, res) => {
  const { email, senha, nome } = req.body;

  try {
    const existingUser = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este email.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const insertResult = await pool.query(
      'INSERT INTO usuario (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
      [nome, email, hashedPassword]
    );

    const user = insertResult.rows[0];
    const { accessToken, refreshToken } = await generateAndStoreTokens(user);

    res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};


// Login
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(senha, user.senha);

    if (!validPassword) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    const { accessToken, refreshToken } = await generateAndStoreTokens(user);

    res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

// Refresh Token
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh Token não enviado' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Verifica se o refresh token existe no banco
    const result = await pool.query('SELECT * FROM tokens WHERE token = $1', [refreshToken]);

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Refresh Token inválido' });
    }

    const newAccessToken = generateAccessToken({ id: payload.id, email: payload.email });

    res.status(201).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: 'Refresh Token inválido ou expirado' });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  const result = await pool.query('SELECT * FROM tokens WHERE token = $1', [refreshToken]);
  if (result.rows.length === 0) return res.status(400).json({ message: 'Refresh Token inválido' });

  try {
    await pool.query('DELETE FROM tokens WHERE token = $1', [refreshToken]);
    res.status(201).json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer logout' });
  }
};

const generateAndStoreTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await pool.query('INSERT INTO tokens (usuario_id, token) VALUES ($1, $2)', [
    user.id,
    refreshToken,
  ]);

  return { accessToken, refreshToken };
};

exports.getProfile = async (req, res) => {
  try {
    const usuario_id = req.user?.id;
    const result = await pool.query('SELECT nome, email FROM usuario WHERE id = $1', [usuario_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar perfil.' });
  }
};

exports.deleteAccount = async (req, res) => {
  const usuario_id = req.user?.id;

  try {
    // Exclui tokens relacionados
    await pool.query('DELETE FROM tokens WHERE usuario_id = $1', [usuario_id]);

    // Exclui registros relacionados
    await pool.query('DELETE FROM registroocr WHERE usuario_id = $1', [usuario_id]);

    // Exclui usuário
    await pool.query('DELETE FROM usuario WHERE id = $1', [usuario_id]);

    res.status(200).json({ message: 'Conta excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir conta.' });
  }
};

exports.updateProfile = async (req, res) => {
  const usuario_id = req.user?.id;
  const { nome, senhaAtual, novaSenha } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM usuario WHERE id = $1', [usuario_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = userResult.rows[0];

    // Verifica e atualiza senha, se for o caso
    if (senhaAtual && novaSenha) {
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }

      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      await pool.query('UPDATE usuario SET senha = $1 WHERE id = $2', [novaSenhaHash, usuario_id]);
    }

    // Atualiza nome
    if (nome) {
      await pool.query('UPDATE usuario SET nome = $1 WHERE id = $2', [nome, usuario_id]);
    }

    res.status(200).json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar perfil.' });
  }
};