export function getRect() {
    // Create arrays to hold the sphere's vertices and indices
    const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

    return { vertices, indices };
}
