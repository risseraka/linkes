var http = require("http"),
    fs = require("fs"),
    parseURL = require("url").parse,

    CacheManager = require("./cachemanager").CacheManager;

exports.URLManager = (function URLManager() {
    var queue = {
            "length": 0
        },
        waiting = {},
        waitingIndex = [];

    function finishRequest(data, response, requestObject) {
        data = (response.statusCode !== 200 ? "" : data);

        var url = requestObject.url,
            next = requestObject.next,
            cache = requestObject.cache,
            responseObject = {
                "data": data,
                "headers": response.headers,
                "statusCode": response.statusCode
            };

        if (cache) {
            CacheManager.set(url, responseObject);
        }

        console.log("[URLManager::finishRequest] - finished:", requestObject.url);
        requestObject.next.forEach(function (func) {
            func(responseObject);
        });
        delete queue[url];
        queue.length -= 1;
        if (waitingIndex.length > 0) {
            var newRequest = waiting[waitingIndex.shift()],
                url = newRequest.url;

            console.log("[URLManager::finishRequest] - waiting removed:", url);
            newRequest.next.forEach(function (func) {
                requestURL(url, func);
            });
        } else {
            console.log("[URLManager::finishRequest] - queue length:", queue.length, ",",
                        "waiting length:", waitingIndex.length);
        }
    }

    function handleData(response, requestObject) {
        var data = "",
            url = requestObject.url;

        response.setEncoding("utf8");
        response.on("data", function (chunk) {
            data += chunk;
        });
        response.on("end", function () {
            finishRequest(data, response, requestObject);
        });
    }

    function queueRequest(requestObject) {
        var url = requestObject.url;

        if (queue[url]) {
            queue[url].next = queue[url].next.concat(requestObject.next);
            console.log("[URLManager::doRequest] - already queued, added next:", url);
            return;
        }
        console.log("[URLManager::doRequest] - queue added:", url);

        queue[url] = requestObject;
        queue.length += 1;

        var parsed = parseURL(url),
            client,
            request;

        request = http.get({
            host: parsed.host,
            path: parsed.path,
            headers: {
              'User-Agent': "Mozilla/5.0"
            }
          }, function (response) {
            handleData(response, requestObject);
        });
        request.on('error', function(err) {
          console.log('[URLManager::dorequest] - Caught error:', err);
        });
    }

    function doRequest(url, next, cache) {
        var requestObject = {
            "url": url,
            "next": [next],
            "cache": cache
        };

        if (queue.length < 200) {
            queueRequest(requestObject);
        } else {
            if (waiting[url]) {
                waiting[url].next =
                    waiting[url].next.concat(requestObject.next);
                console.log("[URLManager::doRequest] - already waiting, added next:", url);
            } else {
                waiting[url] = requestObject;
                waitingIndex.unshift(url);
                console.log("[URLManager::doRequest] - waiting added:", url);
            }
        }
        console.log("[URLManager::doRequest] - queue length:", queue.length, ",",
            "waiting length:", waitingIndex.length);
    }

    function requestURL(url, next, noCache) {
        var result = !noCache ? CacheManager.get(url) : undefined;

        if (result === undefined || result.statusCode === 502) {
            if (result) {
                console.log("[URLManager::requestURL] - got statusCode:", result.statusCode, "from CACHE, re-requesting url:", url);
            }
            doRequest(url, function (response) {
                    return next(response);
                }, true);
        } else {
            console.log("[URLManager::requestURL] - read from cache:", url);
            next(result);
        }
    }

    return {
        "requestURL": requestURL
    };
}());