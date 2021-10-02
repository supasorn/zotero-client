import json
import glob
with open("results.json", "r") as fi:
  a = fi.read()
# sp = "".join(a.split("=")[1:])
sp = a
js = json.loads(sp)

topItem = []
for item in js:
  if "parentItem" not in item["data"]:
    topItem.append(item)

children = {}
for item in js:
  if "parentItem" in item["data"]:
    id = item["data"]["parentItem"]
    if id not in children:
      children[id] = []
    children[id].append(item)


print(children)
  # print(glob.glob(f"/Users/supasorn/Zotero/storage/{item['data']['key']}/*.*"))

