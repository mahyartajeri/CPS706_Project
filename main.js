const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

context.font = "20pt Consolas";
let routerIcon;

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
        "x": 800,
        "y": 250,
        "size": 50
    },
    {
        "x": 650,
        "y": 400,
        "size": 50
    },
    {
        "x": 800,
        "y": 100,
        "size": 50
    }
];
const edges = [{
        "start": 0,
        "end": 1,
        "cost": 3,
        "color": "gray",
    },
    {
        "start": 0,
        "end": 3,
        "cost": 9,
        "color": "gray",
    },
    {
        "start": 0,
        "end": 2,
        "cost": 1,
        "color": "gray",
    },
    {
        "start": 1,
        "end": 3,
        "cost": 1,
        "color": "gray",
    },
    {
        "start": 2,
        "end": 3,
        "cost": 4,
        "color": "gray",
    },
    {
        "start": 4,
        "end": 5,
        "cost": 4,
        "color": "gray",
    },
    {
        "start": 5,
        "end": 6,
        "cost": 5,
        "color": "gray",
    },
    {
        "start": 6,
        "end": 4,
        "cost": 9,
        "color": "gray",
    },
    {
        "start": 5,
        "end": 2,
        "cost": 4,
        "color": "gray",
    },
    {
        "start": 5,
        "end": 5,
        "cost": 3,
        "color": "gray",
    },
    {
        "start": 1,
        "end": 0,
        "cost": 1,
        "color": "gray",
    },
    {
        "start": 5,
        "end": 6,
        "cost": 3,
        "color": "gray",
    }
];

const actions = [];
//let processedNodes = [];
let unprocessedNodes = [];
const addEdgeButton = document.getElementById("addEdge");
const clearButton = document.getElementById("clear");
const undoButton = document.getElementById("undo");
const decentralize = document.getElementById("run_Bellman_algorithm");
const centralize = document.getElementById("run_Dijkstra_algorithm");
const randomGraphButton = document.getElementById("randomGraph");

// Animation Buttons
const stepButton = document.getElementById("stepButton");
const exitButton = document.getElementById("exitButton");

// Animation Info Div
const animationInfoDiv = document.getElementById("infoDiv");
const infoTitle = document.getElementById("infoTitle");
const infoParameters = document.getElementById("infoParameters");
const infoTable = document.querySelector("#infoTable tbody");

// Animation globals
let animationStack = [];
let animationCallback = null;
let infoTableStacks = {};
let running = false;

