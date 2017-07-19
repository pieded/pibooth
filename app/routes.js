'use strict';
const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const moment = require('moment');
const RaspistillClass = require('node-raspistill').Raspistill;
const raspistill = new RaspistillClass();

const rootDir = path.join(__dirname, '..');
const docroot = path.join(rootDir, 'www');
const snaps = path.join(rootDir, 'snaps');
const filenameFormat = 'YYYY-MM-DD_HH:mm:ss:SS';

const app = express();

app.use(express.static(docroot));
app.use(compression());

const rawBodyParserOptions = {
    type: '*/*',
    limit: '500 mb'
};

app.get('/', function (req, res) {
    res.sendFile(path.join(docroot, 'index.html'));
});

app.get('/snap', function (req, res) {
    const filename = 'RASPISTILL_' + moment().format(filenameFormat);
    raspistill.takePhoto()
        .then((image) => {
            saveImage(filename, image, res);
        }).catch((err) => {
            res.send(err.message);
        });
});

app.post('/snap', bodyParser.raw(rawBodyParserOptions), function (req, res) {
    const image = Buffer.from(req.body, 'binary');
    const filename = moment().format(filenameFormat);

    saveImage(filename, image, res);

});

function saveImage (filename, data, res) {
    fs.writeFile(path.join(snaps, filename + '.jpg'), data, {encoding: 'binary'}, function (err) {
        if (err) {
            res.send('failed ' + err.message);
        }
        res.send('wrote file ' + filename);
    });
}

app.use((err, req, res, next) => {
    if (req.xhr) {
        res.status(500).send({error: err.message});
    } else {
        res.status(500).render('error', {error: err});
    }
    next(err);
});

module.exports = app;
