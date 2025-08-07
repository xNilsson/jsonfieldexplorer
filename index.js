#!/usr/bin/env node
import { Command } from "commander";
import { processJson } from "./jfe.js";
import { readFile } from "./file.js";
import { startInteractiveMode } from "./interactive.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to get version
const packagePath = join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const program = new Command();

program
  .name("jfe")
  .description("JSON Field Explorer - analyze and explore JSON structure")
  .version(packageJson.version)
  .argument("[file]", "JSON file to analyze (omit to read from stdin)")
  .option("-f, --format <type>", "output format", "text")
  .option("--max-depth <number>", "maximum recursion depth", parseInt)
  .option("-q, --quiet", "suppress output (useful for benchmarking)")
  .option("-s, --stats", "show detailed statistics for field values")
  .option("-i, --interactive", "start interactive exploration mode")
  .action(async (file, options) => {
    try {
      const json = file ? readFile(file) : await parseStdin();
      
      if (options.interactive) {
        startInteractiveMode(json, options);
      } else {
        processJson(json, options);
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

function parseStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      program.help();
      process.exit(1);
    }
    
    let inputData = "";
    process.stdin.on("data", (chunk) => (inputData += chunk));
    process.stdin.on("end", () => {
      try {
        const json = JSON.parse(inputData);
        resolve(json);
      } catch (error) {
        reject(new Error(`Invalid JSON from stdin: ${error.message}`));
      }
    });
    process.stdin.on("error", (error) => {
      reject(new Error(`Error reading from stdin: ${error.message}`));
    });
  });
}

program.parse();
