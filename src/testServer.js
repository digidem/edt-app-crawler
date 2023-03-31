const http = require("http");
const url = require("url");
const fs = require("fs");
module.exports = () => {
  http
    .createServer((_, response) => {
      response.writeHead(200);
      fs.createReadStream("./src/sample.bin").pipe(response); // do NOT use fs's sync methods ANYWHERE on production (e.g readFileSync)
    })
    .listen(9615);
};
