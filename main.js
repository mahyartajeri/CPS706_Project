const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

context.font = "20pt Consolas"

const nodes = [
    {
        "x": 157,
        "y": 440,
        "size": 50
    },
    {
        "x": 365,
        "y": 217,
        "size": 50
    },
    {
        "x": 419,
        "y": 451,
        "size": 50
    },
    {
        "x": 539,
        "y": 256,
        "size": 50
    }
];
const edges = [
    {
        "start": 0,
        "end": 1,
        "cost": 3
    },
    {
        "start": 0,
        "end": 3,
        "cost": 7
    },
    {
        "start": 0,
        "end": 2,
        "cost": 1
    },
    {
        "start": 1,
        "end": 3,
        "cost": 1
    },
    {
        "start": 2,
        "end": 3,
        "cost": 4
    }
];

const actions = [];
let processedNodes = [];
let unprocessedNodes = [];
const addEdgeButton = document.getElementById("addEdge");
const clearButton = document.getElementById("clear");
const undoButton = document.getElementById("undo");
const decentralize = document.getElementById("run_Bellman_algorithm");
const centralize = document.getElementById("run_Dijkstra_algorithm");

let draggingNode = null;
let lastAction = null;
let running = false;
let Dijsktra = [];

function getNodeIndex(x, y) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dx = node.x - x;
        const dy = node.y - y;
        if (dx * dx + dy * dy <= node.size * node.size) {
            return i;
        }
    }
    return -1;
}

canvas.addEventListener("mousedown", event => {
    const x = event.offsetX;
    const y = event.offsetY;
    const nodeIndex = getNodeIndex(x, y);
    if (nodeIndex !== -1) {
        draggingNode = nodes[nodeIndex];
        lastAction = {
            type: "dragNode",
            data: {
                index: nodeIndex,
                x: draggingNode.x,
                y: draggingNode.y
            }
        };
        console.log("node dragged!", lastAction)
    } else {
        const node = {
            x,
            y,
            size: 50
        };
        nodes.push(node);
        lastAction = {
            type: "addNode",
            data: {
                index: nodes.length - 1
            }
        };
    }
    actions.push(lastAction);
    draw();
});

canvas.addEventListener("mousemove", event => {
    if (draggingNode) {
        const x = event.offsetX;
        const y = event.offsetY;
        draggingNode.x = x;
        draggingNode.y = y;
        // lastAction.data.x = x;
        // lastAction.data.y = y;
        draw();
    }
});

canvas.addEventListener("mouseup", event => {
    draggingNode = null;
});


centralize.addEventListener("click", () => {
    const start = parseInt(prompt("Enter start node index:"));
    const end = parseInt(prompt("Enter end node index:"));
    if (!isNaN(start) && !isNaN(end) &&
    start >= 0 && start < nodes.length && end >= 0 && end < nodes.length && start != end ){
        if(!running){
            running = true;

        }

    }
}
);

addEdgeButton.addEventListener("click", () => {
    const start = parseInt(prompt("Enter start node index:"));

    const end = parseInt(prompt("Enter end node index:"));

    const cost = parseInt(prompt("Enter edge cost:"));

    if (!isNaN(start) && !isNaN(end) && !isNaN(cost) &&
        start >= 0 && start < nodes.length && end >= 0 && end < nodes.length) {
        const edge = {
            start,
            end,
            cost
        };
        edges.push(edge);
        lastAction = {
            type: "addEdge",
            data: {
                index: edges.length - 1
            }
        };
        actions.push(lastAction);
        draw();
    }
});

clearButton.addEventListener("click", () => {
    lastAction = {
        type: "clear",
        data: {
            nodes: [...nodes],
            edges: [...edges]
        }
    };
    nodes.length = 0;
    edges.length = 0;

    actions.push(lastAction);
    draw();
});

