if (location.hash.length > 0) location.href = location.href.replace("#" + location.hash, "");

function dispList(selectList) {
    var obj1 = document.getElementById("dday"); // 상품1 리스트
    var obj2 = document.getElementById("Npark"); // 상품2 리스트

    if (selectList == "1") { // 상품1 리스트
        obj1.style.display = "block";
        obj2.style.display = "none";
    } else { // 상품2 리스트
        obj1.style.display = "none";
        obj2.style.display = "block";
    }
}
document.querySelectorAll(".wholeday").forEach(e => e.value = new Date().toISOString().substring(0, 10));

function addFriendPopup() {
    fetch(location.origin + "/friendList").then(res => res.json())
        .then(friends => {
            friends.splice(0, 1);
            document.querySelector("div.friends-box").innerHTML = "";
            let frstr = "";
            for (i in friends) {
                frstr += `
                    <label for="f-${friends[i].code}">
                    <div class="people_box" >
                        <img src="${friends[i].profile}" alt="프로필" class="profile">
                        <div class="P-name">${friends[i].name}</div>
                        <input type="checkbox" class ="feel" name="" id="f-${friends[i].code}" ${(list.includes(friends[i].code) ? "checked" : "")}>
                    </div>
                    </label>
                `;
            }
            document.querySelector("div.friends-box").innerHTML = frstr;
        });
    document.querySelector(".popup-container").style.display = "flex";
}

function manna() {
    document.querySelector(".popup-container1").style.display = "flex";
}

let me = null;
let list = [];
let names = []
fetch(location.origin + "/friendList").then(res => res.json())
    .then(friends => {
        me = friends[0];
        document.querySelector("#withwhom").innerHTML = me.name;
        list = [me.code];
        names = [me.name];
    });

function setFriends() {
    document.querySelector("#withwhom").innerHTML = me.name;
    let friendsbox = document.querySelector(".friends-box").children;
    list = [me.code];
    names = [me.name];
    for (let i = 0; i < friendsbox.length; i++) {
        const thisone = friendsbox.item(i);
        if (thisone.querySelector("input").checked) {
            list.push(thisone.querySelector("input").id.substring(2));
            document.querySelector("#withwhom").innerHTML += "," + thisone.querySelector(".P-name").innerHTML;
            names.push(thisone.querySelector(".P-name").innerHTML);
        }
    }
    document.querySelector(".popup-container").style.display = "none";
}

function Two(n) {
    if (n < 10) {
        return "0" + n;
    }
    return n + "";
}

//현재 보고 있는 달
let calMonth = new Date();
//선택된 날짜
let dateSelected = new Date();

//달력 밑바탕 생성 함수
function calendar(drawMonth) {
    let thisYear = drawMonth.getFullYear();
    let thisMonth = drawMonth.getMonth();
    const cal = document.querySelector(".calendar");
    document.querySelector(".calendar-title").innerHTML = thisYear + "년 " + (thisMonth + 1) + "월";
    cal.innerHTML = `<div class="calendar-row"><div class="calendar-day">일</div><div class="calendar-day">월</div><div class="calendar-day">화</div><div class="calendar-day">수</div><div class="calendar-day">목</div><div class="calendar-day">금</div><div class="calendar-day">토</div>`;

    let first = new Date(drawMonth.getFullYear(), drawMonth.getMonth(), 1);
    let last = new Date(drawMonth.getFullYear(), drawMonth.getMonth() + 1, 0);
    let firstday = first.getDay();
    let row = `<div class="calendar-row">`;
    for (let i = 0; i - firstday < last.getDate(); i++) {
        if (i % 7 === 0) {
            cal.innerHTML += row + `</div>`;
            row = `<div class="calendar-row">`;
        }
        if (i < first.getDay()) {
            row += `<div class="calendar-date"></div>`;
            continue;
        }
        let today = i - first.getDay() + 1;
        today = today < 10 ? "0" + today : today;
        row += `<div id="calendar-date-${thisYear}-${Two(thisMonth + 1)}-${Two(Number(today))}" class="calendar-date" onclick="selectDate(${Number(today)})">
            <div class="dots">
            </div>
            ${today}
            <div class="dots2">
            </div>
        </div>`;
        //점 예시<span class="dot" style="background:red"></span>
    }
    for (let i = 0; i < 6 - last.getDay(); i++) {
        row += `<div class="calendar-date"></div>`;
    }
    cal.innerHTML += row + `</div></div>`;

    if (dateSelected !== null && dateSelected.getFullYear() === thisYear && dateSelected.getMonth() === thisMonth) selectDate(dateSelected.getDate());
}

