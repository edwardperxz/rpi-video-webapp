const os = require('os');
const { exec } = require('child_process');

function getCpuUsage() {
    return new Promise((resolve) => {
        const start = os.cpus();
        setTimeout(() => {
            const end = os.cpus();
            let idleDiff = 0, totalDiff = 0;
            for (let i = 0; i < start.length; i++) {
                const startCpu = start[i].times;
                const endCpu = end[i].times;
                idleDiff += endCpu.idle - startCpu.idle;
                totalDiff += Object.values(endCpu).reduce((a, b) => a + b, 0) - Object.values(startCpu).reduce((a, b) => a + b, 0);
            }
            const usage = 1 - idleDiff / totalDiff;
            resolve(usage);
        }, 1000);
    });
}

function getCpuTemp() {
    return new Promise((resolve, reject) => {
        exec('cat /sys/class/thermal/thermal_zone0/temp', (err, stdout) => {
            if (err) return reject(err);
            const temp = parseInt(stdout) / 1000;
            resolve(temp);
        });
    });
}

async function getSystemDetails() {
    const baseDetails = {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        release: os.release(),
        uptime: os.uptime(),
        type: os.type()
    };

    const results = await Promise.all([
        // Get Pi model and revision
        new Promise((resolve) => {
            exec('cat /proc/cpuinfo', (err, stdout) => {
                if (err) return resolve(null);
                try {
                    const model = stdout.match(/Model\s*:\s*(.+)/);
                    const revision = stdout.match(/Revision\s*:\s*(.+)/);
                    const serial = stdout.match(/Serial\s*:\s*(.+)/);
                    resolve({
                        model: model ? model[1].trim() : null,
                        revision: revision ? revision[1].trim() : null,
                        serial: serial ? serial[1].trim() : null
                    });
                } catch (e) {
                    resolve(null);
                }
            });
        }),
        // Get firmware version
        new Promise((resolve) => {
            exec('vcgencmd version', (err, stdout) => {
                if (err) return resolve(null);
                resolve(stdout.trim());
            });
        }),
        // Get power state
        new Promise((resolve) => {
            exec('vcgencmd get_throttled', (err, stdout) => {
                if (err) return resolve(null);
                const match = stdout.match(/throttled=(0x[0-9a-fA-F]+)/);
                if (!match) return resolve(null);
                const hex = parseInt(match[1], 16);
                resolve({
                    underVoltage: Boolean(hex & 0x1),
                    armFreqCapped: Boolean(hex & 0x2),
                    throttled: Boolean(hex & 0x4),
                    softTempLimit: Boolean(hex & 0x8),
                    underVoltageOccurred: Boolean(hex & 0x10000),
                    armFreqCappedOccurred: Boolean(hex & 0x20000),
                    throttledOccurred: Boolean(hex & 0x40000),
                    softTempLimitOccurred: Boolean(hex & 0x80000)
                });
            });
        })
    ]);

    return {
        ...baseDetails,
        hardware: results[0],
        firmware: results[1],
        powerState: results[2]
    };
}

async function getMemoryDetails() {
    const baseMemory = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
    };

    const results = await Promise.all([
        // Get swap info
        new Promise((resolve) => {
            exec('free -b', (err, stdout) => {
                if (err) return resolve(null);
                try {
                    const lines = stdout.trim().split('\n');
                    const swapLine = lines.find(l => l.startsWith('Swap:'));
                    if (swapLine) {
                        const [_, total, used, free] = swapLine.split(/\s+/);
                        resolve({
                            total: parseInt(total),
                            used: parseInt(used),
                            free: parseInt(free)
                        });
                    }
                } catch (e) { }
                resolve(null);
            });
        }),
        // Get cached and buffer memory
        new Promise((resolve) => {
            exec('cat /proc/meminfo', (err, stdout) => {
                if (err) return resolve(null);
                try {
                    const cached = stdout.match(/Cached:\s+(\d+)/);
                    const buffers = stdout.match(/Buffers:\s+(\d+)/);
                    resolve({
                        cached: cached ? parseInt(cached[1]) * 1024 : null,
                        buffers: buffers ? parseInt(buffers[1]) * 1024 : null
                    });
                } catch (e) {
                    resolve(null);
                }
            });
        })
    ]);

    return {
        ...baseMemory,
        swap: results[0],
        cached: results[1]?.cached || null,
        buffers: results[1]?.buffers || null
    };
}


