# tx-report

Report portfolio balance base on transaction records

## Setup

Put source file into the data folder (e.g: `./data/transactions.csv`)

Clone the .env.example to .env and change the `FILE_PATH` to match the source file

Execution time: 54522 miliseconds

## Useguide

Run the program: `node index.js`
Example result

`Porfolio Balance: BTC: $3010287.8702013833 ETH: $155222.44638964004 XRP: $60.91500164400009`

Run `node index.js -h` to know the available options, there are 3 options:

- `-t`: Filter by token
- `-d`: Filter by date
- `-r`: Get latest price

## Note

I use stream to handle large file without out of memory
I use the temp `prices.json` file to store the price because request price may cost money, if user really need the current price, they will use the option `-r`
