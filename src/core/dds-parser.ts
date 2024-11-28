import fs from "fs";

interface DDSHeader {
  height: number;
  width: number;
  mipMapCount: number;
  pixelFormat: number;
  pixelData: Buffer;
}

function parseDDS(filePath: string): DDSHeader {
  const buffer = fs.readFileSync(filePath);

  // Verify magic number
  const magicNumber = buffer.toString("ascii", 0, 4);
  if (magicNumber !== "DDS ") {
    throw new Error("Invalid DDS file");
  }

  // Read metadata
  const height = buffer.readUInt32LE(12);
  const width = buffer.readUInt32LE(16);
  const mipMapCount = buffer.readUInt32LE(28);
  const pixelFormat = buffer.readUInt32LE(84);

  // Extract pixel data starting at offset 128
  const pixelData = buffer.slice(128);

  return {
    height,
    width,
    mipMapCount,
    pixelFormat,
    pixelData,
  };
}

export default parseDDS;

function main() {
  console.log("Parsing DDS file...");
  const ddsHeader = parseDDS("src/ui_icon_event1.dds");
  console.log(`Width: ${ddsHeader.width}, Height: ${ddsHeader.height}`);
  console.log(`Pixel Format: ${ddsHeader.pixelFormat}`);
  console.log("DDS parsing completed.");
}

main();
