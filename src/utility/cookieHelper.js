

// set cookie
function setCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else {
        var expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

// delete cookie
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
            return c.substring(nameEQ.length, c.length);
        }
    return null;
}

// delete cookie
function deleteCookie(name) {
    setCookie(name, "", -1);
}

function overrideOrSetCookie(name, value, days) {
    if (getCookie(name) !== null) {
        deleteCookie(name);
        setCookie(name, value, days);
    } else {
        setCookie(name, value, days);
    }
}
// cookie helper ends



module.exports = {
    setCookie,
    getCookie,
    deleteCookie,
    overrideOrSetCookie
};
