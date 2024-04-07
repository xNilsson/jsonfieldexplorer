import benchmark from "benchmark";
import { readFile } from "./file.js";
import { processJson } from "./jfe.js";

const suite = new benchmark.Suite();
suite
  .add("jsonfieldexplorer", async function () {
    const filePath = "./test/benchmark.json";
    const json = filePath ? readFile(filePath) : await parseStdin();
    processJson(json);
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name")[0]);
  })
  .run({ async: true });
