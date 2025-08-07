import readlineSync from "readline-sync";
import { summarizePaths, pathsToLines } from "./jfe.js";

export function startInteractiveMode(jsonObject, options = {}) {
  console.log("🔍 JSON Field Explorer - Interactive Mode");
  console.log("Type 'help' for available commands, 'exit' to quit\n");

  // Pre-calculate all paths once
  const maxDepth = options.maxDepth || Infinity;
  const allPaths = summarizePaths(jsonObject, "", {}, null, 0, maxDepth);
  const allLines = pathsToLines(allPaths, options);

  // Interactive state
  let currentFilter = "";
  let currentSort = "path"; // path, type, alpha
  let showStats = options.stats || false;
  let maxDepthCurrent = options.maxDepth || Infinity;

  const commands = {
    help: () => {
      console.log("Available commands:");
      console.log("  help                 - Show this help message");
      console.log("  list                 - Show all fields (current view)");
      console.log("  filter <pattern>     - Filter fields by path pattern (regex supported)");
      console.log("  sort <method>        - Sort by: path, type, alpha");
      console.log("  stats                - Toggle statistics mode");
      console.log("  depth <number>       - Set max depth (use 'all' for unlimited)");
      console.log("  search <term>        - Quick search for fields containing term");
      console.log("  count                - Show count of current results");
      console.log("  reset                - Reset all filters and settings");
      console.log("  exit                 - Exit interactive mode");
      console.log("");
    },

    list: () => {
      displayCurrentView(allPaths, { 
        filter: currentFilter, 
        sort: currentSort, 
        stats: showStats,
        maxDepth: maxDepthCurrent 
      });
    },

    filter: (pattern) => {
      if (!pattern) {
        console.log(`Current filter: ${currentFilter || "(none)"}`);
        return;
      }
      currentFilter = pattern;
      console.log(`Filter set to: ${pattern}`);
      displayCurrentView(allPaths, { 
        filter: currentFilter, 
        sort: currentSort, 
        stats: showStats,
        maxDepth: maxDepthCurrent 
      });
    },

    sort: (method) => {
      const validSorts = ["path", "type", "alpha"];
      if (!method) {
        console.log(`Current sort: ${currentSort}`);
        console.log(`Valid sorts: ${validSorts.join(", ")}`);
        return;
      }
      if (!validSorts.includes(method)) {
        console.log(`Invalid sort method. Valid sorts: ${validSorts.join(", ")}`);
        return;
      }
      currentSort = method;
      console.log(`Sort set to: ${method}`);
      displayCurrentView(allPaths, { 
        filter: currentFilter, 
        sort: currentSort, 
        stats: showStats,
        maxDepth: maxDepthCurrent 
      });
    },

    stats: () => {
      showStats = !showStats;
      console.log(`Statistics mode: ${showStats ? "ON" : "OFF"}`);
      displayCurrentView(allPaths, { 
        filter: currentFilter, 
        sort: currentSort, 
        stats: showStats,
        maxDepth: maxDepthCurrent 
      });
    },

    depth: (value) => {
      if (!value) {
        console.log(`Current max depth: ${maxDepthCurrent === Infinity ? "unlimited" : maxDepthCurrent}`);
        return;
      }
      if (value === "all") {
        maxDepthCurrent = Infinity;
        console.log("Max depth set to: unlimited");
      } else {
        const depth = parseInt(value);
        if (isNaN(depth) || depth < 1) {
          console.log("Invalid depth. Use a positive number or 'all'.");
          return;
        }
        maxDepthCurrent = depth;
        console.log(`Max depth set to: ${depth}`);
      }
      
      // Recalculate paths with new depth
      const newPaths = summarizePaths(jsonObject, "", {}, null, 0, maxDepthCurrent);
      Object.assign(allPaths, newPaths);
      displayCurrentView(allPaths, { 
        filter: currentFilter, 
        sort: currentSort, 
        stats: showStats,
        maxDepth: maxDepthCurrent 
      });
    },

    search: (term) => {
      if (!term) {
        console.log("Please provide a search term");
        return;
      }
      console.log(`Searching for: ${term}`);
      currentFilter = term;
      displayCurrentView(allPaths, { 
        filter: currentFilter, 
        sort: currentSort, 
        stats: showStats,
        maxDepth: maxDepthCurrent 
      });
    },

    count: () => {
      const filtered = filterLines(pathsToLines(allPaths, { stats: showStats }), currentFilter);
      console.log(`Current view shows ${filtered.length} field(s)`);
    },

    reset: () => {
      currentFilter = "";
      currentSort = "path";
      showStats = options.stats || false;
      maxDepthCurrent = options.maxDepth || Infinity;
      console.log("All filters and settings reset");
      displayCurrentView(allPaths, { 
        filter: currentFilter, 
        sort: currentSort, 
        stats: showStats,
        maxDepth: maxDepthCurrent 
      });
    }
  };

  // Show initial view
  commands.list();

  // Interactive loop
  while (true) {
    const input = readlineSync.question("jfe> ").trim();
    
    if (input === "exit" || input === "quit") {
      console.log("Goodbye! 👋");
      break;
    }

    if (!input) continue;

    const [command, ...args] = input.split(/\s+/);
    const handler = commands[command];

    if (handler) {
      try {
        handler(args.join(" "));
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
    } else {
      console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
    }
    
    console.log(""); // Add spacing
  }
}

export function filterLines(lines, filter) {
  if (!filter) return lines;
  
  try {
    const regex = new RegExp(filter, "i");
    return lines.filter(line => regex.test(line));
  } catch (error) {
    // If regex fails, fall back to string contains
    return lines.filter(line => line.toLowerCase().includes(filter.toLowerCase()));
  }
}

export function sortLines(lines, sortMethod) {
  switch (sortMethod) {
    case "alpha":
      return [...lines].sort((a, b) => a.localeCompare(b));
    case "type":
      return [...lines].sort((a, b) => {
        const typeA = extractType(a);
        const typeB = extractType(b);
        return typeA.localeCompare(typeB) || a.localeCompare(b);
      });
    case "path":
    default:
      // Sort by path depth first, then alphabetically
      return [...lines].sort((a, b) => {
        const depthA = (a.split(".").length - 1) + (a.includes("[]") ? 0.5 : 0);
        const depthB = (b.split(".").length - 1) + (b.includes("[]") ? 0.5 : 0);
        return depthA - depthB || a.localeCompare(b);
      });
  }
}

export function extractType(line) {
  const match = line.match(/: (\w+)/);
  return match ? match[1] : "unknown";
}

function displayCurrentView(paths, options) {
  const lines = pathsToLines(paths, { stats: options.stats });
  let filtered = filterLines(lines, options.filter);
  
  // Apply sorting
  filtered = sortLines(filtered, options.sort);
  
  if (filtered.length === 0) {
    console.log("No fields match the current filter.");
    return;
  }

  console.log(`Showing ${filtered.length} field(s):`);
  filtered.forEach(line => console.log(line));
}