const {windowManager} = require("node-window-manager");

exports.findWindow = (title) => {
    let foundWindow;
    windowManager.getWindows().forEach((window) => {
        if (window.getTitle().indexOf(title) !== -1) {
            foundWindow = window;
        }
    });
    return foundWindow;
}

exports.setWindowBoundsIfNecessary = (wndw, bounds) => {
    const currentBounds = wndw.getBounds();
    if (currentBounds.x !== bounds.x
        || currentBounds.y !== bounds.y
        || currentBounds.width !== bounds.width
        || currentBounds.height !== bounds.height
    ) {
        wndw.setBounds(bounds);
        wndw.maximize();
        wndw.restore();
        wndw.setBounds(bounds);
    }
}


