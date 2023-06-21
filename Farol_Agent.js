import { PriorityQueue } from "./PriorityQueue.js";
import { get, setValueById, checkIfDefaultValue, getFlag } from "./manageFormValues.js";

/*
    ==================
    Player Interaction
    ==================
*/
var strategies_count = get("strategies_count");
var memory_size = get("memory_size");
var days = get("days");

var has_player_agent = getFlag("has_player_agent");

// TODO: add hide/show toggle for predictions
var prediction_tab = document.getElementById("prediction_tab");
// prediction_tab.style.visibility = "hidden";
var player_prediction;
var player_predictions;
var attendences_in_memory;
var current_iteration;

setValueById("has_player_agent", has_player_agent);

if (has_player_agent) {
    // TODO: implement player interaction as one agent predicting per week
    // prediction_tab.style.visibility = "show";
    player_prediction = document.getElementById("prediction");
    player_predictions = document.getElementById("player_predictions");
    attendences_in_memory = document.getElementById("mem_attendances");
    current_iteration = document.getElementById("day_nr");
}

const AMOUNT_OF_PEOPLE = 100;
const OVERCROWDING_THRESHOLD = 60;
const CLOSE_CALL_EPSILON = 5;

const TOTAL_WEEKS = checkIfDefaultValue(days, 3);
const STRATEGIES_COUNT = checkIfDefaultValue(strategies_count, 3);
const MEMORY_SIZE = checkIfDefaultValue(memory_size, 3);
const AGENTS_NR = 100;

setValueById("strategies_count", STRATEGIES_COUNT);
setValueById("memory_size", MEMORY_SIZE);
setValueById("days", TOTAL_WEEKS);


const X_SCALE = 2;
const Y_LOWERBOUND = 420;
const MAX_PREDICTION = AMOUNT_OF_PEOPLE;
const MIN_PREDICTION = 0;
const CanvasLowerBoundProportion = Y_LOWERBOUND / 500;

const STRATEGY_UTIL_BOOST = 1;
var attendance_history = new Array(AMOUNT_OF_PEOPLE);
attendance_history.fill(0);
var current_week;
var agents = new Array(AMOUNT_OF_PEOPLE);

var attendees_map_per_week = []; // per week?
var rows = 2; // bar: 0, home: 1
var atBar = [];
var atHome = [];
var columns = TOTAL_WEEKS;
// creating two-dimensional array
for (let i = 0; i < rows; i++) {
    attendees_map_per_week[i] = [];
    for (let j = 0; j < columns; j++) {
        attendees_map_per_week[i][j] = 0;
    }
}

// TODO: setup color_map and web design for more than 5 iterations
var color_map = new Array(TOTAL_WEEKS);
color_map[0] = "#FF0000";
color_map[1] = "#00FF00";
color_map[2] = "#0000FF";
color_map[3] = "#AA0000";
color_map[4] = "#00AA00";
color_map[5] = "#0000AA";

var canvas = document.getElementById("attendance_graph");
var ctx = canvas.getContext("2d");

setupPredefinedCanvas(canvas);
// // graph line
// drawLine(0, Y_LOWERBOUND, 100, 0, "#000000");

// // capacity line
// drawLine(60, Y_LOWERBOUND, 0, -Y_LOWERBOUND, "#000000");

var days_list = document.getElementById("days_list");

class Farol_Agent {
    id;
    memory_size;
    strategies_set;
    // weights_list;
    first_strategy;
    is_attending; // boolean 
    prediction_history;
    score;  // score how accurate the predictions are

    constructor(id, strategies_nr, memory_size) {
        this.id = id;
        this.memory_size = memory_size;
        // this.weight_list = weights_list;
        this.first_strategy = Math.floor(AMOUNT_OF_PEOPLE * Math.random());
        this.set_random_strategies(strategies_nr);
        this.prediction_history = new Array(TOTAL_WEEKS);
        this.score = 0;
    }

