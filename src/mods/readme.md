# Example of masking `mask.js`

Important note: when supplying the mask to the inRange function,
one should make sure that the HSV colors have been converted to OpenCV's format.

OpenCV's format is that the `HUE` is mapped to `0-180` (instead of the conventional `0-360`),
the `SATURATION` and `VALUE` are mapped to `0-255`.

There's a basic color picker under the `color-picker` directory that will convert the HSV value directly to the OpenCV format space.