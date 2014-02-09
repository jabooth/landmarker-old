var JAB = {};

JAB.metresPerUnitsForObject = function (object) {
    var bounds = object.geometry.boundingBox.size();
    var averageLengthUnits = (bounds.x + bounds.y + bounds.z) / 3;
    // for a bunny, the true length should be 0.3m
    var trueLengthMetres = 0.3;
    // lets say the length is actually is 12WU (World Units)
    // the conversion factor is 0.3m / 12WU
    //
    // e.g. how far is 4m in the world?
    // let this quantity be x:
    //
    //   4m =  xU * 0.3m / 12WU
    //   -> xU = 4 * 12 / 0.3 = 160WU
    return trueLengthMetres / averageLength;
}
