# JsonFieldExplorer (jfe)

## Description

JsonFieldExplorer (jfe) is a command-line tool that simplifies the exploration of JSON data structures. It analyzes JSON files and lists all possible field paths, aiding in understanding and navigating complex JSON objects. This tool is especially useful for developers and data analysts working with large and nested JSON files.

# Installation

To install JsonFieldExplorer, use npm:

```bash
npm install -g jsonfieldexplorer
```

This will install jfe globally on your system, allowing you to use it from any directory.

Requires minimum of node 18.x.

# Usage

## Basic Usage

To use jfe, simply pass the path of your JSON file as an argument:

```bash
jfe path/to/yourfile.json
```

You can also pipe in JSON:

```bash
$ echo '{"a": [{"b": true}]}' | jfe
.a: array
.a[]: object
.a[].b: boolean
```

## Options

```bash
jfe --help                    # Show help and all options
jfe --version                 # Show version
jfe --max-depth 3 file.json   # Limit analysis to 3 levels deep
jfe --quiet file.json         # Suppress output (useful for benchmarking)
jfe --stats file.json         # Show detailed statistics for field values
jfe --interactive file.json   # Start interactive exploration mode
```

### Advanced Features

#### Enum Detection
When jfe detects that a field has a small number of unique values (≤10 by default), it displays them as an enum:

```bash
$ jfe users.json
.users[].status: enum ["active", "inactive", "pending"] (3 values)
.users[].role: enum ["admin", "user"] (2 values)
```

#### Statistics Mode (`--stats`)
Get detailed statistical information about field values:

```bash
$ jfe --stats products.json
.products[].price: number (5 total, min: 24.99, max: 129.99, avg: 74.99, sum: 374.95)
.products[].name: string (5 total, unique: 5, avgLen: 13.4, most common: "Widget" (2x))
.products[].inStock: boolean (5 total, true: 4, false: 1)
```

#### Interactive Mode (`--interactive`)
Explore JSON structures interactively with filtering, sorting, and real-time analysis:

```bash
$ jfe --interactive data.json
🔍 JSON Field Explorer - Interactive Mode
Type 'help' for available commands, 'exit' to quit

Showing 15 field(s):
.company: object
.company.name: string
.company.employees: array (size: 100)
...

jfe> help
Available commands:
  help                 - Show this help message
  list                 - Show all fields (current view)
  filter <pattern>     - Filter fields by path pattern (regex supported)
  sort <method>        - Sort by: path, type, alpha
  stats                - Toggle statistics mode
  depth <number>       - Set max depth (use 'all' for unlimited)
  search <term>        - Quick search for fields containing term
  count                - Show count of current results
  reset                - Reset all filters and settings
  exit                 - Exit interactive mode

jfe> filter employees
Showing 8 field(s):
.company.employees: array (size: 100)
.company.employees[]: object
.company.employees[].name: string
...

jfe> stats
Statistics mode: ON
.company.employees[].age: number (100 total, min: 22, max: 65, avg: 41.2, sum: 4120)
.company.employees[].salary: number (100 total, min: 35000, max: 150000, avg: 72500)

jfe> search address
Filter set to: address
.company.employees[].address: object
.company.employees[].address.street: string
.company.employees[].address.city: string

jfe> exit
Goodbye! 👋
```

##### Interactive Commands Reference

| Command | Description | Examples |
|---------|-------------|----------|
| `help` | Show available commands | `help` |
| `list` | Display current filtered view | `list` |
| `filter <pattern>` | Filter by regex or string pattern | `filter users\[\]`, `filter address` |
| `search <term>` | Quick search (alias for filter) | `search email`, `search phone` |
| `sort <method>` | Sort results (`path`, `type`, `alpha`) | `sort type`, `sort alpha` |
| `stats` | Toggle statistics mode on/off | `stats` |
| `depth <n>` | Set max depth or `all` | `depth 3`, `depth all` |
| `count` | Show number of matching fields | `count` |
| `reset` | Clear all filters and settings | `reset` |
| `exit` | Exit interactive mode | `exit` or `quit` |

# Examples

Given a JSON file like this:

```json
{
  "organization": {
    "name": "OpenAI",
    "location": "San Francisco",
    "departments": [
      {
        "name": "Research",
        "employees": 10,
        "isRemote": true
      },
      {
        "name": "Engineering",
        "employees": "80",
        "budget": null,
        "manager": {
          "name": "John Doe",
          "title": "Engineering Manager"
        }
      }
    ]
  }
}
```

Running jfe on this file would produce output similar to the following:

