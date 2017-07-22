'use strict';
const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const moment = require('moment');
const RaspistillClass = require('node-raspistill').Raspistill;

const useTimelapse = false;
const raspistillWidth = 1920;
const raspistillHeight = 1080;
const rootDir = path.join(__dirname, '..');
const docroot = path.join(rootDir, 'www');
const snaps = path.join(rootDir, 'snaps');
const filenameFormat = 'YYYY-MM-DD_HH:mm:ss:SS';

const timelapseInterval = 0;
const timelapseExecutionTime = 1;

const app = express();
const raspistill = new RaspistillClass({
    noFileSave: true,
    width: raspistillWidth,
    height: raspistillHeight
});

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
    if (useTimelapse) {
        takeRaspistillTimelapse(res);
    } else {
        takeRaspistillPhoto(res);
    }
});

function takeRaspistillPhoto (res) {
    const filename = getFilename() + '_full';
    raspistill.takePhoto()
        .then((image) => {
            raspistill.stop();
            saveImage(filename, image, res);
        }).catch((err) => {
            res.status(500).send(err.message);
        });
}

function takeRaspistillTimelapse (res) {
    const filename = getFilename() + '_full';
    raspistill.timelapse(timelapseInterval, timelapseExecutionTime, (image) => {
        saveImage(filename, image, (err) => {
            if (err) {
                throw err;
            }
        });
    }).then(() => {
        raspistill.stop();
        res.send('wrote file ' + filename);
    }).catch((err) => {
        res.status(500).send(err.message);
    });
}

app.post('/snap', bodyParser.raw(rawBodyParserOptions), function (req, res) {
    const image = Buffer.from(req.body, 'binary');
    const filename = getFilename();
    saveImage(filename, image, (err) => {
        if (err) {
            res.status(500).send('failed ' + err.message);
        }
        res.send('wrote file ' + filename);
    });

});

function saveImage (filename, data, callback) {
    fs.writeFile(path.join(snaps, filename + '.jpg'), data, {encoding: 'binary'}, callback);
}

app.use((err, req, res, next) => {
    if (req.xhr) {
        res.status(500).send({error: err.message});
    } else {
        res.status(500).render('error', {error: err});
    }
    next(err);
});

function getFilename () {
    return moment().format(filenameFormat);
}

module.exports = app;