// Canvas globals
let draggingNode = null;
let lastAction = null;


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
    if (nodeIndex !== -1 && !running) {
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

randomGraphButton.addEventListener("click", () => {
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

    const numNodes = Math.floor(Math.random() * 10 + 3)
    const minDistance = 100;
    const margin = 100;
    const innerWidth = canvas.width - margin * 2;
    const innerHeight = canvas.height - margin * 2;
    for (let i = 0; i < numNodes; i++) {
        let x, y;
        do {
            x = Math.random() * innerWidth + margin;
            y = Math.random() * innerHeight + margin;

            tooClose = nodes.some(node => {
                return distanceBetweenNodes(x, y, node.x, node.y) < minDistance;
            });
        }
        while (tooClose);

        nodes.push({
            x: x,
            y: y,
            size: 50,
        });
    }

    // Max number of edges is n(n-1)/2
    const numEdges = Math.floor(Math.random() * ((numNodes * (numNodes - 1)) / 2));
    const maxCost = 100;
    for (let i = 0; i < numEdges; i++) {
        edges.push({
            start: Math.floor(Math.random() * numNodes),
            end: Math.floor(Math.random() * numNodes),
            cost: Math.floor(Math.random() * maxCost),
            color: "gray",
        })
    }
    console.log(isConnected());
    draw();
})

function distanceBetweenNodes(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}


centralize.addEventListener("click", () => {
    const start = parseInt(prompt("Enter start node index:").match(/\d+/)[0]);
    const end = parseInt(prompt("Enter end node index:").match(/\d+/)[0]);
    if (!isNaN(start) && !isNaN(end) &&
        start >= 0 && start < nodes.length &&
        end >= 0 && end < nodes.length && start != end) {
        let paths = RunDijkstra(start, end);
        if (paths === "error") {
            alert("Please use a connected graph for Djikstra's Algorithim");
            return;
        }

        animationStack = animationStack.concat(paths.searching.reverse());
        infoTableStacks = {
            distanceStack: paths.distanceHistory.reverse(),
            predecessorStack: paths.predecessorHistory.reverse()
        }
        infoTitle.innerHTML = "Djikstra Table (LIVE)";
        infoParameters.innerHTML = "Start: <b>N" + start + "</b> End: <b>N" + end + "</b>";

        toggleAnimationMode();

        animationCallback = (ans = paths.answer) => {
            ans.forEach(i => edges[i].color = "green");
            draw();
        }
    }
});

decentralize.addEventListener("click", () => {
    const start = parseInt(prompt("Enter start node index:").match(/\d+/)[0]);
    if (!isNaN(start) &&
        start >= 0 && start < nodes.length) {

        let info = DvAlgorithm(start);
        animationStack = animationStack.concat(info.searching.reverse());
        infoTableStacks = {
            distanceStack: info.distanceHistory.reverse(),
            predecessorStack: info.predecessorHistory.reverse()
        }
        infoTitle.innerHTML = "Bellman-Ford Table (LIVE)";
        infoParameters.innerHTML = "Start: <b>N" + start + "</b>";
        toggleAnimationMode();

        animationCallback = (costs = info.distances) => {
            nodes.forEach((node, i) => {
                context.fillStyle = "rgba(255, 255, 255, 0.7)";
                context.fillRect(node.x - 35, node.y, 140, 50);
                context.fillStyle = "black";
                context.textAlign = 'center';
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
    randomGraphButton.disabled = running;

    if (running) {
        stepButton.style.display = "inline-block";
        stepButton.disabled = false;
        exitButton.style.display = "inline-block";
        animationInfoDiv.style.display = "inline-block";

        initializeInfoTable();
    } else {
        stepButton.style.display = "none";
        exitButton.style.display = "none";
        animationInfoDiv.style.display = "none";
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

function initializeInfoTable() {
    console.log("pred, dist");
    console.log([...infoTableStacks.predecessorStack]);
    console.log([...infoTableStacks.distanceStack]);
    document.querySelector("#infoTable tbody").innerHTML = "";
    firstDistances = infoTableStacks.distanceStack.pop();
    firstPredecessors = infoTableStacks.predecessorStack.pop();
    const numRows = nodes.length;
    for (let i = 0; i < numRows; i++) {
        const row = infoTable.insertRow();
        const vertexCell = row.insertCell();
        const distanceCell = row.insertCell();
        const predecessorCell = row.insertCell();

        distanceCell.className = "distance";
        distanceCell.setAttribute("last", firstDistances[i]);
        predecessorCell.className = "predecessor";
        if (firstPredecessors[i] !== null) {
            predecessorCell.setAttribute("last", firstPredecessors[i]);
        } else {
            predecessorCell.setAttribute("last", "null");
        }

        vertexCell.textContent = "N" + i;
        distanceCell.textContent = firstDistances[i];
        predecessorCell.textContent = "null";
    }
}

function updateInfoTable() {
    if (infoTableStacks.distanceStack.length === 0) return;
    nextDistances = infoTableStacks.distanceStack.pop();
    nextPredecessors = infoTableStacks.predecessorStack.pop();

    const tableBody = document.querySelector("#infoTable tbody");

    const numRows = nodes.length;
    for (let i = 0; i < numRows; i++) {
        const distanceCell = tableBody.rows[i].cells[1];
        const predecessorCell = tableBody.rows[i].cells[2];


        if (Number(distanceCell.getAttribute("last")) !== nextDistances[i]) {
            distanceCell.innerHTML = "<strike>" + distanceCell.innerHTML + "</strike> " + nextDistances[i];
            distanceCell.setAttribute("last", nextDistances[i]);
        }

        if (parseInt(predecessorCell.getAttribute("last")) !== parseInt(nextPredecessors[i])) {
            if (nextPredecessors[i] !== null && predecessorCell.getAttribute("last") === "null") {
                predecessorCell.innerHTML = "<strike>" + predecessorCell.innerHTML + "</strike> N" + nextPredecessors[i];
            } else if (nextPredecessors[i] !== null) {
                predecessorCell.innerHTML = "<strike>" + predecessorCell.innerHTML + "</strike> N" + nextPredecessors[i];
            }
            predecessorCell.setAttribute("last", nextPredecessors[i]);
        }

    }

}

stepButton.addEventListener("click", () => {
    animateEdge();
    updateInfoTable();
})

exitButton.addEventListener("click", () => {
    toggleAnimationMode();
    edges.forEach(edge => edge.color = "gray");
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
            color: "gray",
        };
        edges.push(edge);
        console.log(DVgraph);
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
    // context.beginPath();
    // context.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI);
    // context.fillStyle = "white";
    // context.fill();
    // context.strokeStyle = "black";
    // context.stroke();

    context.drawImage(routerIcon, node.x - 50, node.y - 50, 100, 100);

    context.fillStyle = "white";
    context.textAlign = 'center'
    context.fillText("N" + nodes.indexOf(node), node.x, node.y + node.size / 6);

}

function drawEdge(edge) {
    edge.color != "gray" ? context.lineWidth = 8 : context.lineWidth = 5;
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
        context.fillStyle = "gray";
        context.fillText(text, -textWidth / 2, 7);
        context.restore();

    }
    // Self Edge
    else {
        context.fillStyle = "gray";
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
    if (!isConnected()) return "error";

    let current = start;

    // For the animation/Info Table
    let searchPath = [];
    let distanceHistory = [];
    let predecessorHistory = [];

    distanceHistory.push(Dijsktra.reduce((acc, node, i) => {
        acc[i] = node.distance;
        return acc;
    }, {}));

    predecessorHistory.push(Dijsktra.reduce((acc, node, i) => {
        acc[i] = node.PreviousVertex;
        return acc;
    }, {}));

    console.log(distanceHistory[0]);

    // iterate until no more unprocessedNodes
    while (unprocessedNodes.length != 0) {
        // for each edge that is connected to current node and unprocessedNode, check if that edge imrove the distance form start to the unprocessed node
        edges.forEach(edge => {
            if (edge.start == current && unprocessedNodes.includes(edge.end)) {
                if (Dijsktra[edge.end].distance > Dijsktra[current].distance + edge.cost || Dijsktra[edge.end].distance == Infinity) {
                    Dijsktra[edge.end].distance = Dijsktra[current].distance + edge.cost;
                    Dijsktra[edge.end].PreviousVertex = current;

                    // For animation/Info Table
                    searchPath.push(edges.indexOf(edge));
                    distanceHistory.push(Dijsktra.reduce((acc, node, i) => {
                        acc[i] = node.distance;
                        return acc;
                    }, {}));

                    predecessorHistory.push(Dijsktra.reduce((acc, node, i) => {
                        acc[i] = node.PreviousVertex;
                        return acc;
                    }, {}));

                }

            } else if (edge.end == current && unprocessedNodes.includes(edge.start)) {
                if (Dijsktra[edge.start].distance > Dijsktra[current].distance + edge.cost || Dijsktra[edge.start].distance == Infinity) {
                    Dijsktra[edge.start].distance = Dijsktra[current].distance + edge.cost;
                    Dijsktra[edge.start].PreviousVertex = current;

                    // For animation/Info Table
                    searchPath.push(edges.indexOf(edge));
                    distanceHistory.push(Dijsktra.reduce((acc, node, i) => {
                        acc[i] = node.distance;
                        return acc;
                    }, {}));

                    predecessorHistory.push(Dijsktra.reduce((acc, node, i) => {
                        acc[i] = node.PreviousVertex;
                        return acc;
                    }, {}));
                }
            }
        })

        //processedNodes.push(current); // put current node
        unprocessedNodes.splice(unprocessedNodes.indexOf(current), 1); // remove current from unprocessedNodes
        current = updateCurrent(); // update current by finding the unprocessedNodes with the lowest distance
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
    console.log("traces:", distanceHistory, predecessorHistory);
    return {
        distanceHistory: distanceHistory,
        predecessorHistory: predecessorHistory,
        searching: searchPath,
        answer: route.reduce((acc, curr, i) => (i > 0) ? [...acc, edges.indexOf(edges.find(edge => ((edge.start === route[i - 1] && edge.end === curr && edge.cost === minCost(route[i - 1], curr)) || (edge.end === route[i - 1] && edge.start === curr && edge.cost === minCost(route[i - 1], curr)))))] : acc, []),
    };
}

function initializeDijstra(start) {
    // reset unprocessedNodes, processedNodes and Dijsktra in case not empty
    unprocessedNodes = [];
    //processedNodes = [];
    Dijsktra = [];
    for (let i = 0; i < nodes.length; i++) {
        // set distance in starting node to 0
        if (i == start) {
            const node = {
                distance: 0,
                PreviousVertex: null
            }
            Dijsktra.push(node);
            unprocessedNodes.push(i);
        } else { // otherwise to infinity
            const node = {
                distance: Infinity,
                PreviousVertex: null
            }
            Dijsktra.push(node);
            unprocessedNodes.push(i);
        }
    }
}

function updateCurrent() { // helper function for runDijstra to find next current node
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

function isConnected() {
    // Create an adjacency list from the edges array
    const adjacencyList = {};
    for (const node of Object.keys(nodes)) {
        adjacencyList[parseInt(node)] = [];
    }
    for (const edge of edges) {
        adjacencyList[edge.start].push(edge.end);
        adjacencyList[edge.end].push(edge.start);
    }

    // Perform a DFS traversal starting from any node
    const visited = {};
    for (const node of nodes) {
        visited[node] = false;
    }
    dfs(Object.keys(nodes)[0], visited, adjacencyList);

    // Check if all nodes were visited
    for (const node of Object.keys(nodes)) {
        if (!visited[node]) {
            return false;
        }
    }
    return true;
}

function dfs(node, visited, adjacencyList) {
    visited[node] = true;
    for (const neighbor of adjacencyList[node]) {
        if (!visited[neighbor]) {
            dfs(neighbor, visited, adjacencyList);
        }
    }
}


function DvAlgorithm(source) {
    initializeDv();
    const distances = {};
    const predecessors = {};
    const predecessorHistory = [];
    const distanceHistory = [];

    // initialize
    for (const vertex in DVgraph) {
        distances[vertex] = Infinity;
        predecessors[vertex] = null;
    }

    predecessorHistory.push({
        ...predecessors
    });

    // set the distance to the source to 0
    distances[source] = 0;
    distanceHistory.push({
        ...distances
    });
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

                    // For the animation/info tables
                    predecessorHistory.push({
                        ...predecessors
                    });
                    distanceHistory.push({
                        ...distances
                    });
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
        distances: distances,
        predecessorHistory: predecessorHistory,
        distanceHistory: distanceHistory,
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

function setup() {
    initializeDv();
    draw();
    draw();
}

function init() {
    routerIcon = new Image();
    routerIcon.src = "assets/router.png";
    routerIcon.onload = function () {
        setup();
    }
}
init();