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
const {findLinesMeta} = require('./lines');

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
            canvas = canvas.getRegion(settings.bot.window.searchRegion);
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



    const resolvedPath = path.resolve(appRootPath.path, './assets/record/case-9');
    replay(false, resolvedPath, (canvas) => {

        const towns = [];
        const foundCircles = findCirclesMeta(canvas);
        for (let i = 0; i < foundCircles.length; i++) {
            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            towns.push(town);
            canvas.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
        }

        log('before');
        let lines = findLinesMeta(canvas, towns, false);
        lines.forEach(line => canvas.drawLine(line.startPoint, line.endPoint, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA));
        log('after');




        return canvas;

    });

}


