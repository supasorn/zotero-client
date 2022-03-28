# zotero-client
Pdf viewer for Zotero local storage. It supports fuzzy search, horizontal scrolling, and auto-trim the white margin.

Please excuse the code mess. This software is very beta, and I didn't test it very well. 

https://user-images.githubusercontent.com/3422049/160427320-745015b6-71ef-446e-b35b-31de4fdb8cae.mp4

Requires node.js

## To install:
1. Create zotero_credential.json with
```
{
  "key": "YOUR_ZOTERO_KEY",
  "userid": "YOUR_USER_ID",
  "path": "/Users/supasorn/Zotero/storage/"
}
```
2. Invoke the usual node install:
```
npm i
node index.js
```
3. Visit http://localhost:3000 or whichever port you picked.

## Known problems
1. Partial sync (sync button) only supports adding new items. To perform a full sync, http://localhost:3000/fsync.
