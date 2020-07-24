const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:replay')
const {settings} = require('../settings');
const {drawText} = require('../util/draw-text');
const {findWindow, setWindowBoundsIfNecessary} = require('../util/to-top');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const {doKmeansBis} = require('./kmeans');
const {findCircles, findCirclesMeta} = require('./find-circle');
const {deltaRgb} = require('../util/color-diff-util');
const {doMask} = require('./mask');

debug.enable('bot:*');

const w = settings.game.window.bounds.width;
const h = settings.game.window.bounds.height;

let displayMat = new cv.Mat(h, w, cv.CV_8UC4);

const title = 'Bot replay';
const positionWindow = () => {
    const displayWnd = findWindow(title);
    displayWnd.bringToTop();
    setWindowBoundsIfNecessary(displayWnd, settings.bot.window.bounds);
}


// const args = process.argv.slice(2);
const replay = (infinite, directoryPath, callback) => {
    let cnt = 0;

    // Fill with black
    displayMat.drawRectangle(new cv.Rect(0, 0, w, h), new cv.Vec3(0, 0, 0,), -1, cv.LINE_AA);

    drawText(displayMat, 'Press any key to start replay', new cv.Vec3(255, 0, 0,), w / 2, h / 2);
    cv.imshow(title, displayMat);
    positionWindow();
    cv.waitKey(-1);
    log('Replaying');


    let canvas;
    let interval = setInterval(() => {
        cnt++;

        let path = directoryPath + '/cap-' + cnt + '.png';
        if (fs.existsSync(path)) {
            canvas = cv.imread(path).cvtColor(cv.COLOR_RGB2RGBA);
            canvas = callback(canvas);
            cv.imshow(title, canvas);
            cv.waitKey(25);
        } else {
            if (infinite) {
                cnt = 0;
            } else {
                clearInterval(interval);
                log('Replaying ended (' + cnt + ' images)');
                cv.imshow(title, canvas);
                cv.waitKey();
            }
        }
    }, 0);

}
exports.replay = replay;


if (require.main === module) {

    const findLinesMeta = (canvas) => {

        let searchMat = canvas.copy();

        let min = new cv.Vec3(0, 0, 50);
        let max = new cv.Vec3(0, 0, 101);
        searchMat = doMask(searchMat, min, max, false);

        // searchMat = searchMat.bitwiseNot();

        searchMat = searchMat.blur(new cv.Size(10,10));

        searchMat = searchMat.threshold(
            50,
            255,
            cv.THRESH_BINARY
        );


        // let kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(15, 15));
        // searchMat = searchMat.dilate(kernel);

        searchMat = searchMat.cvtColor(cv.COLOR_RGBA2GRAY, 0);



        // let kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(7, 7));
        // searchMat = searchMat.erode(kernel);

        // if (true) {
        //     cv.imshow('bla', searchMat);
        //     cv.waitKey();
        // }


        // searchMat.canny( 50, 200, 3);
        //
        let lines = searchMat.houghLinesP(1, Math.PI / 180, 10, 5, 20);

        searchMat = searchMat.cvtColor(cv.COLOR_GRAY2RGBA)

        log('Lines:', lines.length);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let startPoint = new cv.Point2(line.w, line.x);
            let endPoint = new cv.Point2(line.y, line.z);
            // searchMat.drawCircle(startPoint, 2, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // searchMat.drawCircle(endPoint, 2, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // searchMat.drawLine(startPoint, endPoint, new cv.Vec3(255, 0, 0), 1, cv.LINE_AA);
        }


        return searchMat;
    }

    const resolvedPath = path.resolve(appRootPath.path, './assets/record/case-5');
    replay(false, resolvedPath, (canvas) => {

        canvas = findLinesMeta(canvas);

        const foundCircles = findCirclesMeta(canvas);

        for (let i = 0; i < foundCircles.length; i++) {

            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            canvas.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(255, 0, 0), 3);
        }

        return canvas;

    });

}




