const express = require('express');
const path = require('path');

// Bind host and port según lo solicitado
const HOST = process.env.HOST || '192.168.33.13';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Habilitar CORS ligero para permitir peticiones desde otros orígenes (por ejemplo, abrir register.html desde otra máquina)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Simple almacenamiento en memoria (solo demo)
const users = [];

app.post('/register', (req, res) => {
  const { username, password, firstName, lastName } = req.body || {};
  if (!username || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Faltan campos: username, password, firstName, lastName son requeridos.' });
  }

  // Validación simple: usuario único
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
  }

  // Guardar (NO usar en producción sin hashing/DB)
  users.push({ username, password, firstName, lastName, createdAt: new Date().toISOString() });
  console.log('Usuario registrado:', username);
  return res.status(201).json({ message: 'Usuario creado' });
});

// Servir archivos estáticos del repositorio (index.html, register.html, styles.css, videos/...)
app.use(express.static(path.join(__dirname, '.')));

app.listen(PORT, HOST, () => {
  console.log(`Servidor estático + API escuchando en http://${HOST}:${PORT}`);
  console.log('Registro POST disponible en /register');
});

// Nota: si el host 192.168.33.13 no está configurado en la máquina, el bind fallará.