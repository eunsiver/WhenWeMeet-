const express = require("express");
const app = express();
/*const cors = require("cors");
app.use(cors());*/
const PORT = 80;

const session = require("express-session");
const FileStore = require("session-file-store")(session);
/*
본래 express-session은 메모리 상에서 관리되기 때문에
별도의 모듈을 이용해 로컬 스토리지에 저장되도록 한다. -> 서버가 다운되었다 다시 켜질 경우에도 세션이 유지됨.
*/
const bodyParser = require("body-parser");

//회원가입을 위한 crypto
const crypto = require("crypto");
const fs = require("fs-extra");
const { Session } = require("inspector");
const dbpath = __dirname + "/db/";

//email암호화 규칙 -> 유저 코드 생성 시 사용됨
const emailSalt = "117103111";

/*
const nodemailer = require('nodemailer')
async sendMail(email) {
    try {
		const mailConfig = {
			service: 'Naver',
			host: 'smtp.naver.com',
			port: 587,
			auth: {
			user: process.env.MAIL_EMAIL,
			pass: process.env.MAIL_PASSWORD
			}
		}
		let message = {
			from: process.env.MAIL_EMAIL,
			to: email,
			subject: '이메일 인증 요청 메일입니다.',
			html: '<p> 여기에 인증번호나 token 검증 URL 붙이시면 됩니다! </p>'
		}
		let transporter = nodemailer.createTransport(mailConfig)
		transporter.sendMail(message)
	} catch (error) {
		console.log(error)
	}
}*/

//쿠키 유지 기간
const maxage = 604800000; //일주일
app.use(session({
    secret: "Keyboard cat#@!", //uuid 생성시 사용 되는 secret
    resave: false,
    saveUninitialized: true,
    store: new FileStore(), //세션을 로컬 스토리지에서 관리하기 위한 옵션
    cookie: {
        path: "/", //브라우저에서 root에 쿠키가 저장되므로 현재 사이트 전체에서 사용 가능하다.
        maxAge: maxage //쿠키 유지 기간
    }
}));

//user urlencoded cuz bodyParser is deprecated
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));

//static path
app.use(express.static("./web/public"));

app.get("/", (req, res) => {
    if (!req.session || !req.session.logined) {
        res.redirect("/login");
        return;
    }
    if (!fs.existsSync(dbpath + req.session.code + "/")) {
        req.session.destroy();
        res.redirect("/");
    }
    req.session.touch();
    res.sendFile(__dirname + "/web/calendar.html");
});

app.post("/", (req, res) => {
    if (!req.headers.schedule) {
        console.log("* schedule 헤더 없음 확인 요망");
        res.send("error");
        return;
    }

    let accept = JSON.parse(decodeURIComponent(req.headers.schedule));
    accept.code = req.session.code;

    if (!fs.existsSync(dbpath + req.session.code + "/" + accept.date)) {
        let schedules = [JSON.parse(JSON.stringify(accept))];
        fs.writeFile(dbpath + req.session.code + "/" + accept.date, JSON.stringify(schedules), function(err3) {
            if (err3) {
                console.log(err3);
                res.send("error");
            }
            res.send("done");
        });
        return;
    }
    fs.readdir(dbpath + req.session.code + "/", function(err, list) {
        if (err) {
            console.log(err);
            res.send("error");
            return;
        }
        if (list.includes(accept.date)) {
            fs.readFile(dbpath + req.session.code + "/" + accept.date, function(err2, buff) {
                if (err2) {
                    console.log(err2);
                    res.send("error");
                    return;
                }
                let schedules = JSON.parse(buff.toString("utf-8"));
                schedules.push(JSON.parse(JSON.stringify(accept)));
                fs.writeFile(dbpath + req.session.code + "/" + accept.date, JSON.stringify(schedules), function(err3) {
                    if (err3) {
                        console.log(err3);
                        res.send("error");
                    }
                    res.send("done");
                });
            });
        }
    });
});

app.post("/deleteSchedule", (req, res) => {
    if (!req.headers.schedule) {
        console.log("* schedule 헤더 없음 확인 요망");
        res.send("error");
        return;
    }

    let accept = JSON.parse(decodeURIComponent(req.headers.schedule));
    accept.code = req.session.code;

    if (!fs.existsSync(dbpath + req.session.code + "/" + accept.date)) {
        res.send("error");
        console.log("* 존재하지 않는 스케줄에 대한 삭제 요청\n" + JSON.stringify(accept));
    }

    fs.readdir(dbpath + req.session.code + "/", function(err, list) {
        if (err) {
            console.log(err);
            res.send("error");
            return;
        }
        if (list.includes(accept.date)) {
            fs.readFile(dbpath + req.session.code + "/" + accept.date, function(err2, buff) {
                if (err2) {
                    console.log(err2);
                    res.send("error");
                    return;
                }
                let schedules = JSON.parse(buff.toString("utf-8"));
                
                let del = null;

                schedules.forEach((e, i) => {
                    if (Object.keys(e).every(v => accept[v] == e[v])) {
                        del = i;
                    }
                });

                if (del !== null) {
                    schedules.splice(del, 1);
                }

                fs.writeFile(dbpath + req.session.code + "/" + accept.date, JSON.stringify(schedules), function(err3) {
                    if (err3) {
                        console.log(err3);
                        res.send("error");
                    }
                    res.send("done");
                });
            });
        }
    });
});

