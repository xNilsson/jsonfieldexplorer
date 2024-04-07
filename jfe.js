export function summarizePaths(jsonObj, prefix = "", paths = {}) {
  if (Array.isArray(jsonObj)) {
    // Handle arrays: Add "[]" to the path and process the first element (if exists)
    if (jsonObj.length > 0) {
      const path = `${prefix}[]`;
      if (!!prefix) {
        if (!paths[prefix]) {
          paths[prefix] = [];
        }
        paths[prefix].push(jsonObj);
      }
      for (let i = 0; i < jsonObj.length; i++) {
        summarizePaths(jsonObj[i], path, paths);
      }
    }
  } else if (typeof jsonObj === "object" && jsonObj !== null) {
    const path = `${prefix}`;
    if (!!prefix) {
      if (!paths[path]) {
        paths[path] = [];
      }
      paths[path].push(jsonObj);
    }
    Object.keys(jsonObj).forEach((key) => {
      const k = key.includes(" ") ? `"${key}"` : key;
      summarizePaths(jsonObj[key], `${path}.${k}`, paths);
    });
  } else {
    // base case: add the value to the path
    if (!paths[prefix]) {
      paths[prefix] = [];
    }
    paths[prefix].push(jsonObj);
  }
  return paths;
}

export function pathsToLines(paths) {
  const lines = [];
  const arrayLengths = new Set();
  for (const path in paths) {
    const values = paths[path];
    const valueTypes = values.map((value) => {
      if (Array.isArray(value)) {
        arrayLengths.add(value.length);
        return "array";
      } else if (value === null) {
        return "null";
      } else {
        return typeof value;
      }
    });
    const uniqueValueTypes = [...new Set(valueTypes)];
    const valueType =
      uniqueValueTypes.length === 1
        ? uniqueValueTypes[0]
        : `${uniqueValueTypes.join(" | ")}`;

    // Show array lengths for arrays with consistent lengths
    if (valueType === "array" && arrayLengths.size === 1) {
      const l = [...arrayLengths][0];
      lines.push(`${path}: ${valueType} (size: ${l})`);
      continue;
    }

    lines.push(`${path}: ${valueType}`);
  }
  return lines;
}

export function processJson(jsonObject) {
  try {
    const paths = summarizePaths(jsonObject);
    const lines = pathsToLines(paths);
    for (const line of lines) {
      console.log(line);
    }
  } catch (error) {
    console.error("Error processing JSON:", error.message);
  }
}
