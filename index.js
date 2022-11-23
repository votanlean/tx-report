const fs = require("node:fs");
const { parse } = require("csv-parse");
const yargs = require("yargs");
const argv = yargs
  .command("report", "Show simple report from the transactions file")
  .option("token", {
    alias: "t",
    description: "Token Symbol",
    type: "string",
  })
  .option("date", {
    alias: "d",
    description: "Date in format YYYYMMDD",
    type: "string",
  })
  .help()
  .alias("help", "h").argv;

const result = {
  BTC: 0,
  ETH: 0,
  XRP: 0,
};
fs.createReadStream("./simple_tx.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
    // timestamp, action, symbol, amount
    const timestamp = row[0];
    const action = row[1];
    const symbol = row[2];
    const amount = parseFloat(row[3]);
    if (argv.date) {
      const dateBeginingTimestamp = new Date(argv.date).valueOf() / 1000;
      if (
        timestamp < dateBeginingTimestamp ||
        timestamp >= dateBeginingTimestamp + 24 * 60 * 60 // plus 1 day
      ) {
        return;
      }
    }

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
    if (argv.date) {
      console.log("Filtered by date: ", new Date(argv.date));
    }

    if (argv.token) {
      console.log("Filtered by token: ", argv.token);
    }
    console.log("Result", result);
  })
  .on("error", function (error) {
    console.error(error.message);
  });
