const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:lines')
const logd = debug('bot:d')

const isPixelInCircle = (circle, x, y) => {
    return Math.sqrt(Math.pow((x - circle.x), 2) + Math.pow((y - circle.y), 2)) < circle.z;
}

const isPixelInCircles = (x, y, circles) => {
    for (let i = 0; i < circles.length; i++) {
        if (isPixelInCircle(circles[i], x, y)) {
            return circles[i];
        }
    }
    return undefined;
}
const isPixelOutOfBounds = (x, y, mat) => {
    let oob = x < 0
        || x > mat.cols
        || y < 0
        || y > mat.rows;
    // logd('Pixel', x, y, ' is out of bounds?', oob);
    return oob;
}

const findIntersectFromTopLeft = (searchMat, rect, circles, startFromTopLeft = true) => {
    let p1, p2;
    const adjust = 4;
    const step = 20;

    const sign = startFromTopLeft ? 1 : -1;

    let stepColor, foundColor;

    if (startFromTopLeft) {
        // left top
        p1 = new cv.Point2(rect.x + adjust, rect.y + adjust);
        // right bottom
        p2 = new cv.Point2(rect.x + rect.width - adjust, rect.y + rect.height - adjust);

        stepColor = new cv.Vec3(255, 0, 0);
        foundColor = new cv.Vec3(0, 0, 255);

    } else {
        // right top
        p1 = new cv.Point2(rect.x + rect.width - adjust, rect.y + adjust);
        // left bottom
        p2 = new cv.Point2(rect.x + adjust, rect.y + rect.height - adjust);

        stepColor = new cv.Vec3(0, 255, 0);
        foundColor = new cv.Vec3(255, 0, 255);
    }

    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let D = dx / dy;

    let currentX, currentY;

    // Find the axis for which 0 < D < 1
    // Otherwise, by definition, we'll skip pixels: each time we increase one axis with 1, the other axis increases with D
    if (Math.abs(D) >= 1) {
        // Iterate over X axis
        D = dy / dx;

        log('Iterate with a positive step');
        // Iterate with a positive step
        let i = 0;
        let leftCircle;
        let leftPixel;
        do {
            currentX = p1.x + (i * sign * step);
            currentY = p1.y + ((i * sign * step) * D);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            leftCircle = isPixelInCircles(currentX, currentY, circles);

            if (leftCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                leftPixel = {x: currentX, y: currentY};
            }

            cv.imshow('searchMat', searchMat);
            cv.waitKey();
        } while (!leftCircle);

        log('Iterate with a negative step');
        // Iterate with a negative step
        i = 0;
        let rightCircle;
        let rightPixel;
        do {
            currentX = p1.x + (i * sign * -step);
            currentY = p1.y + ((i * sign * -step) * D);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            rightCircle = isPixelInCircles(currentX, currentY, circles);
            if (rightCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                rightPixel = {x: currentX, y: currentY};
            }

            cv.imshow('searchMat', searchMat);
            cv.waitKey();
        } while (!rightCircle);
    } else {
        // Iterate over Y axis
        // Iterate with a positive step (= check one end of the line)

        log('Iterate with a positive step');
        let i = 0;
        let topCircle;
        let topPixel;
        do {
            currentX = p1.x + ((i * sign * step) * D);
            currentY = p1.y + (i * sign * step);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            topCircle = isPixelInCircles(currentX, currentY, circles);
            if (topCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                topPixel = {x: currentX, y: currentY};
            }

            cv.imshow('searchMat', searchMat);
            cv.waitKey();
        } while (!topCircle);

        log('Iterate with a negative step');
        // Iterate with a negative step (=check the other end of the line)
        i = 0;
        let bottomCircle;
        let bottomPixel;
        do {
            currentX = p1.x + ((i * sign * -step) * D);
            currentY = p1.y + (i * sign * -step);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            bottomCircle = isPixelInCircles(currentX, currentY, circles);
            if (bottomCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                bottomPixel = {x: currentX, y: currentY};
            }

            cv.imshow('searchMat', searchMat);
            cv.waitKey();
        } while (!bottomCircle);
    }
}

exports.findIntersectFromTopLeft = findIntersectFromTopLeft;
//
// const findIntersectFromTopRight = (searchMat, rect) => {
//     let p1, p2;
//     const adjust = 4;
//     const step = 20;
//     const stepMaxCount = 5;
//
//     // right top
//     p1 = new cv.Point2(rect.x + rect.width - adjust, rect.y + adjust);
//     // left bottom
//     p2 = new cv.Point2(rect.x + adjust, rect.y + rect.height - adjust);
//
//     let dx = p1.x - p2.x;
//     let dy = p1.y - p2.y;
//     let D = dx / dy;
//
//     // Find the axis for which 0 < D < 1
//     // Otherwise, by definition, we'll skip pixels: each time we increase one axis with 1, the other axis increases with D
//     if (Math.abs(D) >= 1) {
//         // Iterate over X axis
//         D = dy / dx;
//
//         // Iterate with a positive step
//         for (let i = 0; i < stepMaxCount; i++) {
//             currentX = p1.x - (i * step);
//             currentY = p1.y - ((i * step) * D);
//             searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 0, 0), 2);
//         }
//         // Iterate with a negative step
//         for (let i = 0; i < stepMaxCount; i++) {
//             currentX = p1.x - (i * -step);
//             currentY = p1.y - ((i * -step) * D);
//             searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 255, 0), 2);
//         }
//     } else {
//         // Iterate over Y axis
//         for (let i = 0; i < stepMaxCount; i++) {
//             currentX = p1.x - ((i * step) * D);
//             currentY = p1.y - (i * step);
//             searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 0, 0), 2);
//         }
//
//         // Iterate with a negative step (=check the other end of the line)
//         for (let i = 0; i < stepMaxCount; i++) {
//             currentX = p1.x - ((i * -step) * D);
//             currentY = p1.y - (i * -step);
//             searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 255, 0), 2);
//         }
//     }
// }
//
// exports.findIntersectFromTopRight = findIntersectFromTopRight;

const probeContour = (searchMat, contour) => {
    let rect = contour.boundingRect();
    let cross = Math.min(rect.width, rect.height);
    let val;
    const getVal = (x, y) => searchMat.at(y, x);
    for (let g = 0; g < cross; g++) {
        // Left top corner
        val = getVal(rect.x + g, rect.y + g);
        if (val.w === 255) {
            searchMat.drawCircle(new cv.Point2(rect.x + g, rect.y + g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from left top to right bottom
            return true;
        }
        // Right top corner
        val = getVal(rect.x + rect.width - g, rect.y + g);
        if (val.w === 255) {
            searchMat.drawCircle(new cv.Point2(rect.x + rect.width - g, rect.y + g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from right top to left bottom
            return false;
        }
        // Left bottom corner
        val = getVal(rect.x + g, rect.y + rect.height - g);
        if (val.w === 255) {
            searchMat.drawCircle(new cv.Point2(rect.x + g, rect.y + rect.height - g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from right top to left bottom
            return false;
        }
        // Right bottom corner
        val = getVal(rect.x + rect.width - g, rect.y + rect.height - g);
        if (val.w === 255) {
            searchMat.drawCircle(new cv.Point2(rect.x + rect.width - g, rect.y + rect.height - g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from left top to right bottom
            return true;
        }
    }
}

exports.probeContour = probeContour;