if(location.hash.length > 0) location.href = location.href.replace("#" + location.hash, "");

//현재 보고 있는 달
let calMonth = new Date();
//선택된 날짜
let dateSelected = new Date();

//달력 밑바탕 생성 함수
function calendar() {
    let thisYear = calMonth.getFullYear();
    let thisMonth = calMonth.getMonth();
    const cal = document.querySelector(".calendar");
    document.querySelector(".calendar-title").innerHTML = thisYear + "년 " + (thisMonth + 1) + "월";
    cal.innerHTML = `<div class="calendar-row"><div class="calendar-day">일</div><div class="calendar-day">월</div><div class="calendar-day">화</div><div class="calendar-day">수</div><div class="calendar-day">목</div><div class="calendar-day">금</div><div class="calendar-day">토</div>`;

    let first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    let last = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
    let firstday = first.getDay();
    let row = `<div class="calendar-row">`;
    for(let i = 0; i - firstday < last.getDate(); i++) {
        if(i % 7 === 0) {
            cal.innerHTML += row + `</div>`;
            row = `<div class="calendar-row">`;
        }
        if(i < first.getDay()) {
            row += `<div class="calendar-date"></div>`;
            continue;
        }
        let today = i - first.getDay() + 1;
        today = today < 10 ? "0" + today : today;
        row += `<div id="calendar-date-${thisYear}-${thisMonth}-${Number(today)}" class="calendar-date" onclick="selectDate(${Number(today)})">${today}</div>`;
    }
    for(let i = 0; i < 6 - last.getDay(); i++) {
        row += `<div class="calendar-date"></div>`;
    }
    cal.innerHTML += row + `</div></div>`;

    let cur = new Date();
    if(cur.getFullYear() === thisYear && cur.getMonth() === thisMonth) document.querySelector(`#calendar-date-${thisYear}-${thisMonth}-${new Date().getDate()}`).classList.add("today");

    if(dateSelected !== null && dateSelected.getFullYear() === thisYear && dateSelected.getMonth() === thisMonth) selectDate(dateSelected.getDate());
}

//스케줄 데이터를 저장할 변수
let gData = null;

//달력 클릭시 선택
function selectDate(date) {
    document.querySelector(".schedule-error").innerHTML = "";
    let before = null;
    if(dateSelected !== null) before = document.querySelector(`#calendar-date-${dateSelected.getFullYear()}-${dateSelected.getMonth()}-${dateSelected.getDate()}`);
    if(before !== null) before.classList.remove("selected-date");
    dateSelected = new Date(calMonth.getFullYear(), calMonth.getMonth(), date);
    document.querySelector(`#calendar-date-${dateSelected.getFullYear()}-${dateSelected.getMonth()}-${dateSelected.getDate()}`).classList.add("selected-date");

    let datestr = Two(dateSelected.getFullYear()) + "" + Two(dateSelected.getMonth() + 1)+ "" + Two(dateSelected.getDate()) + "";

    document.querySelector(".list").style.display = "flex";
    document.querySelector(".schedule-error").style.display = "block";
    document.querySelector(".plus-button").style.display = "block";
    document.querySelector(".list").innerHTML = `
        <div class="list-title">${dateSelected.getFullYear()}년 ${dateSelected.getMonth() + 1}월 ${dateSelected.getDate()}일</div>
    `;

    fetch(location.href + "schedule", {
        method: "POST",
        headers: {
            "dateselected": encodeURIComponent(datestr)
        }
    }).then(res => res.json())
    .then(data => {
        gData = data;

        if(data.error) {
            document.querySelector("schedule-error").innerHTML = data.error;
            return;
        }

        if(data.length === 0) {
            document.querySelector(".list").innerHTML += `
                <div style="width:100vw;height:100vw;background-size:100% 100%;background-position:center;background-image:url(./img/empty.png)"></div>
            `;
        }

        data.forEach((e, i) => {
            console.log(e);
            document.querySelector(".list").innerHTML += `
                <hr width="99.8%" color="#E4AFB8"> 
                <div class="list1">
                    <div class="left" style="background-color:${e.color}">${e.start}~${e.end}</div>
                    <div class="inputmeet">${e.title}</div>
                    <div class="delete" style="font-size:20px;margin-right:5px;color:red;" onclick="deleteSchedule(${i})">X</div>
                </div>
            `;
        });
    }).catch(e => {
        document.querySelector(".schedule-error").innerHTML = "다시 시도해주세요";
    });
}

