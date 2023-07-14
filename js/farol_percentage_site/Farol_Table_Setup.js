import { addValue, showSummary } from "../util/Summary_Util.js";
import {get, getValueById, setValueById, checkIfDefaultValue} from "../util/manageFormValues.js"

window.onload = init;

var formerUtility;
var iterations;
var countGoodDays = 0;
var countBadDays = 0;
var current_day = 0;

function init() {
    
    // Initial start
    if(window.location.search.substring(0,1) == ""){
        document.getElementById("results").style.display = "none";
        return;
    }
    
    var days = get("days");
    iterations = days > 0 ? days : 1;
    for (current_day; current_day < iterations; current_day++) {
        formerUtility = calcUtility();
        if(formerUtility>0){
            countGoodDays++;
        } else if (formerUtility<0){
            countBadDays++;
        }
    }

    showSummary("days_summary", countGoodDays, countBadDays, iterations);

    console.log("Initialized!")
}

function adaptProbability(prob){
    if(formerUtility == undefined || formerUtility > 0){
        return prob;
    } else {
        return prob / 2;
    }
}

function calcUtility() {
    console.log("Calculating!")
    
    var people_count = get("people_count");
    var capacity = get("capacity");
    var probability = get("probability");
    var home_util = get("home_util");
    var uncrowded_util = get("uncrowded_util");
    var crowded_util = get("crowded_util");
    var adapts = get("adapts");

    home_util = checkIfDefaultValue(home_util, 0);
    uncrowded_util = checkIfDefaultValue(uncrowded_util, 1);
    crowded_util = checkIfDefaultValue(crowded_util,-1);

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

        if(adapts == "true"){
            probability = adaptProbability(probability);
            document.querySelector("#adapts").checked = true;
        }

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

        addValue("td", "day_value", current_day+1, row);
        // addValue("td", "N_value", people_count, row);
        // addValue("td", "c_value", capacity, row);
        addValue("td", "p_value", (probability*100) + "%", row);
        addValue("td", "bar_value", bar_filled, row);
        var util = addValue("td", "util_value", result, row);

        if(result<0){
            util.setAttribute("class", "bad_util");
        }

        document.getElementById("results").append(row);

        return result;
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
