const express = require('express')
const app = express()
const port = 3000
const Zotero = require('libzotero');
const {exec} = require("child_process");

const fs = require('fs');
const glob = require("glob")

app.use(express.static("./"));

app.get('/sync', (req, res) => {
  var config = new Zotero.RequestConfig();
  config.Key("7ouvIbjpR1YFGTXxAFC3pGDa");
  config.LibraryType('user').LibraryID('7902311');
  //config.Target('items').TargetModifier("top").Limit(100);
  config.Target('items').Limit(100);

  console.log(config);
  //config = config.LibraryType('user').LibraryID('7902311');
  //config = config.Target('items');.TargetModifier("top");
  //config = config.Limit(100);
  var fetcher = new Zotero.Fetcher(config.config);

  fetcher.fetchAll().then(()=>{
    let results = fetcher.results;
    console.log(`\nthere are ${fetcher.totalResults} results available, and we've already gotten ${results.length}\n`);

    results.forEach((itemJson)=>{
      let item = new Zotero.Item(itemJson);
      console.log(item);
    });

    let data = JSON.stringify(results);
    fs.writeFileSync('results.json', data);

  });
});

app.get('/fetch_preview/:id', (req, res) => {
  const id = req.params.id;
  fs.access(`preview/${id}`, error => {
    if (!error) {
      glob(`preview/${id}/small*`, (er, files) => {
        res.json(files)
      });
    } else {
      glob(`/Users/supasorn/Zotero/storage/${id}/*.pdf`, function(er, files) {
        if (!er) {
          console.log(`generating ${id}`);
          fs.mkdir(`preview/${id}`, err => {
            const pdf = files[0];
            exec(`pdftoppm -jpeg -r 50 "${pdf}" ./preview/${id}/small`, (error, stdout, stderr) => {
              glob(`preview/${id}/small*`, (er, files) => {
                res.json(files)
              });
            });
          });
        }

      });
    }
  });
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/api/data', (req, res) => {
  fs.readFile('./results.json', (err, json) => {
    let obj = JSON.parse(json);
    res.json(obj);
  });
});
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
