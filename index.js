#!/usr/bin/env node

var express = require('express');
var restEmulator = require('rest-emulator');
var recursive = require('recursive-readdir');
var path = require('path');
var fs = require('fs');
var serveStatic = require('serve-static');
var app = express();
var cors = require('cors');

const defaultOptions = {
    port: 3000,
    dir: '/mocks',
    root: ['./'],
    rewriteNotFound: false,
    corsEnable: true,
    rewriteTemplate: 'index.html',
    headers: {}
};
const options = getOptions();

function jsonOnly(file, stats) {
    return path.extname(file) === '.json';
}

function getJSON(filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function getOptions() {
    if (process.argv.length > 2) {
        const passedOptions = JSON.parse(fs.readFileSync(process.argv[2]));
        return Object.assign(defaultOptions, passedOptions);
    }
    return defaultOptions;
}

function startServer(config) {
    if (Object.keys(options.headers).length) {
        app.use(function(req, res, next) {
            res.set(options.headers);
            next();
        })
    }

    if (options.corsEnable) {
        app.use(cors(options.corsOptions));
    }

    options.root.forEach((dir) => app.use(serveStatic(dir)));

    if (options.rewriteNotFound) {
        var indexFile = path.resolve('.', options.rewriteTemplate);

        app.get('*', function(req, res) {
            return res.sendFile(indexFile);
        });
    }

    var restInstance = restEmulator(config);
    app.use(restInstance.middleware);

    app.listen(options.port);
    console.log(`Started the rest server on ${options.port}`);
}
recursive(process.cwd() + options.dir, function(err, filenames) {
    if (err) {
        throw `Failed to read the files in ${process.cwd() + options.dir}, error says: ${err}`;
    }
    const config = filenames.filter(jsonOnly).map(getJSON);
    startServer(config);
});
