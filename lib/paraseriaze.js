

function serialize(array, func, options) {
    if (typeof array === "number") {
        array = new Array(array);
    }

    var i = 0,
        total = array.length,
        end = options.end || options.step,
        step = end !== options.step ? options.step : undefined,
        defaultValue = options.defaultValue !== undefined ?
            options.defaultValue : "",
        results = [];

    function serializor() {
        function next(data) {
            results[i] = data !== undefined ? data : defaultValue;
            i += 1;
            serializor();
        }

        if (i >= total) {
            end(results);
            return;
        }

        var el = array[i];

        func(el, function (data) {
            if (step) {
                step(data, next, i, results);
            } else {
                next(data);
            }
        });

    }
    serializor();
}

function parallelize(array, func, options) {
    var i = 0,
        total = array.length,
        end = options.end || options.step,
        step = end !== options.step ? options.step : undefined,
        defaultValue = options.defaultValue !== undefined ?
            options.defaultValue : "",
        results = [];

    array.forEach(function (el, i) {
        func(el, function parallelizeNext(response) {
            function next(data) {
                results[i] = data !== undefined ? data : defaultValue;
            }

            if (step) {
                step(response, next, el, i);
            } else {
                next(response);
            }

            var length = results.reduce(function (count) {
                count += 1;
                return count;
            }, 0);

            if (length >= total) {
                end(results);
            }
        });
    });
}

if (exports) {
    exports.parallelize = parallelize;
    exports.serialize = serialize;
}