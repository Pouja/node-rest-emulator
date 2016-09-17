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
var reloadRequire = require('require-nocache')(module);

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

function pick(chooses) {
    return _.sample(chooses);
}

function jsonOnly(file, stats) {
    return path.extname(file) === '.json';
}

function getJSON(filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function jsOnly(file, stats) {
    return path.extname(file) === '.js';
}

function getJs(filename) {
    return reloadRequire(filename);
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

function getConfigs(cb) {
    recursive(process.cwd() + options.dir, function(err, filenames) {
        if (err) {
            throw `Failed to read the files in ${process.cwd() + options.dir}, error says: ${err}`;
        }
        const jsonConfigs = filenames.filter(jsonOnly).map(getJSON);
        const jsConfigs = filenames.filter(jsOnly).map(getJs);

        const configs = jsConfigs.concat(jsonConfigs);
        if (Object.keys(options.headers).length) {
            configs.forEach(setHeader);
        }
        cb(configs);
    });
}

function startServer() {
    if (options.corsEnable) {
        app.use(cors(options.corsOptions));
    }

    app.use(function(req, res, next){
        getConfigs((configs) => restEmulator(configs).middleware(req,res,next));
    });

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
startServer();

