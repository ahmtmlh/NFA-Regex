// THIS IS THE COMBINED FILE OF :
//		*Graph.js
//		*GraphNode.js
//		*Link.js
//		*NFA.js

/**
*	Version 2.5
*	This version is the final version. Unioned graphs dont have extra state
*	that connects all accept states due to lack of performance increase and 
*	memory efficiency.
*	This version can work with nested parantheses. Epsilon as input still
*	forbidden. Regex processing works with infix string type.
*/

///////			START OF NFA CLASS
function NFA(regexp){
	//After all the operations, this will be renewed.
	this.completeGraph = null;
	//This is required to keep track of every subgraph that was created along the way.
	this.graphId = 0;
	this.graphs = new Array();
	this.stateId = 0;
	this.graphs.push(new Graph());
	this.regex = regexp;
	this.currentStates = [];
	this.initialize();
	this.initializeCheck();
}
/**
* This function initializes the graph structure that is
* required by the checking function. NFA initialization works with
* infix type regex. Conversion to postfix is not required.
*/
NFA.prototype.initialize = function(){
	//Construct function is recursive function if there is
	//parentheses. Function creates different graphs yet to be
	//unioned afterwards.
	this.constructNFA(this.regex);
	//After the construction is complete, union all the graphs in
	//the graphs list. The list should contain the graphs divided by
	//'+' operator while construction.
	let count = 1;
	while(count <= this.graphId){
		this.stateId = this.graphs[0].union(this.graphs[1], this.stateId);
		//Remove the unioned graph from the list.
		//Splice function shifts the elements in the array.
		//Meaning, unioning 0 with 1 evertime, after removing 1
		//is the same as unioning everything in the list.
		this.graphs.splice(1,1);
		count++;
	}

	this.completeGraph = this.graphs[0];
	delete this.graphs;
}
/**
* This function stores all states available from start state with '$'
* into currentStates array which will be sued to check given string.
*/
NFA.prototype.initializeCheck = function(){
	this.currentStates.push(this.completeGraph.head);
	let visited = [];
	this.epsilonCheck(visited);
	delete visited;
}
/**
* This function stores all available states from each state in currentStates
* array, with the transition of '$'
*/
NFA.prototype.epsilonCheck = function(visited){
	//This loop iterates through all current states in the array
	for(let i = 0; i < this.currentStates.length; i++){
		let currentNode = this.currentStates[i];
		//This loop iterates through all links of the currentNode.
		//Which is a node in currentStates array.
		for(let j = 0; j < currentNode.links.length; j++){
			//Check if transition is '$' before adding to array.
			if(currentNode.links[j].transition == '$'){
				//If current state array contains the next state, don't add it.
				if(visited[currentNode.links[j].dest.stateId] == true){
					continue;
				}
				visited[currentNode.links[j].dest.stateId] = true;
				this.currentStates.push(currentNode.links[j].dest);
			}
		}
	}	
}
/**
* This function checks the given text according to completeGraph.
*/
NFA.prototype.check = function(text){
	//First for loop iterates all chars from the given text.
	for(let i = 0; i < text.length; i++){
		let visited = []
		let char = text.charAt(i);
		//In every iteration currentStates stored into a temporary array
		//And cleared before any further operation.
		let stateTemp = this.currentStates.slice();
		this.currentStates.length = 0;
		for(let j = 0; j < stateTemp.length; j++){
			let currentNode = stateTemp[j];
			for(let k = 0; k < currentNode.links.length; k++){
				//Check if links between states contains the correct transition.
				if(currentNode.links[k].transition == char){
					this.currentStates.push(currentNode.links[k].dest);
				}
			}
		}
		//After first transition check, add all epsilon states into
		//the currentStates array from the previously added states.
		this.epsilonCheck(visited);
		delete visited;
	}
	//After the text scan is done, return the answer if
	//there are any accept states in the final 'currentStates' array.
	for(let i = 0; i < this.currentStates.length; i++){
		if(this.currentStates[i].state == true)
			return true;
	}
	return false;
}
/**
* This function is recursive, firstly called from the initialization.
* Function constructs a complete graph according to regex that was given
*/
NFA.prototype.constructNFA = function(regex){
	let stack = new Array();
	//This variable is for the expressions inside parentheses.
	//Inline expressions will be processed seperately, meaning
	//that nested parantheses will be presented in this temporary
	//string.
	let inline = "";
	for(let i = 0; i < regex.length; i++){
		let char = regex.charAt(i);
		let next_char = '';
		if(i+1 < regex.length)
			next_char = regex.charAt(i+1);
		if(stack.length == 0 && char == '('){
			//Store the index of '(' character.
			stack.push(i);
		}
		else if(stack.length == 1 && char == ')'){
			//Retrieve the position of '(' character that matches this ')' character 
			let index = stack.pop();			
			//Store the inline graph with the others.
			//However, keep track of the inline graph
			//After the function, do the correct operation and save the prime graph.
			let oldGraphId = this.graphId;
			//An offset variable is needed in case of parenthesis before any other
			//graph creation.
			let offset = 2;
			let prev_char = regex.charAt(index-1);
			//Index shows the parenthesis position. If the regex starts with a parenthesis, 
			//no further adjustments to the graphId is required.
			//Also, if the previous char is '+', graphId is already incremented.
			//No need to do this again.
			if(prev_char != '+' && index != 0)
				this.graphId++;
			else{
				//If previous character is '+', offset should be 2. However, since the increment
				//operation is done before oldGraphId decleration, offset can be set to 1,
				//resulting in the same result. (oldGraphId+2 === oldGraphId+1+offset)
				offset = 1; 
			}
			this.constructNFA(inline);
			//Clear the temp in case of another parentheses is in the original regex
			inline = "";
			let length = this.graphs.length;
			let j = oldGraphId+offset;
			//This loop unions all the subgraphs created from the inline regex
			while(j < this.graphs.length){
				this.stateId = this.graphs[oldGraphId+(offset-1)].union(this.graphs[j], this.stateId);
				//Remove the unioned graphs from the list
				//Splice function shifts elements back, meaning every next element will be
				//moved to the position j everytime. Thus, j remains intact.
				this.graphs.splice(j,1);
			}
			this.graphId = oldGraphId;
			//After the ')' char, if there's a '*' character
			//Star the previously unioned inline graph.
			if(next_char == '*'){
				this.stateId = this.graphs[this.graphId+(offset-1)].star(this.stateId);
			}
			//Concat operation is needed for the inline graph for connecting to
			//previous graph. If the character before the '(' is a valid character
			//and union operation, no operation is needed for now since all union 
			//operations will be done after the full regex scan.
			if(prev_char != "" && prev_char != '+'){
				this.graphs[this.graphId].concat(this.graphs[this.graphId+1]);
				//DELETE THE NEXT GRAPH FROM THE LIST
				this.graphs.splice(this.graphId+1, 1);
			}
		}
		else if(stack.length > 0){
			//If the current character is in between parentheses,
			//store the regex between parentheses.
			inline += char;
			//If there is an inline paranthesis, still push and pop index values
			if(char == ')')
				stack.pop();
			else if(char == '(')
				stack.push(i);
		}
		else{
			//Possible null sectors are avoided.
			if(this.graphs[this.graphId] == null)
				this.graphs[this.graphId] = new Graph();
			this.buildGraph(char, next_char, this.graphs[this.graphId]);
		}
	}
}
/**
* This function is used to create subGraphs such as single transition graphs,
* union graphs, starred graphs and lastly concatenated graphs using the current 
* character of the string and next character from the string.
*/
NFA.prototype.buildGraph = function(char, next_char,storeGraph){
	//'*' situations are handled individually and differently from graph to graph
	//Thus, if the given character is '*', skip the operation.
	if(char == '*')
		return;
	//If the next character from the regex is '*', then create a normal graph with
	//given transition, then change the graph into stared version.
	if(next_char == '*'){
		let g = new Graph();
		this.stateId = g.normal(char,this.stateId);
		this.stateId = g.star(this.stateId);
		if(storeGraph.head == null)
			storeGraph.head = g.head;
		else
			storeGraph.concat(g);
		delete g;
	}
	//If the char is
	else if(char == '+'){
		//Store the current graph into the array.
		this.graphId++;
	}
	//If current char is alphabetic, just create a temporary graph
	//then concat the prime graph with the freshly created temporary graph
	else{
		//First entry must be defined by hand since it can't be concatenated yet.
		if(storeGraph.head == null)
			this.stateId = storeGraph.normal(char, this.stateId);
		else{
			let g = new Graph();
			this.stateId = g.normal(char, this.stateId);
			storeGraph.concat(g);
			delete g;
		}
	}
}
///////			END OF NFA CLASS

