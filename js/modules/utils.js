// Given an object with properties or a dictionary
// will sort by their values and return the top x results
// and return the resulting array.
function sortTopOccurences(dict, x) {
    // Create items array
    var items = Object.keys(dict).map(function (key) {
        return [key, dict[key]];
    });

    // Sort the array based on the second element
    items.sort(function (first, second) {
        return second[1] - first[1];
    });

    // Returns a new array with only the first x items
    return items.slice(0, x);
}

// Given a string with escpaed characters "<", ">", or "&"
// Will replace them with their actual character.
function unEntity(str) {
    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function $(id) {
    return document.getElementById(id);
}

export {sortTopOccurences, unEntity, $};