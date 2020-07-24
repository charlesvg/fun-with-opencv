const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:contours');
const {doMask} = require('./mask');


const appRootPath = require('app-root-path');

const doContours = (canvas) => {
    let contours = canvas
        .copy()
        .cvtColor(cv.COLOR_BGRA2GRAY)
        .findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    contours.forEach(contour => {
        let circle = contour.minEnclosingCircle();
        contour.
        canvas.drawCircle(circle.center, circle.radius, new cv.Vec3(0,255,0), 1, cv.LINE_AA);
    });

    return canvas;
}

const example = () => {
    debug.enable('bot:*');

    let canvas = cv.imread(appRootPath + './assets/sktest3.png').cvtColor(cv.COLOR_RGB2RGBA);

    cv.imshow('canvasOutput', canvas);
    cv.waitKey();

    let min = new cv.Vec3(112, 187, 203);
    let max = new cv.Vec3(116, 190, 206);
    canvas = doMask(canvas, min, max, false);

    cv.imshow('canvasOutput', canvas);
    cv.waitKey();

    canvas = doContours(canvas);

    cv.imshow('canvasOutput', canvas);
    cv.waitKey();
}

if (require.main === module) {
    // Run the example if called directly (as opposed as to being require'd)
    example();
}
