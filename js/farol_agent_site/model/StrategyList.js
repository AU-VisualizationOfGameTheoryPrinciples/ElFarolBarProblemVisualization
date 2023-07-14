class StrategyList {
	constructor() {
		this.heap = [];
	}

	peek() {
		if (this.heap.length === 0) {
			return null;
		}
		return this.heap[0];
	}

	add(item) {
        console.log("add: " + item.getValue())
		this.heap.push(item);
		this.sortUp();
	}

	sortUp() {
        // check error value of items
		this.heap.sort((a,b) => {
            return a.getValue() - b.getValue();
        })
        // console.log("peek: " + this.peek().getValue());
	}

	forEach(func) {
		this.heap.forEach(func);
	}

	getHeap() {
		return this.heap;
	}

	print() {
		for(let i=0; i<this.heap.length; i++){
			console.log("print: " + this.heap[i].getValue());
		}
		// this.heap.forEach(element => {
		// 	console.log(element);
		// 	console.log("print: " + element.getValue());
		// });
	}
}

export {StrategyList};