//달력 이동
function calendarMove(dir) {
    calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + dir, 1);
    calendar(calMonth);
    ScheduleToCal();
}

//서버에서 받아온 스케줄 정보를 글로벌 배열로 저장.
let scheduleData = {};
//스케줄로 확인 할 날짜들을 글로벌 배열로 저장.
let dates = [];

function manna() {
    dates = [];
    let std = document.querySelector(".startdate").value.replace(/-/g, ""),
        edd = document.querySelector(".enddate").value.replace(/-/g, "");

    let first = new Date(std.substring(0, 4), std.substring(4, 6) - 1, std.substring(6, 8) * 1);
    console.log(first.getDate());
    let last = new Date(edd.substring(0, 4), edd.substring(4, 6) - 1, edd.substring(6, 8) * 1);
    let lastdate = Math.ceil((last.getTime() - first.getTime()) / (1000 * 3600 * 24)) + first.getDate();
    console.log(lastdate);
    let firstyear = first.getFullYear();
    let firstmonth = first.getMonth();

    for (let i = first.getDate() + 1; i <= lastdate + 1; i++) {
        dates.push(new Date(firstyear, firstmonth, i).toISOString().substring(0, 10).replace(/-/g, ""));
    }
    console.log(dates);

    //서버에서 스케줄 받아오기
    fetch(location.origin + "/manna", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "friends": JSON.stringify(list),
            "dates": JSON.stringify(dates)
        }
    }).then(res => {
        return res.json();
    }).then(data => {
        /*[
            {
                code: [[personal_code]],
                shedules: [[Array of schedules]]
            }
        ]*/
        const all = {};
        for (let i = 0; i < dates.length; i++) {
            all[dates[i]] = [];
        }
        data.forEach(e => {
            e.schedules.forEach((s, i) => {
                all[dates[i]] = all[dates[i]].concat(s);
            });
        });
        console.log(all);
        scheduleData = all;

        //일단 먼저 그리자
        calMonth = new Date(dates[0].substring(0, 4), dates[0].substring(4, 6) - 1, 1)
        calendar(calMonth);
        ScheduleToCal();

        document.querySelector(".popup-container1").style.display = "block";
    }).catch(e => {
        //에러 처리
    });
}

//캘린터 형식의 문자열
function calString(date) {
    return `${dateSelected.getFullYear()}-${Two(dateSelected.getMonth() + 1)}-${Two(dateSelected.getDate())}`;
}

//스케줄을 캘린더에 반영
function ScheduleToCal() {
    document.querySelectorAll(".calendar-date").forEach(e => {
        let id = e.id.substring(14).replace(/-/g, "");
        if (!dates.includes(id)) {
            e.style.background = "#9d9d9d";
        } else {
            if (scheduleData[id].length === 0) {
                e.style.background = "rgb(203, 179, 225)";
                return;
            }
            // e.style.background = "#9d9d9d";
            for (i in scheduleData[id]) {
                if (i === 8) break;
                if (i < 4) e.querySelector(".dots").innerHTML += `<span class="dot" style="background:${scheduleData[id][i].color}"></span>`;
                else e.querySelector(".dots2").innerHTML += `<span class="dot" style="background:${scheduleData[id][i].color}"></span>`;
            }
        }
    });
}

//달력 클릭시 선택
/**
 * @event listener for date select event
 * @param {string} date 
 * 
 * @returns {void} void
 */
function selectDate(date) {
    let before = null;
    if (dateSelected !== null) before = document.querySelector(`#calendar-date-${dateSelected.getFullYear()}-${Two(dateSelected.getMonth() + 1)}-${Two(dateSelected.getDate())}`);
    if (before !== null) before.classList.remove("selected-date");
    dateSelected = new Date(calMonth.getFullYear(), calMonth.getMonth(), date);
    document.querySelector(`#calendar-date-${dateSelected.getFullYear()}-${Two(dateSelected.getMonth() + 1)}-${Two(dateSelected.getDate())}`).classList.add("selected-date");

    let datestr = Two(dateSelected.getFullYear()) + "" + Two(dateSelected.getMonth() + 1) + "" + Two(dateSelected.getDate()) + "";

    let tp = document.querySelector(".tp2");
    tp.innerHTML = "";
    if(!scheduleData[datestr]) return;
    let temp = "";
    for(item of scheduleData[datestr]) {
        temp += `
            <div class="timebox t1" style="background: ${item.color}">
                <div class="time-people">${names[list.indexOf(item.code)]}</div>
                <div class="whentime">${item.start}시~${item.end}시</div>
            </div>
        `;
    }
    tp.innerHTML = temp;
}