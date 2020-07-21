const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:template')

const appRootPath = require('app-root-path');

const doTemplate = (canvas, template, threshold = 0.80) => {
    let mask = new cv.Mat();

    let howGoodOfAMatch = 1;

    let grayTemplate = template.copy().cvtColor(cv.COLOR_RGBA2GRAY);
    let source = canvas.copy().cvtColor(cv.COLOR_RGBA2GRAY);

    const yellow = new cv.Vec3(0, 255, 255);
    let matches = [];
    while (howGoodOfAMatch > threshold) {
        let dst = source.matchTemplate(grayTemplate, cv.TM_CCOEFF_NORMED, mask);
        let result = cv.minMaxLoc(dst, mask);

        log('Got match', result);

        howGoodOfAMatch = result.maxVal;
        let maxPoint = result.maxLoc;
        let point = new cv.Point2(maxPoint.x + grayTemplate.cols, maxPoint.y + grayTemplate.rows);

        source.drawRectangle(maxPoint, point, yellow, -1, cv.LINE_AA);
        matches.push({p1: point, p2: maxPoint});
    }

    matches.forEach((match) => {
        canvas.drawRectangle(match.p1, match.p2, yellow, -1, cv.LINE_AA);
    });
    return canvas;
}
exports.doTemplate = doTemplate;

const example = () => {

    debug.enable('bot:*');

    let template = cv.imread(appRootPath + './multiple-ats-allied.png');
    let canvas = cv.imread(appRootPath + './sktest3.png');

    cv.imshow('canvasOutput', canvas);
    cv.waitKey();

    canvas = doTemplate(canvas, template, 0.8);

    cv.imshow('canvasOutput', canvas);
    cv.waitKey();
}

if (require.main === module) {
    // Run the example if called directly (as opposed as to being require'd)
    example();
}


