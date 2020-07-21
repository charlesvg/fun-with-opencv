
const isCurrentInsideCandidate = (currentCircle, candidateCircle) => {
    let distSq = Math.sqrt(((currentCircle.center.x - candidateCircle.center.x) * (currentCircle.center.x - candidateCircle.center.x)) + ((currentCircle.center.y - candidateCircle.center.y) * (currentCircle.center.y - candidateCircle.center.y)));

    if (candidateCircle.radius >= (distSq+currentCircle.radius))
    {
        // current inside candidate
        return true;
    } else {
        // current not inside candidate
        return false;
    }
}

exports.isCurrentInsideCandidate = isCurrentInsideCandidate;