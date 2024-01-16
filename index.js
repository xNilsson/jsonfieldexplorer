#!/usr/bin/env node
const fs = require("fs");

function usageInstructions() {
  // Either path to file, or pipe JSON to stdin
  console.log("Usage: ");
  console.log("\tjfe <path-to-file>");
  console.log("\tcat <path-to-file> | jfe");
  console.log('\techo \'{"a": [{"b": true}]}\' | jfe');
}

function summarizePaths(jsonObj, prefix = "", paths = []) {
  if (Array.isArray(jsonObj)) {
    // Handle arrays: Add "[]" to the path and process the first element (if exists)
    if (jsonObj.length > 0) {
      summarizePaths(jsonObj[0], `${prefix}[]`, paths);
    }
  } else if (typeof jsonObj === "object" && jsonObj !== null) {
    Object.keys(jsonObj).forEach((key) => {
      const path = `${prefix}${prefix ? "." : ""}${key}`;
      paths.push(path);
      summarizePaths(jsonObj[key], path, paths);
    });
  }
  return paths;
}

function processJson(json) {
  try {
    const paths = summarizePaths(json);
    console.log(paths.join("\n"));
  } catch (error) {
    console.error("Error processing JSON:", error.message);
  }
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
  return new Promise((resolve, reject) => {
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
