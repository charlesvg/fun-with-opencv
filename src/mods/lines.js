const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:lines')

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
    return x < 0
        || x >= mat.cols
        || y < 0
        || y >= mat.rows;
}

const findIntersect = (searchMat, rect, circles, startFromTopLeft = true) => {
    let p1, p2;
    const adjust = 10;
    const step = 20;

    const sign = startFromTopLeft ? 1 : -1;

    let stepColor, foundColor;
    let startCircle, endCircle;
    let startPoint, endPoint;

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

        // Iterate with a positive step
        let i = 0;
        do {
            currentX = p1.x + (i * sign * step);
            currentY = p1.y + ((i * sign * step) * D);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            startCircle = isPixelInCircles(currentX, currentY, circles);

            if (startCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                startPoint = new cv.Point2(currentX, currentY);
            }

        } while (!startCircle);

        // Iterate with a negative step
        i = 0;
        do {
            currentX = p1.x + (i * sign * -step);
            currentY = p1.y + ((i * sign * -step) * D);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            endCircle = isPixelInCircles(currentX, currentY, circles);
            if (endCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                endPoint = new cv.Point2(currentX, currentY);
            }

        } while (!endCircle);
    } else {
        // Iterate over Y axis
        // Iterate with a positive step (= check one end of the line)

        let i = 0;
        do {
            currentX = p1.x + ((i * sign * step) * D);
            currentY = p1.y + (i * sign * step);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            startCircle = isPixelInCircles(currentX, currentY, circles);
            if (startCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                startPoint = new cv.Point2(currentX, currentY);
            }

        } while (!startCircle);

        // Iterate with a negative step (=check the other end of the line)
        i = 0;
        do {
            currentX = p1.x + ((i * sign * -step) * D);
            currentY = p1.y + (i * sign * -step);
            i++;
            if (isPixelOutOfBounds(currentX, currentY, searchMat)) {
                break;
            }
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            endCircle = isPixelInCircles(currentX, currentY, circles);
            if (endCircle) {
                searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
                endPoint = new cv.Point2(currentX, currentY);
            }

        } while (!endCircle);
    }

    if (startCircle && endCircle) {
        return {
            startPoint: startPoint,
            endPoint: endPoint,
            startCircle: startCircle,
            endCircle: endCircle
        }
    } else {
        return undefined;
    }


}

exports.findIntersect = findIntersect;


const probeContour = (searchMat, contour) => {
    let rect = contour.boundingRect();
    let cross = Math.min(rect.width, rect.height);
    let val;
    const getVal = (x, y) => {
        if (isPixelOutOfBounds(x, y, searchMat)) {
            return {};
        } else {
            return searchMat.at(y, x)
        }
    };
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