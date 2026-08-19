const proxy = {
  "/api": {
    "target": "http://31.97.149.50:3110",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    }
  }
};

module.exports = proxy;
