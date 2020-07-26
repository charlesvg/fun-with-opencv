const cv = require('opencv4nodejs');
const {settings} = require('./settings');
const {findWindow, setWindowBoundsIfNecessary} = require('./util/to-top');
const {deltaRgbFromVec} = require('./util/color-diff-util');
const {drawText} = require('./util/draw-text');
const {doSkirm} = require('./mods/skirm');
const {detectTownAllegiance} = require('./mods/allegiance');
const {findLinesMeta} = require('./mods/lines');
const robot = require('robotjs');
const debug = require('debug');
const log = debug('bot:bot')


const img2mat = (img, width, height) => {
    return new cv.Mat(img.image, height, width, cv.CV_8UC4);
}

const searchRegion = settings.bot.window.searchRegion;

const botMat = new cv.Mat(searchRegion.height, searchRegion.width, cv.CV_8UC4);
const sourceMat = new cv.Mat(searchRegion.height, searchRegion.width, cv.CV_8UC4);

const towns = [];
const skirmishes = [];
const greenColor = new cv.Vec3(0, 255, 0);
const blackColor = new cv.Vec4(98, 98, 98, 255);
const yellowColor3 = new cv.Vec3(0, 255, 255);
const yellowColor = new cv.Vec4(0, 255, 255, 255);

exports.botWindow = {
    initWindow: () => {
        const title = settings.bot.window.title;
        cv.imshow(title, botMat);
        cv.waitKey(1);


        const botWnd = findWindow(title);
        botWnd.bringToTop();
        setWindowBoundsIfNecessary(botWnd, settings.bot.window.bounds);
    },
    waitForever: () => {
        cv.waitKey();
    },
    copyFromSource: () => {
        const w = settings.game.window.bounds.width;
        const h = settings.game.window.bounds.height;
        const screenshotFromRobot = robot.screen.capture(0, 0, w, h);
        img2mat(screenshotFromRobot, w, h)
            .getRegion(searchRegion)
            .copyTo(sourceMat)
            .copyTo(botMat);

    },
    detectTowns: () => {

        const foundCircles = sourceMat.copy()
            .cvtColor(cv.COLOR_RGBA2GRAY)
            .houghCircles(cv.HOUGH_GRADIENT, 1, 45, 20, 40, 25, 40);

        // delete all towns
        towns.splice(0, towns.length);


        for (let i = 0; i < foundCircles.length; i++) {
            const found = foundCircles[i];
            const town = {center: {x: found.x, y: found.y}, radius: found.z};
            towns.push(town)

            botMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, greenColor, 3);
        }

    },
    detectSkirmishes: () => {
        const contours = doSkirm(sourceMat);
        contours.forEach(contour => {
            let circle = contour.minEnclosingCircle();
            botMat.drawCircle(circle.center, circle.radius, new cv.Vec3(255, 255, 255), 1, cv.LINE_AA);
        });
    },
    detectAllegiance: () => {

        detectTownAllegiance(botMat, towns);

        towns.forEach((town) => {
            if (town.allied === true) {
                drawText(botMat, 'Allied', greenColor, town.center.x, town.center.y + 50)
            } else if (town.allied === false) {
                drawText(botMat, 'Enemy', greenColor, town.center.x, town.center.y + 50)
            } else {
                drawText(botMat, 'Unknown', greenColor, town.center.x, town.center.y + 50)
            }
        });
    },
    detectRoads: () => {
        let lines = findLinesMeta(botMat, towns);
        lines.forEach(line => botMat.drawLine(line.startPoint, line.endPoint, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA));
    },
    refresh: () => {
        const title = settings.bot.window.title;
        cv.imshow(title, botMat);
        cv.waitKey(1);
    },
}

