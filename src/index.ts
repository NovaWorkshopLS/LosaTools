import parseDDS from "./core/dds-parser";
import * as fs from "fs";
import { extractImages, parseXml } from "./core/uixmlparse";
import { downloadImage } from "./core/image-downloader";
import INILoader from "./core/ini-loader";

async function main() {
  //   //dds parser
  console.log("Parsing DDS file...");
  const ddsHeader = parseDDS("src/ui_icon_event1.dds");
  console.log(`Width: ${ddsHeader.width}, Height: ${ddsHeader.height}`);
  console.log(`Pixel Format: ${ddsHeader.pixelFormat}`);
  console.log("DDS parsing completed.");

  //   //uixmlparser + convert image to separated png
  console.log("Parsing UI XML file and extracting images...");
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

  console.log("Parsing UI XML file and extracting images completed.");

  //image downloader
  console.log("Downloading images...");
  const total = 260; //total number of mercenary images

  for (let index = 1; index <= total; index++) {
    const paddedIndex = String(index).padStart(3, "0");

    // URL lists

    ///male
    const imageMaleUrl = `https://lostsagakr-cdn-image.valofe.com/2014_grand/class/illust/thum_char_view_n_${paddedIndex}.jpg`;
    const imageFemaleUrl = `https://lostsagakr-cdn-image.valofe.com/2014_grand/class/illust/thum_char_view_o_${paddedIndex}.jpg`;

    ///female
    const imageThumbMaleUrl = `https://lostsagakr-cdn-image.valofe.com/2014_grand/class/thum/thum_char_${paddedIndex}_n.jpg`;
    const imageThumbFemaleUrl = `https://lostsagakr-cdn-image.valofe.com/2014_grand/class/thum/thum_char_${paddedIndex}_o.jpg`;

    // Paths to save the images locally

    ///male
    const savePathMale = `./mercenary/${paddedIndex}/${paddedIndex}_male.jpg`;
    const savePathFemale = `./mercenary/${paddedIndex}/${paddedIndex}_female.jpg`;

    ///female
    const saveThumbPathMale = `./mercenary/${paddedIndex}/${paddedIndex}_thumb_male.jpg`;
    const saveThumbFemale = `./mercenary/${paddedIndex}/${paddedIndex}_thumb_female.jpg`;

    try {
      fs.mkdirSync(`./mercenary/${paddedIndex}/`, { recursive: true });

      console.log(`Downloading Thumbnail Male Image ${paddedIndex}...`);
      await downloadImage(imageThumbMaleUrl, saveThumbPathMale);

      console.log(`Downloading Male Image ${paddedIndex}...`);
      await downloadImage(imageMaleUrl, savePathMale);

      console.log(`Downloading Thumbnail Female Image ${paddedIndex}...`);
      await downloadImage(imageThumbFemaleUrl, saveThumbFemale);

      console.log(`Downloading Female Image ${paddedIndex}...`);
      await downloadImage(imageFemaleUrl, savePathFemale);
    } catch (error: any) {
      console.error(`Error downloading image ${paddedIndex}:`, error?.message);
    }
  }
  console.log("Downloading images completed.");

  //ini-loader
  console.log("Loading ini files...");
  const filePath = `./src/sp2.ini`;
  const iniLoader = new INILoader(filePath, true);
  iniLoader.setTitle("connect");
  const value = iniLoader.loadString("log_server_ip", "");
  console.log(value);
  console.log("Loading ini files completed.");
}

main().catch((err) => console.error(err));