undoButton.addEventListener("click", () => {
    if (actions.length > 0) {
        const action = actions.pop();
        console.log(action);
        switch (action.type) {
            case "addNode":
                nodes.splice(action.data.index, 1);
                break;
            case "addEdge":
                edges.splice(action.data.index, 1);
                break;
            case "dragNode":
                const node = nodes[action.data.index];
                node.x = action.data.x;
                node.y = action.data.y;
                break;
            case "clear":
                nodes.splice(0, nodes.length, ...action.data.nodes);
                edges.splice(0, edges.length, ...action.data.edges);
                break;
        }
        lastAction = null;
        draw();
    }
});

document.addEventListener("keydown", event => {
    if (event.ctrlKey && (event.keyCode === 90) || event.keyCode === "KeyZ") {
        if (actions.length > 0) {
            const action = actions.pop();
            console.log(action);
            switch (action.type) {
                case "addNode":
                    nodes.splice(action.data.index, 1);
                    break;
                case "addEdge":
                    edges.splice(action.data.index, 1);
                    break;
                case "dragNode":
                    const node = nodes[action.data.index];
                    node.x = action.data.x;
                    node.y = action.data.y;
                    break;
                case "clear":
                    nodes.splice(0, nodes.length, ...action.data.nodes);
                    edges.splice(0, edges.length, ...action.data.edges);
                    break;
            }
            lastAction = null;
            draw();
        }
    }
})

function drawNode(node) {
    context.beginPath();
    context.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI);
    context.fillStyle = "white";
    context.fill();
    context.stroke();
    context.fillStyle = "black";
    context.textAlign = 'center'
    context.fillText(nodes.indexOf(node), node.x, node.y + node.size / 6);

}

function drawEdge(edge) {
    const start = nodes[edge.start];
    const end = nodes[edge.end];
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.fillText(edge.cost, (start.x + end.x) / 2, (start.y + end.y) / 2);
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(drawNode);
    edges.forEach(drawEdge);
}
function RunDijkstra(start, end){
    initializeDijstra(start);
    let current = start;
    while(unprocessedNodes.length != 0){

        edges.forEach( edge =>{
            if(edge.start == current){
                if(Dijsktra[edge.end].distance > Dijsktra[current].distance + edge.cost || Dijsktra[edge.end].distance == -1){
                    Dijsktra[edge.end].distance = Dijsktra[current].distance + edge.cost;
                    Dijsktra[edge.end].PreviousVertex = current;
                }
                
            }
            else if (edge.end == current){
                if(Dijsktra[edge.start].distance > Dijsktra[current].distance + edge.cost || Dijsktra[edge.start].distance == -1){
                    Dijsktra[edge.start].distance = Dijsktra[current].distance + edge.cost;
                    Dijsktra[edge.start].PreviousVertex = current;
                }
            }
        }
        )
        processedNodes.push(current);
        unprocessedNodes.splice(unprocessedNodes.indexOf(current),1);
        current = updateCurrent();
    }
    let route = [];
    let distance = Dijsktra[end].distance
    route.push(end);
    while(route[route.length-1] != start){
        route.push(Dijsktra[end].PreviousVertex);
        end = Dijsktra[end].PreviousVertex;
    }
    route.reverse();
    console.log("The shortest path is ");
    console.log(route.join('->'));
    console.log("And the distance is ");
    console.log(distance);
}
function initializeDijstra(start){
    Dijsktra= [];
    for (let i = 0; i < nodes.length; i++) {
        if (i == start){
            const node = {
                distance: 0,
                PreviousVertex: null
            }
            Dijsktra.push(node);
            unprocessedNodes.push(i);
        }
        else{
            const node = {
                distance: -1,
                PreviousVertex: null
            }
            Dijsktra.push(node);
            unprocessedNodes.push(i);
        }
    }    
}
function updateCurrent(){
    let lowest = unprocessedNodes[0];
    for (let i = 1; i < unprocessedNodes.length; i++){
        if(Dijsktra[unprocessedNodes[i]].distance < Dijsktra[lowest].distance && Dijsktra[unprocessedNodes[i]].distance != -1){
            lowest = unprocessedNodes[i];
        }
    }
    return lowest;
}