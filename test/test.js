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
});
