import fs from "fs";

export function readFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(data);
    return json;
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error.message);
    process.exit(1);
  }
}
