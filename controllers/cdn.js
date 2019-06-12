let express = require("express");
let router = express.Router();

router.get("/:url", (req, res) => {
  const { url } = req.params;
  res.status(200).json(`entraste a cdn ${url}`);
});

router.post("/:url", (req, res) => {
  const { url } = req.params;
  res.status(200).json(`posteando a cdn ${url}`);
});

module.exports = router;
