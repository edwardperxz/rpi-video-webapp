const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');
const system = require('./lib/system.js');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);
const app = express();
const port = 3000;

app.use(express.static(__dirname));

// middleware para recibir formularios y JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// API endpoint for server status
app.get('/api/status', async (req, res) => {
    try {
        const statusData = await getServerStatus();
        res.json(statusData);
    } catch (error) {
        console.error('Error getting status data:', error);
        res.status(500).json({ error: 'Failed to get status data' });
    }
});

// Función para obtener el estado del servidor
async function getServerStatus() {
    try {
        const systemData = await system.getRaspberryData();

        let serverIP = 'No disponible';
        try {
            const interfaces = os.networkInterfaces();
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name]) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        serverIP = iface.address;
                        break;
                    }
                }
                if (serverIP !== 'No disponible') break;
            }
        } catch (err) {
            console.error('Error getting IP:', err);
        }

        let osVersion = systemData.system.release;
        try {
            const { stdout } = await execPromise('cat /etc/os-release 2>/dev/null | grep PRETTY_NAME');
            const match = stdout.match(/PRETTY_NAME="([^"]+)"/);
            if (match) osVersion = match[1];
        } catch (err) {
            osVersion = `${systemData.system.platform} ${systemData.system.release}`;
        }

        const services = await getInstalledServices();

        return {
            groupName: 'Grupo #3 - Los Cheveronazos',
            serverIP: serverIP,
            osVersion: osVersion,
            hostname: systemData.system.hostname,
            platform: systemData.system.platform,
            arch: systemData.system.arch,
            uptime: os.uptime(),
            uptimeHuman: systemData.uptime,
            hardware: systemData.system.hardware?.model || 'Desconocido',
            cpuUsage: systemData.cpuUsage,
            cpuTemp: systemData.cpuTemp,
            cpuModel: systemData.cpuModel,
            memory: systemData.memory,
            storage: systemData.storage,
            network: systemData.network,
            gpu: systemData.gpu,
            clock: systemData.clock,
            processes: systemData.processes,
            services: services,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error in getServerStatus:', error);
        throw error;
    }
}

async function getInstalledServices() {
    const services = [
        { name: 'Node.js', command: 'node --version' },
        { name: 'npm', command: 'npm --version' },
        { name: 'Nginx', command: 'nginx -v' },
        { name: 'Git', command: 'git --version' },
        { name: 'curl', command: 'curl --version' },
        { name: 'Python', command: 'python3 --version' }
    ];

    const results = [];

    for (const service of services) {
        try {
            await execPromise(service.command, { timeout: 5000 });
            results.push({
                name: service.name,
                status: 'running',
                installed: true
            });
        } catch (err) {
            // Si falla, el servicio no está instalado o no está disponible
            results.push({
                name: service.name,
                status: 'inactive',
                installed: false
            });
        }
    }

    return results;
}

app.post('/register', (req, res) => {
    console.log('Datos recibidos:', req.body);
    res.status(200).send('✅ Credenciales recibidas correctamente');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});