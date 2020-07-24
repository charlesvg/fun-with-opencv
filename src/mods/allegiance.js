const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:replay')
const path = require('path');
const appRootPath = require('app-root-path');
const {findCirclesMeta} = require('./find-circle');
const {replay} = require('./replay');
const {rgb2hsv} = require('../util/rgb-to-hsv');

debug.enable('bot:*');


const distanceFromCircleCenter = (p1, p2) => {
    let dx = Math.pow(p2.x - p1.x, 2);
    let dy = Math.pow(p2.y - p1.y, 2);
    return Math.sqrt(dx + dy);
}

const getPoints = (x, y, r, canvas) => {

    const hueOfAlliedBlue = 113;
    const hueOfEnemyRed = 3;
    let blue = 0;
    let red = 0;

    const checkEveryXPixels = 2;

    for (let j = x - r; j <= x + r; j += checkEveryXPixels) {
        for (let k = y - r; k <= y + r; k += checkEveryXPixels) {
            // Check if inside the circle
            if (distanceFromCircleCenter({x: j, y: k}, {x: x, y: y}) <= r) {
                // Get RGB value
                const p = canvas.at(k, j);
                // Get HUE of that pixel
                const hue = rgb2hsv(p.y, p.x, p.w).h * 180;
                // How close are we to blue, red?
                const deltaBlue = Math.abs(hueOfAlliedBlue - hue);
                const deltaRed = Math.abs(hueOfEnemyRed - hue);
                if (deltaBlue < 3) {
                    blue++;
                } else if (deltaRed < 3) {
                    red++;
                }
            }
        }
    }
    return {red: red, blue: blue};
}

const isTownIsWithinBounds = (town, canvas) => {
    const size = 30;
    const leftBound = size;
    const rightBound = canvas.cols - size;
    const topBound = size;
    const bottomBound = canvas.rows - size;
    if ((leftBound < town.center.x) &&
        (town.center.x < rightBound) &&
        (topBound < town.center.y) &&
        (town.center.y < bottomBound)) {
        return true;
    }
    return false;
}

const detectTownAllegiance = (canvas, towns) => {
    if (canvas.type !== 24) {
        log('Error, convert source to RGBA first!')
        return;
    }

    const cropCircleBy = 3;
    for (let i = 0; i < towns.length; i++) {
        const town = towns[i];
        if (isTownIsWithinBounds(town, canvas)) {
            const votes = getPoints(town.center.x, town.center.y, town.radius - cropCircleBy, canvas);
            town.allied = votes.blue > votes.red;
        }
    }
    return towns;
}

exports.detectTownAllegiance = detectTownAllegiance;

if (require.main === module) {

    const resolvedPath = path.resolve(appRootPath.path, './assets/record/case-5');
    replay(false, resolvedPath, (canvas) => {

        const foundCircles = findCirclesMeta(canvas);

        let towns = [];
        foundCircles.forEach(circle => towns.push({center: {x: circle.x, y: circle.y}, radius: circle.z}));
        towns = detectTownAllegiance(canvas, towns);

        const blue = new cv.Vec3(255, 0, 0);
        const red = new cv.Vec3(0, 0, 255);
        towns.forEach(town => {
            canvas.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, town.allied ? blue : red, 3);
        });
        return canvas;

    });
}