function getVoltage() {
    return new Promise((resolve, reject) => {
        exec('vcgencmd measure_volts', (err, stdout) => {
            if (err) return reject(err);
            const match = stdout.match(/volt=([\d.]+)/);
            resolve(match ? parseFloat(match[1]) : null);
        });
    });
}

async function getClockDetails() {
    const results = await Promise.all([
        // ARM core frequency
        new Promise((resolve) => {
            exec('vcgencmd measure_clock arm', (err, stdout) => {
                if (err) return resolve(null);
                const match = stdout.match(/frequency\(\d+\)=(\d+)/);
                resolve(match ? parseInt(match[1]) : null);
            });
        }),
        // CPU Governor
        new Promise((resolve) => {
            exec('cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor', (err, stdout) => {
                if (err) return resolve(null);
                resolve(stdout.trim());
            });
        }),
        // Available frequencies
        new Promise((resolve) => {
            exec('cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_frequencies', (err, stdout) => {
                if (err) return resolve(null);
                const freqs = stdout.trim().split(' ').map(f => parseInt(f));
                resolve(freqs.filter(f => !isNaN(f)));
            });
        }),
        // Min/Max frequencies
        new Promise((resolve) => {
            Promise.all([
                new Promise(r => {
                    exec('cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_min_freq', (err, stdout) => {
                        r(err ? null : parseInt(stdout.trim()));
                    });
                }),
                new Promise(r => {
                    exec('cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq', (err, stdout) => {
                        r(err ? null : parseInt(stdout.trim()));
                    });
                })
            ]).then(([min, max]) => resolve({ min, max }));
        })
    ]);

    return {
        armClock: results[0],
        governor: results[1],
        availableFreqs: results[2],
        freqLimits: results[3]
    };
}

function getDiskUsage() {
    return new Promise((resolve, reject) => {
        exec('df -h /', (err, stdout) => {
            if (err) return reject(err);
            const lines = stdout.trim().split('\n');
            if (lines.length < 2) return resolve(null);
            const parts = lines[1].split(/\s+/);
            resolve({
                filesystem: parts[0],
                size: parts[1],
                used: parts[2],
                available: parts[3],
                percent: parts[4],
                mount: parts[5]
            });
        });
    });
}

function getNetworkInfo() {
    return os.networkInterfaces();
}

async function getGpuDetails() {
    const results = await Promise.all([
        // GPU Memory
        new Promise((resolve) => {
            exec('vcgencmd get_mem gpu', (err, stdout) => {
                if (err) return resolve(null);
                const match = stdout.match(/gpu=(\d+)M/);
                resolve(match ? parseInt(match[1]) : null);
            });
        }),
        // Core frequency
        new Promise((resolve) => {
            exec('vcgencmd measure_clock core', (err, stdout) => {
                if (err) return resolve(null);
                const match = stdout.match(/frequency\(\d+\)=(\d+)/);
                resolve(match ? parseInt(match[1]) : null);
            });
        }),
        // Codec support
        new Promise((resolve) => {
            exec('vcgencmd codec_enabled H264', (err, stdout) => {
                if (err) return resolve({});
                const codecs = {};
                try {
                    const lines = stdout.trim().split('\n');
                    lines.forEach(line => {
                        const [codec, enabled] = line.split('=');
                        codecs[codec] = enabled === '1';
                    });
                } catch (e) { }
                resolve(codecs);
            });
        }),
        // Memory split
        new Promise((resolve) => {
            exec('vcgencmd get_mem arm && vcgencmd get_mem gpu', (err, stdout) => {
                if (err) return resolve(null);
                const arm = stdout.match(/arm=(\d+)M/);
                const gpu = stdout.match(/gpu=(\d+)M/);
                resolve({
                    arm: arm ? parseInt(arm[1]) : null,
                    gpu: gpu ? parseInt(gpu[1]) : null
                });
            });
        })
    ]);

    return {
        gpuMemory: results[0],
        coreFreq: results[1],
        codecs: results[2],
        memorySplit: results[3]
    };
}

