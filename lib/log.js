const fs = require('fs'),
    config = require('../config.json'),
    path = require('path');

module.exports = function (message, cat) {
        if (!config.app.mode) {
            message = message || '';
            const c = {
                0: 'err',
                1: 'test',
                2: 'stop'
            };
            cat = c[cat] ? c[cat] : '';
            if (config.app.log.console) console.dir(message);
            const logPath = path.join(config.app.log.path);
            fs.existsSync(logPath) || fs.mkdirSync(logPath);
            if (config.app.log.file) {
                const d = new Date(),
                dl = d.getFullYear() +
                    ((d.getMonth() < 9) ? '0' +
                        (d.getMonth() + 1) : (d.getMonth() + 1)) +
                    ((d.getDate() < 9) ? '0' +
                        d.getDate() : d.getDate());
                    fs
                    .appendFile(logPath + '/' +
                        cat + '___' + dl +'___log.txt',
                    '\n' + d + '____' + message,
                    err => {
                        if (err) console.log(err)
                    })
                }
        }
};