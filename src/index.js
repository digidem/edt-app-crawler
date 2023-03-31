#!/usr/bin/env node

// Read manifest
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");
const wget = require("wget-improved");
const cliProgress = require("cli-progress");
const colors = require("colors");
const mkdirp = require("mkdirp");
const args = require("yargs").argv;
const parseAppsManifest = require("./parseAppsManifest");
const appManifest = require("./appManifest.json");

let downloadQueue = [];

function formatter(options, params, { payload }) {
  const bar = options.barCompleteString.substr(
    0,
    Math.round(params.progress * options.barsize)
  );
  if (params.value >= params.total) {
    return (
      "# " +
      colors.grey(payload) +
      "   " +
      colors.green(params.value + "/" + params.total) +
      " --[" +
      bar +
      "]-- "
    );
  } else {
    return (
      "# " +
      payload +
      "   " +
      colors.yellow(Math.round(params.value) + "/" + params.total) +
      " --[" +
      bar +
      "]-- "
    );
  }
}

function downloadFile(app, installer, bar, workFolder) {
  const installerName = `${app.slug}-${app.version}-${installer.platform}.${installer.extension}`;
  const appFolder = `${workFolder}/apps`;
  mkdirp.sync(appFolder);
  const outputDir = `${appFolder}/${installerName}`;
  const src = installer.link;
  /* TODO: compare versions between local and remote and only download if different */
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
      localApps.push({
        message,
        src,
        dir: `/${installerName}`,
        ...app,
      });
      writeFileSync(
        `${workFolder}/localAppManifest.json`,
        JSON.stringify(localApps)
      );
    } catch (err) {
      console.log("localAppManifest.json not present");
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
}

/* Start of program */
console.log(
  "\n Starting download of installers for all applications in the appManifest.json \n"
);
const workFolder = args.path || path.join(process.cwd(), "src");
const apps = appManifest;
try {
  writeFileSync(`${workFolder}/localAppManifest.json`, JSON.stringify([]));
} catch (err) {
  console.error(err);
}

const multibar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: formatter,
  },
  cliProgress.Presets.shades_grey
);
apps.forEach((app) => {
  const installers = parseAppsManifest(app.installers).filter((i) => i);
  installers.forEach((installer) => {
    const installerBar = multibar.create(100, 0, {
      payload: `${app.slug}/${installer.platform}.${installer.extension}`,
    });
    try {
      downloadFile(app, installer, installerBar, workFolder);
    } catch (error) {
      console.log(error);
    }
  });
});
