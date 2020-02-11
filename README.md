## Paddle PDF Invoices

This is a script to translate all Paddle issued invoices to customers into PDF files on your local machine for accounting purposes. It accepts 2 arguments, a "from" date and a "to" date as command line arguments. The files are dropped into a "pdfs" directory in the same location as the Node script, and the files are named after the payment IDs.

Checkout the repository, then add your Paddle Vendor ID and Auth Code to the configuration file. Then, run the scripts:

```
mkdir pdfs
node index.js 2020-01-28 2020-02-03
```

Pagination can be built into this if the payments are more, as the Paddle API supports it