    predict_attendance(week_nr, attendance_history) {
        let bestStrategy = this.strategies_set.peek();
        let prediction = bestStrategy.weighting_attendances_func(week_nr, bestStrategy.weights_list, attendance_history);
        return prediction;
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

    rank_strategies(week_nr, attendance_history) {
        // set value of all strategies based on current and last weeks of memory-size
        console.log("strategies: " + this.strategies_set.getHeap().length);
        this.strategies_set.getHeap().forEach(element => {
            console.log(element);
            // let value = element.getValue();
            // console.log("element: " + element + " value: " + value);
            let value = 0;
            value += element.determine_error(week_nr, this.memory_size, attendance_history);
            console.log("added value: " + value);
            element.setValue(value);
        });

        this.strategies_set.heapifyUp();
    }

    sort_strategies() {
        // sort strategies based on significance value
    }

    decide_attending(week_nr, attendance_history) {
        let prediction = this.predict_attendance(week_nr, attendance_history);
        console.log("--- predict" + this.id + " [" + week_nr + "]: " + prediction);
        this.is_attending = prediction <= OVERCROWDING_THRESHOLD;
        // attendees per week?
        // attendees_map[this.id] = this.is_attending;
        this.prediction_history[week_nr] = prediction;
        manageAttendees(week_nr, this);
    }

    add_score(week_nr) {
        if (this.is_attending) {
            this.score = isOvercrowded(week_nr) ? this.score - 1 : this.score + 1;
            // TODO: add more score if prediction is close to actual attendance?
        }
    }
}

class Farol_Strategy {
    weights_list;
    weighting_attendances_func;
    error_value;

    constructor(memory_size, first_strategy) {
        console.log("const")
        this.weights_list = new Array(memory_size);
        this.weighting_attendances_func = this.generate_func(memory_size, first_strategy);
        this.error_value = 0;
    }

    generate_func(memory_size, first_strategy) {
        for (let i = 0; i < memory_size; i++) {
            this.weights_list[i] = generateRandomWeight();
        }
        return (week_nr, weights_list, attendance_history) => {
            let prediction = 0;
            let length = week_nr < memory_size ? week_nr : memory_size;
            for (let i = 0; i < length; i++) {
                // current attendance should be skipped
                let attendance = attendance_history[week_nr - (i + 1)];
                attendance = (attendance && attendance > 0) ? attendance : 0;
                prediction += (attendance * weights_list[i]);
                console.log("i -> " + (-1 * (i + 1)) + " -> " + prediction);
            }
            prediction = Math.round(prediction + first_strategy);
            prediction = considerPredictionBoundaries(prediction);
            console.log("first:" + first_strategy);
            console.log("pred:" + prediction);
            return prediction;
        }
    }

