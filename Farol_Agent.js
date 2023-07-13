import { PriorityQueue } from "./PriorityQueue.js";
import { get, getValueById, setValueById, checkIfDefaultValue, getFlag, hasSubmittedValues } from "./manageFormValues.js";
import { hideElement } from "./hideScreenElements.js";
import { addValue, showSummary } from "./Summary_Util.js";

/*
    ==================
    Player Interaction
    ==================
*/
var strategies_count = get("strategies_count");
var memory_size = get("memory_size");
var days = get("days");

var has_player_agent_elem = document.getElementById("has_player_agent");

var has_player_agent = getFlag("has_player_agent");

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
const CLOSE_CALL_EPSILON = 5;

const TOTAL_DAYS = checkIfDefaultValue(days, 3);
const STRATEGIES_COUNT = checkIfDefaultValue(strategies_count, 3);
const MEMORY_SIZE = checkIfDefaultValue(memory_size, 3);
const AGENTS_NR = 100;

setValueById("strategies_count", STRATEGIES_COUNT);
setValueById("memory_size", MEMORY_SIZE);
setValueById("days", TOTAL_DAYS);


const X_SCALE = 2;
const Y_LOWERBOUND = 420;
const MAX_PREDICTION = AMOUNT_OF_PEOPLE;
const MIN_PREDICTION = 0;
const CanvasLowerBoundProportion = Y_LOWERBOUND / 500;

const STRATEGY_UTIL_BOOST = 1;
var attendance_history = new Array(AMOUNT_OF_PEOPLE);
attendance_history.fill(0);
var agents = new Array(AMOUNT_OF_PEOPLE);
var ranking = new Array(AMOUNT_OF_PEOPLE);

var countGoodDays = 0;
var countBadDays = 0;
var attendees_map_per_day = []; // per day?
var rows = 2; // bar: 0, home: 1
var atBar = [];
var atHome = [];
var columns = TOTAL_DAYS;
// creating two-dimensional array
for (let i = 0; i < rows; i++) {
    attendees_map_per_day[i] = [];
    for (let j = 0; j < columns; j++) {
        attendees_map_per_day[i][j] = 0;
    }
}

var color_map_length = TOTAL_DAYS > 10 ? TOTAL_DAYS : 10;
var color_map = setupColorMap();
var name_map = setupNames();

function setupColorMap() {
    let colorMap = new Array(color_map_length);

    for(let i = 0; i < color_map_length;) {
        if(i<10){
            colorMap[i] = `rgb(${100-20*Math.floor(i/3)}%, 0%, 0%)`;
            colorMap[i+1] = `rgb(0%, ${100-20*Math.floor(i/3)}%, 0%)`;
            colorMap[i+2] = `rgb(0%, 0%, ${100-20*Math.floor(i/3)}%)`;
        } else {
            colorMap[i] = `rgb(100%, ${(i*i)%100}%, ${(10*i)%100}%)`;
            colorMap[i+1] = `rgb(${(10*i)%100}%, 100%, ${(i*i)%100}%)`;
            colorMap[i+2] = `rgb(${(i*i)%100}%, ${(10*i)%100}%, 100%)`;
        }
        i = i + 3;
    }

    return colorMap;
}

function setupNames() {
    let nameMap = new Array(AGENTS_NR);
    nameMap.fill("Rando");
    if(has_player_agent){
        nameMap[0] = "You";
    }

    return nameMap;
}

class Farol_Agent {
    id;
    memory_size;
    strategies_set;
    // weights_list;
    first_strategy;
    is_attending; // boolean 
    prediction_history;
    error_history;
    score;  // score how accurate the predictions are
    is_person; // to distinguish between computer and person agents (for predictions)

    constructor(id, strategies_nr, memory_size) {
        this.id = id;
        this.memory_size = memory_size;
        // this.weight_list = weights_list;
        this.first_strategy = Math.floor(AMOUNT_OF_PEOPLE * Math.random());
        this.set_random_strategies(strategies_nr);
        this.prediction_history = new Array(TOTAL_DAYS);
        this.score = 0;
    }

