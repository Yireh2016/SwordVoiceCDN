let express = require("express");
let fs = require("fs");
let multer = require("multer");
let path = require("path");

//services
let applySmartCrop = require("./services/cropImage");

let router = express.Router();

let upload = multer({ dest: "uploads/" });

router.get("/getClasses/:filename", (req, res) => {
  const { filename } = req.params;
  const url = filename;

  const path = `./uploads/articles/${url}/${filename}.css`;
  const readFile = () => {
    fs.readFile(
      `./uploads/articles/${url}/${filename}.css`,
      "utf-8",
      (err, data) => {
        if (err) {
          console.log("there was an error reading file", err);
          res.status(404);
        } else {
          res.status(200).send(data);
        }
      }
    );
  };

  fs.access(path, fs.F_OK, err => {
    if (err) {
      console.log("file do not exist", err);
      res.status(404).send();
      return;
    }

    readFile();
  });
});

router.post("/createPost/:url", (req, res) => {
  const { url } = req.params;

  console.log("url del post ", url);

  if (!fs.existsSync(`./uploads/articles/${url}`)) {
    fs.mkdirSync(`./uploads/articles/${url}`);
  }

  res.status(200).send();
});

router.post("/uploadTempFile/", upload.single("file"), (req, res) => {
  const fileURL = req.body.fileURL;

  const file = req.file;

  console.log("file", file);

  fs.rename(
    `./uploads/${file.filename}`,
    `./uploads/articles/${fileURL}/${file.originalname}`,
    err => {
      if (err) {
        res.json(404, `error copiando archivo ${err}`);
      } else {
        res.json(200, "file was uploaded");
      }
    }
  );
});

router.post("/addClass", (req, res) => {
  const { url, filename, classes } = req.query;

  fs.writeFile(
    `./uploads/articles/${url}/${filename}.css`,
    classes,
    "utf-8",
    function(err) {
      if (err) {
        throw err;
      } else {
        res.status(200).send("Classes Added");
      }
    }
  );
});

router.post("/deleteFiles/", (req, res) => {
  const data = req.body;

  fs.readdir(`./uploads/articles/${data.url}`, (err, files) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("files", files);
    files.forEach(file => {
      let found = false;
      for (let i = 0; i < data.files.length; i++) {
        if (file === data.files[i]) {
          found = true;
        }
      }
      if (!found) {
        fs.unlink(`./uploads/articles/${data.url}/${file}`, err => {
          err && console.log("error eliminando archivo", err);
        });
      }
    });
  });

  res.status(200).send();
});

router.post("/uploadAvatar/", (req, res) => {
  const { userName } = req.query;
  const { base64 } = req.body;
  const fileType = base64.match(/^data:image\/(\w+)/);
  const base64Str = base64.replace(/^data:image\/\w+;base64,/, "");

  const dir = `./uploads/users/${userName}`;
  let filename = `${userName}_original`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFile(
    `./uploads/users/${userName}/${filename}.${fileType[1]}`,
    base64Str,
    "base64",
    err => {
      if (err) {
        console.log("api cdn err", err);
        res.status(404).send(`error copiando archivo ${err}`);
      } else {
        const imageURL = `${
          process.env.CDN_URL
        }/users/${userName}/${filename}.${fileType[1]}`;
        const apiDir = __dirname;
        const tempImgDir = path.join(
          apiDir.replace("\\api", "") +
            `/uploads/users/${userName}/${filename}.${fileType[1]}`
        );

        console.log("imageURL", imageURL);

        applySmartCrop(
          imageURL,
          tempImgDir.replace("original", "big"),
          200,
          200,
          applySmartCrop(
            imageURL,
            tempImgDir.replace("original", "small"),
            50,
            50,
            () => {
              fs.unlink(tempImgDir, err => {
                err && console.log("error eliminando archivo", err);
                res.status(200).json({
                  avatarURL: `${
                    process.env.CDN_URL
                  }/users/${userName}/${filename}.${fileType[1]}`.replace(
                    "original",
                    "big"
                  )
                });
              });
            }
          )
        );
      }
    }
  );
});

module.exports = router;
