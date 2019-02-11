const fs = require('fs'),
    config = require('../config.json'),
    XHR = require('../lib/xhr'),
    path = require('path');

module.exports = {
    log: function (message, cat) {
    if (!config.app.mode) {
        message = message && typeof message === 'string' ? message
            : message && typeof message === 'object' ? JSON.stringify(message): '';
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
},
    /*
     * @summary Verify params.
     * @params {
     *          password - string,
     *          email - string,
     *          ... etc
     *          } Object - verifying params.
     * @return true or {
     *          code - number, error code
     *          message - string, error message, 'Wrong field. + {field name}' for example
     *      } - Boolean if ok, Object if not ok - translated key value.
    * */
    verifyParams: function (params) {
        return new Promise( (resolve, reject) => {
            const verify = {
                password: (value) => {
                    return value && value.length >= 8 && value.length < 256;
                },
                email: (value) => {
                    return value && value.length < 256
                        && null !== value.match
                        (/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
                },
                phone: (value) => {
                    return value && value.length < 256
                        && null !== value.match
                        (/^\+\d{12}$/);
                },
                token: (value) => {
                    return value && value.length > 0 && value.length < 65000;
                },
                name: (value) => {
                    return value && value.length > 0 && value.length < 100;
                },
                g_id: (value) => {
                    return value && value.length > 0 && value.length < 50;
                },
                g_at: (value) => {
                    return value && value.length > 0 && value.length < 256;
                },
                id: (value) => {
                    return value && value.length > 0 && value.length < 256;
                },
                user: (value) => {
                    return value && value.length > 0 && value.length < 256;
                },
                code: (value) => {
                    return value && value.length === 6;
                },
                location: (value) => {
                    return typeof (value.lat) === 'number'
                        && typeof (value.lng) === 'number'
                        && value.lat >= -90 && value.lat <= 90
                        && value.lng >= -180 && value.lng <= 180
                },
                direction: (value) => {
                    return typeof (value.horizont) === 'number'
                        && typeof (value.vertical) === 'number'
                        && value.horizont >= 0 && value.horizont <= 360
                        && value.vertical >= -90 && value.vertical <= 90
                },
                cost: (value) => {
                    return typeof (value) === 'number' && value >= 0
                },
                url: (value) => {
                    return value && value.length > 0 && value.length < 256;
                },
                sha3: (value) => {
                    return value && value.length > 0 && value.length < 256;
                },
                filename: (value) => {
                    return value && value.length > 0 && value.length < 256;
                },
                created: (value) => {
                    return typeof (value) === 'number' && value > 0
                        && value < (new Date()).getTime();
                },
                category: (value) => {
                    return typeof (value) === 'number' && [0, 1, 2, 3, 4, 5].indexOf(value) >= 0
                }

            };
            try {
                const keys = Object.keys(params);
                for (let i = 0; i < keys.length; i++) {
                    if (!verify[keys[i]] || !verify[keys[i]](params[keys[i]]))
                    {
                        reject({
                            status: false,
                            code: 32901,
                            message: 'Wrong field: ' + keys[i]
                        });
                    }
                }
                resolve(true);
            } catch (e) {
                return reject({
                    status: false,
                    code: 32900,
                    message: e.message
                });
            }
        })
    },
    verifyGoogleAccessToken: function (token, userId) {
        return new Promise( (resolve, reject) => {
            try {
                const request = {
                    url: config.auth.google.tokenURL + token,
                    method: 'get'
                };
                XHR(request)
                    .then(res => {
                        if (res.aud === config.auth.google.clientId
                            && res.sub === userId
                            && ((res.exp + res.expires_in) * 1000 - (new Date()).getTime()) > 0
                        ) {
                            return resolve(res);
                        } else return reject({
                            code: 32607,
                            message: 'Google token invalid.'
                        });
                    })
                    .catch(err => {
                        return reject(err);
                    })
            } catch (e) {
                this.log(e.message, 0);
                return reject({
                    code: 32609,
                    message: ''
                });
            }
        })
    },
    sendToService: function (params) {
        return new Promise( (resolve, reject) => {
            try {
                XHR({
                    url: config.app.host + ':' + config.app.port,
                    body: {
                        jsonrpc: "2.0",
                        id: params.id,
                        method: params.method,
                        params: params.params
                    }
                })
                    .then(resp => {
                        return resolve(resp);
                    })
                    .catch(err => {
                        return reject(err);
                    });
            } catch (error) {
                return reject(error);
            }
        });
    }
};