    predict_attendance(day_nr, attendance_history) {
        let bestStrategy = this.strategies_set.peek();
        let prediction = bestStrategy.weighting_attendances_func(day_nr, bestStrategy.weights_list, attendance_history);
        if (this.is_person) {
            prediction = player_prediction;
        }
        return prediction;
    }

    set_is_person_flag(bool) {
        this.is_person = bool;
    }

    generate_random_strategy() {
        return new Farol_Strategy(this.memory_size, this.first_strategy);
    }

    set_random_strategies(nr) {
        // add random strategies to the list of strategies
        this.strategies_set = new PriorityQueue();
        for (let i = 0; i < nr; i++) {
            this.strategies_set.add(this.generate_random_strategy());
        }
    }

    rank_strategies(day_nr, attendance_history) {
        // set value of all strategies based on current and last days of memory-size
        // console.log("strategies: " + this.strategies_set.getHeap().length);
        this.strategies_set.getHeap().forEach(element => {
            // console.log(element);
            // let value = element.getValue();
            // console.log("element: " + element + " value: " + value);
            let value = 0;
            value += element.determine_error(day_nr, this.memory_size, attendance_history);
            // console.log("added value: " + value);
            element.setValue(value);
        });

        this.strategies_set.heapifyUp();
    }

    sort_strategies() {
        // sort strategies based on significance value
    }

    decide_attending(day_nr, attendance_history) {
        let prediction = this.predict_attendance(day_nr, attendance_history);
        // console.log("--- predict" + this.id + " [" + day_nr + "]: " + prediction);
        this.is_attending = prediction <= OVERCROWDING_THRESHOLD;
        // attendees per day?
        // attendees_map[this.id] = this.is_attending;
        this.prediction_history[day_nr] = prediction;
        manageAttendees(day_nr, this);
    }

    add_score(day_nr) {
        if (this.is_attending) {
            this.score = isOvercrowded(day_nr) ? this.score - 1 : this.score + 1;
        }
        // TODO: add more score if prediction is close to actual attendance?
        let error = this.get_error_value(day_nr, attendance_history);
        let addValue = error <= 1 ? (error == 0 ? 1.25 : 1.5) : error;
        this.score += 1/2 * 1/addValue;
    }

    get_error_value(day_nr) {
        return differenceToAttendance(this.get_prediction(day_nr), attendance_history[day_nr]);
    }

    get_prediction(day_nr) {
        return this.prediction_history[day_nr];
    }

    getValue() {
        return this.score;
    }
}

class Farol_Strategy {
    weights_list;
    weighting_attendances_func;
    error_value;

    constructor(memory_size, first_strategy) {
        // console.log("const")
        this.weights_list = new Array(memory_size);
        this.weighting_attendances_func = this.generate_func(memory_size, first_strategy);
        this.error_value = 0;
    }

    generate_func(memory_size, first_strategy) {
        for (let i = 0; i < memory_size; i++) {
            this.weights_list[i] = generateRandomWeight();
        }
        return (day_nr, weights_list, attendance_history) => {
            let prediction = 0;
            let length = day_nr < memory_size ? day_nr : memory_size;
            for (let i = 0; i < length; i++) {
                // current attendance should be skipped
                let attendance = attendance_history[day_nr - (i + 1)];
                attendance = (attendance && attendance > 0) ? attendance : 0;
                prediction += (attendance * weights_list[i]);
                // console.log("i -> " + (-1 * (i + 1)) + " -> " + prediction);
            }
            prediction = Math.round(prediction + first_strategy);
            prediction = considerPredictionBoundaries(prediction);
            // console.log("first:" + first_strategy);
            // console.log("pred:" + prediction);
            return prediction;
        }
    }

    determine_error(day_nr, memory_size, attendance_history) {
        let error = 0;
        let length = day_nr < memory_size ? day_nr + 1 : memory_size + 1;
        for (let i = 0; i < length; i++) {
            error += differenceToAttendance(this.weighting_attendances_func(day_nr - i, this.weights_list, attendance_history), attendance_history[day_nr - i]);
            // console.log("err:" + error);
        }
        return error;
    }

    getValue() {
        return this.error_value;
    }

