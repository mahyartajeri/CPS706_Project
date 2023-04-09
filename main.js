const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

context.font = "20pt Consolas"

const nodes = [{
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
    },
    {
        "x": 750,
        "y": 250,
        "size": 50
    },
    {
        "x": 650,
        "y": 400,
        "size": 50
    },
    {
        "x": 750,
        "y": 100,
        "size": 50
    }
];
const edges = [{
        "start": 0,
        "end": 1,
        "cost": 3,
        "color": "black",
    },
    {
        "start": 0,
        "end": 3,
        "cost": 9,
        "color": "black",
    },
    {
        "start": 0,
        "end": 2,
        "cost": 1,
        "color": "black",
    },
    {
        "start": 1,
        "end": 3,
        "cost": 1,
        "color": "black",
    },
    {
        "start": 2,
        "end": 3,
        "cost": 4,
        "color": "black",
    },
    {
        "start": 4,
        "end": 5,
        "cost": 4,
        "color": "black",
    },
    {
        "start": 5,
        "end": 6,
        "cost": 5,
        "color": "black",
    },
    {
        "start": 6,
        "end": 4,
        "cost": 9,
        "color": "black",
    },
    {
        "start": 5,
        "end": 2,
        "cost": 4,
        "color": "black",
    },
    {
        "start": 5,
        "end": 5,
        "cost": 3,
        "color": "black",
    },
    {
        "start": 1,
        "end": 0,
        "cost": 1,
        "color": "black",
    },
    {
        "start": 5,
        "end": 6,
        "cost": 3,
        "color": "black",
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

// Animation Buttons
const stepButton = document.getElementById("stepButton");
const exitButton = document.getElementById("exitButton");

// Animation global
let animationStack = [];
let animationCallback = null;

let draggingNode = null;
let lastAction = null;
let running = false;

// Djikstra Global
let Dijsktra = [];

// Bellman-Ford Global
let DVgraph = {};


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
        if (running) return;
        const node = {
            x,
            y,
            size: 50
        };
        nodes.push(node);
        DVgraph[nodes.length - 1] = {};
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
        start >= 0 && start < nodes.length && end >= 0 && end < nodes.length && start != end) {
        toggleAnimationMode();
        let paths = RunDijkstra(start, end);
        animationStack = animationStack.concat(paths.searching.reverse());
        console.log(paths.answer);
        animationCallback = (ans = paths.answer) => {
            ans.forEach(i => edges[i].color = "green");
            draw();
        }
    }
});

decentralize.addEventListener("click", () => {
    const start = parseInt(prompt("Enter start node index:"));
    if (!isNaN(start) &&
        start >= 0 && start < nodes.length) {
        toggleAnimationMode();
        let info = DvAlgorithm(start);
        animationStack = animationStack.concat(info.searching.reverse());

        animationCallback = (costs = info.distances) => {
            nodes.forEach((node, i) => {
                context.fillStyle = "green";
                context.textAlign = 'center'
                context.fillText("Cost: " + costs[i], node.x + 35, node.y + 35);
            })
        }
    }
})

function toggleAnimationMode() {
    running = !running;
    addEdgeButton.disabled = running;
    clearButton.disabled = running;
    undoButton.disabled = running;
    decentralize.disabled = running;
    centralize.disabled = running;

    if (running) {
        stepButton.style.display = "inline-block";
        stepButton.disabled = false;
        exitButton.style.display = "inline-block";
    } else {
        stepButton.style.display = "none";
        exitButton.style.display = "none";
    }
}

function finishAnimation() {
    stepButton.disabled = true;
    if (typeof animationCallback === "function") animationCallback();
    animationCallback = null;
}

function animateEdge() {
    if (animationStack.length == 0) {
        finishAnimation();
        return;
    }
    edges[animationStack.pop()].color = "red";
    draw();
}

stepButton.addEventListener("click", () => {
    animateEdge();
})

exitButton.addEventListener("click", () => {
    toggleAnimationMode();
    edges.forEach(edge => edge.color = "black");
    draw();
})



