import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { writeJson } from './render-capture-lib.mjs';

const execFile = promisify(execFileCallback);
const root = process.cwd();
const outputPath = path.resolve(process.env.KGG_FFMPEG_REPORT ?? path.join('test-results', 'ffmpeg-native-smoke.json'));
const ffmpegPath = process.env.KGG_FFMPEG_PATH ?? 'ffmpeg';
const ffprobePath = process.env.KGG_FFPROBE_PATH ?? 'ffprobe';
const width = 16;
const height = 16;
const frameCount = 4;
const fps = 24;

class NotRunError extends Error {}

function getArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBytes, Buffer.from(data)]);
  const chunk = Buffer.alloc(12 + data.byteLength);
  chunk.writeUInt32BE(data.byteLength, 0);
  typeBytes.copy(chunk, 4);
  Buffer.from(data).copy(chunk, 8);
  chunk.writeUInt32BE(crc32(crcInput), 8 + data.byteLength);
  return chunk;
}

function makePng(frameIndex) {
  const rowBytes = width * 3;
  const scanlines = Buffer.alloc(height * (rowBytes + 1));
  for (let y = 0; y < height; y += 1) {
    const offset = y * (rowBytes + 1) + 1;
    for (let x = 0; x < width; x += 1) {
      const pixel = offset + x * 3;
      scanlines[pixel] = (x * 17 + frameIndex * 31) & 0xff;
      scanlines[pixel + 1] = (y * 19 + frameIndex * 47) & 0xff;
      scanlines[pixel + 2] = ((x + y) * 11 + frameIndex * 61) & 0xff;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function runCommand(executable, args) {
  try {
    const result = await execFile(executable, args, {
      cwd: root,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: typeof error?.code === 'number' ? error.code : 1,
      stdout: String(error?.stdout ?? ''),
      stderr: String(error?.stderr ?? error?.message ?? error),
      spawnError: error?.code === 'ENOENT',
    };
  }
}

function encoderAvailable(output, encoder) {
  return output.split(/\r?\n/).some(line => /^\s*\S+\s+/.test(line) && line.trim().split(/\s+/)[1] === encoder);
}

async function requireCommand(executable, label) {
  const result = await runCommand(executable, ['-version']);
  if (result.spawnError) throw new NotRunError(`${label} is not available: ${executable}`);
  if (result.code !== 0) throw new Error(`${label} -version failed: ${result.stderr.trim()}`);
  return result;
}

async function probeVideo(output, expectedCodec, expectedPixFmts) {
  const result = await runCommand(ffprobePath, [
    '-v', 'error',
    '-count_frames',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,pix_fmt,width,height,nb_read_frames,sample_aspect_ratio,color_range,color_space,color_transfer,color_primaries',
    '-of', 'json',
    output,
  ]);
  if (result.code !== 0) throw new Error(`ffprobe failed for ${output}: ${result.stderr.trim()}`);
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`ffprobe returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const stream = parsed.streams?.[0];
  if (!stream) throw new Error(`ffprobe found no video stream in ${output}`);
  const actual = {
    codecName: stream.codec_name,
    pixFmt: stream.pix_fmt,
    width: Number(stream.width),
    height: Number(stream.height),
    frameCount: Number(stream.nb_read_frames),
    sampleAspectRatio: stream.sample_aspect_ratio,
    colorRange: stream.color_range,
    colorSpace: stream.color_space,
    colorTransfer: stream.color_transfer,
    colorPrimaries: stream.color_primaries,
  };
  if (actual.codecName !== expectedCodec) throw new Error(`${output} codec is ${actual.codecName}, expected ${expectedCodec}`);
  if (!expectedPixFmts.includes(actual.pixFmt)) throw new Error(`${output} pixel format is ${actual.pixFmt}, expected one of ${expectedPixFmts.join(', ')}`);
  if (actual.width !== width || actual.height !== height || actual.frameCount !== frameCount) {
    throw new Error(`${output} metadata is ${JSON.stringify(actual)}, expected ${width}×${height}/${frameCount} frames`);
  }
  const file = await stat(output);
  if (file.size < 1) throw new Error(`${output} is empty`);
  return { ...actual, byteLength: file.size, sha256: createHash('sha256').update(await readFile(output)).digest('hex') };
}

async function main() {
  const requestedReport = getArgument('--output');
  const reportFile = path.resolve(requestedReport ?? outputPath);
  await mkdir(path.dirname(reportFile), { recursive: true });
  const report = {
    schemaVersion: 1,
    kind: 'kgg-ffmpeg-native-smoke',
    status: 'not-run',
    ffmpeg: { executable: ffmpegPath, version: null, encoders: { qtrle: false, libx264: false } },
    ffprobe: { executable: ffprobePath },
    input: { width, height, frameCount, fps },
    outputs: {},
    tempDirectory: null,
    cleanupVerified: false,
    errors: [],
  };
  let tempDirectory;
  try {
    const version = await requireCommand(ffmpegPath, 'FFmpeg');
    const ffprobeVersion = await requireCommand(ffprobePath, 'ffprobe');
    report.ffmpeg.version = version.stdout.split(/\r?\n/).find(line => line.toLowerCase().startsWith('ffmpeg version'))?.trim() ?? version.stdout.trim().split(/\r?\n/)[0];
    report.ffprobe.version = ffprobeVersion.stdout.split(/\r?\n/).find(line => line.toLowerCase().startsWith('ffprobe version'))?.trim() ?? ffprobeVersion.stdout.trim().split(/\r?\n/)[0];
    const encoderResult = await runCommand(ffmpegPath, ['-hide_banner', '-encoders']);
    if (encoderResult.code !== 0) throw new Error(`FFmpeg encoder listing failed: ${encoderResult.stderr.trim()}`);
    const encoderText = `${encoderResult.stdout}\n${encoderResult.stderr}`;
    report.ffmpeg.encoders.qtrle = encoderAvailable(encoderText, 'qtrle');
    report.ffmpeg.encoders.libx264 = encoderAvailable(encoderText, 'libx264');
    if (!report.ffmpeg.encoders.qtrle || !report.ffmpeg.encoders.libx264) {
      throw new NotRunError(`Required encoders are unavailable (qtrle=${report.ffmpeg.encoders.qtrle}, libx264=${report.ffmpeg.encoders.libx264})`);
    }

    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'kgg-ffmpeg-smoke-'));
    report.tempDirectory = tempDirectory;
    for (let index = 0; index < frameCount; index += 1) {
      await writeFile(path.join(tempDirectory, `frame_${String(index).padStart(4, '0')}.png`), makePng(index));
    }
    const inputPattern = path.join(tempDirectory, 'frame_%04d.png');
    const mov = path.join(tempDirectory, 'output.mov');
    const mp4 = path.join(tempDirectory, 'output.mp4');
    const qtrle = await runCommand(ffmpegPath, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', String(fps), '-start_number', '0', '-i', inputPattern,
      '-c:v', 'qtrle', '-pix_fmt', 'rgb24', mov,
    ]);
    if (qtrle.code !== 0) throw new Error(`qtrle encode failed: ${qtrle.stderr.trim()}`);
    report.outputs.mov = await probeVideo(mov, 'qtrle', ['rgb24']);

    const mp4Result = await runCommand(ffmpegPath, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', String(fps), '-start_number', '0', '-i', inputPattern,
      '-c:v', 'libx264', '-crf', '22', '-preset', 'slow',
      '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0,format=yuv420p,setsar=1',
      '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
      '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', mp4,
    ]);
    if (mp4Result.code !== 0) throw new Error(`libx264 encode failed: ${mp4Result.stderr.trim()}`);
    report.outputs.mp4 = await probeVideo(mp4, 'h264', ['yuv420p']);
    if (report.outputs.mp4.sampleAspectRatio !== '1:1') {
      throw new Error(`MP4 sample aspect ratio is ${report.outputs.mp4.sampleAspectRatio}, expected 1:1`);
    }
    if (report.outputs.mp4.colorRange !== 'tv'
      || report.outputs.mp4.colorSpace !== 'bt709'
      || report.outputs.mp4.colorTransfer !== 'bt709'
      || report.outputs.mp4.colorPrimaries !== 'bt709') {
      throw new Error(`MP4 color metadata is ${JSON.stringify({
        colorRange: report.outputs.mp4.colorRange,
        colorSpace: report.outputs.mp4.colorSpace,
        colorTransfer: report.outputs.mp4.colorTransfer,
        colorPrimaries: report.outputs.mp4.colorPrimaries,
      })}, expected BT.709/video-range`);
    }
    report.status = 'pass';
  } catch (error) {
    report.status = error instanceof NotRunError ? 'not-run' : 'fail';
    report.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
      report.cleanupVerified = !(await stat(tempDirectory).then(() => true).catch(() => false));
    }
    report.tempDirectory = tempDirectory;
    await writeJson(reportFile, report);
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'not-run') process.exitCode = 2;
  else if (report.status !== 'pass') process.exitCode = 1;
}

await main();