```css
.organization: object
.organization.name: string
.organization.location: string
.organization.departments: array (size: 2)
.organization.departments[]: object
.organization.departments[].name: string
.organization.departments[].employees: number | string
.organization.departments[].isRemote: boolean
.organization.departments[].budget: null
.organization.departments[].manager: object
.organization.departments[].manager.name: string
.organization.departments[].manager.title: string
```

This output indicates that the JSON file contains fields for the organization's name and location, as well as an array of departments, each with its own name and number of employees.

# Roadmap

## ✅ Completed Features

- **CLI Framework**: Proper argument parsing with commander.js
- **Enhanced Options**: `--help`, `--version`, `--max-depth`, `--quiet` flags
- **Enum Detection**: Automatic detection of fields with limited unique values
- **Statistics Mode**: `--stats` for detailed field analysis (min/max/avg, string lengths, frequencies)
- **Interactive Mode**: `--interactive` with filtering, sorting, and real-time exploration
- **Optional Field Detection**: Shows when array elements have inconsistent fields
- **Error Handling**: Comprehensive error messages and file validation
- **Test Coverage**: 34+ tests covering all features
- **Demo Scripts**: Ready-to-run examples

## 🚀 Future Development Ideas

### Phase 3: Output & Integration
- **Multiple Output Formats**: JSON, CSV, XML output options
- **Path Filtering**: `--filter` and `--exclude` pattern matching
- **Color Output**: Syntax highlighting with chalk
- **Progress Indicators**: For large file processing

### Advanced Analysis
- **Pattern Recognition**: Detect emails, URLs, dates, UUIDs automatically  
- **Schema Generation**: Generate JSON Schema, TypeScript interfaces
- **File Comparison**: Compare structures between JSON files
- **Performance**: Streaming parser for very large files (>1GB)

### Developer Integration  
- **Programmatic API**: Node.js module for integration
- **VS Code Extension**: IDE integration for JSON files
- **Configuration**: Support for `.jferc` config files
- **Plugin System**: Extensible architecture for custom analyzers

### Community & Distribution
- **Package Managers**: Homebrew, Chocolatey, Docker image
- **Documentation**: Video tutorials, comprehensive guides
- **CI/CD**: GitHub Actions, automated releases

*Want to contribute? Pick any feature above and send a PR! Check the issues for discussion on specific features.*

# Testing & Demos

## Running Tests

```bash
npm test                     # Run unit tests
npm run demo                 # Run all feature demos
```

## Demo Scripts

Try out the different features with our sample data:

```bash
npm run demo:enum           # See enum detection in action
npm run demo:stats          # See statistics mode
npm run demo:complex        # Complex nested structure analysis
npm run demo:interactive    # Interactive mode (requires manual input)
```

Test files are included in `/test`. To run tests:

```bash
npm test
```

# Benchmarking

Benchmarking is done with [benchmark.js](https://benchmarkjs.com/).

To run benchmark:

```bash
npm run benchmark
```

Current benchmark results:


| File size | Average time per operation | Number of runs sampled | Throughput |
| --------- | -------------------------- | ---------------------- | ---------- |
| 421.27 MB | 3963.35 ms                 | 5                      | 106.29 MB/s |


# Changelog

## v0.3.0 🎉
- ✅ **Enum Detection**: Automatically detects and displays fields with limited unique values as enums
- ✅ **Statistics Mode**: Added `--stats` flag for detailed field analysis (min/max/avg for numbers, length stats for strings, etc.)
- ✅ **Interactive Mode**: Added `--interactive` flag for real-time JSON exploration with filtering, sorting, and search
- ✅ **Demo Scripts**: Added npm run demo scripts to showcase different features 
- ✅ **Comprehensive Tests**: 34 passing tests covering all features
- ✅ **Enhanced Documentation**: Complete documentation for all features and interactive commands

## v0.2.0
- ✅ **CLI Framework**: Added proper CLI argument parsing with commander.js
- ✅ **New Options**: Added `--version`, `--help`, `--max-depth`, `--quiet` flags
- ✅ **Better Error Handling**: Improved error messages for missing files, invalid JSON, and permissions
- ✅ **ES Module Compatibility**: Fixed test compatibility issues
- ✅ **Depth Limiting**: Added `--max-depth` to prevent infinite recursion on large objects

## v0.1.5
- Basic JSON field exploration functionality
- Support for stdin input
- Optional field detection in arrays
- Array size reporting

# License

This project is licensed under the ISC License - see the LICENSE.md file for details.
