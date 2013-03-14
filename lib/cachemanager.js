exports.CacheManager = (function CacheManager() {
    var fs = require("fs"),
        parseURL = require("url").parse,

        CACHE = {
            "length": 0
        },

        CURRENT_EXPORT = 0,
        LAST_EXPORT = 0,
        EXPORT_TRESHOLD = 1000,

        CURRENT_BACKUP = 0,
        LAST_BACKUP = 0,
        BACKUP_TRESHOLD = 10000,

        DEFAULT_FILE = "cache.dump";

    function writeCache(file, next) {
        file = file || DEFAULT_FILE;
        fs.writeFile(file, JSON.stringify(CACHE), function () {
            if (file === DEFAULT_FILE) {
                console.log("[CacheManager::writeCache] - EXPORT written, ", CACHE.length, "urls indexed sofar");
            }
            if (next) {
                next();
            }
        });
    }

    function loadCache(next) {
        fs.readFile("cache.dump", function (err, content) {
            if (content) {
                CACHE = JSON.parse(content);
                CURRENT_EXPORT = CACHE.length;
                LAST_EXPORT = CURRENT_EXPORT;
                CURRENT_BACKUP = CURRENT_EXPORT;
                LAST_BACKUP = CURRENT_EXPORT;
                console.log("[CacheManager::loadCache] - CACHE loaded...", CACHE.length, "urls");
            }
            next();
        });
    }

    function get(url) {
        return CACHE[url];
    }

    function set(url, data) {
        if (CACHE[url] === undefined) {
            CACHE.length += 1;
        }
        CURRENT_EXPORT += 1;
        CURRENT_BACKUP += 1;
        CACHE[url] = data;
        if (CURRENT_EXPORT > LAST_EXPORT + EXPORT_TRESHOLD) {
            LAST_EXPORT = CURRENT_EXPORT;
            writeCache("", function () {
                if (CURRENT_BACKUP > LAST_BACKUP + BACKUP_TRESHOLD) {
                    LAST_BACKUP = CURRENT_BACKUP;
                    writeCache("cache.dump.bak", function () {
                        console.log("[CacheManager::writeCache] - BACKUP written, ", CACHE.length, "urls indexed sofar");
                    });
                }
            });
        }
    }

    return {
        "set": set,
        "get": get,
        "loadCache": loadCache,
        "writeCache": writeCache
    };
}());