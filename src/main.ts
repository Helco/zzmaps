import Scene from "Scene";

function parseQuery(): any {
    // from https://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
    const queryString = window.location.search.substr(1);
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

//
// STARTUP
//
let scene = new Scene("mapid");

const query = parseQuery();
let sceneFilename = "test"; // Endeva
if ("scene" in query)
    sceneFilename = query.scene;
scene.load(sceneFilename);