app.post("/schedule", (req, res) => {
    if (fs.existsSync(dbpath + req.session.code + "/" + req.headers.dateselected + "")) {
        fs.readFile(dbpath + req.session.code + "/" + req.headers.dateselected, function(err, buff) {
            if (err) {
                console.log(err);
                res.json({ "error": "서버 오류(100)" });
                return;
            }
            res.json(JSON.parse(buff.toString("utf-8")));
        });
        return;
    }
    res.json([]);
});

app.get("/friendList", (req, res) => {
    if (!req.session || !req.session.logined) {
        res.send("logout");
        return;
    }
    getFriends(req.session.code).then(frs => res.json(frs));
});

app.get("/friends", (req, res) => {
    if (!req.session || !req.session.logined) {
        res.redirect("/login");
        return;
    }
    req.session.touch();
    if (!fs.existsSync(dbpath + req.session.code + "/")) {
        req.session.destroy();
        res.redirect("/");
    }
    getFriends(req.session.code).then(frs => {
        let frsList = "";
        for (data of frs) {
            if (data.code === req.session.code) {
                data.name = "나";
            }
            frsList += `
				<div class="img_box">
					<img src="${data.profile}" width="32px" height="32px">
					<div class="f-name">${data.name}</div>
					<!-- f-message = 글자 제한 11자 -->
					<div class="f-message">${data.info}</div>
				</div>
			`;
        }

        fs.readFile(__dirname + "/web/friends.html", function(err, data) {
            if (err) {
                res.redirect("/sorry");
                console.error(err);
                return;
            }
            res.send(data.toString("utf-8").replace("$[[friends]]", frsList));
        });
    });
});

// app.delete("/friends", (req, res) => {
// 	if(!req.body.code) {
// 		res.json({"msg": "error"});
// 		return;
// 	}

// 	if(!fs.existsSync(dbpath + req.body.code)) {
// 		res.json({"msg": "no"});
// 		return;
// 	}
// });

app.post("/friends", (req, res) => {
    if (!req.body.code) {
        res.json({ "msg": "error" });
        return;
    }

    if (!fs.existsSync(dbpath + req.body.code)) {
        res.json({ "msg": "no" });
        return;
    }

    fs.readFile(dbpath + req.session.code + "/friends", function(err, data) {
        if (err) {
            res.json({ "msg": "error" });
            return;
        }
        data = data.toString("utf-8");
        let friends = data.split(",");
        if (friends.includes(req.body.code)) {
            res.json({ "msg": "already" });
            return;
        }
        friends.push(req.body.code);
        fs.writeFile(dbpath + req.session.code + "/friends", friends.join(","), "utf-8", function(err) {
            if (err) {
                res.json({ "msg": "error" });
                return;
            }
            fs.readFile(dbpath + req.body.code + "/userinfo", function(err2, data) {
                if (err2) {
                    res.json({ "msg": "error" });
                    return;
                }
                data = data.toString("utf-8");
                fs.readFile(dbpath + req.body.code + "/profile.image", function(err3, data2) {
                    if (err3) {
                        res.json({ "msg": "error" });
                        return;
                    }
                    res.json({ "msg": "done" });
                });
            });
        });
    });
})

function getFriends(code) {
    return new Promise((resolve, reject) => {
        fs.readFile(dbpath + code + "/friends", function(err, data) {
            if (err) {
                reject(err);
                return;
            }
            if (!data) fs.writeFile(dbpath + code + "/friends", code, "utf-8");
            data = data.toString("utf-8");
            let friends = data.split(",");
            let promises = [];
            for (i of friends) {
                if (i.length !== 8) {
                    friends.splice(friends.indexOf(i), 1);
                    continue;
                }
                if (!fs.existsSync(dbpath + i)) {
                    friends.splice(friends.indexOf(i), 1);
                    continue;
                }
                promises.push(getFriend(i));
            }
            if (friends !== data.split(",")) {
                fs.writeFile(dbpath + code + "/friends", friends.join(","), "utf-8");
            }
            Promise.all(promises).then(ret => resolve(ret));
        });
    });
}

