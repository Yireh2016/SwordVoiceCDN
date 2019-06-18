let express = require("express");
let fs = require("fs");
let multer = require("multer");

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

// (req, res) => {
//   const { url } = req.params;

//   let form = new formidable.IncomingForm();
//   form.parse(req, (err, fields, files) => {
//     fs.rename(
//       `${files.file.path}`,
//       `./uploads/articles/${url}/${files.file.name}`,
//       err => {
//         if (err) {
//           res.json(`error copiando archivo ${err}`);
//         } else {
//           res.status(200).send();
//         }
//       }
//     );
//   });
// }

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

module.exports = router;
