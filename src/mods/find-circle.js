const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:find-circle')

const findCircles = (searchMat) => {
    const foundCircles = findCirclesMeta(searchMat);

    for (let i = 0; i < foundCircles.length; i++) {

        const found = foundCircles[i];
        const town = {center: {x: found.x, y: found.y}, radius: found.z};
        searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, greenColor, 3);
    }

    return searchMat;
}

exports.findCircles = findCircles;


const findCirclesMeta = (searchMat) => {
    const greenColor = new cv.Vec3(0, 255, 0);
    const foundCircles = searchMat
        .copy()
        .cvtColor(cv.COLOR_RGBA2GRAY)
        .houghCircles(cv.HOUGH_GRADIENT, 1, 45, 20, 40, 15, 32);

    log('Found circles ', foundCircles);

    return foundCircles;
}

exports.findCirclesMeta = findCirclesMeta;