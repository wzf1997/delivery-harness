#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_FRAMES = 600;

function fail(message) {
  throw new Error(message);
}

function executable(name, environmentName) {
  const explicit = process.env[environmentName];
  const suffixes = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE").split(";") : [""];
  const candidates = explicit
    ? [explicit]
    : (process.env.PATH ?? "")
        .split(delimiter)
        .filter(Boolean)
        .flatMap((directory) => suffixes.map((suffix) => join(directory, `${name}${suffix.toLowerCase()}`)));

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      if (statSync(candidate).isFile()) return resolve(candidate);
    } catch {
      // Try the next candidate.
    }
  }
  fail(`${name} is unavailable; provide it on PATH or set ${environmentName}.`);
}

function run(command, args, timeout = 600_000) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout,
    windowsHide: true,
  });
  if (result.error) fail(`${basename(command)} could not run: ${result.error.message}`);
  if (result.status !== 0) fail(`${basename(command)} failed with exit code ${result.status}.`);
  return result.stdout;
}

export function selectFrames(sourceTimes, start = 0, end, interval, everyFrame = false) {
  if (sourceTimes.length === 0 || sourceTimes.some((value) => !Number.isFinite(value))) {
    fail("The video has no reliable decoded-frame timestamps.");
  }
  if (sourceTimes.some((value, index) => index > 0 && value < sourceTimes[index - 1])) {
    fail("Decoded-frame timestamps are not monotonic.");
  }
  if (!Number.isFinite(start) || start < 0 || (end !== undefined && (!Number.isFinite(end) || end <= start))) {
    fail("The requested time range is invalid.");
  }
  if (interval !== undefined && (!Number.isFinite(interval) || interval <= 0)) {
    fail("The sampling interval must be greater than zero.");
  }

  const relativeTimes = sourceTimes.map((value) => value - sourceTimes[0]);
  const stop = end ?? relativeTimes.at(-1);
  const candidates = relativeTimes.flatMap((value, index) => (value >= start && value <= stop ? [index] : []));
  if (candidates.length === 0) fail("The requested range has no decoded frames.");

  let selected;
  let effectiveInterval = interval;
  if (everyFrame) {
    selected = candidates;
    effectiveInterval = undefined;
  } else {
    effectiveInterval ??= Math.max((stop - start) / 118, 0.001);
    selected = [candidates[0]];
    for (const candidate of candidates.slice(1)) {
      if (relativeTimes[candidate] - relativeTimes[selected.at(-1)] >= effectiveInterval - 1e-9) selected.push(candidate);
    }
    if (selected.at(-1) !== candidates.at(-1)) selected.push(candidates.at(-1));
  }

  if (selected.length > MAX_FRAMES) fail(`The requested run exceeds ${MAX_FRAMES} frames; shorten the range.`);
  return { selected, relativeTimes, effectiveInterval };
}

function tools() {
  return {
    ffmpeg: executable("ffmpeg", "DELIVERYGUARD_FFMPEG"),
    ffprobe: executable("ffprobe", "DELIVERYGUARD_FFPROBE"),
  };
}

function doctor() {
  const found = tools();
  return {
    ffmpeg: run(found.ffmpeg, ["-version"], 60_000).split(/\r?\n/, 1)[0],
    ffprobe: run(found.ffprobe, ["-version"], 60_000).split(/\r?\n/, 1)[0],
  };
}

function parseNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) fail(`${label} must be a non-negative number.`);
  return parsed;
}

function parseExtractArguments(argv) {
  if (argv.length === 0) fail("extract requires a local video path.");
  const options = { source: argv[0], start: 0, end: undefined, interval: undefined, everyFrame: false, output: undefined };
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--every-frame") options.everyFrame = true;
    else if (["--start", "--end", "--interval", "--output"].includes(argument)) {
      const value = argv[++index];
      if (value === undefined) fail(`${argument} requires a value.`);
      if (argument === "--start") options.start = parseNumber(value, "start");
      else if (argument === "--end") options.end = parseNumber(value, "end");
      else if (argument === "--interval") options.interval = parseNumber(value, "interval");
      else options.output = value;
    } else fail(`Unknown option: ${argument}`);
  }
  if (options.everyFrame && options.interval !== undefined) fail("Choose --every-frame or --interval, not both.");
  return options;
}

