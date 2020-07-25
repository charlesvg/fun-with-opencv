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
const {findIntersectFromTopRight, findIntersect, probeContour} = require('./lines');

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

        searchMat = searchMat.blur(new cv.Size(10, 10));

        searchMat = searchMat.threshold(
            50,
            255,
            cv.THRESH_BINARY
        );

        let contours = searchMat
            .copy()
            .cvtColor(cv.COLOR_BGRA2GRAY)
            .findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const foundCircles = findCirclesMeta(canvas);

        for (let i = 0; i < foundCircles.length; i++) {
            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
        }

        contours.forEach(contour => {
            let rect = contour.boundingRect();
            let circle = contour.minEnclosingCircle();
            if (circle.radius > 10) {
                searchMat.drawRectangle(rect, new cv.Vec3(0,255,255), 1, cv.LINE_AA);

                let startFromTopLeft = probeContour(searchMat, contour);
                let foundLine = findIntersect(searchMat, rect, foundCircles, startFromTopLeft);
                if (foundLine) {
                    searchMat.drawLine(foundLine.startPoint, foundLine.endPoint, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA);
                }
            }



            // searchMat.drawCircle(new cv.Point2(rect.x + 1, rect.y + 1), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);

            // searchMat.drawLine(p1, p2, new cv.Vec3(0, 255, 0), 1, cv.LINE_AA);
        });





        return searchMat;
    }

    const resolvedPath = path.resolve(appRootPath.path, './assets/record/case-5');
    replay(false, resolvedPath, (canvas) => {

        canvas = findLinesMeta(canvas);
        return canvas;

    });

}


