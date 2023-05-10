function getEntries() {
    var getText = window.location.search.substring(1);
    const urlParams = new URLSearchParams(getText);

    const entries = urlParams.entries();
    return entries;
}

function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search)) {
        if (typeof name[1] == "undefined") {
            return "";
        }
        return decodeURIComponent(name[1]);
    }
    return "";
}

function getHintText(getHintFunc) {
    var hintText = "";
    var entries = getEntries();
    for (const entry of entries) {
        hintText += getHintFunc(entry);
    }
    return hintText;
}

export { getEntries, get, getHintText };