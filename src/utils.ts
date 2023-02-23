let device: GPUDevice | null = null;
export async function getGpuDevice() {
    if (device) return device;
    try {
        const adapter = await navigator.gpu.requestAdapter();
        device = await adapter!.requestDevice();
    } catch (e) {
        alert('WebGPU is not supported');
        throw e;
    }
    return device;
}

type NormalArray = Uint32Array | Float32Array;
export function getUniformBuffer(typeArray: NormalArray) {
    const buffer = device!.createBuffer({
        size: typeArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });

    typeArray instanceof Uint32Array ? new Uint32Array(buffer.getMappedRange()).set(typeArray) : new Float32Array(buffer.getMappedRange()).set(typeArray);
    buffer.unmap();
    return buffer;
}


export function getVertexBuffer(typeArray: Float32Array) {
    const buffer = device!.createBuffer({
        size: typeArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
    });

    new Float32Array(buffer.getMappedRange()).set(typeArray);
    buffer.unmap();
    return buffer;
}

export function getBuffer(typeArray: Float32Array | Uint16Array, usage: GPUBufferUsageFlags) {
    const buffer = device!.createBuffer({
        size: typeArray.byteLength,
        usage,
        mappedAtCreation: true
    });

    typeArray instanceof Uint16Array ? new Uint16Array(buffer.getMappedRange()).set(typeArray) :
        new Float32Array(buffer.getMappedRange()).set(typeArray);

    buffer.unmap();
    return buffer;
}


export function getTexture(width: number, height: number, format: GPUTextureFormat, usage: GPUTextureUsageFlags) {
    return device!.createTexture({
        size: [width, height],
        format,
        usage,

    });
}

async function createImageBitmapFromUrl(url: string): Promise<GPUImageCopyExternalImage['source']> {
    return new Promise<ImageBitmap>((resolve, reject) => {
        const data = fetch(url).then(res => res.blob());
        data.then(blob => {
            createImageBitmap(blob).then(imageBitmap => {
                resolve(imageBitmap);
            });
        })
    });

    // const image = new Image();
    // image.src = url;
    // await image.decode();
    // return createImageBitmap(image);

    const image = new Image();
    image.src = url;
    return new Promise((resolve) => {
        image.onload = () => {

            // const canvas = new OffscreenCanvas(image.width, image.height);

            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const context = canvas.getContext('2d')!;
            // @ts-ignore
            context.drawImage(image, 0, 0);

            resolve(canvas);
        }
    })
}

export async function getTextureByUrl(url: string) {
    const imageBitmap: GPUImageCopyExternalImage['source'] = await createImageBitmapFromUrl(url);
    const texture = getTexture(imageBitmap.width, imageBitmap.height, "bgra8unorm", GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT);
    // console.log(imageBitmap.toDataURL());
    const copySize = { width: imageBitmap.width, height: imageBitmap.height };
    // const copySize = [imageBitmap.width, imageBitmap.height, 1];
    device!.queue.copyExternalImageToTexture({ source: imageBitmap, flipY: false }, { texture }, copySize);
    // device!.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, {width: imageBitmap.width, height: imageBitmap.height});
    return texture;
}

export function getSampler() {
    return device!.createSampler({
        magFilter: "linear",
        minFilter: "linear",
        mipmapFilter: "linear"
    });
}

async function wait(time: number) {
    return new Promise((resolve => {
        setTimeout(resolve, time)
    }))
} 