let xhr = require('xmlhttprequest').XMLHttpRequest;

module.exports = (params) => {
    return new Promise( (resolve, reject) => {
        try {
            params = params || {};
            params.url = params.url || '';
            params.method = params.method || 'POST';
            params.headers = params.headers || [
                {key: 'Content-Type', value: 'application/json'}
            ];
            params.body = params.body || null;
            const newXHR = new xhr();
            newXHR.open(params.method, params.url);
            if (params.headers && params.headers.length > 0) params.headers.forEach(header => {
                newXHR.setRequestHeader(header.key, header.value);
            });
            newXHR.onload = () => {
                if (newXHR.status === 200) {
                    try {
                        return resolve(JSON.parse(newXHR.responseText));
                    } catch (e) {
                        return reject('Service error ' + e.message);
                    }
                } else {
                    return reject('Error ' + newXHR.status);
                }
            };
            newXHR.onerror = e => {
                return reject('Request Error ' + e);
            };
            newXHR.send(params.body ? JSON.stringify(params.body) : null);
        } catch (e) {
            return reject('Service error ' + e.message);
        }
    });
};