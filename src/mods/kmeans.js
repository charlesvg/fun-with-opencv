const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:kmeans')
const appRootPath = require('app-root-path');
const path = require('path');

const doKmeans = (canvas, rescaledWidth) => {

    // Rescale the image so that after changing the scale, the new width is rescaledWidth
    if (rescaledWidth > 0) {
        let factor = rescaledWidth / canvas.cols;
        canvas = canvas.rescale(factor);
    }

    // Kmeans accepts the pixels as an array of cv.Point3, but there doesn't seem to be a way to get that
    // unless you create it yourself... (AFAIK! all help welcome)
    const convertImage = (image) => {
        log('Image conversion start');
        const imageBuffer = image.getData();
        const ui8 = new Uint8Array(imageBuffer);
        const imageData = new Array((image.rows * image.cols));
        let index = 0;
        for (let i = 0; i < ui8.length; i += 3) {
            imageData[index] = new cv.Point3(ui8[i], ui8[i + 1], ui8[i + 2]);
            index++;
        }
        log('Image conversion end');
        return imageData;
    }

    const {labels, centers} = cv.kmeans(
        convertImage(canvas),
        2,
        new cv.TermCriteria(cv.termCriteria.EPS | cv.termCriteria.MAX_ITER, 10, 0.1),
        5,
        cv.KMEANS_RANDOM_CENTERS
    );

    // Warning: centers are not sorted by compactness!
    return {labels: labels, centers: centers};
}

exports.doKmeans = doKmeans;
const doKmeansBis = (data) => {

    const k = 5;
    const {labels, centers} = cv.kmeans(
        data,
        k,
        new cv.TermCriteria(cv.termCriteria.EPS | cv.termCriteria.MAX_ITER, 10, 0.1),
        5,
        cv.KMEANS_RANDOM_CENTERS
    );

    const votes = new Array(k);
    for (let i = 0; i < votes.length; i++) {
        votes[i] = {idx: i, value:0};
    }
    for (let i = 0; i < labels.length; i++) {
        const bin = labels[i];
        votes[bin].value++;
    }
    votes.sort((a, b) => b.value - a.value);

    const sortedCenters = [];
    for (let i = 0; i < votes.length; i++) {
        const v = votes[i];
        sortedCenters.push(centers[v.idx]);
    }

    return {labels: labels, centers: sortedCenters};
}


exports.doKmeansBis = doKmeansBis;


const example = () => {
    debug.enable('bot:*');

    let img = cv.imread(path.resolve(appRootPath.path, './assets/case-1/cap-1.png'));

    cv.imshow('canvasOutput', img);
    cv.waitKey();

    const {labels, centers} = doKmeans(img, 600);

    // Warning: centers are not sorted by compactness!
    log('Labels', labels);
    log('Centers', centers);

}


if (require.main === module) {
    // Run the example if called directly (as opposed as to being require'd)
    example();
}

