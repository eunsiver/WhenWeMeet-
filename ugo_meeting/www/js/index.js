document.addEventListener('deviceready', onDeviceReady, false);

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

alert = function(title, content = "", buttons = [{"name":"확인", "onclick":"document.querySelector('.popup-container').style.display='none';"}]) {
    if(content === "") {
        content = title;
        title = "알림";
    }
    let popup = `<div class="popup"><div class="popup-title">${title}</div><div class="popup-content">${content}`;
    popup += `</div>`;
    popup += `<div class="popup-button-container">`;
    for(i of buttons) {
        popup += `<div class="popup-button" onclick=${i.onclick}>${i.name}</div>`
    }
    popup +=`</div></div>`;

    document.querySelector(".popup-container").innerHTML = popup;
    document.querySelector(".popup-container").style.display = "flex";
}

function onBackKeyDown() {
    if(document.querySelector(".popup-container").style.display === "none") alert("종료하시겠습니까?", "앱을 종료하시려면 확인을 눌러주세요.", [{"name":"확인", "onclick":"navigator.app.exitApp();"}, {"name":"취소", "onclick":"document.querySelector('.popup-container').style.display='none';"}]);
    else document.querySelector(".popup-container").style.display = "none";
}

async function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    fetchWithTimeout(document.querySelector("iframe").src + "alive/", {"method":"GET"}, 3000, _ => {
        document.querySelector(".body").innerHTML = "<div>서버와 연결 할 수 없네요...</div>";
    });
    await sleep(3000);
    document.querySelector(".loading").outerHTML = "";

    document.addEventListener("backbutton", onBackKeyDown, true);
    document.querySelector(".popup-container").style.display = "none";
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
        }
        return response;
    });
}