function getFriend(code) {
    return new Promise((resolve, reject) => {
        fs.readFile(dbpath + code + "/userinfo", function(err, data) {
            if (err || !data) {
                reject(err);
                return;
            }
            data = JSON.parse(data.toString("utf-8"));
            let json = {};
            json.name = data.name;
            json.info = data.info;
            json.code = data.code;
            fs.readFile(dbpath + code + "/profile.image", function(err2, data2) {
                if (err2) reject(err2);
                json.profile = data2.toString("utf-8");
                resolve(json);
            })
        });
    });
}

app.get("/manna", (req, res) => {
    if (!req.session || !req.session.logined) {
        res.redirect("/login");
        return;
    }
    if (!fs.existsSync(dbpath + req.session.code + "/")) {
        req.session.destroy();
        res.redirect("/");
    }
    req.session.touch();
    res.sendFile(__dirname + "/web/manna.html");
});

app.post("/manna", (req, res) => {
    if (!req.session || !req.session.logined) {
        res.redirect("/login");
        return;
    };
    if (!fs.existsSync(dbpath + req.session.code + "/")) {
        req.session.destroy();
        res.redirect("/");
    }
    getSchedules(JSON.parse(req.headers.friends), JSON.parse(req.headers.dates)).then(result => res.send(result));
});

function getSchedules(codes, dates) {
    return new Promise((resolve, reject) => {
        let promises = [];
        for (i of codes) {
            if (i.length !== 8) {
                codes.splice(codes.indexOf(i), 1);
                continue;
            }
            if (!fs.existsSync(dbpath + i)) {
                codes.splice(codes.indexOf(i), 1);
                continue;
            }
            promises.push(getSchedule(i, dates));
        }
        Promise.all(promises).then(res => resolve(res)).catch(e => reject(e));
    })
}

function getSchedule(code, dates) {
    return new Promise((resolve, reject) => {
        let promises = [];
        for (i of dates) {
            promises.push(new Promise((res, rej) => {
                if (!fs.existsSync(dbpath + code + "/" + i)) {
                    res([]);
                    return;
                }
                fs.readFile(dbpath + code + "/" + i, function(err, data) {
                    if (err || !data) {
                        rej(err);
                        return;
                    }
                    res(JSON.parse(data.toString("utf-8")));
                });
            }));
        }
        Promise.all(promises).then(res => resolve({ "code": code, "schedules": res })).catch(e => reject(e));
    });
}

app.get("/mypage", (req, res) => {
    if (!req.session || !req.session.logined) {
        res.redirect("/login");
        return;
    }
    req.session.touch();
    fs.readFile(__dirname + "/web/mypage.html", function(err, buff) {
        if (err) {
            console.log(err);
            res.redirect("/sorry");
            return;
        }
        let html = buff.toString("utf-8");
        if (!fs.existsSync(dbpath + req.session.code + "/")) {
            req.session.destroy();
            res.redirect("/");
        }
        fs.readFile(dbpath + req.session.code + "/userinfo", function(err2, buff2) {
            if (err2) {
                console.log(err2);
                res.redirect("/sorry");
                return;
            }
            fs.readFile(dbpath + req.session.code + "/profile.image", function(err3, buff3) {
                if (err3) {
                    console.log(err3);
                    res.redirect("/sorry");
                    return;
                }
                let user = JSON.parse(buff2.toString("utf-8"));
                buff3 = buff3.toString("utf-8");
                html = html.replace("$[[code]]", user.code)
                    .replace("$[[name]]", user.name)
                    .replace("$[[info]]", user.info)
                    .replace("$[[profile]]", buff3);
                res.send(html);
            })
        });
    });
});

app.post("/profileImage", (req, res) => {
    if (!req.body.profile) {
        console.log(new Date().toLocaleString() + " : 프로필 이미지 요청이 없는데요?");
        console.log(req.body);
        res.send("error");
        return;
    }

    fs.writeFile(dbpath + req.session.code + "/profile.image", req.body.profile, function(err) {
        if (err) {
            res.send("error");
            return;
        }
        res.send("done");
    });
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/web/login.html");
});

