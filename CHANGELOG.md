# v0.3.1

- Feature: Add color highlighting to terminal output - field names are highlighted in cyan/bold
- Feature: Right-align type information with gray coloring for better readability
- Feature: Truncate long strings in enum types (50 char limit) to keep output clean and readable
- Enhancement: Improved visual scanning of JSON structure with better formatting
- Enhancement: Colors automatically disabled in non-TTY environments (piped output, test environments)
- Fix: Test suite now properly disables colors for consistent test output

# v0.1.5

- Feature: handle optional value in array
- Feature: add `quiet` option to suppress the output
- docs: update benchmark

# v0.1.3

- Bug: Handle different structure between items in array. E.g: [{a: true}, {b: true}]
- Feature: Show type of the value for each path. If multiple types, show separated by a `|`.
- Tests: Added tests to cover the basic cases.
