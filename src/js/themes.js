/*global document, HTMLElement, Function, Array, console, window*/
(function () {
    "use strict";

    var _ = domizer({}),

        themes = [],

        viewer = $("viewer"),

        themesUl = $("themesUl"),
        themeInput = $("themeInput"),
        themeForm = $("themeForm"),

        navDiv = $("navDiv"),
        currentThemeSpan = $("currentThemeSpan"),

        linksDiv = $("linksDiv"),
        linksUl = $("linksUl"),

        linkForm = $("linkForm"),
        linkCancelButton = $("linkCancelButton"),
        linkUrlDiv = $("linkUrlDiv"),
        linkUrlInput = $("linkUrlInput"),
        linkNameDiv = $("linkNameDiv"),
        linkNameInput = $("linkNameInput"),

        dumpArea = $("dumpArea"),
        dumpButton = $("dumpButton"),

        backButton = {};

    function goBackOneLevel() {
        if (backButton.currentTheme) {
            backButton.currentTheme = undefined;
            linksDiv.hide();
            navDiv.hide();
        }
    }

    function initLinkForm() {
        linkForm.removeEvent("submit", addLink, false);
        linkForm.addEvent("submit", askForLinkName, false);
        linkNameInput.value = "";
        linkUrlInput.value = "";
        linkNameDiv.display(false);
        linkUrlDiv.display(true);
        linkUrlInput.focus();
    }

    function playLink(link) {
        viewer.src = "proxy?" + link.url;
    }

    function buildLink(link) {
        var linkEl = _.linkTo(link.url, {"target": "_blank"}, link.name).dom();

        linkEl.addClickEvent(playLink.bindArg(link), false);
        return _.li(linkEl);
    }

    function addLink(event) {
        var url = linkUrlInput.value,
            name = linkNameInput.value,
            link;

        if (name) {
            if (!deepSearch(backButton.currentTheme.links, "url", url)) {
                link = {
                    "url": url,
                    "name": name
                };
                linksUl.append(buildLink(link).dom());
                backButton.currentTheme.links.push(link);
            }
            initLinkForm();
        }
    }

    function askForLinkName() {
        if (linkUrlInput.value) {
            linkForm.removeEvent("submit", askForLinkName, false);
            linkForm.addEvent("submit", addLink, false);
            linkUrlDiv.display(false);
            linkNameDiv.display(true);
            linkNameInput.focus();
        }
    }

    function loadLinks(theme) {
        var linksContainer = document.createDocumentFragment();

        linksUl.removeAll();
        theme.links.reduce(
            function (container, link) {
                container.appendChild(buildLink(link).dom());
                return container;
            },
            linksContainer
        );
        linksUl.append(linksContainer);

        currentThemeSpan.innerHTML = theme.name;
        backButton.currentTheme = theme;
        navDiv.show();
        initLinkForm();
        linksDiv.show();
    }

    function buildTheme(theme) {
        var themeLink;

        themeLink = _.linkTo("javascript:void(0)", theme.name).dom();
        themeLink.addClickEvent(loadLinks.bindArg(theme), false);
        themesUl.appendChild(_.li(themeLink).dom());
        themes.push(theme);
        return theme;
    }

    function addTheme(event) {
        var name = themeInput.value,
            theme,
            result;

        if (name) {
            result = deepFind(themes, "name", name);
            if (result.length === 0) {
                theme = buildTheme({
                    "name": name,
                    "links": []
                });
            } else {
                theme = result.shift();
            }
            themeInput.value = "";
            loadLinks(theme);
        }
    }

    function loadThemes(data) {
        data.forEach(buildTheme);
        navDiv.addClickEvent(goBackOneLevel, false);
    }

    function dumpthemes() {
        var json = JSON.stringify(themes);

        dumpArea.innerHTML = json;
        console.log(json);
    }

    (function main() {
        window.loadThemes = loadThemes;
        window.dumpthemes = dumpthemes;

        var loadScript = _.javascript("themes.json").dom();
        document.body.appendChild(loadScript);

        themeForm.addEvent("submit", addTheme, false);
        dumpButton.addClickEvent(dumpthemes, false);
        linkCancelButton.addClickEvent(initLinkForm, false);
    }());
}());