import fetch from 'node-fetch';
var urlUtil = require('url');


function getUrl(paramStr) {
    var url = window.location.href;
    var urlObject = urlUtil.parse(url);
    var host = urlObject.host;
    var protocol = urlObject.protocol;
    const cur_url = protocol + "//" + host + "/api?" + paramStr;
    console.log("my_cur_url", cur_url);
    return cur_url;
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
