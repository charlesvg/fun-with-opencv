const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:replay')
const {settings} = require('../settings');
const {drawText} = require('../util/draw-text');
const {findWindow, setWindowBoundsIfNecessary} = require('../util/to-top');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const {doMask} = require('./mask');
const {findCircles, findCirclesMeta} = require('./find-circle');

const img = cv.imread(path.resolve(appRootPath.path, './assets/case-1/cap-1.png'));

// single axis for 1D hist
const getHistAxis = channel => [new cv.HistAxes({
    channel,
    bins: 256,
    ranges: [0, 256]
})];

// calc histogram for blue, green, red channel
const bHist = cv.calcHist(img, getHistAxis(0));
const gHist = cv.calcHist(img, getHistAxis(1));
const rHist = cv.calcHist(img, getHistAxis(2));

const blue = new cv.Vec(255, 0, 0);
const green = new cv.Vec(0, 255, 0);
const red = new cv.Vec(0, 0, 255);

// plot channel histograms
const plot = new cv.Mat(300, 600, cv.CV_8UC3, [255, 255, 255]);
cv.plot1DHist(bHist, plot, blue, cv.LINE_AA, 2);
cv.plot1DHist(gHist, plot, green, cv.LINE_AA, 2);
cv.plot1DHist(rHist, plot, red, cv.LINE_AA, 2);


cv.imshow('rgb image', img);
cv.imshow('rgb histogram', plot);
cv.waitKey();

const grayImg = img.bgrToGray();
const grayHist = cv.calcHist(grayImg, getHistAxis(0));
const grayHistPlot = new cv.Mat(300, 600, cv.CV_8UC3, [255, 255, 255]);
cv.plot1DHist(grayHist, grayHistPlot, new cv.Vec(0, 0, 0));

cv.imshow('grayscale image', grayImg);
cv.imshow('grayscale histogram', grayHistPlot);
cv.waitKey();