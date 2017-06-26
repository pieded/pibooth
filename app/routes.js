'use strict';
const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');

const rootDir = path.join(__dirname, '..');
const docroot = path.join(rootDir, 'www');
const snaps = path.join(rootDir, 'snaps');
const filenameFormat = 'YYYY-MM-DD_HH:mm:ss:SS';

const app = express();

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

module.exports = app;
