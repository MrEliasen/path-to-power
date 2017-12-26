exports.parseJson = function(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        return null;
    } 
}

