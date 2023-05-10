window.onload = init;

function init() {
    // document.getElementById("form").onsubmit = calcUtility;
    var days = get("days");
    var iterations = days > 0 ? days : 1;
    for (let i = 0; i < iterations; i++) {
        calcUtility();
    }
    console.log("Initialized!")
}

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

function getValueById(id){
    return document.getElementById(id).value;
}

function setValueById(id, value){
    document.getElementById(id).value = value;
}

function checkIfDefaultValue(elem, defaultValue){
    elem = elem ? elem : defaultValue;
}

function calcUtility() {
    console.log("Calculating!")
    
    var people_count = get("people_count");
    var capacity = get("capacity");
    var probability = get("probability");
    var home_util = get("home_util");
    var uncrowded_util = get("uncrowded_util");
    var crowded_util = get("crowded_util");

    checkIfDefaultValue(home_util, 0);
    checkIfDefaultValue(uncrowded_util, 1);
    checkIfDefaultValue(crowded_util,-1);

    setValueById("people_count", people_count);
    setValueById("capacity", capacity);
    setValueById("probability", probability);
    setValueById("days", get("days"));
    setValueById("home_util", home_util);
    setValueById("uncrowded_util", uncrowded_util);
    setValueById("crowded_util", crowded_util);

    var result = "";

    if (validate() == true) {
        var bar_filled = 0;
        probability = probability / 100;

        for (let i = 0; i < people_count; i++) {
            var rand = Math.random();
            // console.log(rand);
            if (rand < probability) {
                bar_filled++;
            }
        }

        if (bar_filled > capacity) {
            result = "" + calcUtilityValue(crowded_util);
        }
        else {
            result = "" + calcUtilityValue(uncrowded_util);
        }

        // var N = document.createElement("short")
        // N.setAttribute("class","N_value");
        // N.append(people_count);
        // document.getElementById("values").append(N);
        var row = document.createElement("tr");

        addValue("td", "N_value", people_count, row);
        addValue("td", "c_value", capacity, row);
        addValue("td", "p_value", probability, row);
        addValue("td", "bar_value", bar_filled, row);
        addValue("td", "util_value", result, row);

        document.getElementById("results").append(row);
    }
    else {
        document.getElementById("results").style.display = "none";
        alert("False Input!");
    }

    function validate() {
        if (people_count == "" || capacity == "" || probability == "") {
            return false;
        }
        if (probability < 0 || probability > 100) {
            return false;
        }
        if (capacity < 0) {
            return false;
        }
        if (people_count < 0) {
            return false;
        }
        return true;
    }

    function calcUtilityValue(case_util){
        return case_util * bar_filled + home_util * (people_count-bar_filled);
    }
}

function addValue(elementName, className, value, row) {
    var elem = document.createElement(elementName)
    elem.setAttribute("class", className);
    elem.append(value);
    row.append(elem);
}