    setValue(value) {
        this.error_value = value;
    }
}

function generateRandomWeight() {
    return 1 - (Math.random() * 2);
}

function isOvercrowded(day_nr) {
    return attendance_history[day_nr] > OVERCROWDING_THRESHOLD;
}

function isClose(prediction, attendance) {
    return (prediction == (attendance + CLOSE_CALL_EPSILON) || prediction == (attendance - CLOSE_CALL_EPSILON));
}

function differenceToAttendance(prediction, attendance) {
    return Math.abs(prediction - attendance);
}

// for(let i = 0; i<100; i++){
//     console.log(generateRandomWeight())
// }
var canvas = document.getElementById("attendance_graph");
var ctx = canvas.getContext("2d");

var days_summary_attendances = document.getElementById("days_summary_attendances");

var days_summary_graph = document.getElementById("days_summary_graph");
var days_summary_graph_size = 150;
var days_summary_graph_lowerbound = days_summary_graph_size * CanvasLowerBoundProportion;
var days_summary_graph_canvas;
var barContext;

var days_list = document.getElementById("days_list");
var hasRanking = true;

let rankingHeading = document.getElementById("ranking_heading");
let rankingTab = document.getElementById("results");
rankingHeading.addEventListener("click", () => {hideElement(rankingTab, hasRanking); hasRanking = !hasRanking;});

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
    current_day = 0;
    setupPredefinedCanvas(canvas);
    // // graph line
    // drawLine(0, Y_LOWERBOUND, 100, 0, "#000000");

    // // capacity line
    // drawLine(60, Y_LOWERBOUND, 0, -Y_LOWERBOUND, "#000000");

    days_summary_graph_canvas = setupCanvas(0, days_summary_graph_lowerbound - OVERCROWDING_THRESHOLD, 300, 0, true, days_summary_graph, days_summary_graph_size*2, days_summary_graph_size, days_summary_graph_size*2);

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
            } else {
                alert("No value!");
            }
        });
    } else {
        for (current_day; current_day < TOTAL_DAYS; current_day++) {
            simulateDay(current_day);
            drawSummaryGraph(current_day);
        }
    }
}

function simulatePlayerPrediction() {
    let predText = player_predictions.value;
    player_prediction = getValueById("prediction");
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
    atBar = [];
    atHome = [];
    let multiCanvasContext = setupCanvas();
    barContext = setupCanvas(OVERCROWDING_THRESHOLD, 0, 0, -OVERCROWDING_THRESHOLD, false, null, 230, 200, 110);
    // console.log("-- predict: " + testAgent.predict_attendance(i, attendance_history));
    for (let j = 0; j < AGENTS_NR; j++) {
        agents[j].decide_attending(i, attendance_history);
    }

    // console.log("-- ah" + i + ": " + attendance_history[i]);
    attendance_history[i] += generateRandomAttendance(AGENTS_NR);
    // console.log("--- ah" + i + ": " + attendance_history[i]);

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
    
    drawBar(barContext);
    drawMultiCanvasDay(multiCanvasContext, i);
}

// console.log(testAgent.predict_attendance(1, attendance_history) == testAgent.predict_attendance(1, attendance_history));

function manageAttendees(day_nr, attendee) {
    if (attendee.is_attending) {
        // showAttendee(day_nr, attendee);
        attendance_history[day_nr]++;
        atBar.push(attendee);
    } else {
        atHome.push(attendee);
    }
    // attendees_map[attendee.id] = attendee.is_attending;
    showAttendee(day_nr, attendee);
}

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

function showOvercrowded(day_nr) {
    setText(4 * canvas.width / 6, canvas.height / 6 + day_nr * 20, day_nr + ": OVERCROWDED", "#FF0000");
    setText(5, 200 * CanvasLowerBoundProportion - 30,"OVERCROWDED", "#FF0000", barContext, "0.8em");
}

function showDayColor(day_nr) {
    setText(canvas.width / 2, canvas.height / 6 + day_nr * 20, "day" + day_nr, color_map[day_nr]);
}

