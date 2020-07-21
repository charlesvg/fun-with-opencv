const cv = require('opencv4nodejs');

exports.drawText = (mat, text, color, x, y) => {
    const font = cv.FONT_HERSHEY_PLAIN;
    let textSize = cv.getTextSize(text, font, 1, 1);
    const textPosition = new cv.Point2(x - (textSize.size.width / 2), y );
    mat.putText(text, textPosition, font, 1, color, 1, cv.LINE_AA);
}