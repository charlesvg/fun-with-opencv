const cv = require('opencv4nodejs');
const debug = require('debug');
const {doMask} = require('./mask');
const log = debug('bot:skirm')


const min = new cv.Vec3(8, 190, 200);
const max = new cv.Vec3(12, 210, 255);

const doSkirm = (canvas, debug = false) => {

    let mat = canvas.copy();

    // Keep flames
    mat = doMask(mat, min, max, false);

    mat = mat.threshold(
        10,
        255,
        cv.THRESH_BINARY
    );

    mat = mat.blur(new cv.Size(10, 10));

    let contours = mat.cvtColor(cv.COLOR_BGRA2GRAY).findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    return contours;

}

exports.doSkirm = doSkirm;