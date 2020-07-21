const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:kmeans')
const appRootPath = require('app-root-path');
const path = require('path');
debug.enable('bot:*');

let img = cv.imread(path.resolve(appRootPath.path, './assets/case-1/cap-1.png'));
let factor = 30 / img.cols;
img = img.rescale(factor);
const convertImage = (image) => {
    log('Image conversion start');
    const imageBuffer = image.getData();
    const ui8 = new Uint8Array(imageBuffer);
    const imageData = new Array((image.rows * image.cols))
    let index = 0;
    for (let i = 0; i < ui8.length; i += 3) {
        imageData[index] = new cv.Point3(ui8[i], ui8[i + 1], ui8[i + 2]);
        index++;
    }
    log('Image conversion end');
    return imageData;
}

// log(convertImage(img));

cv.imshow('test', img);
cv.waitKey();


const {labels, centers} = cv.kmeans(
    // [
    //     new cv.Point3(255, 0, 0),
    //     new cv.Point3(255, 0, 0),
    //     new cv.Point3(255, 0, 255),
    //     new cv.Point3(255, 0, 255),
    //     new cv.Point3(255, 255, 255)
    // ],
    convertImage(img),
    2,
    new cv.TermCriteria(cv.termCriteria.EPS | cv.termCriteria.MAX_ITER, 10, 0.1),
    5,
    cv.KMEANS_RANDOM_CENTERS
);

log('labels', labels);
log('centers', centers);