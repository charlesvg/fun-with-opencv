const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:mask')

const appRootPath = require('app-root-path');

const doMask = (source, minColor, maxColor, invertMask = false) => {
    if (source.type !== 24) {
        log('Error, convert source to RGBA first!')
        return;
    }
    let searchMat = source.copy();
    const imageInHSV = searchMat.cvtColor(cv.COLOR_BGR2HSV);
    let rangeMask = imageInHSV.inRange(minColor, maxColor);
    if (invertMask) {
        rangeMask = rangeMask.bitwiseNot();
    }
    const result = searchMat.bitwiseAnd(rangeMask.cvtColor(cv.COLOR_GRAY2BGRA));
    return result;
}

exports.doMask = doMask;

const example = () => {
    debug.enable('bot:*');
    log('Run example');
    let canvas = cv.imread(appRootPath + './assets/sktest3.png', -1);

    cv.imshow('canvasOutput', canvas);
    cv.waitKey();

    // Multiple ATs
    let min = new cv.Vec3(23, 25, 218);
    let max = new cv.Vec3(23, 25, 218);
    canvas = doMask(canvas, min, max, true);

    cv.imshow('canvasOutput', canvas);
    cv.waitKey();

}


if (require.main === module) {
    // Run the example if called directly (as opposed as to being require'd)
    example();
}


