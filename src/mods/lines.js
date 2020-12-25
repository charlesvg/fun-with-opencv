const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:lines')
const {doMask} = require('./mask');

const isPixelInTown = (town, x, y) => {
    return Math.sqrt(Math.pow((x - town.center.x), 2) + Math.pow((y - town.center.y), 2)) < town.radius;
}

const isPixelInTowns = (x, y, towns) => {
    for (let i = 0; i < towns.length; i++) {
        if (isPixelInTown(towns[i], x, y)) {
            return towns[i];
        }
    }
    return undefined;
}
const isPixelOutOfBounds = (x, y, mat) => {
    return x < 0
        || x >= mat.cols
        || y < 0
        || y >= mat.rows;
}

const debugShow = (searchMat) => {
    cv.imshow('searchMat', searchMat);
    cv.waitKey();
}
const findIntersect2 = (searchMat, point, angle, towns, flipAngle = false, debugEnabled = false) => {
    const step = 20;

    if (flipAngle) {
        angle += Math.PI;
    }

    let foundCircle = undefined;
    let circlePoint = undefined;

    let length = 0;
    let stepColor = new cv.Vec3(0, 0, 255);
    let foundColor = new cv.Vec3(0, 0, 255);

    do {
        length += step;
        let newX = Math.round(point.x + length * Math.cos(angle));
        let newY = Math.round(point.y + length * Math.sin(angle));

        if (isPixelOutOfBounds(newX, newY, searchMat)) {
            break;
        }
        if (debugEnabled) {
            searchMat.drawCircle(new cv.Point2(newX, newY), 1, stepColor, 2);
            debugShow(searchMat);
        }
        foundCircle = isPixelInTowns(newX, newY, towns);

        if (foundCircle) {
            if (debugEnabled) {
                searchMat.drawCircle(new cv.Point2(newX, newY), 1, foundColor, 8);
            }
            circlePoint = new cv.Point2(newX, newY);
        }

    } while (!foundCircle);

    return foundCircle ? {circle: foundCircle, point: circlePoint} : undefined;

}
const dst = (p1, p2) => {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

const compare = (a, b) => {
    if (a.d < b.d) return 1;
    if (a.d > b.d) return -1;
    return 0;
}

const findAngleOfCountour = (contour) => {
    let convexHull = contour.convexHull(true);

    let arr = [];
    let points = convexHull.getPoints();
    for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        let distance = dst(p1, p2);
        arr.push({d: distance, p1: p1, p2: p2});
    }

    arr.sort(compare);
    const longestLine = arr[0];

    // searchMat.drawLine(longestLine.p1, longestLine.p2, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA);

    // Angle of longest line
    let longestLineAngleInRadians = Math.atan2(longestLine.p1.y - longestLine.p2.y, longestLine.p1.x - longestLine.p2.x);
    return longestLineAngleInRadians;
}


const findLinesMetaPerColor = (canvas, minColor, maxColor, towns, debugEnabled = false) => {

    let searchMat = canvas.copy();

    // Remove the towns
    for (let i = 0; i < towns.length; i++) {
        const town = towns[i];
        searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius + 5, new cv.Vec3(0, 0, 0), -1);
    }


    // Mask (preserve) the target color
    searchMat = doMask(searchMat, minColor, maxColor, false);

    // Find blobs
    let contours = searchMat
        .copy()
        .cvtColor(cv.COLOR_BGRA2GRAY)
        .findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (debugEnabled) {
        for (let i = 0; i < towns.length; i++) {
            const town = towns[i];
            searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
        }
        debugShow(searchMat);
    }

    // Infer line from contours until intersected with a town circle
    let lines = [];
    contours.forEach(contour => {
        let circle = contour.minEnclosingCircle();
        if (circle.radius > 10) {
            if (debugEnabled) {
                let rect = contour.boundingRect();
                searchMat.drawRectangle(rect, new cv.Vec3(0, 255, 255), 1, cv.LINE_AA);
            }

            let angle = findAngleOfCountour(contour);

            let start = findIntersect2(searchMat, circle.center, angle, towns, false, debugEnabled);
            let end = findIntersect2(searchMat, circle.center, angle, towns, true, debugEnabled);

            if (start && end) {
                if (debugEnabled) {
                    searchMat.drawLine(start.point, end.point, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA);
                }
                lines.push({
                    startPoint: start.point,
                    endPoint: end.point,
                    startCircle: start.circle,
                    endCircle: end.circle
                });

            }
        }

    });


    return lines;
}

const findLinesMeta = (canvas, towns, debugEnabled = false) => {
    let lines = [];

    // Gray
    let min = new cv.Vec3(0, 0, 50);
    let max = new cv.Vec3(0, 0, 101);
    lines = lines.concat(findLinesMetaPerColor(canvas, min, max, towns, debugEnabled));

    // Red
    min = new cv.Vec3(2, 210, 135);
    max = new cv.Vec3(4, 220, 180);
    lines = lines.concat(findLinesMetaPerColor(canvas, min, max, towns, debugEnabled));

    // Blue
    min = new cv.Vec3(112, 187, 165);
    max = new cv.Vec3(116, 195, 206);
    lines = lines.concat(findLinesMetaPerColor(canvas, min, max, towns, debugEnabled));

    towns.forEach(town => {
        lines.forEach(line => {
            if (line.startCircle === town) {
                if (town.lines) {
                    town.lines.push[line];
                } else {

                }
            }
        });
    });


    return lines;
}

exports.findLinesMeta = findLinesMeta;