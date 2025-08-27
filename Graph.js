import * as Vertex from './Vertex.js'

export class Graph {
    constructor(vertices) {
        this.vertices = vertices;

        this._initGeometry();
    }

    _initGeometry() {
        this.vertices.forEach(v => {
            v.neighborIndices = v.neighbors
                .map(n => this.vertices.indexOf(n))
                .filter(j => j !== -1);
        });
    }

    getVisibleVertices(state) {
        if (state.isolateSelected && state.selectedPoints.length > 0) {
            return state.selectedPoints.slice();
        }
        return this.vertices.slice(0, state.renderedCount);
    }

    getAncestors(vertex) {
        const visited = new Set();
        const stack = [vertex];

        while (stack.length > 0) {
            const node = stack.pop();
            if (visited.has(node)) continue;
            visited.add(node);

            const parents = Vertex.getParents(node);
            for (const p of parents) {
                if (!visited.has(p)) stack.push(p);
            }
        }

        return Array.from(visited);
    }

    getDescendants(vertex) {
        const visited = new Set();
        const stack = [vertex];

        while (stack.length > 0) {
            const node = stack.pop();
            if (visited.has(node)) continue;
            visited.add(node);

            const children = Vertex.getChildren(node);
            for (const c of children) {
                if (!visited.has(c)) stack.push(c);
            }
        }

        return Array.from(visited);
    }

    getLeafDescendants(vertex) {
        const descendants = this.getDescendants(vertex);

        return descendants.filter(d => Vertex.getChildren(d).length === 0);
    }

    getNeighborPairs(visibleVertices) {
        const pairs = [];
        const seen = new Set();

        visibleVertices.forEach((v, i) => {
            v.visibleNeighborIndices = v.neighborIndices
                .map(j => this.vertices[j])
                .filter(n => visibleVertices.includes(n))
                .map(n => visibleVertices.indexOf(n));

            v.visibleNeighborIndices.forEach(j => {
                if (i < j) {
                    const key = `${i}-${j}`;
                    if (!seen.has(key)) {
                        pairs.push([v, visibleVertices[j]]);
                        seen.add(key);
                    }
                }
            });
        });

        return pairs;
    }

    getNodesByPattern(pattern) {
        return this.vertices.filter(node => matchBoard(pattern, node.id));
    }

    getNodesByDepth(minDepth, maxDepth) {
        return this.vertices.filter(node => {
            return node.depth >= minDepth && node.depth <= maxDepth;
        });
    }

    matchBoard(pattern, state) {
        if (pattern.length !== state.length) return false;

        for (let i = 0; i < state.length; i++) {
            const p = pattern[i];
            const c = state[i];

            if (p === '*') continue;
            if (p === 'X' && c !== 'X') return false;
            if (p === 'O' && c !== 'O') return false;
            if (p === '-' && c !== '-') return false;
            if (p === '!' && c === '-') return false;
            if (p === 'x' && c === 'X') return false;
            if (p === 'o' && c === 'O') return false;
        }

        return true;
    }
}
