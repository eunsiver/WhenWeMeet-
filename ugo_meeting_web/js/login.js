//로그인 함수
function login() {
    let email = document.querySelector(".login-id").value;
    if(!email.endsWith("@naver.com") && !email.endsWith("@gmail.com")) {
        document.querySelector(".error-message").innerHTML = "이메일 형식이 올바르지 않습니다.";
        return;
    } else if(document.querySelector(".login-password").value === "") {
        document.querySelector(".error-message").innerHTML = "비밀번호를 입력해주세요.";
        return;
    } else {
        document.querySelector(".error-message").innerHTML = "";
    }
    document.querySelector("#login").submit();
}

//비밀번호란 엔터키 처리
document.querySelector(".login-password").addEventListener("keypress", function(e) {
    if(e.key === "Enter") {
        e.preventDefault();
        login();
    }
});

//비밀번호란 엔터키 처리2
document.querySelector(".login-password").addEventListener("submit", function() {
    login();
});

if(params && params.msg) {
    switch(params.msg) {
        case "retry":
            document.querySelector(".error-message").innerHTML = "작업 중 오류가 발생했습니다.\n다시 로그인해주세요.";
            break;
        
        case "!exist":
            document.querySelector(".error-message").innerHTML = "계정이 존재하지 않습니다.";
            break;

        case "wrong":
            document.querySelector(".error-message").innerHTML = "비밀번호가 다릅니다.";
            break;
    }
}
