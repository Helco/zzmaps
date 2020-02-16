import Scene from "Scene";
import { Database } from "./Database";

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

async function loadDatabase(): Promise<Database>
{
    const response = await fetch(`res/db.json`);
    return <Database>(await response.json());
}

//
// STARTUP
//
let scene: Scene = null;
let database: Database = null;

(async()=>{
    database = await loadDatabase();
    scene = new Scene("mapid", database);
    const query = parseQuery();
    let sceneFilename = "sc_2421";
    if ("scene" in query)
        sceneFilename = query.scene;
    scene.load(sceneFilename);
})();
