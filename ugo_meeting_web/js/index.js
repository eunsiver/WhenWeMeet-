let params = location.href.replace(location.origin+location.pathname, "").replace(location.hash, "");
if(params.startsWith("?")) {
    params = params.substring(1);
    params = params.split("&");
    let obj = {};
    for(i of params) {
        obj[encodeURIComponent(i.split("=")[0])] = encodeURIComponent(i.split("=")[1]);
    }
    params = obj;
} else {
    delete params;
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function fetchWithTimeout(url, options, delay, onTimeout) {
    const timer = new Promise((resolve) => {
        setTimeout(resolve, delay, {
            timeout: true,
        });
    });
    return Promise.race([
        fetch(url, options),
        timer
    ]).then(response => {
        if (response.timeout) {
            onTimeout();
            return;
        }
        return response;
    }).catch(e => console.log(e));
}

function minmax(id, min, max) {
    document.querySelector(`#${id}`).value = document.querySelector(`#${id}`).value < min ? min : (document.querySelector(`#${id}`).value > max ? max : document.querySelector(`#${id}`).value);
}