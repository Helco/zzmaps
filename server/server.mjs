import path from "path";
import { fileURLToPath } from 'url';
import express from "express";
import createError from "http-errors";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express()
const port = 8000

app.param(['layer', 'zoom', 'tileX', 'tileZ'], function(req, res, next, num, name){
    req.params[name] = parseInt(num, 10);
    if( isNaN(req.params[name]) ){
      next(createError(400, 'failed to parseInt '+num));
    } else {
      next();
    }
});

app.param(['sceneId'], function(req, res, next, sceneId, name){
    req.params[name] = sceneId;
    if( (typeof sceneId) !== "string" || sceneId.length <= 0) {
      next(createError(400, 'failed to parse '+ sceneId));
    } else {
      next();
    }
});

app.use('/', express.static(path.join(__dirname, "..", "public")));
app.use('/res', express.static(path.join(__dirname, "..", "res")));
app.use('/src', express.static(path.join(__dirname, "..", "src")));

function openDatabase() {
  return open({
    filename: path.join(__dirname, "..", "tiles.db"),
    driver: sqlite3.cached.Database,
    mode: sqlite3.OPEN_READONLY
  });
}

app.get('/:sceneId/:layer-:zoom-:tileX.:tileZ', async (req, res) => {
  const db = await openDatabase();
  let result = await db.get("SELECT encoding, tile FROM Tiles WHERE scene = ? AND layer = ? AND zoom = ? AND x = ? AND z = ?", 
      req.params.sceneId, req.params.layer, req.params.zoom, req.params.tileX, req.params.tileZ);
  if (result === undefined)
  {
    //if (req.params.layer >= 0)
    //  res.redirect(`/${req.params.sceneId}/-1-0-0-0.0`);
    //else
      res.status(404);
    res.send();
    return;
  }
  res.status(200);
      res.header("Content-Type", "image/" + result.encoding.substr(1));
      res.send(result.tile);
});

app.get('/:sceneId/meta.json', async (req, res) => {
  const db = await openDatabase();
  let result = await db.get("SELECT meta FROM SceneMeta WHERE scene = ?", req.params.sceneId);
  if (result === undefined)
  {
    res.status(404);
    res.send();
    return;
  }
  res.status(200);
  res.header("Content-Type", "application/json");
  res.send(result.meta);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
