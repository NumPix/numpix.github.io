import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js' 
import * as Vertex from './Vertex.js'

Node = Vertex.Node

function getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) {
        if (board[i] === '-') moves.push(i);
    }
    return moves;
}

function makeMove(board, index, player) {
    return board.slice(0, index) + player + board.slice(index + 1);
}

export function checkWinner(board) {
    const lines = [
        [0,1,2],[3,4,5],[6,7,8], 
        [0,3,6],[1,4,7],[2,5,8], 
        [0,4,8],[2,4,6]   
    ];
    for (const [a,b,c] of lines) {
        if (board[a] !== '-' && board[a] === board[b] && board[b] === board[c]) {
            return board[a];
        }
    }
    return null;
}

export function getSymmetries(board) {
    const boards = [];
    const size = 3;

    const arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(board.slice(i * size, i * size + size).split(''));
    }

    const rotate = b => {
        const r = [];
        for (let i = 0; i < size; i++) {
            r.push([]);
            for (let j = 0; j < size; j++) {
                r[i][j] = b[size - j - 1][i];
            }
        }
        return r;
    };

    const mirrorH = b => b.map(row => [...row].reverse());
    const mirrorV = b => [...b].reverse();

    const arrToStr = b => b.flat().join('');

    let boardsSet = new Set();
    let current = arr;

    for (let i = 0; i < 4; i++) {
        current = i === 0 ? current : rotate(current);
        boardsSet.add(arrToStr(current));
        boardsSet.add(arrToStr(mirrorH(current)));
        boardsSet.add(arrToStr(mirrorV(current)));
    }

    return Array.from(boardsSet);
}

function canonicalBoard(board) {
    return getSymmetries(board).sort()[0];
}

function buildGraphTicTacToe(board = '---------', player = 'X', depth = 0, visited = new Map(), prevNodeCoords = null) {
    const canonBoard = canonicalBoard(board);

    if (visited.has(canonBoard)) return visited.get(canonBoard);

    if (prevNodeCoords == null) prevNodeCoords = new THREE.Vector3(0, 0, 0);

    const newCoords = prevNodeCoords.clone().add(new THREE.Vector3(
        Math.random() * 1,
        Math.random() * 1,
        Math.random() * 1
    ));

    const node = new Node(newCoords, canonBoard, depth);
    visited.set(canonBoard, node);

    if (depth === 9 || checkWinner(canonBoard)) return node;

    const moves = getAvailableMoves(board);
    for (const move of moves) {
        const nextBoard = makeMove(board, move, player);
        const nextPlayer = player === 'X' ? 'O' : 'X';
        const neighborNode = buildGraphTicTacToe(nextBoard, nextPlayer, depth + 1, visited, newCoords);
        node.neighbors.push(neighborNode);
        Vertex.setNeighbors(node, neighborNode);
    }

    return node;
}


function flattenGraph(root) {
    const visited = new Map();

    function dfs(node) {
        if (visited.has(node.id)) return;
        visited.set(node.id, node);
        for (const neighbor of node.neighbors) dfs(neighbor);
    }

    dfs(root);
    return Array.from(visited.values());
}

export function GetStates(depth = 0) {
    const allStates = buildGraphTicTacToe('---------', 'X', depth);
    const allNodes = flattenGraph(allStates);

    return allNodes;
}