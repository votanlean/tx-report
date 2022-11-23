require("dotenv").config();
const fs = require("node:fs");
const { parse } = require("csv-parse");
const yargs = require("yargs");

const supportToken = ["BTC", "ETH", "XRP"];
const filePath = process.env.FILE_PATH || "./data/sample.csv";
const result = supportToken.reduce((res, key) => ((res[key] = 0), res), {});
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
  .help()
  .alias("help", "h").argv;

if (argv.token) {
  if (supportToken.includes(argv.token)) {
    console.log("Filtered by token: ", argv.token);
  } else {
    console.error(`Filtered token ${argv.token} is not support`);
    process.exit(1);
  }
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
    console.log("Result", result);
  })
  .on("error", function (error) {
    console.error(error.message);
  });
