import { readFile, unlink } from "fs/promises";
import Jimp from "jimp";
import { execAsync } from "./utils";

export async function getTextInImage(img: Jimp, x: number, y: number, width: number, height: number): Promise<void> {
    const rawPath = 'test.bmp'
    const convertedPath = 'test-gray.bmp'
    const resPath = 'test-res'
    await img.crop(x * 2, y * 2, width * 2, height * 2).writeAsync(rawPath);
    await execAsync(`convert ${rawPath} -type Grayscale -negate ${convertedPath}`)
    await execAsync(`tesseract -c tessedit_char_whitelist=0123456789-, ${convertedPath} ${resPath}`) //-c tessedit_char_whitelist=0123456789
    console.log(await (await readFile(`${resPath}.txt`)).toString());
    await Promise.all([
        unlink(rawPath),
        unlink(convertedPath),
        unlink(`${resPath}.txt`),
    ])
}