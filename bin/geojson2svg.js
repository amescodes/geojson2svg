#!/usr/bin/env node

import {EOL} from "os";
import {CommanderError, program} from "commander";
import {readFileSync} from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import read from "./read.js";
import write from "./write.js";
import GeoJSON2SVG from "../src/index.js";

const version = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../package.json"))).version;

const options = program
    .version(version)
    .usage("[options] [file]")
    .description("Convert GeoJSON to SVG.")
    .option("-o, --out <file>", "output file name; defaults to “-” for stdout", "-")
    .option("-vs, --viewportsize <size...>", "output view size", [1920,1080])
    .option("-p, --pathsonly", "write path elements without svg parent")
    .option("-pr, --precision <value>", "number of output digits after the decimal point")
    .option("-r, --radius <value>", "default point radius", 4.5)
    .option("-ad, --attributedyn <featurepropertypath:key...>", "feature attribute to add to svg path as attribute. optional key to use as property name in svg path. if left out, the same property name from geojson will be used", [])
    .option("-as, --attributestat <propertyname:value...>", "feature attribute to add to svg path as attribute and value to set", [])
    .parse(process.argv)
    .opts();

if (program.args.length === 0) program.args[0] = "-";
else if (program.args.length !== 1) {
  console.error();
  console.error("  error: multiple input files");
  console.error();
  process.exit(1);
}

let attrs = [];
options.attributedyn.forEach(da => {
    try {
        const keyVal = da.split(':')
        let attr = {
            type: "dynamic",
            property: keyVal[0]
        }
        const key = keyVal[1]
        if (key) {
            attr.key = key
        }

        attrs.push(attr)
    } catch (err) {
        throw new CommanderError(2, "InvalidAttributeDynamic", err.message)
    }
}
);
    
for (var sa in options.attributestat) {
    try {
        const keyVal = sa.split(':')
        let attr = {
            type: "static",
            property: keyVal[0],
            value: keyVal[1]
        }
        attrs.push(attr)
    } catch (err) {
        throw new CommanderError(2, "InvalidAttributeStatic", err.message)
    }
}

const width = options.viewportsize[0];
const height = options.viewportsize[1];
const paths_only = options.pathsonly;
const opts = {
    viewportSize: {
        width: parseInt(width),
        height: parseInt(height)
    },
    attributes: attrs,
    r: options.radius
}
if (options.precision) {
    opts.precision = options.precision;
}

var reader = read(program.args[0],transform).then(end),
    writer = write(options.out);

reader.catch(error => {
  console.error(error.stack);
});

if (!paths_only || paths_only == False) {
    writer.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>" + EOL
        + "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" + EOL
        + "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\""
        + " width=\"" + +width + "\""
        + " height=\"" + +height + "\""
        + " viewBox=\"0 0 " + +width + " " + +height + "\""
        + ">" + EOL);
}

function transform(d) {    
    const converter = new GeoJSON2SVG(opts);
    const svgData = converter.convert(d)
    return writer.write(svgData.join(`${EOL}`));
  }

  
function end() {
    if(!paths_only || paths_only == False) {
        return writer.write("</svg>" + EOL);
    }
  }