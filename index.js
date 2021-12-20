const express = require('express')
const app = express()
const port = 3000
const Zotero = require('libzotero');
const {exec} = require("child_process");

const fs = require('fs');
const glob = require("glob")
const globp = require("glob-promise")

app.use(express.static("./"));
app.use("/pdf_slim_viewer", express.static("/Users/supasorn/pdf_slim_viewer/"));

app.get('/sync', async (req, res) => {
  var config = new Zotero.RequestConfig();
  config.Key("7ouvIbjpR1YFGTXxAFC3pGDa");
  config.LibraryType('user').LibraryID('7902311');
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

  fetcher.fetchAll().then(()=>{
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
  config.Key("7ouvIbjpR1YFGTXxAFC3pGDa");
  config.LibraryType('user').LibraryID('7902311');
  config.Target('items').Limit(100);

  var fetcher = new Zotero.Fetcher(config.config);

  fetcher.fetchAll().then(()=>{
    let results = fetcher.results;
    console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${results.length}\n`);

    let data = JSON.stringify(results);
    fs.writeFileSync('results.json', data);
    res.redirect('/');
  });
});

app.get('/delete', async (req, res) => {
  var config = new Zotero.RequestConfig();
  config.Key("7ouvIbjpR1YFGTXxAFC3pGDa");
  config.LibraryType('user').LibraryID('7902311');
  //config.Target('items').TargetModifier("top").Limit(100);
  config.Target('deleted');
  config.config["since"] = 1000;

  var fetcher = new Zotero.Fetcher(config.config);
  fetcher.fetchAll().then(()=>{
    let results = fetcher.results;
    console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${results.length}\n`);

    console.log(results)
  }).catch(e => {
    console.log(e);
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

  } catch(e) { // Preview doesn't exist
    console.log("not exist");
    const files = await globp(`/Users/supasorn/Zotero/storage/${id}/*.pdf`);
    if (files.length == 0)
      return res.sendStatus(404);

    if (!fs.existsSync(`preview/${id}`))
      await fs.promises.mkdir(`preview/${id}`);

    const pdf = files[0];
    exec(`pdftoppm -jpeg -r 50 "${pdf}" ./preview/${id}/small`, (error, stdout, stderr) => { send_list(); });
  }
})

app.get('/papers/:id/:name?', async (req, res) => {
  const id = req.params.id;
  //console.log(globp);
  const files = await globp.promise(`/Users/supasorn/Zotero/storage/${id}/*.pdf`);
  if (files.length == 0)
    return res.sendStatus(404);
  try {
    const data = await fs.promises.readFile(files[0]);
    res.writeHead(200, {"Content-Type": "application/pdf"});
    res.write(data);
    res.end();       
  } catch (e) {
    return res.sendStatus(404);
  }
});

app.get('/api/data', (req, res) => {
  fs.readFile('./results.json', (err, json) => {
    let obj = JSON.parse(json);
    res.json(obj);
  });
});

app.get('/test', (req, res) => {
  console.log("in")
  res.write("<iframe height='300px' src='http://localhost:3000/pdf_slim_viewer/web/viewer.html?file=http:/papers/975CNYDP/Object-Centric%20Learning%20with%20Slot%20Attention'>");
  res.end();
});

app.listen(port);

/*
fetcher.next().then((response)=>{
	//the parsed json array of items that the api returned is on response.data,
	//we can loop through them and create a Zotero.Item for each
	console.log('\naccessing the items directly from this response:')
	response.data.forEach((itemJson)=>{
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
}).then(()=>{
	//the array was also saved in fetcher.results
	console.log('\nfetcher.results:');
	fetcher.results.forEach((itemJson)=>{
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
}).then(()=>{
	if(fetcher.hasMore){
		console.log('\nfetcher still has more results we can retrieve with a next()');
	} else {
		console.log('\nwe got all the results there are');
	}

	//totalResults is populated when the first set is retrieved, so we can tell how many more there are
	console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${fetcher.results.length}`);
});*/


 /* 
var config = new Zotero.RequestConfig().LibraryType('user').LibraryID(3).Target('publications').config;
var fetcher = new Zotero.Fetcher(config);

fetcher.next().then((response)=>{
	//the parsed json array of items that the api returned is on response.data,
	//we can loop through them and create a Zotero.Item for each
	console.log('\naccessing the items directly from this response:')
	response.data.forEach((itemJson)=>{
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
}).then(()=>{
	//the array was also saved in fetcher.results
	console.log('\nfetcher.results:');
	fetcher.results.forEach((itemJson)=>{
		let item = new Zotero.Item(itemJson);
		console.log(item.get('title'));
	});
}).then(()=>{
	if(fetcher.hasMore){
		console.log('\nfetcher still has more results we can retrieve with a next()');
	} else {
		console.log('\nwe got all the results there are');
	}

	//totalResults is populated when the first set is retrieved, so we can tell how many more there are
	console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${fetcher.results.length}`);
});*/



//import api from 'zotero-api-client';
//const {default: api} = require('zotero-api-client');
//console.log(api);
//const myapi = api('7ouvIbjpR1YFGTXxAFC3pGDa').library('user', '7902311');
//const itemsResponse = myapi.items().get();
//itemsResponse.then((res) => {
  //console.log(res);
//});
//console.log(itemsResponse);

//var zotero = require('zotero');
//var lib = zotero({ user: '7902311' });
//console.log(lib);
//console.log(lib.items());
//var stream = new zotero.Stream({ apiKey: '7ouvIbjpR1YFGTXxAFC3pGDa' });
//7ouvIbjpR1YFGTXxAFC3pGDa
