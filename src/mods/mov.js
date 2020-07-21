const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:mov')

const doMovement = (previous, current, threshold = false, blur = false, blurSize = 8) => {
    let diff = previous.absdiff(current);
    if (threshold) {
        diff = diff.threshold(
            10,
            255,
            cv.THRESH_BINARY
        );
    }
    if (blur) {
        diff = diff.blur(new cv.Size(blurSize, blurSize));
    }
    return diff;
}

exports.doMovement = doMovement;

