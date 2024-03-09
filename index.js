#!/usr/bin/env node
const fs = require("fs");
const { processJson } = require("./jfe");
function usageInstructions() {
  // Either path to file, or pipe JSON to stdin
  console.log("Usage: ");
  console.log("\tjfe <path-to-file>");
  console.log("\tcat <path-to-file> | jfe");
  console.log('\techo \'{"a": [{"b": true}]}\' | jfe');
}

function readFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(data);
    return json;
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error.message);
    process.exit(1);
  }
}

function parseStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      usageInstructions();
      process.exit(1);
    }
    // If no file name is provided, listen to standard input
    let inputData = "";
    process.stdin.on("data", (chunk) => (inputData += chunk));
    process.stdin.on("end", () => {
      try {
        const json = JSON.parse(inputData);
        resolve(json);
      } catch (error) {
        console.error("Error parsing JSON from standard input:", error.message);
        process.exit(1);
      }
    });
  });
}

async function main() {
  const filePath = process.argv[2];
  const json = filePath ? readFile(filePath) : await parseStdin();
  processJson(json);
}

main();

module.exports = {
  processJson,
};
