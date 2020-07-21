// FROM https://gist.github.com/ryancat/9972419b2a78f329ce3aebb7f1a09152
/**
 * Compare color difference in RGB
 * @param {Array} rgb1 First RGB color in array
 * @param {Array} rgb2 Second RGB color in array
 */
exports.deltaRgb = (rgb1, rgb2) => {
    const [r1, g1, b1] = rgb1,
        [r2, g2, b2] = rgb2,
        drp2 = Math.pow(r1 - r2, 2),
        dgp2 = Math.pow(g1 - g2, 2),
        dbp2 = Math.pow(b1 - b2, 2),
        t = (r1 + r2) / 2

    return Math.sqrt(2 * drp2 + 4 * dgp2 + 3 * dbp2 + t * (drp2 - dbp2) / 256)
}

exports.deltaRgbFromVec = (vec1, vec2) => {
    const b1 = vec1.w;
    const g1 = vec1.x;
    const r1 = vec1.y;

    const b2 = vec2.w;
    const g2 = vec2.x;
    const r2 = vec2.y;

    const drp2 = Math.pow(r1 - r2, 2);
    const dgp2 = Math.pow(g1 - g2, 2);
    const dbp2 = Math.pow(b1 - b2, 2);
    const t = (r1 + r2) / 2;

    return Math.sqrt(2 * drp2 + 4 * dgp2 + 3 * dbp2 + t * (drp2 - dbp2) / 256)
}

/**
 * calculate the perceptual distance between colors in CIELAB
 * https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs
 *
 * @param {Array} labA First LAB color in array
 * @param {Array} labB Second LAB color in array
 */
function deltaE(labA, labB) {
    var deltaL = labA[0] - labB[0];
    var deltaA = labA[1] - labB[1];
    var deltaB = labA[2] - labB[2];
    var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    var deltaC = c1 - c2;
    var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    var sc = 1.0 + 0.045 * c1;
    var sh = 1.0 + 0.015 * c1;
    var deltaLKlsl = deltaL / (1.0);
    var deltaCkcsc = deltaC / (sc);
    var deltaHkhsh = deltaH / (sh);
    var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
}