    determine_error(week_nr, memory_size, attendance_history) {
        let error = 0;
        let length = week_nr < memory_size ? week_nr + 1 : memory_size + 1;
        for (let i = 0; i < length; i++) {
            error += differenceToAttendance(this.weighting_attendances_func(week_nr - i, this.weights_list, attendance_history), attendance_history[week_nr - i]);
            console.log("err:" + error);
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

function isOvercrowded(week_nr) {
    return attendance_history[week_nr] > OVERCROWDING_THRESHOLD;
}

function isClose(prediction, attendance) {
    return (prediction == (attendance + CLOSE_CALL_EPSILON) || prediction == (attendance - CLOSE_CALL_EPSILON));
}

function differenceToAttendance(prediction, attendance) {
    return Math.abs(prediction - attendance);
}

// var testArray = [50, 30, 80];
// attendance_history = testArray;
// var testAgent = new Farol_Agent(1, 2, 4);
// var testAgent2 = new Farol_Agent(2, 2, 4);
// console.log(testAgent.first_strategy);
// console.log("score:" + testAgent.score);
setupAgents(STRATEGIES_COUNT, MEMORY_SIZE);

// for(let i = 0; i<100; i++){
//     console.log(generateRandomWeight())
// }

var days_summary = document.getElementById("days_summary");

var days_summary_graph = document.getElementById("days_summary_graph");
var days_summary_graph_size = 150;
var days_summary_graph_lowerbound = days_summary_graph_size * CanvasLowerBoundProportion;
var days_summary_graph_canvas = setupCanvas(0, days_summary_graph_lowerbound - OVERCROWDING_THRESHOLD, 100, 0, true, days_summary_graph, days_summary_graph_size, days_summary_graph_size);
var barContext;

/*
    ===============
    simulate weeks
    ===============
*/
for (let i = 0; i < TOTAL_WEEKS; i++) {
    atBar = [];
    atHome = [];
    let multiCanvasContext = setupCanvas();
    barContext = setupCanvas(OVERCROWDING_THRESHOLD, 0, 0, -OVERCROWDING_THRESHOLD, false, null, 230, 200, 110);
    // console.log("-- predict: " + testAgent.predict_attendance(i, attendance_history));
    for (let j = 0; j < AGENTS_NR; j++) {
        agents[j].decide_attending(i, attendance_history);
    }

    console.log("-- ah" + i + ": " + attendance_history[i]);
    attendance_history[i] += generateRandomAttendance(AGENTS_NR);
    console.log("--- ah" + i + ": " + attendance_history[i]);

    drawPredictionDay(i);
    manageOvercrowded(i);

    for (let k = 0; k < AGENTS_NR; k++) {
        agents[k].add_score(i);
        console.log("score" + k + ": " + agents[k].score);
        agents[k].rank_strategies(i, attendance_history);
        agents[k].strategies_set.print();
    }

    drawBar(barContext);
    drawMultiCanvasDay(multiCanvasContext, i);
}

drawSummaryGraph();
// console.log(testAgent.predict_attendance(1, attendance_history) == testAgent.predict_attendance(1, attendance_history));

function manageAttendees(week_nr, attendee) {
    if (attendee.is_attending) {
        // showAttendee(week_nr, attendee);
        attendance_history[week_nr]++;
        atBar.push(attendee);
    } else {
        atHome.push(attendee);
    }
    // attendees_map[attendee.id] = attendee.is_attending;
    showAttendee(week_nr, attendee);
}

function generateRandomAttendance(agents_nr = 0) {
    return Math.floor(Math.random() * (AMOUNT_OF_PEOPLE - agents_nr));
}

function manageOvercrowded(week_nr) {
    if (isOvercrowded(week_nr)) {
        showOvercrowded(week_nr);
        console.log("OVERCROWDED");
    }
}

function showOvercrowded(week_nr) {
    setText(canvas.width / 2, canvas.height / 4 + week_nr * 20, week_nr + ": OVERCROWDED", "#FF0000");
}

// predictions of all weeks
function showAttendee(week_nr, attendee) {
    let id = attendee.id;
    let prediction = attendee.predict_attendance(week_nr, attendance_history);
    prediction = prediction < 0 ? 1 : prediction;
    // drawPoint(week_nr * 6, id * (-4) + (100 - 5));
    drawPoint(prediction * X_SCALE, id * (-4) + (Y_LOWERBOUND - 5), color_map[week_nr]);
}

function considerPredictionBoundaries(prediction) {
    if (prediction > MAX_PREDICTION) {
        prediction = MAX_PREDICTION;
    } else if (prediction < MIN_PREDICTION) {
        prediction = MIN_PREDICTION;
    }
    return prediction;
}

function addDay(week_nr, attendance, color) {
    var elem = document.createElement("short");
    elem.style.backgroundColor = color;
    elem.append("week" + week_nr + ": " + attendance);
    elem.style.color = "#FFFFFF";
    elem.style.padding = "1em";
    days_summary.append(elem);
    // var elem = document.createElement(elementName)
    // elem.setAttribute("class", className);
    // elem.append(value);
    // row.append(elem);
    // return elem;
}

function setupPredefinedCanvas(predefinedCanvas) {
    return setupCanvas(OVERCROWDING_THRESHOLD, Y_LOWERBOUND, 0, -Y_LOWERBOUND, true, predefinedCanvas, 500, 500);
}

function setupCanvas(x = OVERCROWDING_THRESHOLD, y = Y_LOWERBOUND, dX = 0, dY = -Y_LOWERBOUND, hasCapacity = true, predefinedCanvas = null, width = 500, height = 500, lineLength = 100) {
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

    console.log("predCanv: " + predefinedCanvas);
    if (!predefinedCanvas) {
        days_list.append(canvas);
    }
    return canvasContext;
}

function setupAgents(strategies_nr, memory_size) {
    for (let i = 0; i < AGENTS_NR; i++) {
        agents[i] = new Farol_Agent(i + 1, strategies_nr, memory_size);
    }
}

// predictions of all weeks
function drawPredictionDay(week_nr) {
    addDay(week_nr, attendance_history[week_nr], color_map[week_nr]);
    drawLine(attendance_history[week_nr], Y_LOWERBOUND, 0, -Y_LOWERBOUND, color_map[week_nr]);
}

function drawSummaryGraph() {
    // attendance over time
    drawLine(0, days_summary_graph_lowerbound, 5, -attendance_history[0], "#FF0000", days_summary_graph_canvas);
    for (let i = 0; i < TOTAL_WEEKS; i++) {
        drawPoint((i + 1) * X_SCALE * 5 - 2, days_summary_graph_lowerbound - attendance_history[i] - 2, "#000000", days_summary_graph_canvas);
        drawLine((i + 1) * 5, days_summary_graph_lowerbound - attendance_history[i], 5, attendance_history[i] - attendance_history[i + 1], "#FF0000", days_summary_graph_canvas);
    }
}

function drawMultiCanvasDay(context, week_nr) {
    let atBarValue = 0;
    for (let i = 0; i < atBar.length; i++) {
        drawLine(0, i * (-4) + (Y_LOWERBOUND - 5), atBar[i].prediction_history[week_nr], 0, "#000000", context);
        atBarValue = i;

        drawBarDay(barContext, i, week_nr, atBar[i].score);
    }

    // atHome above atBar
    for (let j = 0; j < atHome.length; j++) {
        drawLine(0, (atBarValue + 2 + j) * (-4) + (Y_LOWERBOUND - 5), atHome[j].prediction_history[week_nr], 0, "#000000", context);

        drawBarDay(barContext, j, week_nr, atHome[j].score, 110);
    }

    // horizontal capacity line
    drawLine(0, OVERCROWDING_THRESHOLD * (-4) + (Y_LOWERBOUND - 5), 100, 0, "#BB2222", context);

    // vertical line - to show actual attendance and attendees
    drawLine(attendance_history[week_nr], (atBarValue + 1) * (-4) + (Y_LOWERBOUND - 5), 0, (atBarValue + 1) * (4) + 5, color_map[week_nr], context);
    // horizontal line - to show actual attendance and attendees
    drawLine(0, (atBarValue + 1) * (-4) + (Y_LOWERBOUND - 5), attendance_history[week_nr], 0, color_map[week_nr], context);
}

function drawBar(context) {
    let wallHeight = -(OVERCROWDING_THRESHOLD + 11);
    let groundHeight = 200 * CanvasLowerBoundProportion;
    let barWidth = 54;
    drawLine(1, groundHeight, 0, wallHeight, "#000000", context);
    drawLine(barWidth + 1, groundHeight, 0, wallHeight, "#000000", context);
    drawLine(1, groundHeight + wallHeight, barWidth, 0, "#000000", context);
}

function drawBarDay(context, attendent_nr, week_nr, score, home_x_shift = 0) {
    let barLineSize = 10;
    let groundHeight = 200 * CanvasLowerBoundProportion;
    let opacity = score / (week_nr + 1) * 100;
    if (opacity <= 5) {
        opacity = 5;
    }
    drawPoint(home_x_shift + 8 + X_SCALE * 5 * (attendent_nr % (barLineSize)), groundHeight - 9 - 12 * Math.floor(attendent_nr / (barLineSize)), `rgba(0,0,0,${opacity}%)`, context, 6);
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

function setText(x, y, content, color, context = ctx) {
    context.font = "1rem Arial";
    context.fillStyle = color;
    context.fillText(content, x, y);
    // ctx.fillText(content, x, y);
    // ctx.strokeText(content, x, y);
}