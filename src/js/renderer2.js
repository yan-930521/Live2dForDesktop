window.onload = () => {
    const PIXI = require("pixi.js");
    window.PIXI = PIXI;

    const Einfach = require("./src/json/data.json");

    var isSyncCamera = false;
    var enlarged = false;

    var tracker = null;
    var live2dParams = null;
    var video = null;
    var stream = null;

    var model = null;

    const initLive2d = () => {
        return new Promise((resolve, reject) => {
            Promise.all([
                loadResourse("./src/css/live2d.css", "css"),
                loadResourse("./src/js/live2d.min.js", "js"),
                loadResourse("./src/js/live2dcubismcore.min.js", "js"),
                loadResourse("./src/js/clmtrackr.js", "js"),
                loadResourse("./src/js/model_pca_20_svm.js", "js")
            ]).then(() => {
                const live2dHTML = `
                <div id="move"></div>
                <div id="setting"></div>
                
                <div id="tools" class="select"></div>
                <div id="camera" class="select"></div>
                <div id="magnifier" class="select"></div>
                <div id="container">
                    <canvas id="${Einfach.Model.Default.Canvas.Id}"></canvas>
                </div>
                <div id="videoCtrl" style="display: none;">
                    <video id="video" width="100px" height="100px"></video>
                </div>`;
                document.body.insertAdjacentHTML("beforeend", live2dHTML);
                setTimeout(() => {
                    let move = document.getElementById("move");
                    move.style.width = `${Einfach.Setting.MoveImg.Width}px`;
                    move.style.height = `${Einfach.Setting.MoveImg.Height}px`;
                    move.style.top = `${Einfach.Setting.MoveImg.Height / 2}px`;
                    move.style.right = `${Einfach.Setting.MoveImg.Width / 2}px`;

                    let setting = document.getElementById("setting");
                    setting.style.width = `${Einfach.Setting.MoveImg.Width}px`;
                    setting.style.height = `${Einfach.Setting.MoveImg.Height}px`;
                    setting.style.top = `${Einfach.Setting.MoveImg.Height * 1.75}px`;
                    setting.style.right = `${Einfach.Setting.MoveImg.Width / 2}px`;

                    document.querySelectorAll(".select").forEach((select, n) => {
                        select.style.width = `${Einfach.Setting.MoveImg.Width}px`;
                        select.style.height = `${Einfach.Setting.MoveImg.Height}px`;
                        select.style.top = `${Einfach.Setting.MoveImg.Height * (1.75 + ((n + 1) * 1.25))}px`;
                        select.style.right = `${Einfach.Setting.MoveImg.Width / 2}px`;

                        switch (select.id) {
                            case "camera":
                                select.onclick = () => syncCamera();
                                break;
                            case "magnifier":
                                select.onclick = () => enlarge();
                                break;
                        }
                    });

                    let settingClicked = false;
                    setting.onclick = () => {
                        if (settingClicked) {
                            document.querySelectorAll(".select").forEach(select => {
                                select.style.display = "none";

                                setting = document.getElementById("setting");
                                setting.style.display = "none";
                                setting.style.animationName = "none";
                                setting.style.animationDuration = "none";
                                setting.style.animationTimingFunction = "none"
                                setting.style.animationIterationCount = "none";
                                setting.style.filter = "drop-shadow(0 0 5px rgb(203, 229, 241))";
                                setting.style.webkitFilter = "drop-shadow(0 0 5px rgb(203, 229, 241))";
                                document.getElementById("move").style.opacity = "0";
                            });
                            settingClicked = false;
                        } else {
                            document.querySelectorAll(".select").forEach(select => {
                                select.style.display = "block";

                                setting = document.getElementById("setting");
                                setting.style.display = "block";
                                setting.style.animationName = "setting";
                                setting.style.animationDuration = "2s";
                                setting.style.animationTimingFunction = "linear"
                                setting.style.animationIterationCount = "infinite";
                                setting.style.filter = "drop-shadow(0 0 5px rgb(203, 229, 241))";
                                setting.style.webkitFilter = "drop-shadow(0 0 5px rgb(203, 229, 241))";
                                document.getElementById("move").style.opacity = "1";
                            });
                            settingClicked = true;
                        }
                    }

                    let hover, out;
                    window.onmouseover = () => {
                        hover = setTimeout(() => {
                            if (out) clearTimeout(out);
                            document.getElementById("setting").style.display = "block";
                            document.getElementById("move").style.opacity = "1";
                        }, 1);
                    };
                    window.onmouseout = () => {
                        out = setTimeout(() => {
                            if (settingClicked) return;
                            if (hover) clearTimeout(hover);
                            document.getElementById("setting").style.display = "none";
                            document.getElementById("move").style.opacity = "0";
                        }, 3000);
                    };
                }, 0);

                resolve();
            }).catch(err => reject(err));
        });
    }

    const loadResourse = (url, type) => {
        return new Promise((resolve, reject) => {
            let tag;

            if (type === "css") {
                tag = document.createElement("link");
                tag.rel = "stylesheet";
                tag.href = url;
            } else if (type === "js") {
                tag = document.createElement("script");
                tag.src = url;
            }

            if (tag) {
                tag.onload = () => resolve(url);
                tag.onerror = () => reject(url);
                document.head.appendChild(tag);
            }
        });
    }

    const enableDrag = () => {
        model.buttonMode = true;
        model.on("pointerdown", (e) => {
            model.dragging = true;
            model._pointerX = e.data.global.x - model.x;
            model._pointerY = e.data.global.y - model.y;
        });
        model.on("pointermove", (e) => {
            if (model.dragging) {
                model.position.x = e.data.global.x - model._pointerX;
                model.position.y = e.data.global.y - model._pointerY;
            }
        });
        model.on("pointerupoutside", () => (model.dragging = false));
        model.on("pointerup", () => (model.dragging = false));
    }

    const syncCamera = () => {

        const initTracker = async () => {
            return new Promise((resolve, reject) => {
                if (!clm || !pModel) {
                    Promise.all([
                        loadResourse("./src/js/clmtrackr.js", "js"),
                        loadResourse("./src/js/model_pca_20_svm.js", "js"),
                    ]).then(() => {
                        if (!clm || !pModel) {
                            reject(Einfach.Error.Clm);
                        }
                        tracker = new clm.tracker({ useWebGL: true });
                        tracker.init(pModel);

                        resolve(tracker);
                    })
                } else {

                    tracker = new clm.tracker({ useWebGL: true });
                    tracker.init(pModel);

                    resolve(tracker);
                }
            });
        }

        const initVideo = () => {
            video = document.getElementById("video");

            if (!video) {
                console.error(Einfach.Error.Video_not_found)
                return null;
            }

            video.srcObject = stream;
            video.play();

            return video;
        }

        if (isSyncCamera) {
            // close
            isSyncCamera = false;
            if (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
            if (tracker) {
                tracker.stop();
            }

            document.querySelector("#videoCtrl").style.display = "none";
        } else {
            navigator.getUserMedia({ video: true }, async (st) => {
                stream = st;

                await initTracker();

                initVideo();

                tracker.start(video);

                //document.querySelector("#videoCtrl").style.display = "block";

                isSyncCamera = true;
            }, () => {
                console.error(Einfach.Error.Camera);
            });
        }

    }

    const enlarge = () => {
        if (enlarged) {
            // 縮小
            model.scale.set(Einfach.Model.Hiyori.Scale);
            enlarged = false;
        } else {
            model.scale.set(Einfach.Model.Hiyori.Scale * 2);
            enlarged = true;
        }
    }

    const calculateParams = () => {
        let params = { SCORE: tracker.getScore() };
        let pos = tracker.getCurrentPosition();

        if (pos) {
            var faceL = pos[62][0] - pos[2][0];
            var faceR = pos[12][0] - pos[62][0];
            var vecL = [pos[2][0] - pos[7][0], pos[2][1] - pos[7][1]];
            var vecR = [pos[12][0] - pos[7][0], pos[12][1] - pos[7][1]];
            var lipH = pos[53][1] - pos[57][1];
            var eyeHL = pos[26][1] - pos[24][1];
            var eyeHR = pos[31][1] - pos[29][1];
            var noseH = pos[62][1] - pos[33][1];

            if (Einfach.Model.Hiyori.NewVersion) {
                //顔の向き
                params["ParamAngleX"] = 90 * (faceL - faceR) / (faceL + faceR);
                params["ParamAngleY"] = -90 * (vecL[0] * vecR[0] + vecL[1] * vecR[1]) / Math.sqrt(vecL[0] * vecL[0] + vecL[1] * vecL[1]) / Math.sqrt(vecR[0] * vecR[0] + vecR[1] * vecR[1]);
                params["ParamAngleZ"] = -90 * (pos[33][0] - pos[62][0]) / (pos[33][1] - pos[62][1]);

                //口の開閉・形
                params["ParamMouthOpenY"] = (pos[57][1] - pos[60][1]) / lipH - 0.5;
                params["ParamMouthForm"] = 2 * (pos[50][0] - pos[44][0]) / (pos[30][0] - pos[25][0]) - 1;

                //眼球の動き
                params["ParamEyeBallX"] = (pos[27][0] - pos[23][0]) / (pos[25][0] - pos[23][0]) - 0.5;
                params["ParamEyeBallY"] = (pos[27][1] - pos[24][1]) / eyeHL - 0.5;

                //目の開閉
                params["ParamEyeLOpen"] = 0.7 * eyeHL / lipH;
                params["ParamEyeROpen"] = 0.7 * eyeHR / lipH;

                //眉の上下
                params["ParamBrowLY"] = 2 * (pos[24][1] - pos[21][1]) / lipH - 4;
                params["ParamBrowRY"] = 2 * (pos[29][1] - pos[17][1]) / lipH - 4;
            } else {

                //顔の向き
                params["PARAM_ANGLE_X"] = 90 * (faceL - faceR) / (faceL + faceR);
                params["PARAM_ANGLE_Y"] = -90 * (vecL[0] * vecR[0] + vecL[1] * vecR[1]) / Math.sqrt(vecL[0] * vecL[0] + vecL[1] * vecL[1]) / Math.sqrt(vecR[0] * vecR[0] + vecR[1] * vecR[1]);
                params["PARAM_ANGLE_Z"] = -90 * (pos[33][0] - pos[62][0]) / (pos[33][1] - pos[62][1]);

                //口の開閉・形
                params["PARAM_MOUTH_OPEN_Y"] = (pos[57][1] - pos[60][1]) / lipH - 0.5;
                params["PARAM_MOUTH_FORM"] = 2 * (pos[50][0] - pos[44][0]) / (pos[30][0] - pos[25][0]) - 1;

                //眼球の動き
                params["PARAM_EYE_BALL_X"] = (pos[27][0] - pos[23][0]) / (pos[25][0] - pos[23][0]) - 0.5;
                params["PARAM_EYE_BALL_Y"] = (pos[27][1] - pos[24][1]) / eyeHL - 0.5;

                //目の開閉
                params["PARAM_EYE_L_OPEN"] = 0.7 * eyeHL / lipH;
                params["PARAM_EYE_R_OPEN"] = 0.7 * eyeHR / lipH;

                //眉の上下
                params["PARAM_BROW_L_Y"] = 2 * (pos[24][1] - pos[21][1]) / lipH - 4;
                params["PARAM_BROW_R_Y"] = 2 * (pos[29][1] - pos[17][1]) / lipH - 4;
            }
        }

        return params;
    }



    (async () => {
        await initLive2d();

        const { Live2DModel } = require("pixi-live2d-display");

        const app = new PIXI.Application({
            view: document.getElementById(Einfach.Model.Hiyori.Canvas.Id),
            autoStart: true,
            transparent: true
        });

        model = await Live2DModel.from(Einfach.ResourcePath + Einfach.Model.Hiyori.FileName);

        console.log(model);

        app.stage.addChild(model);

        model.x = Einfach.Model.Hiyori.Canvas.Width * 0.5;
        model.y = Einfach.Model.Hiyori.Canvas.Height * 0.7;
        model.scale.set(Einfach.Model.Hiyori.Scale);
        model.anchor.set(0.5, 0);

        model.internalModel.motionManager.stopAllMotions();

        enableDrag();

        app.ticker.add(() => {
            if (isSyncCamera) {
                model.internalModel.motionManager.stopAllMotions();

                live2dParams = calculateParams();

                if (Einfach.Model.Hiyori.NewVersion) {
                    for (let paramName in live2dParams) {
                        model.internalModel.coreModel.setParameterValueById(paramName, live2dParams[paramName]);
                    }
                } else {
                    for (let paramName in live2dParams) {
                        model.internalModel.coreModel.setParamFloat(paramName, live2dParams[paramName]);
                    }
                }

                console.log(live2dParams);
            } else if (model.internalModel.motionManager.isFinished()) {
                model.motion(Einfach.Model.Hiyori.Motions);
            }
        });
    })();
}



