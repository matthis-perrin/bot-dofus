import { promises } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execAsync } from "./utils";

const { readFile, unlink } = promises;

export async function takeScreenshot(): Promise<Buffer> {
  const filePath = join(tmpdir(), `${Math.random().toString(36).slice(2)}.bmp`);
  const screencaptureCmd = `screencapture -t bmp -x ${filePath}`;
  await execAsync(screencaptureCmd);
  const file = await readFile(filePath);
  await unlink(filePath);
  return file;
}
