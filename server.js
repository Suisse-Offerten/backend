const app = require("./app");
const http = require("http");
require("dotenv").config();
const port = process.env.PORT || 4001;

const server = http.createServer(app);

server.listen(port, () => {
  // Listen Port
  console.log(`app running http://localhost:${port}`);
});
