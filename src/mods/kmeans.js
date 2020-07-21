const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:kmeans')
const appRootPath = require('app-root-path');
const path = require('path');
debug.enable('bot:*');

// const img = cv.imread(path.resolve(appRootPath.path, './assets/case-1/cap-1.png'));
const img = new cv.Mat(2, 2, cv.CV_8UC3);
img.set(0, 0, new cv.Vec3(255, 0, 0));
img.set(0, 1, new cv.Vec3(255, 0, 0));
img.set(1, 0, new cv.Vec3(0, 255, 0));
img.set(1, 1, new cv.Vec3(255, 0, 0));


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

// cv.imshow('test', img);
// cv.waitKey();


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