var http = require("http"),
  fs = require("fs"),
  parseURL = require("url").parse,

  CacheManager = require("./lib/cachemanager").CacheManager,
  URLManager = require("./lib/urlmanager").URLManager,

  types = {
    "html": {
      "contentType": "text/html",
      "base": "./static/"
    },
    "htm": {
      "contentType": "text/html",
      "base": "./static/"
    },
    "js": {
      "contentType": "application/javascript",
      "base": "./static/"
    },
    "css": {
      "contentType": "text/css",
      "base": "./static/"
    },
    "json": {
      "contentType": "application/json",
      "base": "./cache/"
    }
  },

  extRegExp = /\.([A-Za-z]+)$/,

  paths,
  httpServer;

function getFile(res, contentType) {
  return function (err, content) {
    if (err) {
      res.writeHead(404, {});
    } else {
      res.writeHead(200, {
        "Content-Type": contentType + "; charset=UTF-8"
      });
    }
    res.end(content);
  };
}

paths = {
  "/quit": function quitPath(req, res) {
    CacheManager.writeCache("",
      function writeCacheNext() {
        CacheManager.writeCache("cache.dump.bak",
          function writeCacheBackupNext() {
            res.end("Wrote CACHE\nExiting...");
            throw "Exiting";
          });
      });
  },
  "proxy": function proxyPath(req, res, parsed) {
    var search = parsed.search,
        parsedSearch;

    if (search) {
      search = decodeURIComponent(search.substr(1));
      URLManager.requestURL(search, function (response) {
        var backup = response.data;
        var body = backup.toString();

        delete response.data;
        console.log('got response:', response);
        response.data = backup;
        res.writeHead(response.statusCode, response.headers);
        res.end(body);
      });
    } else {
      res.end("");
    }
  },
  "static": function staticPath(req, res, parsed) {
    //console.log("in static:", parsed.pathname);

    var extension = parsed.pathname.match(extRegExp)[1],
      type,
      fileName,
      path;

    if (extension && types[extension]) {
      type = types[extension];
      fileName = parsed.pathname.split("/");
      fileName = fileName[fileName.length - 1];
      // path = type.base + fileName;
      path = "." + parsed.pathname;
      //console.log("reading file:", path);
      fs.readFile(path, getFile(res, type.contentType));
    } else {
      res.writeHead(404, {});
      res.end();
    }
  },
  "/": function rootPath(req, res, parsed) {
    if (parsed.pathname.match(extRegExp)) {
      paths.static(req, res, parsed);
    }
  }
};

function startServer(req, res) {
  var parsed = parseURL(req.url, true),
    match = parsed.pathname.match(extRegExp),
    path;

  if (match) {
    paths["static"](req, res, parsed);
  } else {
    for (var i in paths) {
      match = parsed.pathname.match(new RegExp(i));
      if (match) {
        paths[i](req, res, parsed, match);
        return;
      }
    }
    res.writeHead(404, {});
    res.end();
    return;
  }
}

CacheManager.loadCache(function () {
  httpServer = http.createServer(startServer);
  httpServer.listen(9615);
  console.log("listening on port 9615 in", __dirname);
});