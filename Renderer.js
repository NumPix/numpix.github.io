import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/Addons.js';

export class Renderer {
    constructor(graph, state, containter = document.body) {
        this.graph = graph;
        this.state = state;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        containter.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.05;
        this.mouse = new THREE.Vector2();

        this._initLineGeometry();
        this._initPointGeometry();

        window.addEventListener('resize', () => this._onResize());
    }

    _initLineGeometry() {
        const maxEdges = this.graph.vertices.reduce(
            (sum, v) => sum + v.neighborIndices.length,
            0
        )

        this.linePositions = new Float32Array(maxEdges * 2 * 3);
        this.lineColors = new Float32Array(maxEdges * 2 * 4);

        this.lineGeometry = new THREE.BufferGeometry();
        this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
        this.lineGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 4));

        const lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true
        });

        this.lines = new THREE.LineSegments(this.lineGeometry, lineMaterial);
        this.scene.add(this.lines);
    }

    _initPointGeometry() {
        const maxVertices = this.graph.vertices.length;

        this.pointPositions = new Float32Array(maxVertices * 3);
        this.pointColors = new Float32Array(maxVertices * 4);
        this.pointSizes = new Float32Array(maxVertices);

        this.pointGeometry = new THREE.BufferGeometry();
        this.pointGeometry.setAttribute('position', new THREE.BufferAttribute(this.pointPositions, 3));
        this.pointGeometry.setAttribute('color', new THREE.BufferAttribute(this.pointColors, 4));
        this.pointGeometry.setAttribute('size', new THREE.BufferAttribute(this.pointSizes, 1));

        const pointMaterial = new THREE.ShaderMaterial({
            transparent: true,
            vertexShader: `
                attribute float size;
                attribute vec4 color;
                varying vec4 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (10.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec4 vColor;
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if(dist > 0.5) discard;
                    gl_FragColor = vColor;
                }
            `
        });

        this.points = new THREE.Points(this.pointGeometry, pointMaterial);
        this.scene.add(this.points);
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(visibleVertices, neighborPairs) {
        const maxDepth = Math.max(...visibleVertices.map(v => v.depth));
        const minDepth = Math.min(...visibleVertices.map(v => v.depth));

        const selectedColorBase1 = new THREE.Color(1, 1, 0);
        const selectedColorBase2 = new THREE.Color(0, 1, 1);

        const getColorParameter = (vertex) => {
            switch (this.state.coloringMode) {
                case 0: 
                    return (vertex.depth - minDepth) / (maxDepth - minDepth || 1);
                case 1:
                    return (-vertex.evaluation[0] + 1) * 0.5; 
                case 2:
                    return (-vertex.evaluation[1] + 1) * 0.5;
            }
        };

        const getAlphaParameter = (t) => {
            switch (this.state.coloringMode) {
                case 0: 
                    return 0.3 * t + 1 - t;
                case 1:
                    return 2.8 * (t - 0.5) * (t - 0.5) + 0.3;
                case 2:
                    return 2.8 * (t - 0.5) * (t - 0.5) + 0.3;
            }
        }

        neighborPairs.forEach(([v1, v2], i) => {
            this.linePositions.set([v1.coordinates.x, v1.coordinates.y, v1.coordinates.z], i * 6);
            this.linePositions.set([v2.coordinates.x, v2.coordinates.y, v2.coordinates.z], i * 6 + 3);

            const t1 = getColorParameter(v1);
            const t2 = getColorParameter(v2);

            const c1 = new THREE.Color(1 - t1, 0, t1);
            const c2 = new THREE.Color(1 - t2, 0, t2);

            const a1 = getAlphaParameter(t1);
            const a2 = getAlphaParameter(t2);

            this.lineColors.set([c1.r, c1.g, c1.b, a1], i * 8);
            this.lineColors.set([c2.r, c2.g, c2.b, a2], i * 8 + 4);

            if (this.state.selectedPoints.includes(v1) && this.state.selectedPoints.includes(v2)) {
                const selectedColor1 = new THREE.Color().lerpColors(selectedColorBase1, selectedColorBase2, t1);
                const selectedColor2 = new THREE.Color().lerpColors(selectedColorBase1, selectedColorBase2, t2);

                this.lineColors.set([selectedColor1.r, selectedColor1.g, selectedColor1.b, 1], i * 8);
                this.lineColors.set([selectedColor2.r, selectedColor2.g, selectedColor2.b, 1], i * 8 + 4);
            }
        });

        this.lineGeometry.setDrawRange(0, neighborPairs.length * 2);
        this.lineGeometry.attributes.position.needsUpdate = true;
        this.lineGeometry.attributes.color.needsUpdate = true;


        visibleVertices.forEach((v, i) => {
            this.pointPositions.set([v.coordinates.x, v.coordinates.y, v.coordinates.z], i * 3);

            const t = getColorParameter(v);
            const c = new THREE.Color(1 - t, 0, t);
            const a = getAlphaParameter(t);
            const s = 5 * (1 - a) + 8 * a;

            this.pointColors.set([c.r, c.g, c.b, a], i * 4);
            this.pointSizes[i] = s;

            if (this.state.selectedPoints.includes(v)) {
                this.pointSizes[i] = s * 1.5;
                const selectedColor = new THREE.Color().lerpColors(selectedColorBase1, selectedColorBase2, t);
                this.pointColors.set([selectedColor.r, selectedColor.g, selectedColor.b, 1], i * 4);
            }

            if (i === this.state.selectedPointIndex) {
                this.pointSizes[i] = s * 3;
                this.pointColors[i * 4 + 3] = 1;
            }
        });

        this.pointGeometry.setDrawRange(0, visibleVertices.length);
        this.pointGeometry.attributes.position.needsUpdate = true;
        this.pointGeometry.attributes.color.needsUpdate = true;
        this.pointGeometry.attributes.size.needsUpdate = true;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}