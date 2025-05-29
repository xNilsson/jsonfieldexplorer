import benchmark from "benchmark";
import { readFile } from "./file.js";
import { processJson } from "./jfe.js";
import fs from "fs";

let fileSizeMB = null;
const suite = new benchmark.Suite();
suite
  .add("jsonfieldexplorer", async function () {
    const filePath = "./test/benchmark.json";
    const json = filePath ? readFile(filePath) : await parseStdin();
    const fileSizeBytes = fs.statSync(filePath).size;
    fileSizeMB = fileSizeBytes / (1024 * 1024);
    processJson(json, { quiet: true });
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    const fastest = this.filter("fastest")[0];
    const opsPerSec = fastest.hz;
    const avgMs = 1000 / opsPerSec;
    const runs = fastest.stats.sample.length;
    const mbPerSec = fileSizeMB * opsPerSec;
    console.log("File size: " + fileSizeMB.toFixed(2) + " MB");
    console.log("Fastest is " + fastest.name);
    console.log(`Average time per operation: ${avgMs.toFixed(2)} ms`);
    console.log(`Number of runs sampled: ${runs}`);
    console.log(`Throughput: ${mbPerSec.toFixed(2)} MB/s`);
  })
  .run({ async: true });
