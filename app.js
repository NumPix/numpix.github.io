import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import * as States from './States.js';
import { Graph } from './Graph.js';
import { PhysicsEngine } from './Physics.js';
import { Renderer } from './Renderer.js';
import * as Analysis from './Analysis.js';
import * as GUI from './GUI.js';

const state = {
    renderedCount: 6000,
    isolateSelected: false,
    inspectMode: false,
    paused: false,
    selectedPointIndex: -1,
    selectedPoints: [],
    coloringMode: 0, // 0 - color by depth, 1 - color by probabilistic outcome, 2 - color by perfect-play outcome (minimax)
    mouse: new THREE.Vector2(),
};

const vertices = States.GetStates();
const graph = new Graph(vertices);
const physics = new PhysicsEngine(graph, { damping: 0.9 });
const renderer = new Renderer(graph, state);

GUI.initFilterGUI((filters) => {
    let filteredPoints = graph.vertices;

    if (filters.usePattern) {
        const pattern = filters.c0 + filters.c1 + filters.c2 +
            filters.c3 + filters.c4 + filters.c5 +
            filters.c6 + filters.c7 + filters.c8;
        const symmetries = States.getSymmetries(pattern);

        filteredPoints = filteredPoints.filter(n =>
            symmetries.some(sym => graph.matchBoard(sym, n.id))
        );

        formatBoard(pattern);
    }

    if (filters.useDepth) {
        filteredPoints = filteredPoints.filter(n => {
            return n.depth >= filters.minDepth && n.depth <= filters.maxDepth;
        });
    }

    state.selectedPoints = filteredPoints;
    state.selectedPointIndex = -1;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') state.isolateSelected = !state.isolateSelected;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        state.selectedPointIndex = -1;
        state.selectedPoints = [];
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyI') state.inspectMode = !state.inspectMode;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') state.paused = !state.paused;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit1') state.coloringMode = 0;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit2') state.coloringMode = 1;
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit3') state.coloringMode = 2;
});

window.addEventListener('click', onClick);

function onClick(event) {

    const rect = renderer.renderer.domElement.getBoundingClientRect();

    state.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    renderer.raycaster.setFromCamera(state.mouse, renderer.camera);
    const intersects = renderer.points ? renderer.raycaster.intersectObject(renderer.points) : [];

    if (intersects.length > 0) {
        const vertexIndex = intersects[0].index;
        state.selectedPointIndex = vertexIndex;

        if (!state.inspectMode) {
            state.selectedPoints = graph.getAncestors(graph.vertices[vertexIndex]);
        }

        formatBoard(graph.vertices[vertexIndex].id);
    }
}

function formatBoard(board) {
    const tiles = document.querySelectorAll('#board .tile div');
    board.split('').forEach((ch, i) => {
        const div = tiles[i];
        div.className = '';
        div.textContent = '';

        switch (ch) {
            case 'X':
            case 'O':
                div.classList.add(ch);
                div.textContent = ch;
                break;
            case 'x':
                div.classList.add('X', 'red');
                div.textContent = 'X';
                break;
            case 'o':
                div.classList.add('O', 'red');
                div.textContent = 'O';
                break;
            case '-':
                break;
            case '!':
                div.classList.add('red-bg');
                break;
            case '*':
                div.classList.add('green-bg');
                break;
        }
    });
}

function animate() {
    if (!state.paused) {
        physics.step(state);
    }
    const visibleVertices = graph.getVisibleVertices(state);
    const neighborPairs = graph.getNeighborPairs(visibleVertices);

    const nodeCounter = document.getElementById('nodeCounter');
    const edgeCounter = document.getElementById('edgeCounter');
    const inspectModeFlag = document.getElementById('inspectModeFlag');
    const colorModeLabel = document.getElementById('colorModeLabel');
    const pauseLabel = document.getElementById('pauseLabel');

    nodeCounter.textContent = `Nodes selected: ${state.selectedPoints.length}`;
    edgeCounter.textContent = `Edges selected: ${graph.getNeighborPairs(state.selectedPoints).length}`;
    inspectModeFlag.textContent = `Inspect mode ${state.inspectMode ? 'on' : 'off'}`;
    colorModeLabel.textContent = `Color mode: ${state.coloringMode === 0 ? 'depth' : state.coloringMode === 1 ? 'probabilistic outcome' : 'perfect-play outcome (minimax)'}`;
    pauseLabel.textContent = `Physics: ${state.paused ? 'off' : 'on'}`;

    renderer.update(visibleVertices, neighborPairs);
    renderer.render();
}

const loadingScreen = document.getElementById('loadingScreen');
const helpLabel = document.getElementById('help');
const loader = document.querySelector('#loadingScreen .loader');

const fill = document.querySelector('.progressFill');

loadingScreen.style.display = 'flex';
helpLabel.style.display = 'none';
document.querySelectorAll('.dg').forEach(gui => gui.style.display = 'none');

function processEvaluations(vertices) {
    let index = 0;
    const batchSize = 1;

    function nextChunk() {
        const end = Math.min(index + batchSize, vertices.length);

        for (; index < end; index++) {
            const v = vertices[vertices.length - 1 - index];
            v.evaluation[0] = Analysis.getProbabilisticEvaluation(graph, v);
            v.evaluation[1] = Analysis.getMinimaxEvaluation(v);
        }

        const percent = Math.floor((index / vertices.length) * 100);
        loader.textContent = `Loading: ${percent}%`;
        fill.style.width = `${percent}%`;

        if (index < vertices.length) {
            setTimeout(nextChunk, 0);
        } else {
            loadingScreen.style.display = 'none';
            helpLabel.style.display = 'block';
            document.querySelectorAll('.dg').forEach(gui => gui.style.display = 'block');
            renderer.renderer.setAnimationLoop(animate);
        }
    }

    nextChunk();
}

setTimeout(() => {
    processEvaluations(graph.vertices);
}, 0);