//달력 이동
function calendarMove(dir) {
    calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + dir, 1);
    calendar();
}

function colorChange(n) {
    const circles = document.querySelector(".popup-color").children;

    for(let i = 0; i < circles.length; i++) {
        circles.item(i).classList.remove("circle-selected");
        if(i === n) circles.item(i).classList.add("circle-selected");
    }

    document.getElementById("color-selected").innerHTML = n;
}

function Two(n) {
    if (n < 10) {
        return "0" + n;
    }
    return n;
}

function addSchedule() {
    if(document.querySelector("#what").value.length === 0) {
        document.querySelector(".popup-error").innerHTML = "*제목을 입력하세요.";
        return;
    } else {
        document.querySelector(".popup-error").innerHTML = "";
    }
    const sendBody = {
        "date": Two(dateSelected.getFullYear()) + "" + Two(dateSelected.getMonth() + 1)+ "" + Two(dateSelected.getDate()) + "",
        "title": encodeURIComponent(document.querySelector("#what").value + ""),
        "start": ((document.querySelector("#start-ap").innerHTML === "오전" ? 0 : 12) + (document.querySelector("#start-time").value * 1)) + "",
        "end": ((document.querySelector("#end-ap").innerHTML === "오전" ? 0 : 12) + (document.querySelector("#end-time").value * 1)) + "",
        "color": ["#f9d7d1", "#f5c098", "#fde0a2", "#bdddbf", "#b2d0eb", "#dac2e1"][document.querySelector("#color-selected").innerHTML]
    };

    //창 닫고 업로드 중 표시

    document.querySelector(".popup-container").style.display = "none";

    fetch(location.href, {
        method: "POST",
        headers: {
            schedule: JSON.stringify(sendBody)
        }
    }).then(res => res.text())
    .then(data => {
        switch(data) {
            case "done":
                selectDate(dateSelected.getDate());
                break;

            case "error":
                document.querySelector(".schedule-error").innerHTML = "*오류가 발생했습니다. 다시 시도해주세요.";
                break;
        }
    }).catch(e => {
        document.querySelector(".schedule-error").innerHTML = "*오류가 발생했습니다. 다시 시도해주세요.";
    });
}

function schedulePopup() {
    document.querySelector(".popup-container").style.display = "flex";
    document.querySelector("#what").value = "";
    let cur = new Date().getHours();
    if(cur > 12) {
        document.querySelector("#start-ap").innerHTML = "오후";
        document.querySelector("#end-ap").innerHTML = "오후";
        cur -= 12;
    } else {
        document.querySelector("#start-ap").innerHTML = "오전";
        document.querySelector("#end-ap").innerHTML = "오전";
    }
    document.querySelector("#start-time").value = cur;
    document.querySelector("#end-time").value = cur;
    colorChange(0);
}

function deleteSchedule(ind) {
    let schedule = gData[ind];
    schedule.title = encodeURIComponent(schedule.title);
    fetch(location.origin + "/deleteSchedule", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'schedule': JSON.stringify(schedule),
        }
    }).then(res => res.text())
    .then(data => {
        switch(data) {
            case "done":
                selectDate(dateSelected.getDate());
                break;

            case "error":
                document.querySelector(".schedule-error").innerHTML = "*오류가 발생했습니다. 다시 시도해주세요.";
                break;
        }
    }).catch(e => {
        console.log(e);
        document.querySelector(".schedule-error").innerHTML = "*오류가 발생했습니다. 다시 시도해주세요.";
    });
}

calendar();
// selectDate(dateSelected.getDate());
document.querySelector(".popup-container").style.display = "none";