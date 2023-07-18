import { Farol_Variables } from "./Farol_Variables.js";
import { drawAttendee } from "../view/drawResults.js";
import { StrategyList } from "./StrategyList.js";
import { playSuitableSound } from "./Audio_Setup.js";

const OVERCROWDING_THRESHOLD = Farol_Variables.OVERCROWDING_THRESHOLD;
const AMOUNT_OF_PEOPLE = Farol_Variables.AMOUNT_OF_PEOPLE;
const TOTAL_DAYS = Farol_Variables.TOTAL_DAYS;

const MAX_PREDICTION = Farol_Variables.MAX_PREDICTION;
const MIN_PREDICTION = Farol_Variables.MIN_PREDICTION;

const STRATEGY_UTIL_BOOST = 1;
const CLOSE_CALL_EPSILON = 5; // what is a close / good value to a specific value (prediction)

var attendance_history = Farol_Variables.attendance_history;

class Farol_Agent {
    id;
    memory_size;
    strategies_set;
    // weights_list;
    first_strategy;
    is_attending; // boolean 
    prediction_history;
    // error_history;
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
            prediction = Farol_Variables.player_prediction;
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
        // this.strategies_set = new PriorityQueue();
        this.strategies_set = new StrategyList();
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

        this.sort_strategies();
    }

    sort_strategies() {
        // sort strategies based on error value
        this.strategies_set.sortUp();
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
        let rating;
        let overcrowded = isOvercrowded(day_nr);
        if (this.is_attending) {
            if (overcrowded) {
                this.score = this.score - 1; 
                rating = "bad";
            } else {
                this.score = this.score + 1;
                rating = "good";
            }
        }
        // TODO: add more score if prediction is close to actual attendance?
        let error = this.get_error_value(day_nr, attendance_history);
        let addValue = error <= 1 ? (error == 0 ? 1.25 : 1.5) : error;
        this.score += 1/2 * 1/addValue;
        if(this.is_person){
            playSuitableSound(rating, isClose(error));
        }
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

// function isClose(prediction, attendance) {
//     return (prediction == (attendance + CLOSE_CALL_EPSILON) || prediction == (attendance - CLOSE_CALL_EPSILON));
// }

function isClose(error) {
    return error <= CLOSE_CALL_EPSILON;
}

function differenceToAttendance(prediction, attendance) {
    return Math.abs(prediction - attendance);
}

function considerPredictionBoundaries(prediction) {
    if (prediction > MAX_PREDICTION) {
        prediction = MAX_PREDICTION;
    } else if (prediction < MIN_PREDICTION) {
        prediction = MIN_PREDICTION;
    }
    return prediction;
}

function manageAttendees(day_nr, attendee) {
    if (attendee.is_attending) {
        // showAttendee(day_nr, attendee);
        attendance_history[day_nr]++;
        Farol_Variables.atBar.push(attendee);
    } else {
        Farol_Variables.atHome.push(attendee);
    }
    // attendees_map[attendee.id] = attendee.is_attending;
    showAttendee(day_nr, attendee);
}

// predictions of all days
function showAttendee(day_nr, attendee) {
    let id = attendee.id;
    let prediction = attendee.predict_attendance(day_nr, attendance_history);
    prediction = prediction < 0 ? 1 : prediction;
    drawAttendee(prediction, id, day_nr);
}

function rankAgents() {
    Farol_Variables.ranking.sort(function (x,y) {
        let a = x.getValue();
        let b = y.getValue();
        return b-a;
    })
}

export { Farol_Agent, isOvercrowded, differenceToAttendance, rankAgents };