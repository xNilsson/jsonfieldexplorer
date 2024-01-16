#!/usr/bin/env node
const fs = require("fs");

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

function main() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error("Usage: jfe <path-to-json-file>");
    process.exit(1);
  }

  try {
    const data = fs.readFileSync(fileName, "utf8");
    const json = JSON.parse(data);
    const paths = summarizePaths(json);
    console.log(paths.join("\n"));
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error.message);
  }
}

main();
