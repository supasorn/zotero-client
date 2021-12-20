async function test() {
const arxiv = require('arxiv-api');

  const papers = await arxiv.search({
    searchQueryParams: [
      {
        include: [{name: 'diffusion'}],
        exclude: [],
      },
    ],
    start: 0,
    maxResults: 5,
  });
  console.log(papers);
}
test();