app.post("/login", (req, res) => {
    crypto.scrypt(req.body.email, emailSalt, 4, function(err, code) {
        code = code.toString("hex");
        if (err) {
            res.redirect("/login?msg=retry");
            return;
        }
        if (!fs.existsSync(dbpath + code)) {
            res.redirect("/login?msg=!exist");
            return;
        }
        fs.readFile(dbpath + code + "/userinfo", function(err, data) {
            if (err) {
                console.log(err);
                res.redirect("/sorry");
                return;
            }
            data = JSON.parse(data.toString('utf8'));
            crypto.scrypt(req.body.pwd, data.salt, 32, function(err, hash) {
                hash = hash.toString("hex");
                if (err) res.redirect("/sorry");
                else if (hash === data.hash) {
                    req.session.logined = true;
                    req.session.code = data.code;
                    req.session.save(function(err) {
                        if (err) console.error(err);
                        req.session.reload(function(err) {
                            if (err) console.error(err);
                            res.redirect("/");
                        });
                    });
                } else {
                    res.redirect("/login?msg=wrong");
                }
            });
        });
    });
});

//sorry(죄송합니다) 페이지
app.get("/sorry", (req, res) => {
    let colors = ["#dda162", "#5271ff", "#ff66c4", "#ffffff", "#41584b"];
    let idx = (Math.random() * 5) | 0;
    while (idx === 5) idx = (Math.random() * 5) | 0;
    res.send(`
        <html style="width:100%;height:100%;margin:0;padding:0">
            <body style="width:100%;height:100%;margin:0;padding:0">
                <div style="width:100%;height:100%;margin:0;padding:0;display:flex;flex-direction:column;justify-content:center;text-align:center;background-image:url(./img/sorry${idx + ""}.png);background-size:100vw 100vw;background-position:center center;background-repeat:no-repeat;background-color:${colors[idx]};">
                <div>
            </body>
        <html>
    `);
});

app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/web/signup.html");
});

app.post("/signup", (req, res) => {
    let salt = Math.round((new Date().valueOf() * Math.random())) + "";

    const userData = {
        "name": req.body.name,
        "email": req.body.email,
        "salt": salt,
        "email-registered": false,
        "status": "idle",
        "info": req.body.info ? req.body.info : ""
    };

    crypto.scrypt(decodeURIComponent(req.body.email), emailSalt, 4, function(err, code) {
        code = code.toString("hex");
        if (err) {
            console.error(err);
            res.redirect("/sorry");
        }
        userData.code = code;
        crypto.scrypt(req.body.pwd, salt, 32, function(err, hash) {
            hash = hash.toString("hex");
            userData.hash = hash;
            try {
                fs.mkdirSync(dbpath + code + "/");
                fs.writeFile(dbpath + code + "/userinfo", JSON.stringify(userData), function() {
                    fs.copyFile(__dirname + "/profile.image", dbpath + code + "/profile.image", (err) => {
                        if (err) {
                            console.error(err);
                            res.redirect("/sorry");
                            return;
                        }
                        fs.writeFile(dbpath + code + "/friends", code, "utf-8", function(err2) {
                            if (err2) {
                                console.error(err2);
                                res.redirect("/sorry");
                                fs.remove(dbpath + req.session.code + "/", function(err) {
                                    if (err) {
                                        res.redirect("/sorry");
                                        console.log(err);
                                        return;
                                    }
                                });
                                return;
                            }
                            req.session.logined = true;
                            req.session.code = code;
                            req.session.save(function(err) {
                                if (err) console.error(err);
                                req.session.reload(function(err) {
                                    if (err) console.error(err);
                                    res.redirect("/");
                                });
                            });
                        });
                    });
                });
            } catch (e) {
                console.error(e);
                res.redirect("/sorry");
            }
        });
    });
});

app.post("/secede", (req, res) => {
    fs.remove(dbpath + req.session.code + "/", function(err) {
        if (err) {
            res.redirect("/sorry");
            console.log(err);
            return;
        }
        req.session.destroy();
        res.redirect("/seceded");
    });
});

app.get("/seceded", (req, res) => {
    res.send(`
		<div style="display:flex;flex-direction:column;justify-content:center;text-align:center;margin:0;padding:0;">
			<div style="font-weight:bold;font-size:20px;margin:0;padding:0;">지금까지 이용해주셔서 감사했습니다...</div>
			<a href="/" style="margin:0;padding:0;">
				<div style="font-weight:normal;font-size:16px;margin:0;padding:0;">첫 화면으로</div>
			</a>
		</div>
	`);
});

app.get("/id", (req, res) => {
    const email = req.query.email;

    crypto.scrypt(decodeURIComponent(req.query.email), emailSalt, 4, function(err, code) {
        code = code.toString("hex");
        if (err) {
            res.send("error");
            return;
        } else if (fs.existsSync(dbpath + code + "/")) {
            res.send("exist");
        } else {
            res.send("ok");
        }
    });
});

app.get("/alive", (req, res) => {
    res.send("yes");
});

app.post("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.listen(PORT, _ => {
    console.log("*listening at " + PORT);
});