import { addValue } from "../../util/Summary_Util.js";
import { rankAgents } from "../model/Farol_Agent.js";
import { Farol_Variables } from "../model/Farol_Variables.js";

const OVERCROWDING_THRESHOLD = Farol_Variables.OVERCROWDING_THRESHOLD;
const X_SCALE = Farol_Variables.X_SCALE;
const Y_LOWERBOUND = Farol_Variables.Y_LOWERBOUND;
const CanvasLowerBoundProportion = Farol_Variables.CanvasLowerBoundProportion;

var color_map = Farol_Variables.color_map;

var attendance_graph_canvas = document.getElementById("attendance_graph");
var ctx = attendance_graph_canvas.getContext("2d");

var days_summary_graph = document.getElementById("days_summary_graph");
var days_summary_graph_size = 150;
var days_summary_graph_lowerbound = days_summary_graph_size * CanvasLowerBoundProportion;
var days_summary_graph_canvas;

var attendance_history = Farol_Variables.attendance_history;

var days_summary_attendances = document.getElementById("days_summary_attendances");

var days_list = document.getElementById("days_list");

function showOvercrowded(day_nr) {
    setText(4 * attendance_graph_canvas.width / 6, attendance_graph_canvas.height / 6 + day_nr * 20, day_nr + ": OVERCROWDED", "#FF0000");
    setText(5, 200 * CanvasLowerBoundProportion - 30,"OVERCROWDED", "#FF0000", Farol_Variables.barContext, "0.8em");
}

function showDayColor(day_nr) {
    setText(attendance_graph_canvas.width / 2, attendance_graph_canvas.height / 6 + day_nr * 20, "day" + day_nr, color_map[day_nr]);
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

// predictions of all days
function drawPredictionDay(day_nr) {
    addDay(day_nr, attendance_history[day_nr], color_map[day_nr]);
    drawLine(attendance_history[day_nr], Y_LOWERBOUND, 0, -Y_LOWERBOUND, color_map[day_nr]);
}

function setupDaysSummaryGraphCanvas() {
    Farol_Variables.days_summary_graph_canvas = setupCanvas(0, days_summary_graph_lowerbound - OVERCROWDING_THRESHOLD, 300, 0, true, days_summary_graph, days_summary_graph_size*2, days_summary_graph_size, days_summary_graph_size*2);
    days_summary_graph_canvas = Farol_Variables.days_summary_graph_canvas;
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
    let barContext = Farol_Variables.barContext;
    let atBar = Farol_Variables.atBar;
    let atHome = Farol_Variables.atHome;

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

function drawAttendee(prediction, id, day_nr) {
    // drawPoint(day_nr * 6, id * (-4) + (100 - 5));
    drawPoint(prediction * X_SCALE, id * (-4) + (Y_LOWERBOUND - 5), color_map[day_nr]);
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

function showRanking() {
    let current_day = Farol_Variables.current_day;
    // ranking.heapifyDown();
    // ranking.print();
    rankAgents();
    let rankingList = Farol_Variables.ranking;
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
        let agentNameWeight = (agent.id == 1 && Farol_Variables.has_player_agent) ? "th" : "td";
        addValue(agentNameWeight, "name_value", Farol_Variables.name_map[agent.id-1], row);
        addValue("td", "score_value", Math.round(agent.score*100)/100, row);
        // TODO:  check:
        //  - save last strategy used because of strategy ranking and score addition happen at the same time?
        //  - change score calculation?
        addValue("td", "error_value", "Prediction: " + agent.get_prediction(current_day) + "; Error:" + agent.get_error_value(current_day), row);
        document.getElementById("results").append(row);
    }

    // ranking.print();
}

function animateAddition(score_addition) {
    score_addition.style.opacity = "100%";
    let id = null;
    const elem = score_addition;
    let pos = 8;
    clearInterval(id);
    id = setInterval(frame, 30);
    function frame() {
        if (pos == -14) {
            clearInterval(id);
            score_addition.style.opacity = "0%";
        } else {
            pos -= 2;
            elem.style.top = pos + "px";
        }
    }
}

export { showOvercrowded, showDayColor, showRanking, addDay, setupCanvas, setupPredefinedCanvas, setupDaysSummaryGraphCanvas, setupCanvas, drawPredictionDay, drawMultiCanvasDay, drawSummaryGraph, drawBar, drawBarDay, drawPoint, drawLine, setText, drawAttendee, animateAddition };
