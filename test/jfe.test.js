import assert from "assert";
import { processJson, summarizePaths, pathsToLines } from "../jfe.js";
import { filterLines, sortLines, extractType } from "../interactive.js";

describe("summarizePaths", () => {
  it("should handle simple objects", () => {
    const input = { a: 1, b: "hello" };
    const expected = {
      ".a": [1],
      ".b": ["hello"],
    };
    assert.deepEqual(summarizePaths(input), expected);
  });

  it("should handle nested objects", () => {
    const input = { a: { b: 2, c: [3, 4] } };
    const expected = {
      ".a": [{ b: 2, c: [3, 4] }],
      ".a.b": [2],
      ".a.c": [[3, 4]],
      ".a.c[]": [3, 4],
    };
    assert.deepEqual(summarizePaths(input), expected);
  });

  it("should handle arrays", () => {
    const input = { a: [1, 2, 3] };
    const expected = {
      ".a": [[1, 2, 3]],
      ".a[]": [1, 2, 3],
    };
    const result = summarizePaths(input);
    assert.deepEqual(JSON.stringify(result), JSON.stringify(expected));
  });

  it("should handle null values", () => {
    const input = { a: null };
    const expected = {
      ".a": [null],
    };
    assert.deepEqual(summarizePaths(input), expected);
  });

  it("should handle spaces in keys", () => {
    const input = { "a b": 1 };
    const expected = {
      '."a b"': [1],
    };
    assert.deepEqual(summarizePaths(input), expected);
  });

  it("should handle top-level arrays", () => {
    const input = [{ a: 1 }, { a: 2 }];
    const result = summarizePaths(input);
    assert.ok(result["[]"]);
    assert.ok(result["[].a"]);
    assert.equal(result["[]"].length, 1);
    assert.equal(result["[].a"].length, 2);
  });

  it("should detect optional fields in arrays", () => {
    const input = [
      { field1: "string", field2: 123 },
      { field1: "string", field2: 123, field3: true },
    ];
    const result = summarizePaths(input);

    // Should have array context for optional field detection
    assert.ok(result._arrayContexts);
    assert.ok(result._arrayContexts["[].field3"]);

    // field3 should be present in only 1 out of 2 elements
    const context = result._arrayContexts["[].field3"];
    assert.equal(context.totalElements, 2);
    assert.equal(context.fieldPresence.get("field3").length, 1);
  });
});

describe("processJson", () => {
  it("should process simple JSON", () => {
    const data = { a: 1, b: "hello" };
    const expectedOutput = [".a: number", ".b: string"];
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    processJson(data);

    const loggedLines = consoleLogSpy.mock.calls.map((call) => call.join(" "));
    const got = JSON.stringify(loggedLines);
    const expected = JSON.stringify(expectedOutput);
    assert.equal(got, expected);

    consoleLogSpy.mockRestore();
  });

  it("should show optional fields in output", () => {
    const data = [
      { field1: "string", field2: 123 },
      { field1: "string", field2: 123, field3: true },
    ];
    const expectedOutput = [
      "[]: array (size: 2)",
      "[].field1: string",
      "[].field2: number",
      "[].field3: boolean | optional",
    ];
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    processJson(data);

    const loggedLines = consoleLogSpy.mock.calls.map((call) => call.join(" "));
    const got = JSON.stringify(loggedLines);
    const expected = JSON.stringify(expectedOutput);
    assert.equal(got, expected);

    consoleLogSpy.mockRestore();
  });
});

