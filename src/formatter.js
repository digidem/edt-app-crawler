const colors = require("colors");

module.exports = (options, params, { payload }) => {
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
};
