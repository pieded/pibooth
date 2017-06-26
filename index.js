'use strict';
const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const opn = require('opn');
const portfinder = require('portfinder');

const certDir = path.join(__dirname, 'cert');
const docroot = path.join(__dirname, 'www');
const snaps = path.join(__dirname, 'snaps');
const filenameFormat = 'YYYY-MM-DD_HH:mm:ss:SS';

const raspiconf = {app: ['chromium-browser', '--noerrdialogs', '--kiosk']};
const opnConfig = {} || raspiconf;

const app = express();

const privateKey = fs.readFileSync(path.join(certDir, 'localhost.key'), 'utf8');
const certificate = fs.readFileSync(path.join(certDir, 'localhost.crt'), 'utf8');

const credentials = {key: privateKey, cert: certificate};

app.use(express.static(docroot));

const rawBodyParserOptions = {
    type: '*/*',
    limit: '500 mb'
};

app.get('/', function (req, res) {
    res.sendFile(path.join(docroot, 'index.html'));
});

app.post('/snap', bodyParser.raw(rawBodyParserOptions), function (req, res) {

    const imageData = req.body.toString().replace(/^data:image\/jpeg;base64,/, '');
    const image = Buffer.from(imageData, 'base64');
    const filename = moment().format(filenameFormat);

    fs.writeFile(path.join(snaps, filename + '.jpg'), image, 'base64', function (err) {
        if (err) {
            throw err;
        }
        res.send('wrote file' + filename);
    });
});

app.use((err, req, res, next) => {
    if (req.xhr) {
        res.status(500).send({error: err.message});
    } else {
        res.status(500).render('error', {error: err});
    }
    next(err);
});

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