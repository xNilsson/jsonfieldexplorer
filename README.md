# JsonFieldExplorer (jfe)

## Description

JsonFieldExplorer (jfe) is a command-line tool that simplifies the exploration of JSON data structures. It analyzes JSON files and lists all possible field paths, aiding in understanding and navigating complex JSON objects. This tool is especially useful for developers and data analysts working with large and nested JSON files.

# Installation

To install JsonFieldExplorer, use npm:

```bash
npm install -g jsonfieldexplorer
```

This will install jfe globally on your system, allowing you to use it from any directory.

# Usage

To use jfe, simply pass the path of your JSON file as an argument:

```bash
jfe path/to/yourfile.json
```

You can also pipe in JSON.

```bash
$ echo '{"a": [{"b": true}]}' | jfe
a
a[].b
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
        "employees": 100
      },
      {
        "name": "Engineering",
        "employees": 80
      }
    ]
  }
}
```

Running jfe on this file would produce output similar to the following:

```css
organization.name
organization.location
organization.departments[].name
orgrnization.departments[].employees
```

This output indicates that the JSON file contains fields for the organization's name and location, as well as an array of departments, each with its own name and number of employees.

# License

This project is licensed under the ISC License - see the LICENSE.md file for details.
