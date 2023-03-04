import { mat4, vec3 } from 'gl-matrix';

const projectionMatrix = mat4.create();
const viewMatrix = mat4.create();

export function getMatrix(datas: {
    aspect?: number, fov?: number, near?: number,
    far?: number, eye: Readonly<vec3>, center?: Readonly<vec3>, up?: Readonly<vec3>
}) {
    const { aspect = 1, fov = Math.PI / 6, near = 0.01, far = 1000, eye, center = [0, 0, 0], up = [0, 1, 0] } = datas;
    
    mat4.perspectiveZO(projectionMatrix, fov, aspect, near, far);
    // mat4.orthoZO(projectionMatrix, -aspect, aspect, -1, 1, near, far);
    
    // eye[2] = 0;
    mat4.lookAt(viewMatrix, eye, center, up);
    // const modelMatrix = mat4.create();
    // mat4.rotate(modelMatrix, modelMatrix, Math.PI / 4, [0, 1, 0]);
    // mat4.rotate(modelMatrix, modelMatrix, Math.PI / 4, [1, 0, 0]);
    const matrix = mat4.create();
    mat4.multiply(matrix, projectionMatrix, viewMatrix);
    // mat4.multiply(matrix, matrix, modelMatrix);

    
    return matrix;
}