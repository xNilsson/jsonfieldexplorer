export function summarizePaths(
  jsonObj,
  prefix = "",
  paths = {},
  arrayContext = null,
  currentDepth = 0,
  maxDepth = Infinity
) {
  // Stop recursing if we've reached max depth
  if (currentDepth >= maxDepth) {
    if (!paths[prefix]) {
      paths[prefix] = [];
    }
    paths[prefix].push("...[max depth reached]");
    return paths;
  }

  if (Array.isArray(jsonObj)) {
    // Handle arrays: Add "[]" to the path and process all elements
    const arrayPath = prefix || "[]";

    if (!paths[arrayPath]) {
      paths[arrayPath] = [];
    }
    paths[arrayPath].push(jsonObj);

    if (jsonObj.length > 0) {
      const elementPath = prefix ? `${prefix}[]` : `[]`;

      // Track field presence across all array elements for optional field detection
      const fieldPresence = new Map();
      const allFields = new Set();

      // First pass: collect all possible fields across all elements
      jsonObj.forEach((element, index) => {
        if (
          typeof element === "object" &&
          element !== null &&
          !Array.isArray(element)
        ) {
          Object.keys(element).forEach((key) => {
            allFields.add(key);
            if (!fieldPresence.has(key)) {
              fieldPresence.set(key, []);
            }
            fieldPresence.get(key).push(index);
          });
        }
      });

      // Create array context for tracking optional fields
      const newArrayContext = {
        totalElements: jsonObj.length,
        fieldPresence: fieldPresence,
        allFields: allFields,
      };

      // Second pass: process each element
      for (let i = 0; i < jsonObj.length; i++) {
        summarizePaths(jsonObj[i], elementPath, paths, newArrayContext, currentDepth + 1, maxDepth);
      }
    }
  } else if (typeof jsonObj === "object" && jsonObj !== null) {
    const path = `${prefix}`;
    // Only add objects to paths if we're not in an array context for the same path
    // This prevents mixing array contents with the array itself
    if (!!prefix && !Array.isArray(paths[path]?.[0])) {
      if (!paths[path]) {
        paths[path] = [];
      }
      paths[path].push(jsonObj);
    }
    Object.keys(jsonObj).forEach((key) => {
      const k = key.includes(" ") ? `"${key}"` : key;
      summarizePaths(jsonObj[key], `${path}.${k}`, paths, arrayContext, currentDepth + 1, maxDepth);
    });
  } else {
    // base case: add the value to the path
    if (!paths[prefix]) {
      paths[prefix] = [];
    }
    paths[prefix].push(jsonObj);
  }

  // Store array context separately to avoid modifying the original values
  // Only add when there are actually optional fields to track
  if (arrayContext && arrayContext.allFields.size > 0) {
    if (!paths._arrayContexts) {
      paths._arrayContexts = {};
    }
    paths._arrayContexts[prefix] = arrayContext;
  }

  return paths;
}

export function pathsToLines(paths) {
  const lines = [];
  const arrayLengths = new Set();

  for (const path in paths) {
    if (path === "_arrayContexts") continue; // Skip the metadata

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
    let valueType =
      uniqueValueTypes.length === 1
        ? uniqueValueTypes[0]
        : `${uniqueValueTypes.join(" | ")}`;

    // Check if this field is optional (not present in all array elements)
    let isOptional = false;
    if (paths._arrayContexts && paths._arrayContexts[path]) {
      const context = paths._arrayContexts[path];
      const pathParts = path.split(".");
      const fieldName = pathParts[pathParts.length - 1];

      if (context.fieldPresence && context.fieldPresence.has(fieldName)) {
        const presenceCount = context.fieldPresence.get(fieldName).length;
        isOptional = presenceCount < context.totalElements;
      }
    }

    // Add optional marker if field is not present in all array elements
    if (isOptional) {
      valueType += " | optional";
    }

    // Show array lengths for arrays with consistent lengths
    if (
      uniqueValueTypes.length === 1 &&
      uniqueValueTypes[0] === "array" &&
      arrayLengths.size === 1
    ) {
      const l = [...arrayLengths][0];
      lines.push(`${path}: ${valueType} (size: ${l})`);
      continue;
    }

    lines.push(`${path}: ${valueType}`);
  }
  return lines;
}

export function processJson(jsonObject, options = {}) {
  try {
    const maxDepth = options.maxDepth || Infinity;
    const paths = summarizePaths(jsonObject, "", {}, null, 0, maxDepth);
    const lines = pathsToLines(paths);
    
    if (!options.quiet) {
      for (const line of lines) {
        console.log(line);
      }
    }
    
    return { paths, lines }; // Return data for programmatic use
  } catch (error) {
    throw new Error(`Error processing JSON: ${error.message}`);
  }
}
