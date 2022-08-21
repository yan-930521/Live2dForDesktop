const { Einfach } = require("./src/js/export.js");

window.onload = () => {
    (() => {
        Promise.all([
            loadResourse("./src/css/live2d.css", "css"),
            loadResourse("./src/js/live2d.min.js", "js")
        ]).then(async () => {
            // default model
            startLive2d();
        });
    })();
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

const startLive2d = (model = null) => {
    if (!Einfach) return;

    const loadModel = (modelName) => {
        const fileName = Einfach.ResourcePath + modelName;
        console.log(fileName)
        window.loadlive2d("live2d", "./src/models/asuna_01/asuna_01.model.json");
    }

    let move = document.getElementById("move");
    move.width = Einfach.Setting.MoveImg.Width;
    move.height = Einfach.Setting.MoveImg.Height;
    let live2d = document.getElementById("live2d");
    live2d.width = window.innerWidth;
    live2d.height = window.innerHeight;
    window.onresize = () => {
        //live2d.width = window.innerWidth;
        //live2d.height = window.innerHeight;
    }
    // document.body.insertAdjacentHTML("beforeend", live2dHTML);
    //setTimeout(() => {

    //}, 0);

    model = model == null ? Einfach.Model.Default.ModelName : model;

    loadModel(model);
}