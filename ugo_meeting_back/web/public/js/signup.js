function nameCheck() {
    let uname = document.querySelector(".signup-name").value;
    if(uname.length === 0) {
        document.querySelector(".name-error").innerHTML = "*필수 입력 사항입니다.";
    } else {
        document.querySelector(".name-error").innerHTML = "";
    }
}

function idCheck() {
    let id = document.querySelector(".signup-id").value;
    if(id.length === 0) {
        document.querySelector(".email-error").innerHTML = "*필수 입력 사항입니다.";
    }
    if(!id.endsWith("@gmail.com") && !id.endsWith("@naver.com")) {
        document.querySelector(".email-error").innerHTML = "*네이버 또는 구글 메일을 사용해주세요.";
    } else {
        fetch(location.origin + "/id?email=" + encodeURIComponent(id))
        .then(res => res.text())
        .then(data => {
            switch(data) {
                case "ok":
                    document.querySelector(".email-error").innerHTML = "";
                    break;
                
                case "exist":
                    document.querySelector(".email-error").innerHTML = "*동일한 이메일이 이미 사용 중입니다.";
                    break;

                case "error":
                    document.querySelector(".email-error").innerHTML = "*오류";
                    break;
            }
        })
        .catch(e => {
            document.querySelector(".email-error").innerHTML = "*오류";
        });
    }
}

function pwdCheck() {
    let pwd = document.querySelector(".signup-password-check").value;
    document.querySelector(".pwd-check-error").innerHTML = pwd.length > 0 ? (document.querySelector(".signup-password").value === pwd ? "" : "*비밀번호가 다릅니다.") : "*필수 입력 사항입니다.";
}

function signUp() {
    let divs = document.querySelectorAll("form > div");
    for(i of divs) {
        if(i.id === "submit" || i.id === "all-error") continue;
        if (i.children[0].innerHTML !== "") {
            document.querySelector(".all-error").innerHTML = "*" + i.innerText.replace(i.children[0].innerHTML, "").replace(":", "");
            return;
        }
    }
    document.querySelector("#signUp").submit();
}

nameCheck();
idCheck();
pwdCheck();