document.getElementById('help').addEventListener("click", () => hideInfo(true));
var isInfoHidden;
window.onload = () => {
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

    if(isInfoHidden){
        document.getElementById('intro').style.display = "none";
    } else {
        document.getElementById('intro').style.display = "inherit";
    }
}