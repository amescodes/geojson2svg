#!/usr/bin/env node

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
    .option("-p, --precision <value>", "number of output digits after the decimal point")
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
for (da in options.attributedyn) {
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

for (sa in options.attributestat) {
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

const opts = {
    viewportSize: {
        width: parseInt(options.width),
        height: parseInt(options.height)
    },
    attributes: attrs,
    r: options.radius
}
if (options.precision) {
    opts.precision = options.precision;
}

var reader = read(program.args[0],transform),
    writer = write(options.out);
reader.catch(error => {
  console.error(error.stack);
});

function transform(d) {    
    const converter = new GeoJSON2SVG(opts);
    svgData = converter.convert(d)
    return writer.write(svgData);
  }