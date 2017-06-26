'use strict';
const path = require('path');
const fs = require('fs');
const https = require('https');

const opn = require('opn');
const portfinder = require('portfinder');

const app = require('./app/routes');

const certDir = path.join(__dirname, 'cert');

const raspiconf = {app: ['chromium-browser', '--noerrdialogs', '--kiosk']};
const opnConfig = process.env.DEVICE === 'raspi' ? raspiconf : {};

const privateKey = fs.readFileSync(path.join(certDir, 'localhost.key'), 'utf8');
const certificate = fs.readFileSync(path.join(certDir, 'localhost.crt'), 'utf8');

const credentials = {key: privateKey, cert: certificate};

const httpsServer = https.createServer(credentials, app);

const gracefulShutdown = function () {
    console.log('Received kill signal, shutting down gracefully.');
    httpsServer.close(function () {
        console.log('Closed out remaining connections.');
        process.exit();
    });

    // if after
    setTimeout(function () {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit();
    }, 10 * 1000);
};

process.on('SIGTERM', gracefulShutdown);

process.on('SIGINT', gracefulShutdown);

const listenToPort = (port) => {
    httpsServer.listen(port, () => {
        console.log('server started on port', port);
        opn('https://localhost' + ':' + port, opnConfig);
    });
};

portfinder.getPortPromise()
    .then((port) => {
        listenToPort(port);
    })
    .catch((err) => {

    });