// predictions of all days
function showAttendee(day_nr, attendee) {
    let id = attendee.id;
    let prediction = attendee.predict_attendance(day_nr, attendance_history);
    prediction = prediction < 0 ? 1 : prediction;
    // drawPoint(day_nr * 6, id * (-4) + (100 - 5));
    drawPoint(prediction * X_SCALE, id * (-4) + (Y_LOWERBOUND - 5), color_map[day_nr]);
}

function considerPredictionBoundaries(prediction) {
    if (prediction > MAX_PREDICTION) {
        prediction = MAX_PREDICTION;
    } else if (prediction < MIN_PREDICTION) {
        prediction = MIN_PREDICTION;
    }
    return prediction;
}

function addDay(day_nr, attendance, color) {
    var elem = document.createElement("short");
    elem.style.backgroundColor = color;
    elem.append("day" + day_nr + ": " + attendance);
    elem.style.color = "#FFFFFF";
    elem.style.padding = "1em";
    days_summary_attendances.append(elem);
}

function setupPredefinedCanvas(predefinedCanvas) {
    return setupCanvas(OVERCROWDING_THRESHOLD, Y_LOWERBOUND, 0, -Y_LOWERBOUND, true, predefinedCanvas, 500, 500);
}

function setupCanvas(x = OVERCROWDING_THRESHOLD, y = Y_LOWERBOUND, dX = 0, dY = -Y_LOWERBOUND, hasCapacity = true, predefinedCanvas = null, width = 200, height = 500, lineLength = 100) {
    var canvas = predefinedCanvas == null ? document.createElement("canvas") : predefinedCanvas;
    canvas.width = width;
    canvas.height = height;

    let lowerBound = height * CanvasLowerBoundProportion;

    var canvasContext = canvas.getContext("2d");
    // graph line
    drawLine(0, lowerBound, lineLength, 0, "#000000", canvasContext);

    // capacity line
    if (hasCapacity) {
        drawLine(x, y, dX, dY, "#000000", canvasContext);
    }

    // console.log("predCanv: " + predefinedCanvas);
    if (!predefinedCanvas) {
        days_list.append(canvas);
    }
    return canvasContext;
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

// predictions of all days
function drawPredictionDay(day_nr) {
    addDay(day_nr, attendance_history[day_nr], color_map[day_nr]);
    drawLine(attendance_history[day_nr], Y_LOWERBOUND, 0, -Y_LOWERBOUND, color_map[day_nr]);
}

function drawSummaryGraph(i) {
    // attendance over time
    if (i == 0) {
        drawLine(0, days_summary_graph_lowerbound, 5, -attendance_history[0], "#FF0000", days_summary_graph_canvas);
    }
    drawPoint((i + 1) * X_SCALE * 5 - 2, days_summary_graph_lowerbound - attendance_history[i] - 2, "#000000", days_summary_graph_canvas);
    // draw prior line to the point
    i = i - 1;
    drawLine((i + 1) * 5, days_summary_graph_lowerbound - attendance_history[i], 5, attendance_history[i] - attendance_history[i + 1], "#FF0000", days_summary_graph_canvas);
}

function getAgentColor(agent) {
    let color = (agent.is_person == true) ? "#FF0000" : "#000000";
    return color;
}

function drawMultiCanvasDay(context, day_nr) {
    let atBarValue = 0;
    let agent_color;

    for (let i = 0; i < atBar.length; i++) {
        agent_color = getAgentColor(atBar[i]);
        drawLine(0, i * (-4) + (Y_LOWERBOUND - 5), atBar[i].prediction_history[day_nr], 0, agent_color, context);
        atBarValue = i;

        drawBarDay(barContext, i, day_nr, atBar[i].score, 0, atBar[i]);
    }

    // atHome above atBar
    for (let j = 0; j < atHome.length; j++) {
        agent_color = getAgentColor(atHome[j]);
        drawLine(0, (atBarValue + 2 + j) * (-4) + (Y_LOWERBOUND - 5), atHome[j].prediction_history[day_nr], 0, agent_color, context);

        drawBarDay(barContext, j, day_nr, atHome[j].score, 110, atHome[j]);
    }

    // horizontal capacity line
    drawLine(0, OVERCROWDING_THRESHOLD * (-4) + (Y_LOWERBOUND - 5), 100, 0, "#BB2222", context);

    // vertical line - to show actual attendance and attendees
    drawLine(attendance_history[day_nr], (atBarValue + 1) * (-4) + (Y_LOWERBOUND - 5), 0, (atBarValue + 1) * (4) + 5, color_map[day_nr], context);
    // horizontal line - to show actual attendance and attendees
    drawLine(0, (atBarValue + 1) * (-4) + (Y_LOWERBOUND - 5), attendance_history[day_nr], 0, color_map[day_nr], context);
}

function drawBar(context) {
    let wallHeight = -(OVERCROWDING_THRESHOLD + 11);
    let groundHeight = 200 * CanvasLowerBoundProportion;
    let barWidth = 54;
    drawLine(1, groundHeight, 0, wallHeight, "#000000", context);
    drawLine(barWidth + 1, groundHeight, 0, wallHeight, "#000000", context);
    drawLine(1, groundHeight + wallHeight, barWidth, 0, "#000000", context);
}

function drawBarDay(context, attendent_nr, day_nr, score, home_x_shift = 0, agent = null) {
    let barLineSize = 10;
    let groundHeight = 200 * CanvasLowerBoundProportion;
    let opacity = Math.floor(score) / (day_nr + 1) * 100;
    if (opacity <= 5) {
        opacity = 5;
    } else if (opacity >= 100) {
        opacity = 100;
    }
    drawPoint(home_x_shift + 8 + X_SCALE * 5 * (attendent_nr % (barLineSize)), groundHeight - 9 - 12 * Math.floor(attendent_nr / (barLineSize)), `rgba(0,0,0,${opacity}%)`, context, 6);

    if (agent.is_person) {
        drawPoint(home_x_shift + 8 + 1 + X_SCALE * 5 * (attendent_nr % (barLineSize)), groundHeight - 9 - 12 * Math.floor(attendent_nr / (barLineSize)) - 3, `rgba(0,0,0,${opacity}%)`, context, 4);
    }
}

function drawPoint(x, y, color, context = ctx, size = 4) {
    context.fillStyle = color;
    context.fillRect(x, y, size, size); // fill in the pixel at (10,10)
}

function drawLine(x, y, dX, dY, color, context = ctx) {
    context.beginPath();
    context.moveTo(x * X_SCALE, y);
    context.lineTo((x + dX) * X_SCALE, y + dY);
    context.strokeStyle = color;
    context.stroke();
}

function setText(x, y, content, color, context = ctx, fontSize = "1em") {
    context.font = `${fontSize} Arial`;
    context.fillStyle = color;
    context.fillText(content, x, y);
    // ctx.fillText(content, x, y);
    // ctx.strokeText(content, x, y);
}

function rankAgents() {
    ranking.sort(function (x,y) {
        let a = x.getValue();
        let b = y.getValue();
        return b-a;
    })
}

function showRanking() {
    // ranking.heapifyDown();
    // ranking.print();
    rankAgents();
    let rankingList = ranking;
    var row = document.createElement("tr");
    addValue("th", null, "Day " + current_day, row);
    addValue("th", "", "", row);
    addValue("th", "", "", row);
    addValue("th", "", "", row);
    addValue("th", "", "", row);
    document.getElementById("results").append(row);

    for(let i=1; i<=3; i++){
        let agent = rankingList[i-1];
        var row = document.createElement("tr");
        addValue("td", "ranking_value", "# " + i, row);
        addValue("td", "id_value", agent.id, row);
        let agentNameWeight = agent.id == 1 ? "th" : "td";
        addValue(agentNameWeight, "name_value", name_map[agent.id-1], row);
        addValue("td", "score_value", Math.round(agent.score*100)/100, row);
        // TODO:  check:
        //  - save last strategy used because of strategy ranking and score addition happen at the same time?
        //  - change score calculation?
        addValue("td", "error_value", "Prediction: " + agent.get_prediction(current_day) + "; Error:" + agent.get_error_value(current_day), row);
        document.getElementById("results").append(row);
    }

    // ranking.print();
}
