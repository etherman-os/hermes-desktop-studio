import { describe, expect, it } from "vitest";
import { parseSSEEvent, parseSSEStream, splitSSEBlocks } from "./sseParser";

describe("parseSSEEvent", () => {
  it("parses a basic event with space after colon", () => {
    const result = parseSSEEvent("event: run.started\ndata: {\"run_id\":\"r1\"}");
    expect(result).toEqual({
      event: "run.started",
      data: '{"run_id":"r1"}',
    });
  });

  it("parses event without space after colon", () => {
    const result = parseSSEEvent("event:run.started\ndata:{\"run_id\":\"r1\"}");
    expect(result).toEqual({
      event: "run.started",
      data: '{"run_id":"r1"}',
    });
  });

  it("handles multi-line data fields", () => {
    const block = "event: message\ndata: line1\ndata: line2\ndata: line3";
    const result = parseSSEEvent(block);
    expect(result).toEqual({
      event: "message",
      data: "line1\nline2\nline3",
    });
  });

  it("returns null for empty input", () => {
    expect(parseSSEEvent("")).toBeNull();
    expect(parseSSEEvent("   ")).toBeNull();
  });

  it("returns null when event field is missing", () => {
    expect(parseSSEEvent('data: {"key":"val"}')).toBeNull();
  });

  it("returns null when data field is missing", () => {
    expect(parseSSEEvent("event: run.started")).toBeNull();
  });

  it("skips comment lines", () => {
    const block = ": this is a comment\nevent: test\ndata: value";
    const result = parseSSEEvent(block);
    expect(result).toEqual({ event: "test", data: "value" });
  });

  it("ignores unknown fields like id and retry", () => {
    const block = "id: 42\nretry: 3000\nevent: ping\ndata: hello";
    const result = parseSSEEvent(block);
    expect(result).toEqual({ event: "ping", data: "hello" });
  });

  it("handles data with leading/trailing whitespace in value", () => {
    const block = "event: msg\ndata:  hello world  ";
    const result = parseSSEEvent(block);
    expect(result).toEqual({ event: "msg", data: " hello world  " });
  });

  it("handles JSON data with special characters", () => {
    const json = '{"text":"hello\\nworld","nested":{"a":1}}';
    const block = `event: assistant.delta\ndata: ${json}`;
    const result = parseSSEEvent(block);
    expect(result).toEqual({ event: "assistant.delta", data: json });
  });

  it("trims event type whitespace", () => {
    const block = "event:  run.completed  \ndata: {}";
    const result = parseSSEEvent(block);
    expect(result).toEqual({ event: "run.completed", data: "{}" });
  });
});

describe("splitSSEBlocks", () => {
  it("splits buffer on double newlines", () => {
    const buffer = "event: a\ndata: 1\n\nevent: b\ndata: 2\n\nevent: c\ndata: 3\n\n";
    const { blocks, remainder } = splitSSEBlocks(buffer);
    expect(blocks).toHaveLength(3);
    expect(remainder).toBe("");
  });

  it("preserves incomplete trailing text as remainder", () => {
    const buffer = "event: a\ndata: 1\n\nevent: b\ndata: ";
    const { blocks, remainder } = splitSSEBlocks(buffer);
    expect(blocks).toHaveLength(1);
    expect(remainder).toBe("event: b\ndata: ");
  });

  it("returns empty blocks and full buffer when no separator found", () => {
    const buffer = "event: a\ndata: 1";
    const { blocks, remainder } = splitSSEBlocks(buffer);
    expect(blocks).toHaveLength(0);
    expect(remainder).toBe(buffer);
  });
});

describe("parseSSEStream", () => {
  it("parses a complete multi-event stream", () => {
    const buffer =
      'event: run.started\ndata: {"run_id":"r1"}\n\n' +
      'event: assistant.delta\ndata: {"text":"hello"}\n\n';
    const { events, remainder } = parseSSEStream(buffer);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: "run.started", data: '{"run_id":"r1"}' });
    expect(events[1]).toEqual({ event: "assistant.delta", data: '{"text":"hello"}' });
    expect(remainder).toBe("");
  });

  it("handles partial stream with incomplete trailing event", () => {
    const buffer =
      'event: run.started\ndata: {"run_id":"r1"}\n\n' +
      "event: assistant.delta\ndata: {";
    const { events, remainder } = parseSSEStream(buffer);
    expect(events).toHaveLength(1);
    expect(remainder).toBe("event: assistant.delta\ndata: {");
  });

  it("filters out malformed blocks", () => {
    const buffer =
      'event: run.started\ndata: {"run_id":"r1"}\n\n' +
      "just garbage\n\n" +
      'event: run.completed\ndata: {"done":true}\n\n';
    const { events } = parseSSEStream(buffer);
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe("run.started");
    expect(events[1].event).toBe("run.completed");
  });

  it("handles empty buffer", () => {
    const { events, remainder } = parseSSEStream("");
    expect(events).toHaveLength(0);
    expect(remainder).toBe("");
  });
});
