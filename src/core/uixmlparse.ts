import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { XMLParser } from "fast-xml-parser";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

interface Image {
  Name: string;
  X?: number;
  Y?: number;
  Width: number;
  Height: number;
  OffsetX?: number;
  OffsetY?: number;
}

interface Imageset {
  Name: string;
  File: string;
  Images: Image[];
}

interface ImagesetLayout {
  Imageset: Imageset[];
}

// Function to log messages to a file
function WriteLog(message: string, filename: string) {
  const logDirPath = "./log";
  const logFilePath = path.join(logDirPath, filename);

  if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Append the log message to the log file
  fs.appendFileSync(logFilePath, logMessage, "utf8");
}

// Function to parse the XML
export function parseXml(filePath: string): ImagesetLayout {
  const xmlData = fs.readFileSync(filePath, "utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    allowBooleanAttributes: false,
  });

  const jsonObj = parser.parse(xmlData);

  const imagesetLayout: ImagesetLayout = {
    Imageset: (Array.isArray(jsonObj.ImagesetLayout.Imageset)
      ? jsonObj.ImagesetLayout.Imageset
      : [jsonObj.ImagesetLayout.Imageset]
    ).map((imageset: any) => {
      WriteLog("Processing Imageset: " + imageset.Name, "./xml.log");

      return {
        Name: imageset?.Name,
        File: imageset.File,
        Images: (Array.isArray(imageset.Image)
          ? imageset.Image
          : [imageset.Image]
        )
          .map((image: any) => {
            // Skip images with missing properties
            if (
              !image ||
              !image.X ||
              !image.Y ||
              !image.Width ||
              !image.Height
            ) {
              WriteLog(
                "Skipping image due to missing properties: " + image,
                "./error.log"
              );

              return null;
            }

            WriteLog("Processing Image: " + image, "./xml.log");

            return {
              Name: image?.Name,
              X: Number(image.X),
              Y: Number(image.Y),
              Width: Number(image.Width),
              Height: Number(image.Height),
              OffsetX: Number(image.OffsetX),
              OffsetY: Number(image.OffsetY),
            };
          })
          .filter((image: any) => image !== null),
      };
    }),
  };

  WriteLog("Final Imageset Layout: " + imagesetLayout, "./xml.log");

  return imagesetLayout;
}

// Function to convert DDS to PNG using ImageMagick
async function convertDdsToPng(
  inputFile: string,
  outputFile: string
): Promise<void> {
  try {
    const command = `magick convert "${inputFile}" "${outputFile}"`;

    WriteLog("Executing command: " + command, "./debug.log");

    await execPromise(command);

    WriteLog(`Converted: ${inputFile} to ${outputFile}`, "./debug.log");
  } catch (error) {
    WriteLog(`Failed to convert ${inputFile}:`, "./error.log");

    throw error;
  }
}

export async function extractImages(
  imageset: Imageset,
  outputDir: string
): Promise<void> {
  const inputFilePath = path.resolve(imageset.File);

  if (!fs.existsSync(inputFilePath)) {
    WriteLog(`File not found: ${inputFilePath}`, "./error.log");
    return;
  }

  // Get file extension
  const ext = path.extname(inputFilePath).toLowerCase();

  let imagePath = inputFilePath;

  // Convert DDS to PNG if necessary
  if (ext === ".dds") {
    const tempPngPath = path.resolve(outputDir, `${imageset.Name}.png`);
    await convertDdsToPng(inputFilePath, tempPngPath);
    imagePath = tempPngPath;
  }

  if (ext === ".bmp") {
    imagePath = inputFilePath;
  }

  // Process images
  for (const image of imageset.Images) {
    const outputFilePath = path.resolve(outputDir, `${image.Name}.png`);

    WriteLog(
      `Extracting ${image.Name} from ${inputFilePath} to ${outputFilePath} \r\n
      X: ${image.X}, Y: ${image.Y}, Width: ${image.Width}, Height: ${image.Height}`,
      "./debug.log"
    );

    try {
      await sharp(imagePath)
        .extract({
          left: image.X ?? 0,
          top: image.Y ?? 0,
          width: image.Width,
          height: image.Height,
        })
        .toFormat("png") // Save as PNG format
        .toFile(outputFilePath);

      WriteLog(`Saved: ${outputFilePath}`, "./debug.log");
    } catch (err) {
      WriteLog(`Failed to extract ${image.Name}: ${err}`, "./error.log");
    }
  }
}

// Main function
async function main() {
  const xmlFilePath = "uiimageset.xml";
  const resourcesPath = "";
  const outputDir = "./output-images/";

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const parsedData = parseXml(xmlFilePath);

  for (const imageset of parsedData.Imageset) {
    if (!fs.existsSync(outputDir + imageset?.Name)) {
      fs.mkdirSync(outputDir + imageset?.Name);
    }
    imageset.File = resourcesPath + "/" + imageset?.File;
    console.log(`Processing Imageset: ${imageset?.Name}`);

    await extractImages(imageset, outputDir + imageset?.Name);
  }

  console.log("Processing completed.");
}

main().catch((err) => console.error(err));
