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


const resolvedPath = path.resolve(appRootPath.path, './assets/case-2');
replay(false, resolvedPath, (canvas) => {

    const calc = (town, canvas) => {
        const getPoints = (x, y, r, canvas) => {
            const distance = (p1, p2) => {
                let dx = Math.pow(p2.x - p1.x, 2);
                let dy = Math.pow(p2.y - p1.y, 2);
                return Math.sqrt(dx + dy);
            }

            let ret = [];
            for (let j = x - r; j <= x + r; j++) {
                for (let k = y - r; k <= y + r; k++) {
                    if (distance({x: j, y: k}, {x: x, y: y}) <= r) {
                        // ret.push({x: j, y: k})
                        const pixelValue = canvas.at(k, j);
                        ret.push(new cv.Point3(pixelValue.x, pixelValue.y, pixelValue.z));
                    }
                }
            }
            return ret;
        }

        const townPoints = getPoints(town.center.x, town.center.y, town.radius, canvas);

        const result = doKmeansBis(townPoints).centers;
        const clusterOne = result[0];
        const clusterTwo = result[1];

        canvas.drawRectangle(
            new cv.Point2(town.center.x, town.center.y),
            new cv.Point2(town.center.x + 10, town.center.y + 10),
            new cv.Vec3(clusterOne.x, clusterOne.y, clusterOne.z),
            -1,
            cv.LINE_AA);

        canvas.drawRectangle(
            new cv.Point2(town.center.x, town.center.y + 10),
            new cv.Point2(town.center.x + 10, town.center.y + 20),
            new cv.Vec3(clusterTwo.x, clusterTwo.y, clusterTwo.z),
            -1,
            cv.LINE_AA);

    }

    const foundCircles = findCirclesMeta(canvas);
    foundCircles.forEach((found) => {
        const town = {center: {x: found.x, y: found.y}, radius: found.z};
        calc(town, canvas);
    });


    return canvas;

});