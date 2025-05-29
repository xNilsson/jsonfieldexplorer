const assert = require("assert").strict;
const { processJson, summarizePaths } = require("../jfe");

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
