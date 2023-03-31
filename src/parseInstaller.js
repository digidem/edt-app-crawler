module.exports = (file) => {
  const extension = file.split(".").pop().toLowerCase();
  let platform;
  if (extension === "zip" || extension === "gz") {
    if (RegExp("\\b" + "linux" + "\\b").test(file)) platform = "linux";
    if (RegExp("\\b" + "macos" + "\\b").test(file)) platform = "mac";
    if (RegExp("\\b" + "windows" + "\\b").test(file)) platform = "windows";
  }
  if (extension === "exe" || extension === "msi") platform = "windows";
  else if (extension === "deb" || extension === "appimage") platform = "linux";
  else if (extension === "dmg") platform = "mac";
  else if (extension === "apk") platform = "android";
  return {
    platform,
    extension,
  };
};
