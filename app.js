const express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    routes = require(__dirname + '/routes/index'),
    cors = require('cors'),
    config = require( '../config.json'),
    fs = require('fs'),
    morgan = require('morgan'),
    rfs = require('rotating-file-stream'),
    Log = require('./lib/log'),
    takePort = require('./lib/takeFreePort'),
    runningServices = [],
    {fork} = require('child_process');

/********************************
 * Start Services
 * */
const key = process.argv[process.argv.length - 1] || '010101';

function checkServices() {
    Log('Scan services...');
    fs.readdir(__dirname + '/services/', (err, files) => {
        let pool = config.app.services.portPool;
        files.forEach(file => {
            const serv = file.split('.');
            if (serv[0]
                && serv[1] === 'service'
                && serv[2] === 'js'
                && !serv[3]
                && runningServices
                    .filter(rSrv => rSrv.name === serv[0]).length === 0)
                takePort(pool, Log)
                    .then(freePort => startService({
                        name: serv[0],
                        script: file,
                        host: config.app.services.protocol +
                            '://' + config.app.services.ipPool[0],
                        port: freePort,
                        key: key
                    }))
                    .catch(err => Log(err))
        })
    });
}

checkServices();
setInterval(() => checkServices(), config.app.mode ?
    config.app.services.checkInterval : 30 * 1000);

function startService(srv) {
    const service = srv,
        serv = fork(__dirname + '/services/service.starter.js',
            [JSON.stringify(service)]);
    serv.on('message', msg => {
        runningServices.push(service);
        Log(msg.message);
    });
    serv.on('exit', () => {
        Log('Service ' + service.name + ' stop!');
        const newRun = runningServices.filter(srv => srv.name !== service.name);
        while (runningServices.length) runningServices.shift();
        newRun.forEach(serv => runningServices.push(serv));
        // runningServices.concat(newRun);
    });
}

app.use(function (req, res, next) {
    req.services = runningServices;
    next();
});
const logPath = __dirname + '/Log';
fs.existsSync(logPath) || fs.mkdirSync(logPath);
const accessLogStream = rfs('access.log',
    {
        interval: '1d',
        path: logPath
    });
app.use(morgan('combined', {stream: accessLogStream}));
app.use(bodyParser.json());
app.use(cors());
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    Log(err.message, 0);
    res.json({
        jsonrpc: '2.0',
        error: {
            code: -32600,
            message: 'Invalid Request'
        },
        id: null
    });
});
module.exports = app;