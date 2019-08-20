const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const sizeOf = require("image-size");
const del = require("del");

const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminSvgo = require("imagemin-svgo");
const imageminMozjpeg = require("imagemin-mozjpeg");

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

  if (!fs.existsSync(`./uploads/articles`)) {
    fs.mkdirSync(`./uploads/articles`);
  }

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
        if (
          file
            .replace(/\.\w{3,4}/, "")
            .match(data.files[i].replace(/\.\w{3,4}/, ""))
        ) {
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`eliminado ./uploads/articles/${data.url}/${file}`);
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

  if (!fs.existsSync(`./uploads/users/`)) {
    fs.mkdirSync("./uploads/users/");
  }

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
          err => {
            if (err) {
              console.log("error on cropping big image", err);
              res.status(404).send({ error: err });
              return;
            }

            applySmartCrop(
              imageURL,
              tempImgDir.replace("original", "small"),
              50,
              50,
              err => {
                if (err) {
                  console.log("error on cropping small image", err);
                  res.status(404).send({ error: err });
                  return;
                }

                fs.unlink(tempImgDir, err => {
                  if (err) {
                    console.log("error deleting image", err);
                    res.status(404).send({ error: err });
                    return;
                  }

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
            );
          }
        );
      }
    }
  );
});

router.post("/uploadPostImage/", (req, res) => {
  const { base64, url, filename, thumbnail } = req.body;
  const base64Str = base64.replace(/^data:image\/\w+;base64,/, "");

  const dir = `./uploads/articles/${url}/tmp/thumb`;

  !fs.existsSync(`./uploads/articles/${url}`) &&
    fs.mkdirSync(`./uploads/articles/${url}`);

  !fs.existsSync(`./uploads/articles/${url}/tmp/`) &&
    fs.mkdirSync(`./uploads/articles/${url}/tmp/`);

  !fs.existsSync(`./uploads/articles/${url}/tmp/thumb/`) &&
    fs.mkdirSync(`./uploads/articles/${url}/tmp/thumb`);

  let writeDir = `${dir}/${filename}`.replace("/thumb", "");

  fs.writeFile(writeDir, base64Str, "base64", err => {
    if (err) {
      console.log("api cdn err", err);
      res.status(404).send(`error copiando archivo ${err}`);
    } else {
      const imageURL = `${process.env.CDN_URL}/articles/${url}/tmp/${filename}`;
      const apiDir = __dirname;
      let tempImgDir;

      if (thumbnail) {
        tempImgDir = path.join(
          apiDir.replace("\\api", "") +
            `${`${dir}/${filename}`.replace("./", "/")}`
        );

        console.log("\n " + "imageURL", imageURL);
        console.log("tempImgDir", tempImgDir);

        applySmartCrop(
          imageURL,
          tempImgDir,
          600,
          584,
          applySmartCrop(
            imageURL,
            tempImgDir.replace(".", "_tablet."),
            400,
            389,
            applySmartCrop(
              imageURL,
              tempImgDir.replace(".", "_mobile."),
              250,
              243,
              async () => {
                let thumbnails;
                try {
                  thumbnails = await imagemin(
                    [`./uploads/articles/${url}/tmp/thumb/*.{jpg,png,svg}`],
                    {
                      destination: `uploads/articles/${url}/`,
                      plugins: [
                        imageminSvgo(),
                        imageminMozjpeg({ quality: 80 }),
                        imageminPngquant({ quality: [0, 0.5] })
                      ]
                    }
                  );
                } catch (err) {
                  console.log("imagemin", err);
                }

                console.log("thumbnails", thumbnails);
                thumbnails.forEach(thumb => {
                  if (!thumb.data) {
                    res.status(404).send(`error on image minify`);
                    return;
                  }
                });

                (async () => {
                  const deletedPaths = await del([
                    `uploads/articles/${url}/tmp/thumb/*.{jpg,png,svg}`
                  ]);
                  await del([`uploads/articles/${url}/tmp/*.{jpg,png,svg}`]);

                  console.log(
                    "Deleted files and directories:\n",
                    deletedPaths.join("\n")
                  );
                })();

                res.status(200).send(`success`);
              }
            )
          )
        );
      } else {
        sizeOf(`uploads/articles/${url}/tmp/${filename}`, (err, dimensions) => {
          console.log(dimensions.width, dimensions.height);

          tempImgDir = path.join(
            apiDir.replace("\\api", "") + `${writeDir.replace("./", "/")}`
          );

          applySmartCrop(
            imageURL,
            tempImgDir.replace(".", "_tablet."),
            parseInt((dimensions.width * 2) / 3),
            parseInt((dimensions.height * 2) / 3),
            applySmartCrop(
              imageURL,
              tempImgDir.replace(".", "_mobile."),
              parseInt((dimensions.width * 2) / 6),
              parseInt((dimensions.height * 2) / 6),
              async () => {
                //                 const imageminPngquant = require('imagemin-optipng');
                // const imageminSvgo = require('imagemin-svgo');
                // const imageminMozjpeg = require('imagemin-mozjpeg');

                const files = await imagemin(
                  [`uploads/articles/${url}/tmp/*.{jpg,png,svg}`],
                  {
                    destination: `uploads/articles/${url}/`,
                    plugins: [
                      imageminSvgo(),
                      imageminMozjpeg({ quality: 80 }),
                      imageminPngquant({ quality: [0.3, 0.5] })
                    ]
                  }
                );

                console.log("files", files);
                files.forEach(file => {
                  if (!file.data) {
                    res.status(404).send(`error on image minify`);
                    return;
                  }
                });

                (async () => {
                  const deletedPaths = await del([
                    `uploads/articles/${url}/tmp/*.{jpg,png,svg}`
                  ]);

                  console.log(
                    "Deleted files and directories:\n",
                    deletedPaths.join("\n")
                  );
                })();

                res.status(200).send(`success`);
              }
            )
          );
        });
      }
    }
  });
});

module.exports = router;
