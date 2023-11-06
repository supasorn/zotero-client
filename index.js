const express = require('express')
const app = express()
const port = 3000
const Zotero = require('libzotero');
const { exec } = require("child_process");

const fs = require('fs');
const glob = require("glob")
const globp = require("glob-promise")

let cred = JSON.parse(fs.readFileSync('zotero_credential.json'));
console.log(cred.key, cred.userid);

app.use(express.static("./"));
app.use("/pdf_slim_viewer", express.static("pdf_slim_viewer/"));

app.get('/readdb', async (req, res) => {
  let dbfile = "/Users/supasorn/Zotero/zotero.sqlite";
  const sqlite3 = require('sqlite3').verbose();

  let db = new sqlite3.Database(dbfile, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
  });

  const query = `
    SELECT i.dateAdded, subitem.key, i.itemID,
           (SELECT idv.value
            FROM itemData id
            JOIN itemDataValues idv ON id.valueID = idv.valueID
            WHERE id.itemID = i.itemID
            AND id.fieldID = 1
            LIMIT 1
           ) AS title,
           (
        SELECT GROUP_CONCAT(fullName, '; ')
        FROM (
            SELECT c.firstName || ' ' || c.lastName AS fullName
            FROM creators c
            JOIN itemCreators ci ON c.creatorID = ci.creatorID
            WHERE ci.itemID = i.itemID
            ORDER BY ci.orderIndex
        )
       ) AS authors,
          (SELECT idv.value
              FROM itemData id
              JOIN itemDataValues idv ON id.valueID = idv.valueID
              WHERE id.itemID = i.itemID
              AND id.fieldID = 6
              LIMIT 1
             ) AS pubdate
    FROM items i
    LEFT JOIN itemAttachments ia ON i.itemID = ia.parentItemID
    LEFT JOIN items subitem ON ia.itemID = subitem.itemID
    WHERE 
    NOT EXISTS (
        SELECT 1
        FROM groupItems gi
        WHERE gi.itemID = i.itemID
    )
    AND (
      i.itemID IN (
          SELECT parentItemID
          FROM itemAttachments
      )
      OR
      i.itemID IN (
          SELECT itemID
          FROM itemAttachments
          WHERE parentItemID IS NULL AND contentType = 'application/pdf' 
      )
    )
    AND ia.contentType = 'application/pdf' 
    ORDER BY i.dateAdded DESC;
`;
    //AND NOT EXISTS (
        // SELECT 1
        // FROM collectionItems ci
        // WHERE ci.itemID = i.itemID
    // ) 
          // WHERE parentItemID IS NULL AND contentType = 'application/pdf' AND syncState = 2

  let output = "";
  db.all(query, [], (err, rows) => {
    if (err) {
      throw err;
    }
    let json = JSON.stringify(rows);
    // fs.writeFileSync('sql.json', json);

    res.send(json);
    db.close();
  });

});

app.get('/fetch_preview/:id', async (req, res) => {
  const id = req.params.id;
  const send_list = () => glob(`preview/${id}/small*`, (er, files) => { res.json(files) });

  console.log(id);
  try { // Preview exists
    console.log("exists");
    await fs.promises.access(`preview/${id}/small-01.jpg`);
    send_list();

  } catch (e) { // Preview doesn't exist
    console.log("not exist");
    const files = await globp(`${cred.path}/${id}/*.pdf`);
    if (files.length == 0)
      return res.sendStatus(404);

    if (!fs.existsSync(`preview/${id}`))
      await fs.promises.mkdir(`preview/${id}`);

    const pdf = files[0];
    exec(`pdftoppm -jpeg -r 50 -l 10 "${pdf}" ./preview/${id}/small`, (error, stdout, stderr) => { send_list(); });
  }
})

app.get('/papers/:id/:name?', async (req, res) => {
  const id = req.params.id;
  //console.log(globp);
  const files = await globp.promise(`${cred.path}${id}/*.pdf`);
  if (files.length == 0)
    return res.sendStatus(404);
  try {
    const data = await fs.promises.readFile(files[0]);
    res.writeHead(200, { "Content-Type": "application/pdf" });
    res.write(data);
    res.end();
  } catch (e) {
    return res.sendStatus(404);
  }
});

app.get('/test', (req, res) => {
  console.log("in")
  res.write("<iframe height='300px' src='http://localhost:3000/pdf_slim_viewer/web/viewer.html?file=http:/papers/975CNYDP/Object-Centric%20Learning%20with%20Slot%20Attention'>");
  res.end();
});

app.get('/arxiv', (req, res) => {
  const query = req.params.query;
  console.log(query)
  res.write("yes");
  res.end();
});


app.get('/sync', async (req, res) => {
  var config = new Zotero.RequestConfig();
  config.Key(cred.key);
  config.LibraryType('user').LibraryID(cred.userid);
  config.Target('items').Limit(100);


  const obj = await fs.promises.readFile('./results.json');
  const json = JSON.parse(obj);
  let maxversion = 0;
  for (let item of json) {
    if (item.version > maxversion)
      maxversion = item.version;
  }
  console.log(maxversion)
  config.config["since"] = maxversion;

  var fetcher = new Zotero.Fetcher(config.config);

  fetcher.fetchAll().then(() => {
    let results = fetcher.results;
    console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${results.length}\n`);


    for (let item of results) {
      const found = json.findIndex(element => element.key == item.key)
      if (found == -1) {
        console.log(item.key, "not found");
        json.push(item);
      } else {
        console.log(item.key, "found", found);
        json[found] = item;
      }
    }

    let data = JSON.stringify(json);
    fs.writeFileSync('results.json', data);
    res.redirect('/');
  });
});

app.get('/fsync', async (req, res) => {
  var config = new Zotero.RequestConfig();
  config.Key(cred.key);
  config.LibraryType('user').LibraryID(cred.userid);
  config.Target('items').Limit(100);

  var fetcher = new Zotero.Fetcher(config.config);

  fetcher.fetchAll().then(() => {
    let results = fetcher.results;
    console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${results.length}\n`);

    let data = JSON.stringify(results);
    fs.writeFileSync('results.json', data);
    res.redirect('/');
  });
});

app.get('/delete', async (req, res) => {
  var config = new Zotero.RequestConfig();
  config.Key(cred.key);
  config.LibraryType('user').LibraryID(cred.userid);
  //config.Target('items').TargetModifier("top").Limit(100);
  config.Target('deleted');
  config.config["since"] = 1000;

  var fetcher = new Zotero.Fetcher(config.config);
  fetcher.fetchAll().then(() => {
    let results = fetcher.results;
    console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${results.length}\n`);

    console.log(results)
  }).catch(e => {
    console.log(e);
  });
});

app.get('/api/data', (req, res) => {
  fs.readFile('./results.json', (err, json) => {
    let obj = JSON.parse(json);
    res.json(obj);
  });
});


app.listen(port);
