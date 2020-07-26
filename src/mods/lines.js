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

const findIntersect = (searchMat, rect, towns, startFromTopLeft = true) => {
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
            // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            startCircle = isPixelInTowns(currentX, currentY, towns);

            if (startCircle) {
                // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
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
            // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            endCircle = isPixelInTowns(currentX, currentY, towns);
            if (endCircle) {
                // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
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
            // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            startCircle = isPixelInTowns(currentX, currentY, towns);
            if (startCircle) {
                // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
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
            // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, stepColor, 2);
            endCircle = isPixelInTowns(currentX, currentY, towns);
            if (endCircle) {
                // searchMat.drawCircle(new cv.Point2(currentX, currentY), 1, foundColor, 4);
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
            // searchMat.drawCircle(new cv.Point2(rect.x + g, rect.y + g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from left top to right bottom
            return true;
        }
        // Right top corner
        val = getVal(rect.x + rect.width - g, rect.y + g);
        if (val.w === 255) {
            // searchMat.drawCircle(new cv.Point2(rect.x + rect.width - g, rect.y + g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from right top to left bottom
            return false;
        }
        // Left bottom corner
        val = getVal(rect.x + g, rect.y + rect.height - g);
        if (val.w === 255) {
            // searchMat.drawCircle(new cv.Point2(rect.x + g, rect.y + rect.height - g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from right top to left bottom
            return false;
        }
        // Right bottom corner
        val = getVal(rect.x + rect.width - g, rect.y + rect.height - g);
        if (val.w === 255) {
            // searchMat.drawCircle(new cv.Point2(rect.x + rect.width - g, rect.y + rect.height - g), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);
            // This line goes from left top to right bottom
            return true;
        }
    }
}

const findLinesMetaPerColor = (canvas, minColor, maxColor, towns) => {

    let searchMat = canvas.copy();

    // Remove the towns
    for (let i = 0; i < towns.length; i++) {
        const town = towns[i];
        searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius+5, new cv.Vec3(0, 0, 0), -1);
    }

    // Mask (preserve) the target color
    searchMat = doMask(searchMat, minColor, maxColor, false);

    // Blur before threshold (remove noise)
    searchMat = searchMat.blur(new cv.Size(10, 10));

    // Threshold (remove noise)
    searchMat = searchMat.threshold(
        5,
        255,
        cv.THRESH_BINARY
    );

    // Find blobs
    let contours = searchMat
        .copy()
        .cvtColor(cv.COLOR_BGRA2GRAY)
        .findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Infer line from blobs until intersected with a town circle
    let lines = [];
    contours.forEach(contour => {
        let rect = contour.boundingRect();
        let circle = contour.minEnclosingCircle();
        if (circle.radius > 10) {
            // searchMat.drawRectangle(rect, new cv.Vec3(0,255,255), 1, cv.LINE_AA);

            // Returns undefined if the contour starts outside of bounds
            let startFromTopLeft = probeContour(searchMat, contour);
            if (startFromTopLeft !== undefined) {
                let foundLine = findIntersect(searchMat, rect, towns, startFromTopLeft);
                if (foundLine) {
                    lines.push(foundLine);
                    // searchMat.drawLine(foundLine.startPoint, foundLine.endPoint, new cv.Vec3(0, 255, 0), 2, cv.LINE_AA);
                }
            }
        }



        // searchMat.drawCircle(new cv.Point2(rect.x + 1, rect.y + 1), 1, new cv.Vec3(0, 0, 255), -1, cv.LINE_AA);

        // searchMat.drawLine(p1, p2, new cv.Vec3(0, 255, 0), 1, cv.LINE_AA);
    });


    for (let i = 0; i < towns.length; i++) {
        const town = towns[i];
        // searchMat.drawCircle(new cv.Point2(town.center.x, town.center.y), town.radius, new cv.Vec3(0, 255, 0), 1);
    }


    return lines;
}

const findLinesMeta = (canvas, towns) => {
    let lines = [];

    // Gray
    let min = new cv.Vec3(0, 0, 50);
    let max = new cv.Vec3(0, 0, 101);
    lines = lines.concat(findLinesMetaPerColor(canvas, min, max, towns));

    // Red
    min = new cv.Vec3(2, 210, 135);
    max = new cv.Vec3(4, 220, 180);
    lines = lines.concat(findLinesMetaPerColor(canvas, min, max, towns));

    // Blue
    min = new cv.Vec3(112, 187, 165);
    max = new cv.Vec3(116, 195, 206);
    lines = lines.concat(findLinesMetaPerColor(canvas, min, max, towns));

    return lines;
}

exports.findLinesMeta = findLinesMeta;