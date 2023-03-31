#!/usr/bin/env node

// Read manifest
const { writeFileSync } = require("fs");
const path = require("path");
const cliProgress = require("cli-progress");
const mkdirp = require("mkdirp");
const args = require("yargs").argv;
const downloadFile = require("./downloadFile");
const formatter = require("./formatter");
const appManifest = require("./appManifest.json");
const parseInstaller = require("./parseInstaller");

const test = args["dry-run"];

if (test) {
  console.log("TEST MODE");
  require("./testServer")();
}

const multibar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: formatter,
  },
  cliProgress.Presets.shades_grey
);

/* Start of program */
console.log(
  "\n Starting download of installers for all applications in the appManifest.json \n"
);
const workFolder = args.path || path.join(process.cwd(), "src/apps");
const apps = appManifest;
try {
  mkdirp.sync(`${workFolder}`);
  writeFileSync(`${workFolder}/localAppManifest.json`, JSON.stringify([]));
} catch (err) {
  console.error(err);
}
apps.forEach((app) => {
  app.installers.forEach((installer) => {
    const { platform, extension } = parseInstaller(installer);
    const installerBar = multibar.create(100, 0, {
      payload: `${app.slug}/${platform}.${extension}`,
    });
    try {
      downloadFile(
        app,
        installer,
        platform,
        extension,
        installerBar,
        workFolder,
        test
      );
    } catch (error) {
      console.log(error);
    }
  });
});
