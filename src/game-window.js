const {findWindow, setWindowBoundsIfNecessary} = require('./util/to-top');
const {settings} = require('./settings');

const robot = require("robotjs");

const promiseWithDelay = (delay => {
    return new Promise((resolve =>
        setTimeout(() => {
            resolve()
        }, delay)));
});

exports.gameWindow = {
    show: () => {
        const gameWindow = findWindow('Heroes');
        gameWindow.bringToTop();
        setWindowBoundsIfNecessary(gameWindow, settings.game.window.bounds);
    },
    selectGeneralsTab: async () => {
        robot.moveMouse(settings.game.tabs.generals.x, settings.game.tabs.generals.y);
        robot.mouseClick();
        return promiseWithDelay(4000);
    },
    zoomToMax: async () => {
        robot.moveMouse(settings.game.rtsMenu.zoomMax.x, settings.game.rtsMenu.zoomMax.y);
        robot.mouseClick();
        return promiseWithDelay(2000);
    }
}