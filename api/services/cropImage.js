let request = require("request");
let sharp = require("sharp");
let smartcrop = require("smartcrop-sharp");

const applySmartCrop = (src, dest, width, height, callback) => {
  request(src, { encoding: null }, function process(error, response, body) {
    if (error) return console.error(error);

    smartcrop
      .crop(body, { width: width, height: height })
      .then(function(result) {
        let crop = result.topCrop;
        sharp(body)
          .extract({
            width: crop.width,
            height: crop.height,
            left: crop.x,
            top: crop.y
          })
          .resize(width, height)
          .toFile(dest)
          .then(() => {
            callback && callback();
          })
          .catch(err => {
            console.error(err);
          });
      })
      .catch(err => {
        console.error(err);
      });
  });
};

module.exports = applySmartCrop;
