import fetch from 'node-fetch';
var urlUtil = require('url');


function getUrl(paramStr) {
    var url = window.location.href;
    var urlObject = urlUtil.parse(url);
    var host = urlObject.host;
    var protocol = urlObject.protocol;
    const cur_url = protocol + "//" + host + "/api?" + paramStr;
    return cur_url;
}

function fetchUrl(url, headers) {
    return fetch(url, headers)
    .then(res => {
        return res.json();
    });
}

function fetchUrlPost(url, options) {
    return fetch(url, options)
    .then(res => {
        return res.json();
    });
}


module.exports = {
    getUrl,
    fetchUrl,
    fetchUrlPost
};