///////			START OF GRAPH CLASS
function Graph(){
	this.head = null;
}
/**
* This function creates a one char graph which is accepted by NFA
* standarts. 
*/
Graph.prototype.normal = function(trans, startId){
	this.head = new GraphNode(false, startId++);
	let temp = new GraphNode(true, startId++);
	this.head.addLink(trans, temp, this.head);
	return startId;
}
/**
* This function changes the graph into a starred version
* For example, given graph is the state for regex 'a', this
* function changes the status of the graph into 'a*'
*/
Graph.prototype.star = function(startId){
	let temp = new GraphNode(true, startId++);
	let visited = [];
	let acceptStates = [];
	//Find all accept states of given graph.
	this.DFS_acceptStates(visited , acceptStates, this.head);
	for(let i = 0; i < acceptStates.length; i++){
		acceptStates[i].addLink('$',this.head, acceptStates[i]);
	}
	//New graph is generated
	temp.addLink('$' , this.head, temp);
	this.head.state = false;
	this.head = temp;
	delete visited;
	delete acceptStates;
	return startId;
}
/**
* This function operates as an union. Unites the given graph with the
* this graph. Final result affects this graph.
*/
Graph.prototype.union = function(graph, startId){
	//New head created and connected to previous head values.
	let temp = new GraphNode(false, startId++);
	temp.addLink('$', this.head, temp);
	temp.addLink('$', graph.head, temp);
	this.head = temp;
	return startId;
}
/**
* This function concats the graph, with the given graph.
* Final result affects the first graph.
*/
Graph.prototype.concat = function(graph){
	let visited = [];
	let oldAcceptStates = [];
	this.DFS_acceptStates(visited,oldAcceptStates, this.head);
	for(let i = 0; i < oldAcceptStates.length; i++){
		oldAcceptStates[i].state = false;
		//Left hand connects to right hand's start state.
		oldAcceptStates[i].addLink('$', graph.head, oldAcceptStates[i]);
	}
	delete visited;
	delete oldAcceptStates;
}
/**
* This function iterates all states while listing the accept states.
*/
Graph.prototype.DFS_acceptStates = function(visited,acceptStates, Gnode){
	//Can be done better.
	if(visited[Gnode.stateId] == true)
		return;
	visited[Gnode.stateId] = true;
	if(Gnode.state == true)
		acceptStates.push(Gnode);
	for(let i = 0; i < Gnode.links.length; i++){
		this.DFS_acceptStates(visited,acceptStates, Gnode.links[i].dest);
	}
}
///////			END OF GRAPH CLASS

///////			START OF LINK CLASS
/**
* Link is presenting the arrows in a NFA.
* A link should have a destination and source nodes
* as well as a transition that connects two nodes
* together.
*/
function Link(trans, dest, src){
	this.transition = trans;
	this.dest = dest;
	this.src = src;
}
///////			END OF LINK CLASS

///////			START OF GRAPHNODE CLASS
function GraphNode(state, id){
	this.state = state;
	this.links = new Array();
	this.stateId = id;
}
/**
* This function adds links to the present node.
* srcNode is always given the same node as this is. JS with these type of
* class decleration won't recognise this keyword as the instance.
*/
GraphNode.prototype.addLink = function(trans, destNode, srcNode){
	this.links.push(new Link(trans, destNode, srcNode));
}
///////			END OF GRAPHNODE CLASS

///////			START OF TEST UTILITY
function TestNFA(regex, text){
	var nfa = new NFA(regex);
	var answer = nfa.check(text);
	//Remove the created NFA since new ones will be generated everytime
	//'TestNFA' function is called from console or Web Application.
	delete nfa;
	return (answer == true ? "Checks" : "Fails");
}