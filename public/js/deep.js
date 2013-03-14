/*global is, rduce, count, shift*/

var is = (function () {
    function buildTypeFunc(type) {
        return function (obj) {
            return Object.prototype.toString.call(obj) === "[object " + type + "]";
        };
    }

    var that = {},
        types = ["Array", "RegExp", "Date", "Number", "String", "Object", "Function"],
        i,
        j;

    for (i = types.length - 1; i >= 0; i -= 1) {
        that[types[i]] = buildTypeFunc(types[i]);
    }
    return that;
}());

function feach(obj, func) {
    if (is.Array(obj)) {
        return obj.forEach(func);
    } else if (is.Object(obj)) {
        var key;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                func(obj[key], key, obj);
            }
        }
        return;
    }
    throw "Illegal forEach on non object nor array variable";
}

function map(obj, func) {
    if (is.Array(obj)) {
        return obj.map(func);
    } else if (is.Object(obj)) {
        var key, result = [];

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push(func(obj[key], key, obj));
            }
        }
        return result;
    }
    throw "Illegal map on non object nor array variable";
}

function rduce(obj, func, result) {
    if (is.Array(obj)) {
        return obj.reduce(func, result);
    } else if (is.Object(obj)) {
        var key;

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                result = func(result, obj[key], key, obj);
            }
        }
        return result;
    }
    throw "Illegal rduce on non object nor array variable";
}

function count(obj) {
    if (is.Array(obj) || is.Object(obj)) {
        return rduce(
            obj,
            function (total, el) {
                return total + 1;
            },
            0
        );
    }
    return 1;
}

function unshift(obj, value) {
    if (is.Array(obj)) {
        if (is.Array(obj[0]) || is.Object(obj[0])) {
            unshift(obj[0], value);
        } else {
            obj[0] = value;
        }
    } else if (is.Object(obj)) {
        rduce(obj,
            function (value, old, key, obj) {
                if (is.Array(old) || is.Object(old)) {
                    unshift(old, value);
                } else if (value !== undefined) {
                    obj[key] = value;
                }
            },
            value
        );
    } else {
        return value;
    }
    return obj;
}

function shift(obj) {
    if (is.Array(obj)) {
        return obj.shift();
    } else if (is.Object(obj)) {
        return rduce(obj,
            function (result, value, key, obj) {
                if (result === undefined) {
                    delete obj[key];
                    return value;
                }
                return result;
            }
        );
    }
    return obj;
}

function shiftKey(obj) {
    if (is.Array(obj)) {
        arr.shift();
        return 0;
    } else if (is.Object(obj)) {
        return rduce(obj,
            function (result, value, key, obj) {
                if (result === undefined) {
                    delete obj[key];
                    return key;
                }
                return result;
            }
        );
    }
    return obj;
}

function merge(obj1, obj2) {
    if (obj2 !== undefined) {
        feach(obj2,
            function forEachMerge(value, key) {
                obj1[key] = value;
            });
    }
    return obj1;
}

var deep = (function buildDeep() {
    function deepArray(obj, fields, up) {
        var result = fields.reduce(
            function (result, field) {
                var res;

                if (is.Array(obj) || is.Object(obj)) {
                    res = map(
                        obj,
                        function (el) {
                            return deep(el, field, up);
                        }
                    );
                } else {
                    res = deep(obj, field, up);
                }
                result.push(res);
                return result;
            },
            []
        );

        if (count(result) < 2) {
            return result.shift();
        }
        return result;
    }

    function deepObject(obj, fields, up) {
        var result = rduce(
            fields,
            function (result, value, field) {
                var temp = field !== "" ? obj[field] : obj,
                    res;

                if (is.String(value)) {
                    if (up) {
                        return obj;
                    }
                    result[value || field] = temp;
                } else {
                    res = deep(temp, value, up);
                    if (is.Object(field) && is.Object(res)) {
                        result = merge(result, res);
                    } else {//if (res !== undefined) {
                        result[field] = res;
                    }
                }
                return result;
            },
            {}
        );

        if (count(result) < 2) {
            return shift(result);
        }
        return result;
    }

    function deepFunction(obj, f) {
        return f(obj);
    }

    function deepString(obj, field, up) {
        if (field === "" || up === true) {
            return obj;
        }
        return obj[field];
    }

    return function deep(obj, fields, up) {
        if (obj !== undefined &&
                fields &&
                count(fields) > 0) {
            var func;

            if (is.String(fields)) {
                func = deepString;
            } else if (is.Function(fields)) {
                func = deepFunction;
            } else if (is.Object(fields)) {
                func = deepObject;
            } else if (is.Array(fields)) {
                func = deepArray;
            }
            return func(obj, fields, up);
        }
        return obj;
    };
}());

function deepSearch(arr, fields, value) {
    return arr.reduce(
        function (results, obj) {
            if (deep(obj, fields) === value) {
                return true;
            }
            return results;
        },
        false
    );
}

function deepFind(arr, fields, value) {
    return arr.reduce(
        function (results, obj) {
            var res = deep(obj, fields);
            if (res !== undefined && res === value) {
                results.push(obj);
            }
            return results
        },
        []
    );
}