addEdgeButton.addEventListener("click", () => {
    const start = parseInt(prompt("Enter start node index:"));

    const end = parseInt(prompt("Enter end node index:"));

    const cost = parseInt(prompt("Enter edge cost:"));

    if (!isNaN(start) && !isNaN(end) && !isNaN(cost) &&
        start >= 0 && start < nodes.length && end >= 0 && end < nodes.length) {
        const edge = {
            start,
            end,
            cost,
            color: "black",
        };
        edges.push(edge);
        DVgraph[start][end] = cost;
        DVgraph[end][start] = cost;
        lastAction = {
            type: "addEdge",
            data: {
                index: edges.length - 1,
                start: start,
                end: end
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
                delete DVgraph[action.data.index];
                break;
            case "addEdge":
                edges.splice(action.data.index, 1);
                delete DVgraph[action.data.start][action.data.end];
                delete DVgraph[action.data.end][action.data.start];
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
    context.lineWidth = 1;
    context.beginPath();
    context.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI);
    context.fillStyle = "white";
    context.fill();
    context.strokeStyle = "black";
    context.stroke();
    context.fillStyle = "black";
    context.textAlign = 'center'
    context.fillText("N" + nodes.indexOf(node), node.x, node.y + node.size / 6);

}

function drawEdge(edge) {
    edge.color != "black" ? context.lineWidth = 5 : context.lineWidth = 1;
    context.strokeStyle = edge.color;
    const start = nodes[edge.start];
    const end = nodes[edge.end];
    context.beginPath();
    context.moveTo(start.x, start.y);

    // Can be multiple edges between two nodes (or even multiple self edges)
    index = edges.filter((e) => (e.start === edge.start && e.end === edge.end) || (e.start === edge.end && e.end === edge.start)).indexOf(edge);
    // Normal Edge
    if (edge.start !== edge.end) {
        const controlX = (start.x + end.x) / (2 + index);
        const controlY = (start.y + end.y) / (2 + index);
        context.quadraticCurveTo(controlX, controlY, end.x, end.y);
        context.stroke();


        const text = edge.cost;
        const textWidth = context.measureText(text).width - 15;
        const t = 0.5; // Set t value to midpoint of curve
        const midX = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlX + t * t * end.x;
        const midY = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlY + t * t * end.y;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const slope = -dx / dy; // Calculate slope of tangent
        //const angle = Math.atan(slope); // Calculate angle of rotation
        context.save();
        context.translate(midX, midY);
        //context.rotate(angle);
        context.fillStyle = "white";
        context.fillRect(-textWidth / 2 - 10, -10, 20, 20);
        context.fillStyle = "black";
        context.fillText(text, -textWidth / 2, 7);
        context.restore();

    }
    // Self Edge
    else {
        context.beginPath();
        context.ellipse(start.x + 25, start.y + 25, 30 + 15 * index, 25 + 15 * index, Math.PI / 4, 0, Math.PI * 2);
        context.stroke();
        context.fillText(edge.cost, start.x + 60 + 15 * index, start.y + 60 + 15 * index);
    }
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    edges.forEach(drawEdge);
    nodes.forEach(drawNode);
}

function RunDijkstra(start, end) {
    initializeDijstra(start);
    let current = start;
    let searchPath = [];
    while (unprocessedNodes.length != 0) {

        edges.forEach(edge => {
            if (edge.start == current) {
                if (Dijsktra[edge.end].distance > Dijsktra[current].distance + edge.cost || Dijsktra[edge.end].distance == Infinity) {
                    Dijsktra[edge.end].distance = Dijsktra[current].distance + edge.cost;
                    Dijsktra[edge.end].PreviousVertex = current;
                    searchPath.push(edges.indexOf(edge));
                }

            } else if (edge.end == current) {
                if (Dijsktra[edge.start].distance > Dijsktra[current].distance + edge.cost || Dijsktra[edge.start].distance == Infinity) {
                    Dijsktra[edge.start].distance = Dijsktra[current].distance + edge.cost;
                    Dijsktra[edge.start].PreviousVertex = current;
                    searchPath.push(edges.indexOf(edge));
                }
            }
        })
        processedNodes.push(current);
        unprocessedNodes.splice(unprocessedNodes.indexOf(current), 1);
        current = updateCurrent();
    }
    let route = [];
    let distance = Dijsktra[end].distance
    route.push(end);

    while (route[route.length - 1] != start) {
        route.push(Dijsktra[end].PreviousVertex);
        end = Dijsktra[end].PreviousVertex;
        console.log(end);
    }
    route.reverse();
    console.log("The shortest path is ");
    console.log(route.join('->'));
    console.log("And the distance is ");
    console.log(distance);
    console.log("ROUTE", route);
    // Will use these for the animation.
    // I think it's better to animate after the function than during
    return {
        searching: searchPath,
        answer: route.reduce((acc, curr, i) => (i > 0) ? [...acc, edges.indexOf(edges.find(edge => ((edge.start === route[i - 1] && edge.end === curr && edge.cost === minCost(route[i - 1], curr)) || (edge.end === route[i - 1] && edge.start === curr && edge.cost === minCost(route[i - 1], curr)))))] : acc, []),
    };
}

function initializeDijstra(start) {
    processedNodes = [];
    Dijsktra = [];
    for (let i = 0; i < nodes.length; i++) {
        if (i == start) {
            const node = {
                distance: 0,
                PreviousVertex: null
            }
            Dijsktra.push(node);
            unprocessedNodes.push(i);
        } else {
            const node = {
                distance: Infinity,
                PreviousVertex: null
            }
            Dijsktra.push(node);
            unprocessedNodes.push(i);
        }
    }
}

function updateCurrent() {
    let lowest = unprocessedNodes[0];
    for (let i = 1; i < unprocessedNodes.length; i++) {
        if (Dijsktra[unprocessedNodes[i]].distance < Dijsktra[lowest].distance && Dijsktra[unprocessedNodes[i]].distance != Infinity) {
            lowest = unprocessedNodes[i];
        }
    }
    return lowest;
}

function minCost(n1, n2) {
    if (n1 === n2) return 0;
    min = Infinity;
    edges.forEach((edge) => {
        if ((edge.start === n1 && edge.end === n2) || (edge.start === n2 && edge.end === n1)) {
            if (edge.cost < min) min = edge.cost;
        }
    })

    return min;
}

function DvAlgorithm(source) {
    initializeDv();
    const distances = {};
    const predecessors = {};

    // initialize
    for (const vertex in DVgraph) {
        distances[vertex] = Infinity;
        predecessors[vertex] = null;
    }

    // set the distance to the source to 0
    distances[source] = 0;

    // Edge path for animation
    searchPath = [];

    // iterate over DVgraph 
    for (let i = 0; i < Object.keys(DVgraph).length - 1; i++) {
        for (const vertex in DVgraph) {
            for (const neighbor in DVgraph[vertex]) {
                const distanceThroughVertex = distances[vertex] + DVgraph[vertex][neighbor];
                if (distanceThroughVertex < distances[neighbor]) {
                    distances[neighbor] = distanceThroughVertex;
                    predecessors[neighbor] = vertex;
                    searchPath.push(
                        edges.indexOf(
                            edges.find(
                                edge => (edge.start === parseInt(vertex) &&
                                    edge.end === parseInt(neighbor) &&
                                    edge.cost === minCost(parseInt(vertex), parseInt(neighbor))) ||
                                (edge.end === parseInt(vertex) &&
                                    edge.start === parseInt(neighbor) &&
                                    edge.cost === minCost(parseInt(vertex), parseInt(neighbor))
                                )
                            )
                        )
                    );
                }
            }
        }
    }

    return {
        distances,
        predecessors,
        searching: searchPath,
    };
}

function initializeDv() {
    DVgraph = {};
    nodes.forEach((node, i) => DVgraph[i] = {});
    edges.forEach((edge) => {

        if (DVgraph[edge.start][edge.end]) {
            if (edge.cost < DVgraph[edge.start][edge.end]) {
                DVgraph[edge.start][edge.end] = edge.cost;
            }
        } else {
            DVgraph[edge.start][edge.end] = edge.cost;
        }
        if (DVgraph[edge.end][edge.start]) {
            if (edge.cost < DVgraph[edge.end][edge.start]) {
                DVgraph[edge.end][edge.start] = edge.cost;
            }
        } else {
            DVgraph[edge.end][edge.start] = edge.cost;
        }
    })
}
draw();
draw();