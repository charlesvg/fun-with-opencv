const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:kmeans')
debug.enable('bot:*');

// const img = cv.imread(path.resolve(appRootPath.path, './assets/case-1/cap-1.png'));

const { labels, centers } = cv.kmeans(
    [
        new cv.Point3(255, 0, 0),
        new cv.Point3(255, 0, 0),
        new cv.Point3(255, 0, 255),
        new cv.Point3(255, 0, 255),
        new cv.Point3(255, 255, 255)
    ],
    2,
    new cv.TermCriteria(cv.termCriteria.EPS | cv.termCriteria.MAX_ITER, 10, 0.1),
    5,
    cv.KMEANS_RANDOM_CENTERS
);

log('labels', labels);
log('centers', centers);