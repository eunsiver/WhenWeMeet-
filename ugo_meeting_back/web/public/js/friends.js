if(location.hash.length > 0) location.href = location.href.replace("#" + location.hash, "");

function friendPopup() {
    document.querySelector("#codeinput").value = "";
    document.querySelector(".popup-container").style.display = "flex";
}

function friendAdd() {
    let code = document.querySelector("#codeinput").value;
    if(code.length !== 8) {
        document.querySelector(".code-error").innerHTML = "코드 8자리를 정확히 입력해주세요.";
        return;
    }
    fetch(location.href, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({"code": code})
    }).then(res => res.json())
    .then(data => {
        switch(data.msg) {
            case "error":
                document.querySelector(".code-error").innerHTML = "서버 오류. 다시 시도해 주세요.";
                break;

            case "no":
                document.querySelector(".code-error").innerHTML = "해당하는 유저가 존재하지 않습니다.";
                break;

            case "already":
                document.querySelector(".code-error").innerHTML = "이미 해당 유저와 친구입니다.";
                break;

            case "done":
                location.href = location.href;
                break;
        }
    }).catch(e => {
        document.querySelector(".code-error").innerHTML = "서버 오류. 다시 시도해 주세요.";
    });
}