describe("Enum Detection", () => {
  it("should detect string enums with few unique values", () => {
    const input = [
      { status: "active" },
      { status: "inactive" },
      { status: "active" },
      { status: "pending" }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result);
    
    // Should detect enum for status field
    const statusLine = lines.find(line => line.includes("[].status"));
    assert.ok(statusLine.includes('enum ["active", "inactive", "pending"] (3 values)'));
  });

  it("should detect number enums", () => {
    const input = [
      { priority: 1 },
      { priority: 2 },
      { priority: 1 },
      { priority: 3 }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result);
    
    // Should detect enum for priority field
    const priorityLine = lines.find(line => line.includes("[].priority"));
    assert.ok(priorityLine.includes('enum [1, 2, 3] (3 values)'));
  });

  it("should detect boolean enums", () => {
    const input = [
      { active: true },
      { active: false },
      { active: true }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result);
    
    // Should detect enum for active field
    const activeLine = lines.find(line => line.includes("[].active"));
    assert.ok(activeLine.includes('enum [false, true] (2 values)'));
  });

  it("should not show enum for single unique value", () => {
    const input = [
      { status: "active" },
      { status: "active" },
      { status: "active" }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result);
    
    // Should not detect enum, just show type
    const statusLine = lines.find(line => line.includes("[].status"));
    assert.ok(statusLine.includes("string"));
    assert.ok(!statusLine.includes("enum"));
  });

  it("should not show enum for too many unique values", () => {
    const input = Array.from({ length: 12 }, (_, i) => ({ id: i }));
    const result = summarizePaths(input);
    const lines = pathsToLines(result, { maxEnumValues: 10 });
    
    // Should not detect enum because there are too many unique values
    const idLine = lines.find(line => line.includes("[].id"));
    assert.ok(idLine.includes("number"));
    assert.ok(!idLine.includes("enum"));
  });

  it("should respect maxEnumValues option", () => {
    const input = [
      { level: 1 },
      { level: 2 },
      { level: 3 },
      { level: 4 },
      { level: 5 }
    ];
    const result = summarizePaths(input);
    
    // With default maxEnumValues (10), should show enum
    const lines1 = pathsToLines(result, { maxEnumValues: 10 });
    const levelLine1 = lines1.find(line => line.includes("[].level"));
    assert.ok(levelLine1.includes("enum"));

    // With maxEnumValues set to 3, should not show enum (5 > 3)
    const lines2 = pathsToLines(result, { maxEnumValues: 3 });
    const levelLine2 = lines2.find(line => line.includes("[].level"));
    assert.ok(!levelLine2.includes("enum"));
  });

  it("should sort enum values consistently", () => {
    const input = [
      { status: "zebra" },
      { status: "alpha" },
      { status: "beta" }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result);
    
    // Should be sorted alphabetically
    const statusLine = lines.find(line => line.includes("[].status"));
    assert.ok(statusLine.includes('enum ["alpha", "beta", "zebra"]'));
  });
});

describe("Statistics Mode", () => {
  it("should show number statistics", () => {
    const input = [
      { score: 85 },
      { score: 92 },
      { score: 78 },
      { score: 95 }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result, { stats: true });
    
    const scoreLine = lines.find(line => line.includes("[].score"));
    assert.ok(scoreLine.includes("number (4 total"));
    assert.ok(scoreLine.includes("min: 78"));
    assert.ok(scoreLine.includes("max: 95"));
    assert.ok(scoreLine.includes("avg: 87.50"));
    assert.ok(scoreLine.includes("sum: 350"));
  });

  it("should show string statistics", () => {
    const input = [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Alice" },
      { name: "Charlie" }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result, { stats: true });
    
    const nameLine = lines.find(line => line.includes("[].name"));
    assert.ok(nameLine.includes("string (4 total"));
    assert.ok(nameLine.includes("unique: 3"));
    assert.ok(nameLine.includes('most common: "Alice" (2x)'));
  });

  it("should show boolean statistics", () => {
    const input = [
      { active: true },
      { active: false },
      { active: true },
      { active: true }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result, { stats: true });
    
    const activeLine = lines.find(line => line.includes("[].active"));
    assert.ok(activeLine.includes("boolean (4 total"));
    assert.ok(activeLine.includes("true: 3"));
    assert.ok(activeLine.includes("false: 1"));
  });

  it("should handle null values in statistics", () => {
    const input = [
      { score: 85 },
      { score: null },
      { score: 92 },
      { score: null }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result, { stats: true });
    
    const scoreLine = lines.find(line => line.includes("[].score"));
    assert.ok(scoreLine.includes("number (2 total"));  // Only counts non-null values
    assert.ok(scoreLine.includes("min: 85"));
    assert.ok(scoreLine.includes("max: 92"));
  });

  it("should show enum instead of stats by default", () => {
    const input = [
      { status: "active" },
      { status: "inactive" },
      { status: "active" }
    ];
    const result = summarizePaths(input);
    
    // Without stats flag, should show enum
    const normalLines = pathsToLines(result, { stats: false });
    const normalLine = normalLines.find(line => line.includes("[].status"));
    assert.ok(normalLine.includes("enum"));
    
    // With stats flag, should show statistics
    const statsLines = pathsToLines(result, { stats: true });
    const statsLine = statsLines.find(line => line.includes("[].status"));
    assert.ok(statsLine.includes("string (3 total"));
    assert.ok(statsLine.includes("unique: 2"));
  });

  it("should handle edge case with all null values", () => {
    const input = [
      { value: null },
      { value: null },
      { value: null }
    ];
    const result = summarizePaths(input);
    const lines = pathsToLines(result, { stats: true });
    
    const valueLine = lines.find(line => line.includes("[].value"));
    // When all values are null, it shows as "null" type, not statistics
    assert.ok(valueLine.includes("null"));
  });
});

