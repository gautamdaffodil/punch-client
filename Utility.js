import moment from "moment";

export const getZeroTimeDate = (date, eod) => {
    if (!date) {
        return date;
    }
    let minutes = date.getTimezoneOffset() * -1;
    if (eod) {
        return moment(date).endOf("day").add(minutes, "minutes").utc().toDate();
    } else {
        return moment(date).startOf("day").add(minutes, "minutes").utc().toDate();
    }
};

export const compareTwoDatesEquals=(date1, date2)=>{
    if (date1 && date2) {
        let day1 = date1.getUTCDate();
        let month1 = date1.getUTCMonth();
        let year1 = date1.getUTCFullYear();

        let day2 = date2.getUTCDate();
        let month2 = date2.getUTCMonth();
        let year2 = date2.getUTCFullYear();
        if (Number(day1) == Number(day2) && Number(month1) == Number(month2) && Number(year1) == Number(year2)) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

export const compareTwoDatesLessEquals=(date1, date2)=> {
    if (date1 && date2) {
        let day1 = date1.getUTCDate();
        let month1 = date1.getUTCMonth();
        let year1 = date1.getUTCFullYear();

        let day2 = date2.getUTCDate();
        let month2 = date2.getUTCMonth();
        let year2 = date2.getUTCFullYear();

        let d1 = new Date("2014-01-10");
        d1.setUTCFullYear(year1);
        d1.setUTCMonth(month1);
        d1.setUTCDate(day1);
        d1.setUTCHours(0);
        d1.setUTCMinutes(0);
        d1.setUTCSeconds(0);
        d1.setUTCMilliseconds(0);

        let d2 = new Date("2014-01-10");
        d2.setUTCFullYear(year2);
        d2.setUTCMonth(month2);
        d2.setUTCDate(day2);
        d2.setUTCHours(0);
        d2.setUTCMinutes(0);
        d2.setUTCSeconds(0);
        d2.setUTCMilliseconds(0);

        if (Number(d1.getTime()) <= Number(d2.getTime())) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

export const getCLAs = (config = {}) => {
  if (!process.argv) {
    return config;
  }
  return process.argv.reduce((prev, current) => {
    let indexOf = current.indexOf("=");
    if (indexOf >= 0) {
      let value = current.substring(indexOf + 1);
      if (value !== undefined) {
        try {
          value = JSON.parse(value);
        } catch (err) {}
        putDottedValue(prev, current.substring(0, indexOf), value);
      }
    }
    return prev;
  }, config);
};

export const putDottedValue = (data, key, value) => {
  if (!data) {
    throw new Error("data does not exists for putting dotted value");
  }
  let lastDottedIndex = key.lastIndexOf(".");
  if (lastDottedIndex >= 0) {
    let firstExpression = key.substring(0, lastDottedIndex);
    key = key.substring(lastDottedIndex + 1);
    data = resolveDottedValue(data, firstExpression, true);
  }
  data[key] = value;
};

export const resolveDottedValue = (data, expression, confirm, confirmType) => {
  if (!data) {
    return;
  }
  while (expression !== undefined) {
    let fieldIndex = expression.indexOf(".");
    let exp = expression;
    if (fieldIndex >= 0) {
      exp = expression.substring(0, fieldIndex);
      expression = expression.substring(fieldIndex + 1);
    } else {
      expression = undefined;
    }

    if ((data[exp] === undefined || data[exp] === null) && !confirm) {
      return;
    }
    if (data[exp] !== undefined && data[exp] !== null) {
      data = data[exp];
    } else {
      if (expression) {
        data[exp] = {};
      } else {
        if (confirmType === "array") {
          data[exp] = [];
        } else {
          data[exp] = {};
        }
      }
      data = data[exp];
    }
  }
  return data;
};

export const executeService = ({ service, params, options={} }) => {
    return new Promise((resolve, reject) => {
      // console.log("service +++++++++++++++++++++++++++++++++++++++ >> " + JSON.stringify(service))
      // console.log("params ++++++++++++++++++++++++++++++++++++++++ >> " + JSON.stringify(params))
        try {
            options = options || {};
            let http = require("http");
            if (options.https) {
                http = require("https");
            }
            let path = service.path;
            let queryString = "";
            if (params && Object.keys(params).length > 0) {
                if (options.skipQS) {
                    queryString = JSON.stringify(params);
                } else {
                    let QueryString = require("querystring");
                    queryString = QueryString.stringify(params);
                }
            }
            let optionHeaders = options.headers;
            let serverOptions = {
                hostname: service.hostname,
                host: service.host,
                port: service.port,
                path: path,
                method: service.method,
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": queryString.length,
                }
            };
      console.log("################################################################################### ")
            // console.log("serverOptions >> " +JSON.stringify(serverOptions))
            let req = http.request(serverOptions, function(res) {
                if (params && params.response) {
                    res.setEncoding("binary");
                } else {
                    res.setEncoding("utf8");
                }
                let body = "";
                res.on("data", function(chunk) {
                    body += chunk;
                });
                res.on("end", function() {
                    resolve({ result: body });
                });
            });
            req.on("error", function(err) {
                reject(err);
            });
            // console.log(queryString)
            req.write(queryString);
            req.end();
        } catch (err) {
            reject(err);
        }
    });
};


