#!/usr/bin/env node

var express = require('express');
var restEmulator = require('rest-emulator');
var recursive = require('recursive-readdir');
var path = require('path');
var fs = require('fs');
var serveStatic = require('serve-static');
var app = express();
var cors = require('cors');
var _ = require('lodash');
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

function setHeader(resources) {
    _.each(resources, function(resource, key) {
        if (resource.data !== undefined) {
            resource.headers = options.headers;
        } else {
            _.each(resource, function(httpMethod, key) {
                httpMethod.headers = options.headers;
            });
        }
    });
}

function startServer(config) {
    if (Object.keys(options.headers).length) {
        config.forEach(setHeader);
    }
    if (options.corsEnable) {
        app.use(cors(options.corsOptions));
    }

    var restInstance = restEmulator(config);
    app.use(restInstance.middleware);

    options.root.forEach((dir) => app.use(serveStatic(dir)));

    if (options.rewriteNotFound) {
        var indexFile = path.resolve('.', options.rewriteTemplate);

        app.get('*', function(req, res) {
            return res.sendFile(indexFile);
        });
    }

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
