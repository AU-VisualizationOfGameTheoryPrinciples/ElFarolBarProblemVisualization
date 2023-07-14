import { get, getValueById, setValueById, hasSubmittedValues } from "../../util/manageFormValues.js";
import { hideElement } from "../../util/hideScreenElements.js";
import { showSummary } from "../../util/Summary_Util.js";
import { Farol_Agent, isOvercrowded } from "../model/Farol_Agent.js";
import { Farol_Variables } from "../model/Farol_Variables.js";
import { drawBar, drawMultiCanvasDay, drawPredictionDay, drawSummaryGraph, setupCanvas, setupDaysSummaryGraphCanvas, setupPredefinedCanvas, showDayColor, showOvercrowded, showRanking } from "../view/drawResults.js";

/*
    ==================
    Player Interaction
    ==================
*/
// var strategies_count = get("strategies_count");
var memory_size = get("memory_size");
// var days = get("days");

// var has_player_agent_elem = document.getElementById("has_player_agent");

var has_player_agent = Farol_Variables.has_player_agent;

var prediction_tab = document.getElementById("prediction_tab");

var player_prediction;
var player_predictions;
var player_errors;
var attendences_in_memory;
var current_iteration;
var prediction_button;

var current_day;

setValueById("has_player_agent", has_player_agent);

var doesToggling = true;
var isPredictionTabHidden = !has_player_agent;

// toggle by clicking button
// has_player_agent_elem.addEventListener("click", () => { doesToggling = true; hidePredictionTab(); });

function hidePredictionTab() {
    if (doesToggling) {
        isPredictionTabHidden = !isPredictionTabHidden;
    }

    hideElement(prediction_tab, isPredictionTabHidden);
}

doesToggling = false;
hidePredictionTab();
if (has_player_agent) {
    player_prediction = getValueById("prediction");
    player_predictions = document.getElementById("player_predictions");
    player_errors = document.getElementById("player_errors");
    attendences_in_memory = document.getElementById("mem_attendances");
    current_iteration = document.getElementById("day_nr");
    prediction_button = document.getElementById("prediction_button");
}

const AMOUNT_OF_PEOPLE = 100;
const OVERCROWDING_THRESHOLD = 60;

const TOTAL_DAYS = Farol_Variables.TOTAL_DAYS;
const STRATEGIES_COUNT = Farol_Variables.STRATEGIES_COUNT;
const MEMORY_SIZE = Farol_Variables.MEMORY_SIZE;
const AGENTS_NR = Farol_Variables.AGENTS_NR;

setValueById("strategies_count", STRATEGIES_COUNT);
setValueById("memory_size", MEMORY_SIZE);
setValueById("days", TOTAL_DAYS);

var attendance_history = Farol_Variables.attendance_history;
// var atHome = Farol_Variables.atHome;
// var atBar = Farol_Variables.atBar;

var agents = new Array(AMOUNT_OF_PEOPLE);
var ranking = Farol_Variables.ranking;

var countGoodDays = 0;
var countBadDays = 0;
var attendees_map_per_day = []; // per day?
var rows = 2; // bar: 0, home: 1
var columns = TOTAL_DAYS;
// creating two-dimensional array
for (let i = 0; i < rows; i++) {
    attendees_map_per_day[i] = [];
    for (let j = 0; j < columns; j++) {
        attendees_map_per_day[i][j] = 0;
    }
}

var attendance_graph_canvas = document.getElementById("attendance_graph");

var hasRanking = true;

let rankingHeading = document.getElementById("ranking_heading");
let rankingTab = document.getElementById("results");
rankingHeading.addEventListener("click", () => {hideElement(rankingTab, hasRanking); hasRanking = !hasRanking;});

var current_day;

/*
    ===============
    simulate days
    ===============
*/
if (hasSubmittedValues()) {
    // var testArray = [50, 30, 80];
    // attendance_history = testArray;
    // var testAgent = new Farol_Agent(1, 2, 4);
    // var testAgent2 = new Farol_Agent(2, 2, 4);
    // console.log(testAgent.first_strategy);
    // console.log("score:" + testAgent.score);
    setupAgents(STRATEGIES_COUNT, MEMORY_SIZE);
    simulateDays();
} else {
    hideElement(document.getElementById("graphs"), true);
}

