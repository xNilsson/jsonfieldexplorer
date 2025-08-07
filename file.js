import fs from "fs";

export function readFile(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    // Check if it's a file (not a directory)
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    const data = fs.readFileSync(filePath, "utf8");
    
    // Better JSON parsing error
    try {
      const json = JSON.parse(data);
      return json;
    } catch (parseError) {
      throw new Error(`Invalid JSON in file ${filePath}: ${parseError.message}`);
    }
  } catch (error) {
    if (error.code === "EACCES") {
      throw new Error(`Permission denied reading file: ${filePath}`);
    } else if (error.code === "EISDIR") {
      throw new Error(`Path is a directory, not a file: ${filePath}`);
    } else if (error.message.includes("Invalid JSON")) {
      throw error; // Re-throw our custom JSON error
    } else {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  }
}
