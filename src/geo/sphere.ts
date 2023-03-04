export function getSphere(radius = 1, segments = 32) {
    // Create arrays to hold the sphere's vertices and indices
    const vertexStep = 8;
    const vertices = new Float32Array((segments + 1) * (segments + 1) * vertexStep);
    const indices = new Uint16Array(segments * segments * 6);

    // Create the sphere's vertices
    for (let i = 0; i <= segments; i++) {
        const theta = i * Math.PI / segments;
        const r = Math.sin(theta);
        const h = Math.cos(theta);

        for (let j = 0; j <= segments; j++) {
            const phi = j * 2 * Math.PI / segments;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * r;
            const y = h;
            const z = sinPhi * r;

            const baseIndex = (i * (segments + 1) + j) * vertexStep;
            vertices[baseIndex + 0] = x * radius;
            vertices[baseIndex + 1] = y * radius;
            vertices[baseIndex + 2] = z * radius;

            // normal
            vertices[baseIndex + 3] = x;
            vertices[baseIndex + 4] = y;
            vertices[baseIndex + 5] = z;

            // texture
            vertices[baseIndex + 6] = j / segments;
            vertices[baseIndex + 7] = i / segments;
        }
    }

    // Create the sphere's indices
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const first = (i * (segments + 1)) + j;
            const second = first + segments + 1;

            const baseIndex = (i * segments + j) * 6;
            indices[baseIndex + 0] = first;
            indices[baseIndex + 1] = second;
            indices[baseIndex + 2] = first + 1;

            indices[baseIndex + 3] = second;
            indices[baseIndex + 4] = second + 1;
            indices[baseIndex + 5] = first + 1;
        }
    }

    return { vertices, indices, vertexStep };
}

export function getRandomArray(instanceCount: number, baseInstanceNum: number, radius: number) {
    const randomArray = new Float32Array(instanceCount * baseInstanceNum);
    for (let i = 0; i < instanceCount; i++) {
        const baseIndex = i * baseInstanceNum;
        randomArray[baseIndex + 0] = Math.random() * 2 - 1;
        randomArray[baseIndex + 1] = Math.random() * 2 - 1;
        randomArray[baseIndex + 2] = Math.random() * 2 - 1;
        randomArray[baseIndex + 4] = Math.random() * 2 - 1;
        randomArray[baseIndex + 5] = Math.random() * 2 - 1;
        randomArray[baseIndex + 6] = Math.random() * 2 - 1;
        randomArray[baseIndex + 7] = (Math.random() * 0.6 + 0.4) * radius;
    }

    // for (let i = 0; i < instanceCount/2; i+=2) {
    //     let baseIndex = i * baseInstanceNum;

    //     randomArray[baseIndex + 0] = 0;
    //     randomArray[baseIndex + 1] = -0.5;
    //     randomArray[baseIndex + 2] = 0;


    //     randomArray[baseIndex + 4] = 0;
    //     randomArray[baseIndex + 5] = 5;
    //     randomArray[baseIndex + 6] = 0;

    //     randomArray[baseIndex + 7] = radius;
        

    //     baseIndex += baseInstanceNum;
        
    //     randomArray[baseIndex + 0] = 0;
    //     randomArray[baseIndex + 1] = 0.5;
    //     randomArray[baseIndex + 2] = 0;

    //     randomArray[baseIndex + 4] = 0;
    //     randomArray[baseIndex + 5] = -5;
    //     randomArray[baseIndex + 6] = 0;
    //     randomArray[baseIndex + 7] = 0.5 * radius;
        
    // }

    return randomArray;
}