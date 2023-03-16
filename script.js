var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var nodes = [];
var edges = [];

var drag = false;
var selectedNode = null;

canvas.addEventListener('mousedown', function (e) {
    drag = true;
    var mousePos = getMousePos(canvas, e);
    selectedNode = findNode(mousePos.x, mousePos.y);
    if (!selectedNode) {
        if (e.shiftKey) {
            var newNode = new Node(mousePos.x, mousePos.y);
            nodes.push(newNode);
            selectedNode = newNode;
        }
    }
});

canvas.addEventListener('mouseup', function (e) {
    drag = false;
    selectedNode = null;
});

canvas.addEventListener('mousemove', function (e) {
    if (drag && selectedNode) {
        var mousePos = getMousePos(canvas, e);
        selectedNode.x = mousePos.x;
        selectedNode.y = mousePos.y;
        draw();
    }
});

document.getElementById('host').addEventListener('mousedown', function (e) {
    e.preventDefault();
});

document.getElementById('edge').addEventListener('mousedown', function (e) {
    e.preventDefault();
});

document.getElementById('host').addEventListener('click', function (e) {
    e.preventDefault();
});

document.getElementById('edge').addEventListener('click', function (e) {
    e.preventDefault();
});

function Node(x, y) {
    this.x = x;
    this.y = y;
}

function Edge(node1, node2, cost) {
    this.node1 = node1;
    this.node2 = node2;
    this.cost = cost;
}

function findNode(x, y) {
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (x > node.x - 20 && x < node.x + 20 &&
            y > node.y - 20 && y < node.y + 20) {
            return node;
        }
    }
    return null;
}

function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}



document.getElementById('host').addEventListener('click', function (e) {
    e.preventDefault();
});

document.getElementById('edge').addEventListener('click', function (e) {
    e.preventDefault();
    var node1 = null;
    var node2 = null;
    canvas.addEventListener('mousedown', function (e) {
        var mousePos = getMousePos(canvas, e);
        if (!node1) {
            node1 = findNode(mousePos.x, mousePos.y);
            if (node1) {
                ctx.beginPath();
                ctx.moveTo(node1.x, node1.y);
            }
        } else if (!node2) {
            node2 = findNode(mousePos.x, mousePos.y);
            if (node2) {
                var cost = prompt("Enter the cost of the edge:", "1");
                if (cost) {
                    var newEdge = new Edge(node1, node2, cost);
                    edges.push(newEdge);
                }
                node1 = null;
                node2 = null;
                draw();
            }
        }
    });
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        ctx.beginPath();
        ctx.moveTo(edge.node1.x, edge.node1.y);
        ctx.lineTo(edge.node2.x, edge.node2.y);
        ctx.stroke();
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(edge.cost, (edge.node1.x + edge.node2.x) / 2, (edge.node1.y + edge.node2.y) / 2);
    }
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        ctx.fillStyle = "lightblue";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText("Host " + (i + 1), node.x - 25, node.y + 5);
    }
}

draw();