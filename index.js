if (process.env.NODE_ENV == "development") {
  console.log('Running dev server (redirect)');
  require("http")
    .createServer((req, res) => {
      res.writeHead(301, {
        Location: "https://spice-escape.com",
      });
      res.end("Moved permanently");
    })
    .listen(3000);
} else {
  require("./server.js");
}
