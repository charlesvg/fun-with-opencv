const debug = require('debug');
const log = debug('bot:app')

const {gameWindow} = require('./game-window');
const {botWindow} = require('./bot-window');

debug.enable('bot:*');

(async () => {
    log('Showing game window');
    await gameWindow.show();
    // log('Selecting generals tab');
    // await gameWindow.selectGeneralsTab();
    // log('Setting zoom to max');
    // await gameWindow.zoomToMax();
    log('Showing bot window');
    await botWindow.initWindow();
    setInterval(() => {
        botWindow.copyFromSource();
        botWindow.detectTowns();
        botWindow.detectAllegiance();
        botWindow.detectSkirmishes();
        botWindow.detectRoads();
        botWindow.refresh();

    }, 250);

    log('done');

})();

// robot.moveMouse(1280/2, 720/2);
// robot.mouseToggle("down");
// robot.dragMouse(1280/2 + 2, 720/2 +2 );
// robot.mouseToggle("up");