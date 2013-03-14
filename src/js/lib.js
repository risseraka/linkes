/* library */
function $(id) {
    return document.getElementById(id);
}

Function.prototype.bindArg = function () {
    var args = arguments,
        that = this;
    return function () {
        that.apply(this, args);
    };
};
HTMLElement.prototype.addEvent = function (event, callback, bubble) {
    this.addEventListener(
        event,
        function (event) {
            try {
                callback.apply(this, arguments);
            } catch (e) {
                console.log(e);
            }
            event.preventDefault();
            return false;
        },
        bubble);
};
HTMLElement.prototype.removeEvent = HTMLElement.prototype.removeEventListener;
HTMLElement.prototype.addClickEvent = function addClickEvent(func) {
    this.addEvent("click", func, false);
};
HTMLElement.prototype.removeAll = function removeAll() {
    if (this.hasChildNodes()) {
        while (this.childNodes.length > 0) {
            this.removeChild(this.firstChild);
        }
    }
};
HTMLElement.prototype.append = function append(child) {
    this.appendChild(child);
    return this;
};
HTMLElement.prototype.toggle = function toggle() {
    this.style.visibility = (this.style.visibility === "hidden") ? "visible" : "hidden";
};
HTMLElement.prototype.draw = function draw(draw) {
    this.style.visibility = (draw === true) ? "visible" : "hidden";
};
HTMLElement.prototype.hide = function hide() {
    this.draw(false);
};
HTMLElement.prototype.show = function show() {
    this.draw(true);
};
HTMLElement.prototype.display = function display(show) {
    this.style.display = (show === true) ? "block" : "none";
};
if (Array.prototype.forEach === undefined) {
    Array.prototype.forEach = function (func) {
        var key, ret;
        for (key in this) {
            if (this.hasOwnProperty(key)) {
                ret = func(this[key], key);
                if (ret) {
                    return ret;
                }
            }
        }
    };
}
Array.prototype.search = function (key, value) {
    return this.reduce(function (result, el) {
        if (result) return result;
        if (key) {
            if (typeof key === "function") {
                if (key(el) === value) {
                    return el;
                }
            } else {
                if (el[key] === value) {
                    return el;
                }
            }
        } else if (el === value) {
            return el;
        }
    }, undefined);
};
/* library */