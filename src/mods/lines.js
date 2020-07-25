const cv = require('opencv4nodejs');

const findIntersectFromTopLeft = (searchMat, rect) => {
    let p1, p2;
    const adjust = 4;

    // left top
    p1 = new cv.Point2(rect.x + adjust, rect.y + adjust);
    // right bottom
    p2 = new cv.Point2(rect.x + rect.width - adjust, rect.y + rect.height - adjust);

    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let D = dx / dy;
    if (Math.abs(D) >= 1) {
        // Iterate over X axis, otherwise we get a dotted line..
        D = dy / dx;
        for (let n = 0; n < 100; n += 4) {
            searchMat.drawCircle(new cv.Point2(p1.x + n, p1.y + (n * D)), 1, new cv.Vec3(255, 0, 0), 2);
        }
    } else {
        for (let n = 0; n < 100; n += 4) {
            searchMat.drawCircle(new cv.Point2(p1.x + (n * D), p1.y + n), 1, new cv.Vec3(255, 0, 0), 2);
        }
    }
}

exports.findIntersectFromTopLeft = findIntersectFromTopLeft;

const findIntersectFromTopRight = (searchMat, rect) => {
    let p1, p2;
    const adjust = 4;

    // right top
    p1 = new cv.Point2(rect.x + rect.width - adjust, rect.y + adjust);
    // left bottom
    p2 = new cv.Point2(rect.x + adjust, rect.y + rect.height - adjust);

    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    let D = dx / dy;

    if (Math.abs(D) >= 1) {
        // Iterate over X axis, otherwise we get a dotted line..
        D = dy / dx;
        for (let n = 0; n < 100; n += 4) {
            searchMat.drawCircle(new cv.Point2(p2.x - n, p2.y - (n * D)), 1, new cv.Vec3(255, 0, 0), 2);
        }
    } else {
        for (let n = 0; n < 100; n += 4) {
            searchMat.drawCircle(new cv.Point2(p2.x - (n * D), p2.y - n), 1, new cv.Vec3(255, 0, 0), 2);
        }
    }
}

exports.findIntersectFromTopRight = findIntersectFromTopRight;

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