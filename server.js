const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const system = require('./lib/system.js');

const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// middleware para recibir formularios y JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// API endpoint for system information
app.get('/api/system', async (req, res) => {
    try {
        const data = await system.getRaspberryData();
        res.json(data);
    } catch (error) {
        console.error('Error getting system data:', error);
        res.status(500).json({ error: 'Failed to get system data' });
    }
});

app.post('/register', (req, res) => {
    console.log('Datos recibidos:', req.body);
    res.status(200).send('✅ Credenciales recibidas correctamente');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});