describe("Interactive Mode Helpers", () => {
  const sampleLines = [
    ".users: array (size: 3)",
    ".users[]: object", 
    ".users[].name: string",
    ".users[].age: number",
    ".users[].profile: object",
    ".users[].profile.city: string",
    ".users[].active: boolean"
  ];

  describe("filterLines", () => {
    it("should return all lines when no filter provided", () => {
      const result = filterLines(sampleLines, "");
      assert.equal(result.length, sampleLines.length);
    });

    it("should filter lines with simple string matching", () => {
      const result = filterLines(sampleLines, "profile");
      assert.equal(result.length, 2); // .profile and .profile.city
    });

    it("should support regex filtering", () => {
      const result = filterLines(sampleLines, "users\\[\\]\\.(name|age):");
      assert.equal(result.length, 2); // name and age
    });

    it("should be case insensitive", () => {
      const result = filterLines(sampleLines, "ARRAY");
      assert.equal(result.length, 1);
    });

    it("should fallback to string contains on invalid regex", () => {
      const result = filterLines(sampleLines, "[invalid"); // Invalid regex
      assert.equal(result.length, 0); // Should not crash
    });
  });

  describe("sortLines", () => {
    it("should sort by path depth by default", () => {
      const result = sortLines(sampleLines, "path");
      assert.ok(result[0].includes(".users:"));
      assert.ok(result[result.length - 1].includes(".users[].profile.city"));
    });

    it("should sort alphabetically", () => {
      const result = sortLines(sampleLines, "alpha");
      assert.ok(result[0].includes(".users:"));
      assert.ok(result[1].includes(".users[]:"));
    });

    it("should sort by type", () => {
      const result = sortLines(sampleLines, "type");
      // Should group by type, then alphabetically
      const arrayLines = result.filter(line => line.includes("array"));
      const booleanLines = result.filter(line => line.includes("boolean"));
      assert.equal(arrayLines.length, 1);
      assert.equal(booleanLines.length, 1);
    });

    it("should not modify original array", () => {
      const original = [...sampleLines];
      sortLines(sampleLines, "alpha");
      assert.deepEqual(sampleLines, original);
    });
  });

  describe("extractType", () => {
    it("should extract type from field line", () => {
      assert.equal(extractType(".users[].name: string"), "string");
      assert.equal(extractType(".users[].age: number"), "number");
      assert.equal(extractType(".users: array (size: 3)"), "array");
    });

    it("should handle enum types", () => {
      assert.equal(extractType('.users[].status: enum ["active", "inactive"]'), "enum");
    });

    it("should return unknown for invalid format", () => {
      assert.equal(extractType("invalid line"), "unknown");
    });
  });
});
