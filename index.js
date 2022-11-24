require("dotenv").config();
const fs = require("node:fs");
const { parse } = require("csv-parse");
const yargs = require("yargs");
const fetch = require("node-fetch");

const supportTokens = ["BTC", "ETH", "XRP"];
const filePath = process.env.FILE_PATH || "./data/sample.csv";
const pricePath = process.env.PRICE_PATH || "./data/prices.json";
const apiKey = process.env.API_KEY;
const argv = yargs
  .command("report", "Show simple report from the transactions file")
  .option("token", {
    alias: "t",
    description: "Token Symbol",
    type: "string",
  })
  .option("date", {
    alias: "d",
    description: "Date in format YYYY-MM-DD",
    type: "string",
  })
  .option("refresh", {
    alias: "r",
    description: "Get newest price",
    type: "boolean",
  })
  .help()
  .alias("help", "h").argv;

let result = {};
if (argv.token) {
  if (supportTokens.includes(argv.token)) {
    console.log("Filtered by token: ", argv.token);
    result[argv.token] = 0;
  } else {
    console.error(`Filtered token ${argv.token} is not support`);
    process.exit(1);
  }
} else {
  supportTokens.forEach((token) => {
    result[token] = 0;
  });
}

if (argv.date) {
  const filteredDate = new Date(argv.date);
  if (filteredDate instanceof Date && !isNaN(filteredDate)) {
    console.log("Filtered by date: ", argv.date);
  } else {
    console.error(
      `Invalid filter date: ${argv.date}, the format is YYYY-MM-DD`
    );
  }
}

let prices = {};
if (argv.refresh) {
  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${supportTokens.join()}&tsyms=USD&api_key=${apiKey}`
  )
    .then((res) => res.json())
    .then((json) => {
      prices = json;
      console.log("json", json);
      fs.writeFile(pricePath, JSON.stringify(json), (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully update price");
        }
      });
      parseTx();
    });
} else {
  fs.readFile(pricePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Cannot read price data, ${err.message}`);
      parseTx.exit(1);
    }
    prices = JSON.parse(data);
    parseTx();
  });
}

function parseTx() {
  fs.createReadStream(filePath)
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
      // timestamp, action, symbol, amount
      const timestamp = row[0];
      const action = row[1];
      const symbol = row[2];
      const amount = parseFloat(row[3]);
      if (argv.token) {
        if (symbol !== argv.token) {
          return;
        }
      }
      if (argv.date) {
        const dateBeginingTimestamp = new Date(argv.date).valueOf() / 1000;
        if (
          timestamp < dateBeginingTimestamp ||
          timestamp >= dateBeginingTimestamp + 24 * 60 * 60 // plus 24 hours to get end date
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
      console.log("Porfolio Balance:");
      Object.keys(result).forEach((symbol) => {
        console.log(`${symbol}: $${result[symbol] * prices[symbol]["USD"]}`);
      });
    })
    .on("error", function (error) {
      console.error(error.message);
    });
}
