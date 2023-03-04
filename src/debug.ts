export function gpuDebug(device: GPUDevice, render: () => any) {
    device.pushErrorScope('out-of-memory');
    device.pushErrorScope('validation');
    device.pushErrorScope('internal');

    render()
    // Detect unexpected errors.
    device.popErrorScope().then(showError);
    device.popErrorScope().then(showError);
    device.popErrorScope().then(showError);
}

function showError(error: GPUError | null) {
    if (error !== null) {
        console.error(error);
    }
}