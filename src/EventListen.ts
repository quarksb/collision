import { vec3 } from "gl-matrix";
import type { Params } from "./main";

export function spaceWatch(globalState: { loopNum: number | null; }, show: () => void) {
    document.addEventListener("keydown", function (event) {
        if (event.code === "Space" || event.code === "Enter") {
            if (globalState.loopNum) {
                cancelAnimationFrame(globalState.loopNum);
                globalState.loopNum = null;
                return;
            } else {
                show();
            }
        }
        if (event.code === "ArrowLeft") {
            console.log("left");
        }
    });
}

export function rotateWatch(canvas: HTMLCanvasElement, Params: Params) {
    let leftButtonDown = false;
    canvas.addEventListener('mousemove', (event) => {
        if (!leftButtonDown) return;
        // Calculate rotation angles based on mouse position
        const x = event.clientX / canvas.width;
        const y = event.clientY / canvas.height;
        Params.rotateX = (x - 0.5) * 2 * Math.PI;
        Params.rotateY = (y - 0.5) * Math.PI;
    });

    canvas.addEventListener('mousedown', (event) => {
        leftButtonDown = true;
    });

    canvas.addEventListener('mouseup', (event) => {
        leftButtonDown = false;
    });
}

export function getEyeAndFov(params: Params, thetaX = 0, thetaY = 0) {
    const fov = Math.PI * params.fov / 180;
    const dis = params.dist;

    const eye = new Float32Array([0, 0, dis + 1]);
    vec3.rotateX(eye, eye, [0, 0, 0], thetaY);
    vec3.rotateY(eye, eye, [0, 0, 0], thetaX);
    return { eye, fov };
}