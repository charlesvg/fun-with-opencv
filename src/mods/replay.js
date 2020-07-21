const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:replay')
const {settings} = require('../settings');
const {drawText} = require('../util/draw-text');
const {findWindow, setWindowBoundsIfNecessary} = require('../util/to-top');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const {doMask} = require('./mask');
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


    let interval = setInterval(() => {
        cnt++;

        let path = directoryPath + '/cap-' + cnt + '.png';
        if (fs.existsSync(path)) {
            let canvas = cv.imread(path).cvtColor(cv.COLOR_RGB2RGBA);
            canvas = callback(canvas);
            cv.imshow(title, canvas);
            cv.waitKey(25);
        } else {
            if (infinite) {
                cnt = 0;
            } else {
                clearInterval(interval);
                log('Replaying ended (' + cnt + ' images)');
            }
        }
    }, 0);

}


const resolvedPath = path.resolve(appRootPath.path, './assets/case-1');
replay(true, resolvedPath, (canvas) => {

    const calcHistOfTown = (town) => {
        const w = canvas.cols;
        const h = canvas.rows;
        const mask = new cv.Mat(h, w, cv.CV_8U);
        mask.drawRectangle(new cv.Rect(0, 0, w, h), new cv.Vec3(0, 0, 0,), -1, cv.LINE_AA);
        mask.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(255,255,255), -1, cv.LINE_AA);
        // cv.imshow('bla', mask);
        // cv.waitKey();
        // calcHist(img: Mat, histAxes: HistAxes[], mask?: Mat): Mat;
        cv.calcHist(canvas, )
    }

    const foundCircles = findCirclesMeta(canvas);
    foundCircles.forEach((found) => {
        const town = {center: {x: found.x, y: found.y}, radius: found.z};
        calcHistOfTown(town);
    });


    
    log('Found', foundCircles);

    return canvas;

});