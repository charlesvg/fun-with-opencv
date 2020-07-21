const cv = require('opencv4nodejs');
const debug = require('debug');
const log = debug('bot:record')
const {settings} = require('../settings');
const robot = require('robotjs');
const {drawText} = require('../util/draw-text');
const {gameWindow} = require('../game-window');
const {findWindow, setWindowBoundsIfNecessary} = require('../util/to-top');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

debug.enable('bot:*');

const img2mat = (img, width, height) => {
    return new cv.Mat(img.image, height, width, cv.CV_8UC4);
}
const w = settings.game.window.bounds.width;
const h = settings.game.window.bounds.height;

let displayMat = new cv.Mat(h,w, cv.CV_8UC4);

const getDir = () => {
    let cnt = 0;
    let resolvedPath;
    do {
        cnt++;
        resolvedPath = path.resolve(appRootPath.path, './assets/record/case-' + cnt);
    } while (fs.existsSync(resolvedPath));
    fs.mkdirSync(resolvedPath, { recursive: true })
    return resolvedPath;
}

const title = 'Bot recording';
const positionWindow = () => {
    const displayWnd = findWindow(title);
    displayWnd.bringToTop();
    setWindowBoundsIfNecessary(displayWnd, settings.bot.window.bounds);
}


const capture = async () => {

    await gameWindow.show();



    // Fill with black
    displayMat.drawRectangle(new cv.Rect(0, 0, w, h), new cv.Vec3(0, 0, 0,), -1, cv.LINE_AA);

    drawText(displayMat, 'Press any key to start recording', new cv.Vec3(255,0,0,), w/2, h/2);
    cv.imshow(title, displayMat);
    positionWindow();
    cv.waitKey(-1);

    let dirPath = getDir();
    log('Recording to ', dirPath);

    let cnt = 0;

    let interval = setInterval(() => {
        cnt++;
        const screenshotFromRobot = robot.screen.capture(0, 0, w, h);
        displayMat = img2mat(screenshotFromRobot, w, h);
        cv.imwrite(dirPath + '/cap-' + cnt + '.png', displayMat);
        drawText(displayMat, 'Image ' + cnt, new cv.Vec3(255,255,255,), w/2, h/2);
        cv.imshow(title, displayMat);
        if (cv.waitKey(25) !== -1) {
            clearInterval(interval);
            log('End recording (' + cnt + ' images)')
        }
    }, 0);


}

(async () => {
    await capture();
})();
