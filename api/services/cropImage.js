let request = require("request");
let sharp = require("sharp");
let smartcrop = require("smartcrop-sharp");

const applySmartCrop = (src, dest, width, height, callback) => {
  request(src, { encoding: null }, function process(error, response, body) {
    if (error) {
      console.error(error);
      return callback(error);
    }

    const cropOpt = height
      ? { width: width, height: height }
      : { width: width };

    console.log("cropOpt", cropOpt);

    smartcrop
      .crop(body, cropOpt)
      .then(function(result) {
        console.log("result", result);
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
            console.error("error on sharp", err);
            callback(err);
          });
      })
      .catch(err => {
        console.error("error on smartcrop", err);
        callback(err);
      });
  });
};

module.exports = applySmartCrop;
