import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js'
import * as Vertex from './Vertex.js'

export class PhysicsEngine {
    constructor(graph, config={}) {
        this.graph = graph;

        this.config = Object.assign({
            damping: 0.85,
            cellSize: 5,
            timeStep: 0.016,
        }, config);

        this.forces = graph.vertices.map(() => new THREE.Vector3());
    }

    step(state) {
        const dt = this.config.timeStep;

        const visibleVertices = this.graph.getVisibleVertices(state);

        const visibleSet = new Set(visibleVertices);

        visibleVertices.forEach((v) => {
            v.visibleNeighborIndices = v.neighborIndices
                .map(j => this.graph.vertices[j])
                .filter(n => visibleSet.has(n))
                .map(n => visibleVertices.indexOf(n));
        });

        visibleVertices.forEach((v, i) => {
            this.forces[i].set(0, 0, 0);
            v.velocity.multiplyScalar(this.config.damping);
        });

        const grid = new Map();
        const getCellKey = (pos) => {
            const {cellSize} = this.config;
            return `${Math.floor(pos.x / cellSize)},${Math.floor(pos.y / cellSize)},${Math.floor(pos.z / cellSize)}`;
        };

        visibleVertices.forEach(v => {
            const key = getCellKey(v.coordinates);
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(v);
        });

        visibleVertices.forEach((v, i) => {
            const cellX = Math.floor(v.coordinates.x / this.config.cellSize);
            const cellY = Math.floor(v.coordinates.y / this.config.cellSize);
            const cellZ = Math.floor(v.coordinates.z / this.config.cellSize);

            for (let dx = -1; dx <= 1; ++dx) {
                for (let dy = -1; dy <= 1; ++dy) {
                    for (let dz = -1; dz <= 1; ++dz) {
                        const neighbors = grid.get(`${cellX + dx},${cellY + dy},${cellZ + dz}`);
                        if (!neighbors) continue;

                        neighbors.forEach(other => {
                            if (v === other) return;
                            
                            const j = visibleVertices.indexOf(other);
                            if (j === -1) return;

                            const force = Vertex.getRepelForce(v, other);

                            this.forces[i].add(force);
                            this.forces[j].sub(force);
                        }); 
                    }
                }
            }
        });

        visibleVertices.forEach((v, i) => {
            v.visibleNeighborIndices.forEach(j => {
                if (i < j) {
                    const force = Vertex.getSpringForce(v, visibleVertices[j]).multiplyScalar(dt);
                    
                    this.forces[i].add(force);
                    this.forces[j].sub(force);
                }
            });
        });

        visibleVertices.forEach((v, i) => {
            v.velocity.add(this.forces[i]);
            v.coordinates.add(v.velocity.clone().multiplyScalar(dt));
        })
    }
}