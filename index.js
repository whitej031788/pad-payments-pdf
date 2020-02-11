const config = require('./config.json');
const axios = require('axios');
const htmlToPdf = require('html-pdf');
const HTMLParser = require('node-html-parser');
const pdfOptions = { format: 'Letter', border: "1cm" };

class PaddlePaymentsWorker {
    constructor() {
        this.vendor_id = config.PADDLE_VENDOR_ID;
        this.vendor_auth_code = config.PADDLE_AUTH_KEY;
        this.url = config.PADDLE_API_URL;
    }

    JSON(params) {
        return this.createObj(params);
    }

    createObj(params) {
        let obj = {
            vendor_id: this.vendor_id,
            vendor_auth_code: this.vendor_auth_code
        };

        const finobj = {...obj, ...params};

        return finobj;
    }

    callListPaymentsAPI(fromDate, toDate) {
        return new Promise((resolve, reject) => {
            axios({
                method: "POST",
                url: this.url + "/api/2.0/subscription/payments",
                data: this.JSON({from: fromDate, to: toDate, is_paid: 1}),
                headers: { "Content-Type":  "application/json"}
            })
            .then(function (response) {
                // handle success
                return resolve(response.data);
            })
            .catch(function (error) {
                // handle error
                return reject(error);
            });
        });
    }

    convertToPdf(content, id) {
        let invSect = this.constructHtmlString(content);
        htmlToPdf.create(invSect, pdfOptions).toFile('./pdfs/' + id + '.pdf', function (err, res) {
            if (err) return console.log(err);
            console.log(res);
        });
    }

    constructHtmlString(htmlContent) {
        let returnContent = "";
        const root = HTMLParser.parse(htmlContent);
        let header = root.querySelector('head');
        let newCSS = HTMLParser.parse(this.buildCustomCss(), {style: true});
        header.appendChild(newCSS);
        returnContent += header.toString();
        returnContent += "<body>";
        let invoice = root.querySelector('.c-sheet').toString();
        returnContent += invoice;
        returnContent += "</body>";
        returnContent += "</html>";
        return returnContent;
    }

    buildCustomCss() {
        let theCss = "";
        theCss += "<style>";
        theCss += ".c-sheet {padding: 0px !important; margin: 0px !important;} p {font-size: 9px !important; line-height: 12px !important; overflow: hidden !important;} body * {overflow: hidden !important;} .c-heading--size-4 {font-size: 14px !important;} div, .g-container {margin-top: 2px !important;} .c-heading--size-2 {font-size: 18px !important;} .c-heading--size-3 {font-size: 16px !important;} .c-heading--size-5 {font-size: 12px !important;}"
        theCss += "</style>";
        return theCss;
    }
}

if (process.argv.length < 4) {
    console.log("You must pass a 'from' and 'to' date as the first and second argument, respectively.");
    console.log("Dates should be in 'YYYY-MM-DD' format");
    console.log("\n*PLEASE NOTE*\nBoth date parameters are exclusive, which is inconsistent with other Paddle APIs.")
    process.exit();
} else {
    let obj = new PaddlePaymentsWorker();

    obj.callListPaymentsAPI(process.argv[2], process.argv[3]).then((data) => {
        data.response.forEach(function(paddle_item) {
            console.log(paddle_item.receipt_url);
            axios.get(paddle_item.receipt_url).then(function (html_response) {
                obj.convertToPdf(html_response.data, paddle_item.id);
              })
              .catch(function (error) {
                console.log(error);
              });
        });
    })
    .catch(function (error) {
        console.log(error);
    });
}