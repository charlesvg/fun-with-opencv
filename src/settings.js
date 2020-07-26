const cv = require('opencv4nodejs');

const topOffset = 200;
const rightOffset = 310;
const leftOffset = 65;
const bottomOffset = 150;

const searchRegion = new cv.Rect(leftOffset, topOffset, 1280 - rightOffset - leftOffset, 720 - topOffset - bottomOffset);


exports.settings = {
    game: {
        tabs: {
            generals: {x: 350, y: 60}
        },
        window: {
            bounds: {
                x: 0,
                y: 0,
                width: 1280,
                height: 720
            }
        },
        rtsMenu: {
            zoomMax: {x: 325, y: 157}
        }
    },
    bot: {
        window: {
            title: 'The Bot',
            bounds: {
                x: -searchRegion.width,
                y: 0,
                width: searchRegion.width,
                height: searchRegion.height
            },
            searchRegion: searchRegion
        },
    }
}