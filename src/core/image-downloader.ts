import https from "https";
import fs from "fs";

export function downloadImage(url: string, outputFilePath: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`Starting download from ${url}...`);

    https
      .get(url, (response: any) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          response.resume();
          return;
        }

        const fileStream = fs.createWriteStream(outputFilePath);

        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(() => {
            console.log(`Image saved to ${outputFilePath}`);
            resolve();
          });
        });

        fileStream.on("error", (err: any) => {
          fs.unlink(outputFilePath, () => reject(err));
        });
      })
      .on("error", (err: any) => {
        reject(err);
      });
  });
}

async function main() {
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

  console.log("All downloads completed!");
}

main();
