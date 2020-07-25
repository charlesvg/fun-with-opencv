const cv = require('opencv4nodejs');

const isPixelInCircle = (circle, x, y) => {
    return Math.sqrt(Math.pow((x - circle.center.x), 2) + Math.pow((y - circle.center.y), 2)) < circle.radius;
}

const findIntersectFromTopLeft = (searchMat, rect, circles) => {
    let p1, p2;
    const adjust = 4;
    const step = 20;
    const stepMaxCount = 5;

    // left top
    p1 = new cv.Point2(rect.x + adjust, rect.y + adjust);
    // right bottom
    p2 = new cv.Point2(rect.x + rect.width - adjust, rect.y + rect.height - adjust);

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
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x + (i * step);
            currentY = p1.y + ((i * step) * D);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 0, 0), 2);
        }
        // Iterate with a negative step
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x + (i * -step);
            currentY = p1.y + ((i * -step) * D);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 255, 0), 2);
        }
    } else {
        // Iterate over Y axis
        // Iterate with a positive step (= check one end of the line)
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x + ((i * step) * D);
            currentY = p1.y + (i * step);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 0, 0), 2);
        }

        // Iterate with a negative step (=check the other end of the line)
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x + ((i * -step) * D);
            currentY = p1.y + (i * -step);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 255, 0), 2);
        }
    }
}

exports.findIntersectFromTopLeft = findIntersectFromTopLeft;

const findIntersectFromTopRight = (searchMat, rect) => {
    let p1, p2;
    const adjust = 4;
    const step = 20;
    const stepMaxCount = 5;

    // right top
    p1 = new cv.Point2(rect.x + rect.width - adjust, rect.y + adjust);
    // left bottom
    p2 = new cv.Point2(rect.x + adjust, rect.y + rect.height - adjust);

    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    let D = dx / dy;

    // Find the axis for which 0 < D < 1
    // Otherwise, by definition, we'll skip pixels: each time we increase one axis with 1, the other axis increases with D
    if (Math.abs(D) >= 1) {
        // Iterate over X axis
        D = dy / dx;

        // Iterate with a positive step
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x - (i * step);
            currentY = p1.y - ((i * step) * D);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 0, 0), 2);
        }
        // Iterate with a negative step
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x - (i * -step);
            currentY = p1.y - ((i * -step) * D);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 255, 0), 2);
        }
    } else {
        // Iterate over Y axis
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x - ((i * step) * D);
            currentY = p1.y - (i * step);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 0, 0), 2);
        }

        // Iterate with a negative step (=check the other end of the line)
        for (let i = 0; i < stepMaxCount; i++) {
            currentX = p1.x - ((i * -step) * D);
            currentY = p1.y - (i * -step);
            searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, new cv.Vec3(255, 255, 0), 2);
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