function simulateDays() {
    Farol_Variables.current_day = 0;
    current_day = Farol_Variables.current_day;
    setupPredefinedCanvas(attendance_graph_canvas);
    // // graph line
    // drawLine(0, Y_LOWERBOUND, 100, 0, "#000000");

    // // capacity line
    // drawLine(60, Y_LOWERBOUND, 0, -Y_LOWERBOUND, "#000000");

    setupDaysSummaryGraphCanvas();

    if (has_player_agent) {
        current_iteration.textContent = current_day;
        player_predictions.value = "";
        player_errors.value = "";
        prediction_button.addEventListener("click", () => {
            if (getValueById("prediction")) {
                simulatePlayerPrediction();
                showAttendancesInMemory();
                drawSummaryGraph(current_day);
                // if (current_day >= TOTAL_DAYS) {
                // TODO: implement stop for Days under given max value?
                // }
                current_iteration.textContent = ++current_day;
                Farol_Variables.current_day = current_day;
            } else {
                alert("No value!");
            }
        });
    } else {
        for (current_day; current_day < TOTAL_DAYS; current_day++) {
            Farol_Variables.current_day = current_day;
            simulateDay(current_day);
            drawSummaryGraph(current_day);
        }
    }
}

function simulatePlayerPrediction() {
    let predText = player_predictions.value;
    player_prediction = getValueById("prediction");
    Farol_Variables.player_prediction = player_prediction;
    predText = current_day == 0 ? predText : predText + "; ";
    predText += player_prediction;
    player_predictions.value = predText;

    simulateDay(current_day);

    let errorText = agents[0].get_error_value(current_day);
    errorText = current_day == 0 ? errorText : "; " + errorText;
    player_errors.value += errorText;
}

function showAttendancesInMemory() {
    let length = current_day < memory_size ? current_day + 1 : memory_size;
    let attendancesText = "";
    for (let i = 0; i < length; i++) {
        let attendance = " " + -(i + 1) + ": " + attendance_history[current_day - i];
        // alert(attendance)
        attendancesText += attendance;
    }
    attendences_in_memory.value = attendancesText;
}

function simulateDay(i) {
    Farol_Variables.atBar = [];
    Farol_Variables.atHome = [];

    // NOTE: ensure that the array is the updated one (might be removable)
    attendance_history = Farol_Variables.attendance_history;

    let multiCanvasContext = setupCanvas();
    Farol_Variables.barContext = setupCanvas(OVERCROWDING_THRESHOLD, 0, 0, -OVERCROWDING_THRESHOLD, false, null, 230, 200, 110);
    // console.log("-- predict: " + testAgent.predict_attendance(i, attendance_history));
    for (let j = 0; j < AGENTS_NR; j++) {
        agents[j].decide_attending(i, attendance_history);
    }

    // console.log("-- ah" + i + ": " + attendance_history[i]);
    attendance_history[i] += generateRandomAttendance(AGENTS_NR);
    // console.log("--- ah" + i + ": " + attendance_history[i]);

    // NOTE: ensure that the array is the updated one (might be removable)
    Farol_Variables.attendance_history = attendance_history;

    drawPredictionDay(i);
    manageOvercrowded(i);
    showDayColor(i);
    showSummary("days_summary", countGoodDays, countBadDays, current_day+1, document.getElementById("days_summary_text"));
    
    // TODO: check if Priority Queue needs to be changed to a sort tree / list
    for (let k = 0; k < AGENTS_NR; k++) {
        agents[k].add_score(i);
        // console.log("score" + k + ": " + agents[k].score);
        agents[k].rank_strategies(i, attendance_history);
        console.log(k);
        agents[k].strategies_set.print();
    }
    showRanking();
    
    drawBar(Farol_Variables.barContext);
    drawMultiCanvasDay(multiCanvasContext, i);
}

// console.log(testAgent.predict_attendance(1, attendance_history) == testAgent.predict_attendance(1, attendance_history));

function generateRandomAttendance(agents_nr = 0) {
    return Math.floor(Math.random() * (AMOUNT_OF_PEOPLE - agents_nr));
}

function manageOvercrowded(day_nr) {
    if (isOvercrowded(day_nr)) {
        countBadDays++;
        showOvercrowded(day_nr);
        console.log("OVERCROWDED");
    } else {
        countGoodDays++;
    }
}

function setupAgents(strategies_nr, memory_size) {
    for (let i = 0; i < AGENTS_NR; i++) {
        agents[i] = new Farol_Agent(i + 1, strategies_nr, memory_size);
        agents[i].set_is_person_flag(false);
        // ranking.add(agents[i]);
        ranking.push(agents[i]);
    }
    if (has_player_agent) {
        agents[0].set_is_person_flag(true);
    }
}