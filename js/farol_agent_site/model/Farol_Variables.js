import { checkIfDefaultValue, get, getFlag } from "../../util/manageFormValues.js";
import { setupColorMap } from "./Color_Map.js";
import { setupNames } from "./Name_Map.js";

class Farol_Variables_Object {
    // constants
    AMOUNT_OF_PEOPLE;
    OVERCROWDING_THRESHOLD;
    TOTAL_DAYS;
    STRATEGIES_COUNT;
    MEMORY_SIZE;
    AGENTS_NR;
    X_SCALE;
    Y_LOWERBOUND;
    MAX_PREDICTION;
    MIN_PREDICTION;
    CanvasLowerBoundProportion;
    color_map;
    name_map;

    has_player_agent;
    player_agent_index;

    // canvas
    days_summary_graph;

    // dynamic variables
    // - arrays
    attendance_history;
    atHome;
    atBar;

    ranking;

    // - changing variables per day
    barContext;
    current_day;
    player_prediction;
}

var capacity = get("capacity");
var strategies_count = get("strategies_count");
var memory_size = get("memory_size");
var days = get("days");

var Farol_Variables;
setupVariablesObject();
Farol_Variables.AMOUNT_OF_PEOPLE = 100;
let capacityDefaultValue = 60;
let capacity_value = checkIfDefaultValue(capacity, capacityDefaultValue);
Farol_Variables.OVERCROWDING_THRESHOLD = (capacity_value >= Farol_Variables.AMOUNT_OF_PEOPLE || capacity_value < 0) ? capacityDefaultValue : capacity_value;

Farol_Variables.TOTAL_DAYS = checkIfDefaultValue(days, 3);
Farol_Variables.STRATEGIES_COUNT = checkIfDefaultValue(strategies_count, 3);
Farol_Variables.MEMORY_SIZE = checkIfDefaultValue(memory_size, 3);
Farol_Variables.AGENTS_NR = 100;

Farol_Variables.X_SCALE = 2;
Farol_Variables.Y_LOWERBOUND = 420;
Farol_Variables.MAX_PREDICTION = Farol_Variables.AMOUNT_OF_PEOPLE;
Farol_Variables.MIN_PREDICTION = 0;
Farol_Variables.CanvasLowerBoundProportion = Farol_Variables.Y_LOWERBOUND / 500;

Farol_Variables.player_agent_index = 0;

Farol_Variables.color_map = setupColorMap(Farol_Variables.TOTAL_DAYS);
Farol_Variables.has_player_agent = getFlag("has_player_agent");
Farol_Variables.name_map = setupNames(Farol_Variables.AGENTS_NR, Farol_Variables.has_player_agent);

var atBar = [];
var atHome = [];
var attendance_history = new Array(Farol_Variables.AMOUNT_OF_PEOPLE);
attendance_history.fill(0);

Farol_Variables.atHome = atHome;
Farol_Variables.atBar = atBar;
Farol_Variables.attendance_history = attendance_history;

Farol_Variables.ranking = new Array(Farol_Variables.AMOUNT_OF_PEOPLE);

function setupVariablesObject() {
    Farol_Variables = new Farol_Variables_Object();
}

export { setupVariablesObject, Farol_Variables };
