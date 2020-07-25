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


const topOffset = 200;
const rightOffset = 310;
const leftOffset = 65;
const bottomOffset = 150;

const searchRegion = new cv.Rect(leftOffset, topOffset, 1280 - rightOffset - leftOffset, 720 - topOffset - bottomOffset);

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
            canvas = canvas.getRegion(searchRegion);
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

    const findLinesMeta = (canvas, minColor, maxColor, foundCircles) => {

        let searchMat = canvas.copy();

        // Remove the towns
        for (let i = 0; i < foundCircles.length; i++) {
            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius+5, new cv.Vec3(0, 0, 0), -1);
        }

        // Mask (preserve) the target color
        searchMat = doMask(searchMat, minColor, maxColor, false);

        // Blur before threshold (remove noise)
        searchMat = searchMat.blur(new cv.Size(10, 10));

        // Threshold (remove noise)
        searchMat = searchMat.threshold(
            5,
            255,
            cv.THRESH_BINARY
        );

        // Find blobs
        let contours = searchMat
            .copy()
            .cvtColor(cv.COLOR_BGRA2GRAY)
            .findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Infer line from blobs until intersected with a town circle
        let lines = [];
        contours.forEach(contour => {
            let rect = contour.boundingRect();
            let circle = contour.minEnclosingCircle();
            if (circle.radius > 10) {
                searchMat.drawRectangle(rect, new cv.Vec3(0,255,255), 1, cv.LINE_AA);

                // Returns undefined if the contour starts outside of bounds
                let startFromTopLeft = probeContour(searchMat, contour);
                if (startFromTopLeft !== undefined) {
                    let foundLine = findIntersect(searchMat, rect, foundCircles, startFromTopLeft);
                    if (foundLine) {
                        lines.push(foundLine);
                        searchMat.drawLine(foundLine.startPoint, foundLine.endPoint, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA);
                    }
                }
            }



            // searchMat.drawCircle(new cv.Point2(rect.x + 1, rect.y + 1), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);

            // searchMat.drawLine(p1, p2, new cv.Vec3(0, 255, 0), 1, cv.LINE_AA);
        });


        for (let i = 0; i < foundCircles.length; i++) {
            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
        }


        return lines;
    }

    const resolvedPath = path.resolve(appRootPath.path, './assets/record/case-5');
    replay(false, resolvedPath, (canvas) => {

        const foundCircles = findCirclesMeta(canvas);
        for (let i = 0; i < foundCircles.length; i++) {
            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            canvas.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
        }

        log('before');
        // Gray
        // let min = new cv.Vec3(0, 0, 50);
        // let max = new cv.Vec3(0, 0, 101);
        // Red
        // let min = new cv.Vec3(2, 210, 135);
        // let max = new cv.Vec3(4, 220, 180);
        // Blue
        // let min = new cv.Vec3(112, 187, 165);
        // let max = new cv.Vec3(116, 195, 206);

        let lines = [];

        // Gray
        let min = new cv.Vec3(0, 0, 50);
        let max = new cv.Vec3(0, 0, 101);
        lines = lines.concat(findLinesMeta(canvas, min, max, foundCircles));

        // Red
        min = new cv.Vec3(2, 210, 135);
        max = new cv.Vec3(4, 220, 180);
        lines = lines.concat(findLinesMeta(canvas, min, max, foundCircles));

        // Blue
        min = new cv.Vec3(112, 187, 165);
        max = new cv.Vec3(116, 195, 206);
        lines = lines.concat(findLinesMeta(canvas, min, max, foundCircles));

        lines.forEach(line => canvas.drawLine(line.startPoint, line.endPoint, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA));
        log('after');




        return canvas;

    });

}