function getProcesses() {
    return new Promise((resolve, reject) => {
        exec('ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 10', (err, stdout) => {
            if (err) return reject(err);
            const lines = stdout.trim().split('\n').slice(1);
            const procs = lines.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    pid: parts[0],
                    command: parts[1],
                    cpu: parts[2],
                    mem: parts[3]
                };
            });
            resolve(procs);
        });
    });
}

function getLoadAverage() {
    const loads = os.loadavg();
    return {
        '1min': loads[0],
        '5min': loads[1],
        '15min': loads[2]
    };
}

function getUptimeHuman() {
    const seconds = os.uptime();
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function getCpuModel() {
    const cpus = os.cpus();
    return (cpus && cpus[0] && cpus[0].model) ? cpus[0].model : null;
}

function getNetworkTraffic() {
    return new Promise((resolve) => {
        // Read /proc/net/dev and parse rx/tx for common interfaces
        exec("awk '/:/ {print $0}' /proc/net/dev", (err, stdout) => {
            if (err) return resolve(null);
            const lines = stdout.trim().split('\n');
            const data = {};
            lines.forEach(line => {
                // iface:  rx bytes ... tx bytes ...
                const parts = line.replace(/:/, ' ').trim().split(/\s+/);
                const iface = parts[0];
                const rx = parseInt(parts[1]);
                const tx = parseInt(parts[9]);
                data[iface] = { rx, tx };
            });
            resolve(data);
        });
    });
}

function getWirelessSignal() {
    return new Promise((resolve) => {
        // Try iwconfig first (may not be present), fallback to null
        exec('iwconfig 2>/dev/null', (err, stdout) => {
            if (err || !stdout) return resolve(null);
            // find lines with Signal level
            const match = stdout.match(/Signal level=([-0-9]+) dBm/);
            if (match) return resolve(parseInt(match[1]));
            // alternative pattern
            const alt = stdout.match(/Signal level[:=]([-0-9]+)/);
            return resolve(alt ? parseInt(alt[1]) : null);
        });
    });
}

async function getRaspberryData() {
    const [
        cpuUsage,
        cpuTemp,
        voltage,
        clockDetails,
        diskUsage,
        gpuDetails,
        processes,
        loadAvg,
        uptimeHuman,
        cpuModel,
        netTraffic,
        wirelessSignal,
        systemDetails,
        memoryDetails
    ] = await Promise.all([
        getCpuUsage(),
        getCpuTemp(),
        getVoltage(),
        getClockDetails(),
        getDiskUsage(),
        getGpuDetails(),
        getProcesses(),
        Promise.resolve(getLoadAverage()),
        Promise.resolve(getUptimeHuman()),
        Promise.resolve(getCpuModel()),
        getNetworkTraffic(),
        getWirelessSignal(),
        getSystemDetails(),
        getMemoryDetails()
    ]);

    return {
        // CPU info
        cpuUsage,
        cpuTemp,
        cpuModel,
        loadAvg,

        // Clock and voltage
        voltage,
        clock: {
            arm: clockDetails.armClock,
            core: gpuDetails.coreFreq,
            governor: clockDetails.governor,
            available: clockDetails.availableFreqs,
            limits: clockDetails.freqLimits
        },

        // Memory
        memory: {
            ...memoryDetails,
            split: gpuDetails.memorySplit
        },

        // GPU
        gpu: {
            memory: gpuDetails.gpuMemory,
            coreFreq: gpuDetails.coreFreq,
            codecs: gpuDetails.codecs
        },

        // System
        system: systemDetails,
        uptime: uptimeHuman,

        // Storage
        storage: diskUsage,

        // Network
        network: {
            interfaces: getNetworkInfo(),
            traffic: netTraffic,
            wireless: {
                signal: wirelessSignal
            }
        },

        // Processes
        processes
    };
}

module.exports = {
    // Main data getter
    getRaspberryData,

    // Individual functions
    getCpuUsage,
    getCpuTemp,
    getCpuModel,
    getSystemDetails,
    getMemoryDetails,
    getVoltage,
    getClockDetails,
    getDiskUsage,
    getNetworkInfo,
    getGpuDetails,
    getProcesses,
    getLoadAverage,
    getUptimeHuman,
    getNetworkTraffic,
    getWirelessSignal
};
