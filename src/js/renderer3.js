window.onload = () => {
    const PIXI = require("pixi.js");
    window.PIXI = PIXI;

    const Einfach = require("../json/data.json");
    const { ipcRenderer } = require("electron");

    var isSyncCamera = false;
    var isAppendTags = false;
    var clicked = {
        setting: false,
        tools: false
    }
    var enlarged = false;

    var brfv5 = {};
    var brfv5Manager = null;
    var brfv5Config = null;
    var live2dParams = null;
    var video = null;
    var stream = null;

    var model = null;

    const init = () => {
        return new Promise((resolve, reject) => {
            Promise.all([
                loadResourse("../css/live2d.css", "css"),
                loadResourse("../js/live2d.min.js", "js"),
                loadResourse("../js/live2dcubismcore.min.js", "js"),
                loadResourse("../brfv5-browser/js/brfv5/brfv5_js_tk261120_v5.2.1_trial_no_modules.js", "js")
            ]).then(() => {
                const Htmls = {
                    tools: `<div id="camera" class="ctrl tools tag"></div>`,
                    setting: `
                        <div id="magnifier" class="ctrl setting tag"></div>
                        <div id="append" class="ctrl setting tag"></div>
                        <div id="hidden" class="ctrl setting tag"></div>
                        <div id="close" class="ctrl setting tag"></div>`
                }
                const live2dHTML = `
                <div id="move" class="main"></div>

                <div id="tools" class="main ctrl"></div>
                
                <div id="setting" class="main ctrl"></div>

                <div id="box"></div>
               
                <div id="container">
                    <canvas id="${Einfach.Model.Default.Canvas.Id}"></canvas>
                </div>
                <div style="display: none;">
                    <video id="video" width="200px" height="200px" style="display: none;"></video>
                    <canvas id="imageData" width="200px" height="200px"></canvas>
                </div>`;
                /**
                 * 輸入區 
                 * <div id="chatInput"></div>
                 * <div id="talk"> => 轉語音辨識
                 * |--> 接後台AI
                 */

                document.body.insertAdjacentHTML("beforeend", live2dHTML);
                setTimeout(() => {
                    let rate = 0.5;
                    let oldRate = rate;

                    document.querySelectorAll(".main").forEach((ele) => {
                        ele.style.width = `${Einfach.Setting.MoveImg.Width}px`;
                        ele.style.height = `${Einfach.Setting.MoveImg.Height}px`;
                        ele.style.top = `${Einfach.Setting.MoveImg.Height * rate}px`;
                        ele.style.right = `${Einfach.Setting.MoveImg.Width / 2}px`;

                        switch (ele.id) {
                            case "setting":
                                ele.onclick = () => {
                                    if (clicked.setting) {
                                        ele.style.animationName = "none";
                                        ele.style.animationDuration = "none";
                                        ele.style.animationTimingFunction = "none"
                                        ele.style.animationIterationCount = "none";

                                        onTagChange("");
                                        isAppendTags = false;
                                        clicked.setting = false;
                                    } else if (!isAppendTags) {
                                        ele.style.animationName = "setting";
                                        ele.style.animationDuration = "2s";
                                        ele.style.animationTimingFunction = "linear"
                                        ele.style.animationIterationCount = "infinite";

                                        onTagChange(Htmls.setting);
                                        isAppendTags = true;
                                        clicked.setting = true;
                                    }
                                }
                                break;
                            case "tools":
                                ele.onclick = () => {
                                    if (clicked.tools) {
                                        onTagChange("");
                                        isAppendTags = false;
                                        clicked.tools = false;
                                    } else if (!isAppendTags) {
                                        onTagChange(Htmls.tools);
                                        isAppendTags = true;
                                        clicked.tools = true;
                                    }
                                }
                        }

                        rate += 1.25;
                        oldRate = rate;
                    });

                    const onTagChange = (html) => {
                        let rate = oldRate;
                        // 清空

                        //document.querySelectorAll(".main").forEach(ele => {
                        //    ele.innerHTML = "";
                        //});

                        document.getElementById("box").innerHTML = html;

                        document.querySelectorAll(".tag").forEach((ele) => {
                            ele.style.width = `${Einfach.Setting.MoveImg.Width}px`;
                            ele.style.height = `${Einfach.Setting.MoveImg.Height}px`;
                            ele.style.top = `${Einfach.Setting.MoveImg.Height * rate}px`;
                            ele.style.right = `${Einfach.Setting.MoveImg.Width / 2}px`;
                            ele.className += " select";

                            switch (ele.id) {
                                case "camera":
                                    ele.onclick = () => syncCamera();
                                    break;
                                case "magnifier":
                                    ele.onclick = () => enlarge();
                                    break;
                                case "append":
                                    ele.onclick = () => append();
                                    break;
                                case "hidden":
                                    ele.onclick = () => {
                                        ipcRenderer.send(Einfach.IpcEvent.Hidden, Einfach.Setting.List["MainWindow"]);
                                    }
                                    break;
                                case "close":
                                    ele.onclick = () => {
                                        ipcRenderer.send(Einfach.IpcEvent.Close, Einfach.Setting.List["MainWindow"]);
                                    }
                                    break;
                            }
                            rate += 1.25;
                        });
                    }

                    let hover, out;
                    window.onmouseover = () => {
                        hover = setTimeout(() => {
                            if (out) clearTimeout(out);
                            document.getElementById("move").style.opacity = "1";
                            document.querySelectorAll(".main").forEach(ele => {
                                ele.style.display = "block";
                            });
                        }, 1);
                    };
                    window.onmouseout = () => {
                        out = setTimeout(() => {
                            if (isAppendTags) return;
                            if (hover) clearTimeout(hover);
                            document.getElementById("move").style.opacity = "0";
                            document.querySelectorAll(".main").forEach(ele => {
                                ele.style.display = "none";
                            });
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

    const enableDragModel = (model) => {
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
    const enableDragImg = (model) => {
        model.on("mousedown", (e) => {
            model.x = e.data.global.x;
            model.y = e.data.global.y;
            model.dragging = true;
        });
        model.on("mousemove", (e) => {
            if (model.dragging) {
                model.x = e.data.global.x;
                model.y = e.data.global.y;
            }
        });
        model.on("mouseup", (e) => {
            model.x = e.data.global.x;
            model.y = e.data.global.y;
            model.dragging = false;
        });
    }

    const syncCamera = () => {
        const loadBRFv5Model = () => {
            console.log("loadBRFv5Model");

            return new Promise((resolve, reject) => {
                if (brfv5Manager && brfv5Config) {
                    resolve();
                } else {
                    try {
                        brfv5.appId = Einfach.Brfv5.AppId;
                        brfv5.binaryLocation = Einfach.Brfv5.PathToModels + Einfach.Brfv5.LibraryName;
                        brfv5.modelLocation = Einfach.Brfv5.PathToModels + Einfach.Brfv5.ModelName + '_c';
                        brfv5.modelChunks = Einfach.Brfv5.NumChunksToLoad; // 4, 6, 8
                        brfv5.binaryProgress = (process) => {
                            console.log(process);
                        }
                        brfv5.binaryError = (e) => {
                            reject(e);
                        }
                        brfv5.onInit = (_brfv5Manager, _brfv5Config) => {
                            brfv5Manager = _brfv5Manager;
                            brfv5Config = _brfv5Config;
                            resolve();
                        }

                        brfv5Module(brfv5);
                    } catch (err) {
                        reject(err);
                    }
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

        const configureTracking = () => {
            const imageWidth = video.width;
            const imageHeight = video.height;

            const inputSize = imageWidth > imageHeight ? imageHeight : imageWidth;

            // Setup image data dimensions

            brfv5Config.imageConfig.inputWidth = imageWidth;
            brfv5Config.imageConfig.inputHeight = imageHeight;

            const sizeFactor = inputSize / 480.0;

            // Set face detection region of interest and parameters scaled to the image base size.

            brfv5Config.faceDetectionConfig.regionOfInterest.setTo(0, 0, imageWidth, imageHeight);

            brfv5Config.faceDetectionConfig.minFaceSize = 144 * sizeFactor;
            brfv5Config.faceDetectionConfig.maxFaceSize = 480 * sizeFactor;

            if (imageWidth < imageHeight) {

                // Portrait mode: probably smartphone, faces tend to be closer to the camera, processing time is an issue,
                // so save a bit of time and increase minFaceSize.

                brfv5Config.faceDetectionConfig.minFaceSize = 240 * sizeFactor;
            }

            // Set face tracking region of interest and parameters scaled to the image base size.

            brfv5Config.faceTrackingConfig.regionOfInterest.setTo(0, 0, imageWidth, imageHeight);

            brfv5Config.faceTrackingConfig.minFaceScaleStart = 50.0 * sizeFactor;
            brfv5Config.faceTrackingConfig.maxFaceScaleStart = 320.0 * sizeFactor;

            brfv5Config.faceTrackingConfig.minFaceScaleReset = 35.0 * sizeFactor;
            brfv5Config.faceTrackingConfig.maxFaceScaleReset = 420.0 * sizeFactor;

            brfv5Config.faceTrackingConfig.confidenceThresholdReset = 0.001;

            brfv5Config.faceTrackingConfig.enableStabilizer = true;

            brfv5Config.faceTrackingConfig.maxRotationXReset = 35.0;
            brfv5Config.faceTrackingConfig.maxRotationYReset = 45.0;
            brfv5Config.faceTrackingConfig.maxRotationZReset = 34.0;

            brfv5Config.faceTrackingConfig.numTrackingPasses = 3;
            brfv5Config.faceTrackingConfig.enableFreeRotation = true;
            brfv5Config.faceTrackingConfig.maxRotationZReset = 999.0;

            brfv5Config.faceTrackingConfig.numFacesToTrack = 1;
            brfv5Config.enableFaceTracking = true;

            console.log("configureTracking:", brfv5Config);

            brfv5Manager.configure(brfv5Config);
        }
        if (isSyncCamera) {
            // close
            isSyncCamera = false;
            if (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            document.querySelector("#Ctrl").style.display = "none";
        } else {

            console.log('loadBRFv5Model: done');

            navigator.getUserMedia({ video: true }, async (st) => {
                stream = st;

                await loadBRFv5Model();

                initVideo();

                configureTracking();

                //document.querySelector("#Ctrl").style.display = "block";

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

    const append = () => {
        ipcRenderer.send(Einfach.IpcEvent.Append, Einfach.Setting.List["SettingWindow"]);
    }

    const trackFaces = () => {
        const ctx = document.querySelector("#imageData").getContext('2d');

        ctx.setTransform(-1.0, 0, 0, 1, video.width, 0); // A virtual mirror should be... mirrored
        ctx.drawImage(video, 0, 0, video.width, video.height);
        ctx.setTransform(1.0, 0, 0, 1, 0, 0); // unmirror to draw the results

        brfv5Manager.update(ctx.getImageData(0, 0, video.width, video.height));

        if (brfv5Config.enableFaceTracking) {

            const sizeFactor = Math.min(video.width, video.height) / 480.0;
            const faces = brfv5Manager.getFaces();

            for (let i = 0; i < faces.length; i++) {

                const face = faces[i];

                if (face.state === brfv5.BRFv5State.FACE_TRACKING) {

                    live2dParams = calculateParams(face.landmarks);

                    drawRect(ctx, brfv5Config.faceTrackingConfig.regionOfInterest, '#00a0ff', 2.0);

                    drawCircles(ctx, face.landmarks, '#00a0ff', 2.0 * sizeFactor);
                    drawRect(ctx, face.bounds, '#ffffff', 1.0);

                }
            }
        }

        // requestAnimationFrame(trackFaces)
    }

    const calculateParams = (pos) => {
        let params = {};

        if (pos) {
            var faceL = pos[30].x - pos[2].x;
            var faceR = pos[14].x - pos[30].x;
            var vecL = {
                x: pos[8].x - pos[2].x,
                y: pos[8].y - pos[2].y
            };
            var vecR = {
                x: pos[14].x - pos[8].x,
                y: pos[14].y - pos[8].y
            };
            var lipH = pos[57].y - pos[66].y;
            var eyeHL = pos[41].y - pos[37].y;
            var eyeHR = pos[46].y - pos[44].y;
            var noseH = pos[30].y - pos[27].y;

            if (Einfach.Model.Hiyori.NewVersion) {
                //顔の向き
                params["ParamAngleX"] = 90 * (faceL - faceR) / (faceL + faceR);
                params["ParamAngleY"] = -90 * (vecL.x * vecR.x + vecL.y * vecR.y) / Math.sqrt(vecL.x * vecL.x + vecL.y * vecL.y) / Math.sqrt(vecR.x * vecR.x + vecR.y * vecR.y);
                params["ParamAngleZ"] = -90 * (pos[27].x - pos[30].x) / (pos[27].y - pos[30].y);

                //口の開閉・形
                params["ParamMouthOpenY"] = (pos[66].y - pos[62].y) / lipH - 0.5;
                params["ParamMouthForm"] = 2 * (pos[64].x - pos[60].x) / (pos[42].x - pos[39].x) - 1;

                //目の開閉
                params["ParamEyeLOpen"] = 0.7 * eyeHL / lipH;
                params["ParamEyeROpen"] = 0 // 0.7 * eyeHR / lipH;

                //眉の上下
                params["ParamBrowLY"] = 2 * (pos[37].y - pos[19].y) / lipH - 4;
                params["ParamBrowRY"] = 2 * (pos[44].y - pos[24].y) / lipH - 4;
            } else {

                //顔の向き
                params["PARAM_ANGLE_X"] = 90 * (faceL - faceR) / (faceL + faceR);
                params["PARAM_ANGLE_Y"] = -90 * (vecL.x * vecR.x + vecL.y * vecR.y) / Math.sqrt(vecL.x * vecL.x + vecL.y * vecL.y) / Math.sqrt(vecR.x * vecR.x + vecR.y * vecR.y);
                params["PARAM_ANGLE_Z"] = -90 * (pos[27].x - pos[30].x) / (pos[27].y - pos[30].y);

                //口の開閉・形
                params["PARAM_MOUTH_OPEN_Y"] = (pos[66].y - pos[62].y) / lipH - 0.5;
                params["PARAM_MOUTH_FORM"] = 2 * (pos[64].x - pos[60].x) / (pos[42].x - pos[39].x) - 1;


                //目の開閉
                params["PARAM_EYE_L_OPEN"] = 0.7 * eyeHL / lipH;
                params["PARAM_EYE_R_OPEN"] = 0.7 * eyeHR / lipH;

                //眉の上下
                params["PARAM_BROW_L_Y"] = 2 * (pos[37].y - pos[19].y) / lipH - 4;
                params["PARAM_BROW_R_Y"] = 2 * (pos[44].y - pos[24].y) / lipH - 4;
            }
        }

        return params;
    }

    const drawCircles = (ctx, array, color, radius) => {

        ctx.strokeStyle = null
        ctx.fillStyle = getColor(color, 1.0)

        let _radius = radius || 2.0

        for (let i = 0; i < array.length; ++i) {

            ctx.beginPath()
            ctx.arc(array[i].x, array[i].y, _radius, 0, 2 * Math.PI)
            ctx.fill()
        }
    }

    const drawRect = (ctx, rect, color, lineWidth) => {

        ctx.strokeStyle = getColor(color, 1.0)
        ctx.fillStyle = null

        ctx.lineWidth = lineWidth || 1.0

        ctx.beginPath()
        ctx.rect(rect.x, rect.y, rect.width, rect.height)
        ctx.stroke()
    }

    const drawRects = (ctx, rects, color, lineWidth) => {

        ctx.strokeStyle = getColor(color, 1.0)
        ctx.fillStyle = null

        ctx.lineWidth = lineWidth || 1.0

        for (let i = 0; i < rects.length; ++i) {

            let rect = rects[i]

            ctx.beginPath()
            ctx.rect(rect.x, rect.y, rect.width, rect.height)
            ctx.stroke()
        }
    }

    const getColor = (color, alpha) => {

        const colorStr = color + ''

        if (colorStr.startsWith('rgb')) {

            return color
        }

        if (colorStr.startsWith('#')) {

            color = parseInt('0x' + colorStr.substr(1))
        }

        return 'rgb(' +
            (((color >> 16) & 0xff).toString(10)) + ', ' +
            (((color >> 8) & 0xff).toString(10)) + ', ' +
            (((color) & 0xff).toString(10)) + ', ' + alpha + ')'
    }

    const InitGragFile = (app) => {
        const handle = {
            "img": (files) => {
                let filters = ["jpg", "png", "svg", "ico"];
                let f = false;
                filters.forEach(fil => {
                    if (files[0].path.endsWith("." + fil)) {
                        f = files[0];
                    }
                });
                return f;
            },
            "mp4": (files) => {
                if (files[0].path.endsWith(".mp4")) {
                    return files[0];
                }
                return false;
            },
            "mp3": (files) => {
                let f = [];
                for (let i = 0; i < files.length; i++) {
                    f.push({
                        name: files[i].name,
                        path: files[i].path
                    });
                }
                f = f.filter(sf => sf.path.endsWith(".mp3"));
                return f.length > 0 ? f : false;
            }
            // e.dataTransfer.files[0].path
        }
        window.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            return false;
        };

        window.ondrop = (e) => {
            e.preventDefault();
            let img = null;
            let mp4 = null;
            if (e.dataTransfer.files.length == 1) {
                img = handle["img"](e.dataTransfer.files);
                mp4 = handle["mp4"](e.dataTransfer.files);
            }
            let mp3 = handle["mp3"](e.dataTransfer.files);

            if (mp3) return ipcRenderer.send(Einfach.IpcEvent.MusicStart, mp3);

            if (img) {
                let sprite = PIXI.Sprite.from(img.path)
                app.stage.addChild(sprite);
                sprite.x = Einfach.Model.Hiyori.Canvas.Width * 0.5;
                sprite.y = Einfach.Model.Hiyori.Canvas.Height * 0.7;
                sprite.anchor.set(0.5, 0);
                app.stage.sortChildren();
                // enableDragImg(sprite);
            }
            if (mp4) {

            }
            return false;
        };

        window.ondragleave = () => {
            return false;
        };
    }



    (async () => {
        await init();

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
        model.zIndex = 999;
        model.scale.set(Einfach.Model.Hiyori.Scale);
        model.anchor.set(0.5, 0);

        model.internalModel.motionManager.stopAllMotions();

        enableDragModel(model);
        InitGragFile(app);

        app.ticker.add(() => {
            if (isSyncCamera) {
                model.internalModel.motionManager.stopAllMotions();

                trackFaces();

                if (Einfach.Model.Hiyori.NewVersion) {
                    for (let paramName in live2dParams) {
                        model.internalModel.coreModel.setParameterValueById(paramName, live2dParams[paramName]);
                    }
                } else {
                    for (let paramName in live2dParams) {
                        model.internalModel.coreModel.setParamFloat(paramName, live2dParams[paramName]);
                    }
                }

            } else if (model.internalModel.motionManager.isFinished()) {
                model.motion(Einfach.Model.Hiyori.Motions);
            }
        });
    })();
}