function timestamp(seconds) {
  const milliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor(milliseconds / 60_000) % 60;
  const wholeSeconds = Math.floor(milliseconds / 1000) % 60;
  const remainder = milliseconds % 1000;
  return [hours, minutes, wholeSeconds].map((value) => String(value).padStart(2, "0")).join(":") + `.${String(remainder).padStart(3, "0")}`;
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function extract(options) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(options.source)) fail("Only local media files are accepted.");
  const source = resolve(options.source);
  if (!existsSync(source) || !statSync(source).isFile()) fail("The video path is not a local regular file.");

  const found = tools();
  const probe = JSON.parse(
    run(found.ffprobe, [
      "-v", "error", "-protocol_whitelist", "file,pipe", "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height,avg_frame_rate:frame=best_effort_timestamp_time",
      "-of", "json", source,
    ]),
  );
  if (!Array.isArray(probe.streams) || probe.streams.length === 0) fail("The file has no video stream.");
  const sourceTimes = (probe.frames ?? []).map((frame) => Number(frame.best_effort_timestamp_time));
  const { selected, relativeTimes, effectiveInterval } = selectFrames(
    sourceTimes,
    options.start,
    options.end,
    options.interval,
    options.everyFrame,
  );

  const parent = resolve(options.output ?? tmpdir());
  mkdirSync(parent, { recursive: true });
  const output = mkdtempSync(join(parent, "deliveryguard-video-"));
  const selection = selected.map((frame) => `eq(n\\,${frame})`).join("+");
  run(found.ffmpeg, [
    "-nostdin", "-hide_banner", "-v", "error", "-protocol_whitelist", "file,pipe", "-i", source,
    "-map", "0:v:0", "-an", "-sn", "-dn", "-vf", `select=${selection},scale=1280:-2:force_original_aspect_ratio=decrease`,
    "-fps_mode", "passthrough", "-q:v", "2", "-frames:v", String(selected.length), join(output, "frame-%04d.jpg"),
  ]);

  const images = readdirSync(output).filter((file) => /^frame-\d{4}\.jpg$/.test(file)).sort();
  if (images.length !== selected.length) fail("Extracted images do not match the selected frame index.");
  const digest = createHash("sha256").update(readFileSync(source)).digest("hex");
  const frames = images.map((file, index) => ({
    file,
    frameNumber: selected[index],
    sourcePtsSeconds: sourceTimes[selected[index]],
    relativeSeconds: relativeTimes[selected[index]],
    timestamp: timestamp(relativeTimes[selected[index]]),
  }));
  const stream = probe.streams[0];
  const index = {
    schemaVersion: 1,
    sourceName: basename(source),
    sourceExtension: extname(source).toLowerCase(),
    sha256: digest,
    metadata: {
      codec: stream.codec_name,
      width: stream.width,
      height: stream.height,
      averageFrameRate: stream.avg_frame_rate,
    },
    audioAnalyzed: false,
    observedRange: { start: options.start, end: options.end ?? relativeTimes.at(-1) },
    sampleIntervalSeconds: options.everyFrame ? null : effectiveInterval,
    everyFrame: options.everyFrame,
    frames,
  };
  writeFileSync(join(output, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
  const cards = frames
    .map((frame) => `<figure><a href="${frame.file}"><img src="${frame.file}" width="320"></a><figcaption>${escapeHtml(frame.timestamp)} · frame ${frame.frameNumber}</figcaption></figure>`)
    .join("\n");
  writeFileSync(join(output, "index.html"), `<!doctype html><meta charset="utf-8"><title>DeliveryGuard video frames</title><h1>Video frames</h1><p>Relative decoded-frame time. Audio was not analyzed.</p>${cards}\n`);
  return { output, index: join(output, "index.json"), frames: frames.length, observedRange: index.observedRange };
}

function usage() {
  return [
    "Usage:",
    "  extract-frames.mjs doctor",
    "  extract-frames.mjs extract <video> [--start seconds] [--end seconds] [--interval seconds | --every-frame] [--output directory]",
  ].join("\n");
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    return 0;
  }
  try {
    const command = argv[0];
    const result = command === "doctor" ? doctor() : command === "extract" ? extract(parseExtractArguments(argv.slice(1))) : fail(usage());
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return 0;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
