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

        const lines = [];
        contours.forEach(contour => {
            let rect = contour.boundingRect();

            const probeContour = (searchMat, contour) => {
                let rect = contour.boundingRect();
                let cross = Math.min(rect.width, rect.height);
                let val;
                const getVal = (x, y) => searchMat.at(y, x);
                for (let g = 0; g < cross; g++) {
                    // Left top corner
                    val = getVal(rect.x + g, rect.y + g);
                    if (val.w === 255) {
                        searchMat.drawCircle(new cv.Point2(rect.x + g, rect.y + g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
                        return true;
                    }
                    // Right top corner
                    val = getVal(rect.x + rect.width - g, rect.y + g);
                    if (val.w === 255) {
                        searchMat.drawCircle(new cv.Point2(rect.x + rect.width - g, rect.y + g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
                        return false;
                    }
                    // Left bottom corner
                    val = getVal(rect.x + g, rect.y + rect.height - g);
                    if (val.w === 255) {
                        searchMat.drawCircle(new cv.Point2(rect.x + g, rect.y + rect.height - g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
                        return false;
                    }
                    // Right bottom corner
                    val = getVal(rect.x + rect.width - g, rect.y + rect.height - g);
                    if (val.w === 255) {
                        searchMat.drawCircle(new cv.Point2(rect.x + rect.width - g, rect.y + rect.height - g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
                        return true;
                    }
                }
            }

            let p1, p2;
            const adjust = 4;
            if (probeContour(searchMat, contour)) {
                // left top
                p1 = new cv.Point2(rect.x + adjust, rect.y + adjust);
                // right bottom
                p2 = new cv.Point2(rect.x + rect.width - adjust, rect.y + rect.height - adjust);

                let dx = p2.x - p1.x;
                let dy = p2.y - p1.y;
                let D = dx / dy;
                for (let n=0; n < 10; n++){
                    searchMat.drawCircle(new cv.Point2(p1.x + (n*D), p1.y + n), 1, new cv.Vec3(255, 0, 0), 2);
                }

            } else {
                // right top
                p1 = new cv.Point2(rect.x + rect.width - adjust, rect.y + adjust);
                // left bottom
                p2 = new cv.Point2(rect.x + adjust, rect.y + rect.height - adjust);

                let dx = p1.x - p2.x;
                let dy = p1.y - p2.y;
                let D = dx / dy;
                for (let n=0; n < 10; n++){
                    log('n*D', n*D, D);
                    searchMat.drawCircle(new cv.Point2(p2.x - (n*D), p2.y - n), 1, new cv.Vec3(255, 0, 0), 2);
                }
            }
            // searchMat.drawCircle(new cv.Point2(rect.x + 1, rect.y + 1), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);

            lines.push({p1:p1, p2:p2});
            searchMat.drawLine(p1, p2, new cv.Vec3(0, 255, 0), 1, cv.LINE_AA);
        });

        const foundCircles = findCirclesMeta(canvas);

        for (let i = 0; i < foundCircles.length; i++) {

            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
        }


        return {mat: searchMat, lines: lines};
    }

    const resolvedPath = path.resolve(appRootPath.path, './assets/record/case-5');
    replay(false, resolvedPath, (canvas) => {

        const retval = findLinesMeta(canvas);
        canvas = retval.mat;



        return canvas;

    });

}


