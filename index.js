const fs = require("node:fs");
const { parse } = require("csv-parse");
const result = {
  BTC: 0,
  ETH: 0,
  XRP: 0,
};
fs.createReadStream("./simple_tx.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
    // timestamp, action, symbol, amount
    const action = row[1];
    const symbol = row[2];
    const amount = parseFloat(row[3]);
    switch (action) {
      case "DEPOSIT":
        result[symbol] += amount;
        break;
      case "WITHDRAWAL":
        result[symbol] -= amount;
        break;
    }
  })
  .on("end", function () {
    console.log("Result", result);
  })
  .on("error", function (error) {
    console.error(error.message);
  });
