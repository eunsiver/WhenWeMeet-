if(location.hash.length > 0) location.href = location.href.replace("#" + location.hash, "");

//프로필 변경
async function changeProfile() {
    let profile = await toBase64(document.querySelector(".photo-input").files[0]);

    document.querySelector(".profile-form-input").value = profile;

    fetch(location.origin + "/profileImage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"profile": profile})
    }).then(res => res.text())
    .then(data => {
        switch(data) {
            case "error":
                document.querySelector(".profile-error").innerHTML = "다시 시도해주세요.";
                break;
            case "done":
                document.querySelector(".profile-error").innerHTML = "";
                document.querySelector(".profile-image").style.backgroundImage = `url(${profile})`;
                break;
        }
    }).catch(e => {
        document.querySelector(".profile-error").innerHTML = "다시 시도해주세요.";
    });
}

document.querySelector(".photo-input").addEventListener("change", changeProfile, false);

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

//저장
function changeSettings() {
    //post
}