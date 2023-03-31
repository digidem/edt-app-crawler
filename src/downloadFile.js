const { readFileSync, writeFileSync } = require("fs");
const path = require("path");
const wget = require("wget-improved");
const colors = require("colors");

let downloadQueue = [];

module.exports = (
  app,
  installer,
  platform,
  extension,
  bar,
  workFolder,
  test
) => {
  const installerName = `${app.slug}-${app.version}-${platform}.${extension}`;
  const outputDir = `${workFolder}/${installerName}`;
  const src = test ? "http://localhost:9615" : installer;
  if (test) {
    console.log("Download test", src);
  }
  // TODO: Skip if version is the same
  const download = wget.download(src, outputDir, {});
  download.on("error", (err) => {
    console.log(err);
    bar.stop();
  });
  download.on("start", () => {
    downloadQueue.push(installerName);
  });
  download.on("end", (message) => {
    try {
      const localAppManifest = readFileSync(
        path.join(workFolder, "/localAppManifest.json"),
        {
          encoding: "utf8",
          flag: "r",
        }
      );
      const localApps = JSON.parse(localAppManifest);
      const index = localApps.map((i) => i.name).indexOf(app.name);
      const localInstaller = {
        file: `/${installerName}`,
        platform,
        extension,
        src: installer,
      };
      if (index !== -1) {
        localApps[index].localInstallers.push(localInstaller);
      } else {
        localApps.push({
          message,
          localInstallers: [localInstaller],
          ...app,
        });
      }
      writeFileSync(
        `${workFolder}/localAppManifest.json`,
        JSON.stringify(localApps)
      );
    } catch (err) {
      console.log("localAppManifest.json not present", err);
    }
    bar.stop();
    downloadQueue = downloadQueue.filter((i) => i !== installerName);
    if (downloadQueue.length == 0) {
      console.log(colors.green("\n\nAll downloads completed!"));
      process.exit();
    }
  });
  download.on("progress", (progress) => {
    bar.update(progress * 100);
  });
};
