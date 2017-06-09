'use strict';
const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');

const noop = () => {};
const docroot = path.join(__dirname, 'www');
const snaps = path.join(__dirname, 'snaps');
const filenameFormat = 'YYYY-MM-DD_HH:mm:ss:SS';
const serverPort = 8080;

const app = express();

app.use(express.static(docroot));

const rawBodyParserOptions = {
    type: '*/*',
    limit: '500 mb'
};

app.get('/', function (req, res) {
    res.sendFile(path.join(docroot, 'index.html'))
});

app.post('/snap', bodyParser.raw(rawBodyParserOptions), function (req, res) {

    const imageData = req.body.toString().replace(/^data:image\/jpeg;base64,/, '');
    const image = Buffer.from(imageData, 'base64');
    const filename = moment().format(filenameFormat);

    fs.writeFile(path.join(snaps, filename + '.jpg'), image, 'base64', function(err) {
        if (err) {
            throw err;
        }
        res.send('wrote file' + filename);
    });
});

app.use((err, req, res, next) => {
    if (req.xhr) {
        res.status(500).send({ error: err.message });
    } else {
        res.status(500).render('error', { error: err });
    }
    next(err);
});

app.listen(serverPort, () => {
    console.log('server started on port', serverPort);
});
