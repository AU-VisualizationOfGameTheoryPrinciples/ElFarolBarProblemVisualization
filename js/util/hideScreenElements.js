var helpInfo = document.getElementById('help');
var isInfoHidden;
if(helpInfo){
    helpInfo.addEventListener("click", () => hideInfo(true));
    isInfoHidden = getFlag(localStorage['isInfoHidden']);
    hideInfo(false);
}

function getFlag(flag) {
    if(flag === 'true') {
        return true;
    } else {
        return false;
    }
}

function hideInfo(doesToggling) {
    if(doesToggling){
        isInfoHidden = !isInfoHidden;
        localStorage['isInfoHidden'] = isInfoHidden + "";
    }
    let infoElem = document.getElementById('intro');
    hideElement(infoElem, isInfoHidden);
}

function hideElement(element, flag) {
    if(flag){
        element.style.display = "none";
    } else {
        element.style.display = "inherit";
    }
}

export {hideElement};