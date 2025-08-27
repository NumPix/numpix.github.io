import * as THREE from 'three'

const k = 0.3;
const restLength = 1;
const kSpring = 120;

export class Node {
    coordinates;
    id;
    velocity;
    neighbors;
    depth;
    evaluation;

    constructor(coordinates, id, depth) {
        this.coordinates = coordinates;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.neighbors = [];
        this.id = id;
        this.depth = depth;
        this.evaluation = [null, null];
    }
}

export function getRepelForce(n1, n2) {
    const dist2 = n1.coordinates.distanceToSquared(n2.coordinates);
    if (dist2 === 0) return new THREE.Vector3(0,0,0); 

    const forceMagnitude = k / dist2;
    const direction = n1.coordinates.clone().sub(n2.coordinates).normalize();
    const force = direction.multiplyScalar(forceMagnitude);

    return force
}

export function getSpringForce(n1, n2) {
    const dir = n2.coordinates.clone().sub(n1.coordinates);
    const len = dir.length();
    const stretch = len - restLength;
    const force = dir.normalize().multiplyScalar(kSpring * stretch);

    return force;
}

export function setNeighbors(n1, n2) {
    n1.neighbors.push(n2);
    n2.neighbors.push(n1);
}

export function getParents(n) {
    let parents = []
    n.neighbors.forEach(v => {
        if (v.depth < n.depth) {
            parents.push(v);
        }
    })

    return parents;
}

export function getChildren(n) {
    let children = []
    n.neighbors.forEach(v => {
        if (v.depth > n.depth) {
            children.push(v);
        }
    })

    return children;
}