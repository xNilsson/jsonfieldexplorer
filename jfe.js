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

function calculateStatistics(values, type) {
  const stats = {
    count: values.length,
    nullCount: values.filter(v => v === null).length,
    type: type
  };

  // Filter out null values for stats calculations
  const nonNullValues = values.filter(v => v !== null);
  
  if (nonNullValues.length === 0) {
    return { ...stats, hasData: false };
  }

  stats.hasData = true;

  if (type === "number") {
    const numbers = nonNullValues.filter(v => typeof v === "number");
    if (numbers.length > 0) {
      stats.min = Math.min(...numbers);
      stats.max = Math.max(...numbers);
      stats.avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
      stats.sum = numbers.reduce((sum, n) => sum + n, 0);
    }
  } else if (type === "string") {
    const strings = nonNullValues.filter(v => typeof v === "string");
    if (strings.length > 0) {
      const lengths = strings.map(s => s.length);
      stats.minLength = Math.min(...lengths);
      stats.maxLength = Math.max(...lengths);
      stats.avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
      
      // Most common values
      const frequency = {};
      strings.forEach(s => {
        frequency[s] = (frequency[s] || 0) + 1;
      });
      const sortedFreq = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Top 5 most common
      stats.mostCommon = sortedFreq;
    }
  } else if (type === "boolean") {
    const booleans = nonNullValues.filter(v => typeof v === "boolean");
    if (booleans.length > 0) {
      stats.trueCount = booleans.filter(b => b === true).length;
      stats.falseCount = booleans.filter(b => b === false).length;
    }
  }

  // Unique values count for all types
  stats.uniqueCount = new Set(nonNullValues).size;
  
  return stats;
}

function formatStatistics(stats, fieldName) {
  if (!stats.hasData) {
    return `${fieldName}: ${stats.type} (${stats.count} total, all null)`;
  }

  let result = `${fieldName}: ${stats.type} (${stats.count} total`;
  
  if (stats.nullCount > 0) {
    result += `, ${stats.nullCount} null`;
  }
  
  result += ", ";

  if (stats.type === "number") {
    result += `min: ${stats.min}, max: ${stats.max}, avg: ${stats.avg.toFixed(2)}`;
    if (stats.sum !== undefined) {
      result += `, sum: ${stats.sum}`;
    }
  } else if (stats.type === "string") {
    result += `unique: ${stats.uniqueCount}, avgLen: ${stats.avgLength.toFixed(1)}`;
    if (stats.mostCommon && stats.mostCommon.length > 0) {
      const topValue = stats.mostCommon[0];
      result += `, most common: "${topValue[0]}" (${topValue[1]}x)`;
    }
  } else if (stats.type === "boolean") {
    result += `true: ${stats.trueCount}, false: ${stats.falseCount}`;
  } else {
    result += `unique: ${stats.uniqueCount}`;
  }

  result += ")";
  return result;
}

export function pathsToLines(paths, options = {}) {
  const lines = [];
  const arrayLengths = new Set();
  const maxEnumValues = options.maxEnumValues || 10;
  const showStats = options.stats || false;

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

    // Enum detection: Check if we should show unique values as an enum
    let enumInfo = null;
    if (uniqueValueTypes.length === 1 && 
        (uniqueValueTypes[0] === "string" || uniqueValueTypes[0] === "number" || uniqueValueTypes[0] === "boolean")) {
      
      // Filter out objects and arrays for enum detection
      const primitiveValues = values.filter(value => 
        !Array.isArray(value) && 
        typeof value !== "object" && 
        value !== null
      );
      
      const uniqueValues = [...new Set(primitiveValues)];
      
      // Show as enum if we have a reasonable number of unique values
      if (uniqueValues.length > 1 && uniqueValues.length <= maxEnumValues) {
        // Sort the values for consistent output
        const sortedValues = uniqueValues.sort((a, b) => {
          if (typeof a === "string" && typeof b === "string") {
            return a.localeCompare(b);
          }
          return a < b ? -1 : a > b ? 1 : 0;
        });
        
        enumInfo = {
          values: sortedValues,
          count: uniqueValues.length,
          total: primitiveValues.length
        };
      }
    }

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

    // Build the final type description
    if (showStats) {
      // Check if we can show statistics (single primitive type, possibly with nulls)
      const primitiveValues = values.filter(value => 
        !Array.isArray(value) && 
        typeof value !== "object"
      );
      
      // Get the non-null types
      const nonNullTypes = [...new Set(primitiveValues.filter(v => v !== null).map(v => typeof v))];
      
      if (nonNullTypes.length === 1 && 
          (nonNullTypes[0] === "string" || nonNullTypes[0] === "number" || nonNullTypes[0] === "boolean")) {
        const stats = calculateStatistics(primitiveValues, nonNullTypes[0]);
        let statLine = formatStatistics(stats, path);
        
        // Add optional marker if field is not present in all array elements
        if (isOptional) {
          statLine += " | optional";
        }
        
        lines.push(statLine);
        continue;
      }
    }
    
    if (enumInfo) {
      // Format enum values with proper quotes for strings
      const formattedValues = enumInfo.values.map(v => 
        typeof v === "string" ? `"${v}"` : String(v)
      );
      valueType = `enum [${formattedValues.join(", ")}] (${enumInfo.count} values)`;
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
    const lines = pathsToLines(paths, options);
    
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
