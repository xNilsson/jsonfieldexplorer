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
```

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

For future roadmap, features that could be implemented are;

- Show types in order of usage.
- Show enum if variation is small in type.
- Provide a "stat" command to show statistics about the values. Like most common strings (if enum), or min/max/average for numbers.

If you want to contribute with any of these, feel free to send a PR!

# Testing

Test files are included in `/test`. To run test:

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
