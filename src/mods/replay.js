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


const resolvedPath = path.resolve(appRootPath.path, './assets/case-1');
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
                        const p = new cv.Point3(pixelValue.w, pixelValue.x, pixelValue.y);
                        ret.push(p);
                    }
                }
            }
            return ret;
        }

        const townPoints = getPoints(town.center.x, town.center.y, town.radius, canvas);

        const result = doKmeansBis(townPoints).centers;



        const clusterOne = result[0];
        const dominantHue = rgb2hsv(clusterOne.z, clusterOne.y, clusterOne.x).h * 180;
        const hueOfAlliedBlue = 113;
        const delta = Math.abs(hueOfAlliedBlue - dominantHue);

        if (delta < 50) {
            canvas.drawRectangle(
                new cv.Point2(town.center.x, town.center.y),
                new cv.Point2(town.center.x + 10, town.center.y + 10),
                new cv.Vec3(255, 0, 0),
                -1,
                cv.LINE_AA);
        } else {
            canvas.drawRectangle(
                new cv.Point2(town.center.x, town.center.y),
                new cv.Point2(town.center.x + 10, town.center.y + 10),
                new cv.Vec3(0, 0, 255),
                -1,
                cv.LINE_AA);
        }


        canvas.drawRectangle(
            new cv.Point2(town.center.x, town.center.y),
            new cv.Point2(town.center.x + 10, town.center.y + 10),
            new cv.Vec3(255, 255, 255),
            1,
            cv.LINE_AA);

    }

    const foundCircles = findCirclesMeta(canvas);
    foundCircles.forEach((found) => {
        const town = {center: {x: found.x, y: found.y}, radius: found.z - 3};
        calc(town, canvas);
    });

    // Now draw the circle
    foundCircles.forEach((found) => {
        const town = {center: {x: found.x, y: found.y}, radius: found.z - 3};
        canvas.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
    });


    return canvas;

});


const rgb2hsv =  (r, g, b)  => {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
        diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: h,
        s: s,
        v: v
    };
}