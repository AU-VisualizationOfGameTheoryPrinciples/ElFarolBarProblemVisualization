// Adapted version from geeksforgeeks
// see: https://www.geeksforgeeks.org/implementation-priority-queue-javascript/

class PriorityQueue {
	constructor() {
		this.heap = [];
	}

	// Helper Methods
	getLeftChildIndex(parentIndex) {
		return 2 * parentIndex + 1;
	}

	getRightChildIndex(parentIndex) {
		return 2 * parentIndex + 2;
	}

	getParentIndex(childIndex) {
		return Math.floor((childIndex - 1) / 2);
	}

	hasLeftChild(index) {
		return this.getLeftChildIndex(index) < this.heap.length;
	}

	hasRightChild(index) {
		return this.getRightChildIndex(index) < this.heap.length;
	}

	hasParent(index) {
		return this.getParentIndex(index) >= 0;
	}

	leftChild(index) {
		return this.heap[this.getLeftChildIndex(index)];
	}

	rightChild(index) {
		return this.heap[this.getRightChildIndex(index)];
	}

	parent(index) {
		return this.heap[this.getParentIndex(index)];
	}

	swap(indexOne, indexTwo) {
		const temp = this.heap[indexOne];
		this.heap[indexOne] = this.heap[indexTwo];
		this.heap[indexTwo] = temp;
	}

	peek() {
		if (this.heap.length === 0) {
			return null;
		}
		return this.heap[0];
	}
	
	// Removing an element will remove the
	// top element with highest priority then
	// heapifyDown will be called
	remove() {
		if (this.heap.length === 0) {
			return null;
		}
		const item = this.heap[0];
		this.heap[0] = this.heap[this.heap.length - 1];
		this.heap.pop();
		this.heapifyDown();
		return item;
	}

	add(item) {
        console.log("add: " + item.getValue())
		this.heap.push(item);
		this.heapifyUp();
	}

	heapifyUp() {
		let index = this.heap.length - 1;
        // check significance value of items
		while (this.hasParent(index) && this.parent(index).getValue() > this.heap[index].getValue()) {
			this.swap(this.getParentIndex(index), index);
			index = this.getParentIndex(index);
		}
        // console.log("peek: " + this.peek().getValue());
	}

	heapifyDown() {
		let index = 0;
		while (this.hasLeftChild(index)) {
			let smallerChildIndex = this.getLeftChildIndex(index);
			if (this.hasRightChild(index) && this.rightChild(index).getValue() < this.leftChild(index).getValue()) {
				smallerChildIndex = this.getRightChildIndex(index);
			}
			if (this.heap[index].getValue() < this.heap[smallerChildIndex].getValue()) {
				break;
			} else {
				this.swap(index, smallerChildIndex);
			}
			index = smallerChildIndex;
		}

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

export {PriorityQueue};
