import fetch from 'node-fetch';

function getUrl(paramStr) {
    var host = 'http://www.houzztest.com/api?';
    const env = process.env.NODE_ENV;
    switch (env) {
        case 'dev':
            host = host.replace('houzz', 'stghouzz');
            break;
        case 'staging':
            host = host.replace('houzz', 'stghouzz');
            break;
        case 'houzz2':
            host = host.replace('houzz', 'houzz2');
            break;
    }

    const url = host + paramStr;
    console.log('=> url: ', url);
    return url;
}

function fetchUrl(url, headers) {
    return fetch(url, headers)
    .then(res => {
        return res.json();
    });
}



module.exports = {
    getUrl,
    fetchUrl
};
