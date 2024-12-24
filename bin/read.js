import {createReadStream} from "fs";
import {createInterface} from "readline";

export default function(file, callback) {
  var index = -1,
      input = file === "-" ? process.stdin : createReadStream(file);

  function readObject() {
    return new Promise(function(resolve, reject) {
      var data = [];
      input
          .on("data", function(d) { data.push(d); })
          .on("end", function() { resolve(JSON.parse(Buffer.concat(data))); })
          .on("error", reject);
    });
  }

  function callbackObject(object) {
    return callback(object, ++index);
  }

  return readObject().then(callbackObject);
}