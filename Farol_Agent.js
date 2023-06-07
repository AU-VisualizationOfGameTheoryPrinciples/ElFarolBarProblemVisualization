import { PriorityQueue } from "./PriorityQueue.js";
const AMOUNT_OF_PEOPLE = 100;
const OVERCROWDING_THRESHOLD = 60;
const CLOSE_CALL_EPSILON = 5;

const STRATEGY_UTIL_BOOST = 1;
var attendance_history = new Array(AMOUNT_OF_PEOPLE);
var attendees_map = new Array(); // per week?
attendance_history.fill(0);
var current_week;
var agents = new Array(AMOUNT_OF_PEOPLE);

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
        this.predictionHistory = new Array();
        this.score = 0;
    }

    predict_attendance(week_nr, attendance_history) {
        let bestStrategy = this.strategies_set.peek();
        let prediction = bestStrategy.weighting_attendences_func(week_nr, bestStrategy.weights_list, attendance_history); 
        return prediction;
    }

    generate_random_strategy() {
        return new Farol_Strategy(this.memory_size, this.first_strategy);
    }

    set_random_strategies(nr) {
        // add random strategies to the list of strategies
        this.strategies_set = new PriorityQueue();
        for(let i = 0; i<nr; i++){
            this.strategies_set.add(this.generate_random_strategy());
        }
    }

    rank_strategies(week_nr, attendance_history) {
        // set value of all strategies based on current and last weeks of memory-size
        console.log("strategies: " + this.strategies_set.getHeap().length);
        this.strategies_set.getHeap().forEach(element => {
            console.log(element);
            // let value = element.getValue();
            let value = 0;
            console.log("element: " + element + " value: " + value);
            value += element.determine_error(week_nr, this.memory_size, attendance_history);
            element.setValue(value);
        });

        // this.strategies_set.heapifyDown();
    }

    sort_strategies() {
        // sort strategies based on significance value
    }

    decide_attending(week_nr, attendance_history) {
        prediction = this.predict_attendance(week_nr, attendance_history);
        this.is_attending = prediction <= OVERCROWDING_THRESHOLD;
        // attendees per week?
        // attendees_map[this.id] = this.is_attending;
        this.prediction_history[week_nr] = prediction;
    }

    add_score(week_nr) {
        if(!isOvercrowded(week_nr) && this.is_attending) {
            this.score = this.score + 1;
        }
    }
}

class Farol_Strategy {
    weights_list;
    weighting_attendences_func;
    error_value;

    constructor(memory_size, first_strategy) {
        console.log("const")
        this.weights_list = new Array(memory_size);
        this.weighting_attendences_func = this.generate_func(memory_size, first_strategy);
        this.error_value = 0;
    }

    generate_func(memory_size, first_strategy) {
        for (let i = 0; i < memory_size; i++) {
            this.weights_list[i] = generateRandomWeight();
        }
        return (week_nr, weights_list, attendance_history) => {
            let prediction = 0;
            let div = week_nr < memory_size ? week_nr : memory_size;
            for (let i = 0; i < memory_size; i++) {
                let attendance = attendance_history[week_nr - i];
                attendance = (attendance && attendance > 0) ? attendance : 0;
                prediction += (attendance * weights_list[i]);
                console.log("i -> " + i + " -> " + prediction);
            }
            prediction = Math.floor(prediction + first_strategy);
            console.log("pred:" + prediction);
            return prediction;
        }
    }

    determine_error(week_nr, memory_size, attendance_history){
        let error = 0;
        let length = week_nr+1 < memory_size ? week_nr+1 : memory_size;
        for (let i = 0; i < length; i++) {
            error+= differenceToAttendance(this.weighting_attendences_func(week_nr-i, this.weights_list, attendance_history), attendance_history[week_nr-i]);
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
var testAgent = new Farol_Agent(1,2,4);
console.log(testAgent.first_strategy);
console.log("score:" + testAgent.score);

// for(let i = 0; i<100; i++){
//     console.log(generateRandomWeight())
// }

for (let i = 0; i < 2; i++) {
    console.log("predict: " + testAgent.predict_attendance(i, attendance_history));

    attendance_history[i] = generateRandomAttendance();
    console.log("ah" + i + ": " + attendance_history[i]);

    testAgent.rank_strategies(i, attendance_history);
    testAgent.strategies_set.print();
}

console.log(testAgent.predict_attendance(1, attendance_history) == testAgent.predict_attendance(1, attendance_history));

function generateRandomAttendance() {
    return Math.floor(Math.random() * 100);
}