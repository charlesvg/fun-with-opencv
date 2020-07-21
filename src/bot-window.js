const cv = require('opencv4nodejs');
const {settings} = require('./settings');
const {findWindow, setWindowBoundsIfNecessary} = require('./util/to-top');
const {deltaRgbFromVec} = require('./util/color-diff-util');
const {drawText} = require('./util/draw-text');
const {doSkirm} = require('./mods/skirm');
const robot = require('robotjs');
const debug = require('debug');
const log = debug('bot:bot')


const img2mat = (img, width, height) => {
    return new cv.Mat(img.image, height, width, cv.CV_8UC4);
}

const botMat = new cv.Mat(settings.game.window.bounds.height, settings.game.window.bounds.width, cv.CV_8UC4);
const sourceMat = new cv.Mat(settings.game.window.bounds.height, settings.game.window.bounds.width, cv.CV_8UC4);

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
        img2mat(screenshotFromRobot, w, h).copyTo(sourceMat).copyTo(botMat);
    },
    detectTowns: () => {
        const topOffset = 200;
        const rightOffset = 310;
        const leftOffset = 65;
        const bottomOffset = 150;

        const searchRegion = new cv.Rect(leftOffset, topOffset, 1280 - rightOffset - leftOffset, 720 - topOffset - bottomOffset);
        const searchMat = sourceMat.getRegion(searchRegion);

        const foundCircles = searchMat
            .cvtColor(cv.COLOR_RGBA2GRAY)
            .houghCircles(cv.HOUGH_GRADIENT, 1, 45, 20, 40, 25, 40);

        // delete all towns
        towns.splice(0, towns.length);


        for (let i = 0; i < foundCircles.length; i++) {
            const found = foundCircles[i];
            const town = {center: {x: found.x + leftOffset, y: found.y + topOffset}, radius: found.z};
            towns.push(town)

            botMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, greenColor, 3);
        }

        botMat.drawRectangle(searchRegion, yellowColor3, 1, cv.LINE_AA);
    },
    detectSkirmishes: () => {
        const contours = doSkirm(sourceMat);
        contours.forEach(contour => {
            let circle = contour.minEnclosingCircle();
            botMat.drawCircle(circle.center, circle.radius, new cv.Vec3(255, 255, 255), 1, cv.LINE_AA);
        });
    },
    detectAllegiance: () => {
        const theRed = new cv.Vec4(29, 42, 174, 255);
        const theBlue = new cv.Vec4(203, 87, 52, 255);
        towns.forEach((town) => {
            const colorPickPosition = new cv.Point2(town.center.x - 12, town.center.y - 12);
            const colorInCenter = sourceMat.at(colorPickPosition.y, colorPickPosition.x);

            if (deltaRgbFromVec(colorInCenter, theRed) < 5) {
                drawText(botMat, 'Enemy', greenColor, town.center.x, town.center.y + 50)
            } else if (deltaRgbFromVec(colorInCenter, theBlue) < 5) {
                drawText(botMat, 'Allied', greenColor, town.center.x, town.center.y + 50)
            } else {
                drawText(botMat, 'Attacked', greenColor, town.center.x, town.center.y + 50)
            }
        });
    },
    refresh: () => {
        const title = settings.bot.window.title;
        cv.imshow(title, botMat);
        cv.waitKey(1);
    },
}

