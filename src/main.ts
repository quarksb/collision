import "./index.css";
import { getBuffer, getGpuDevice, getSampler, getTextureByUrl, getTextureFromUrls, getUniformBuffer, getVertexBuffer } from "./utils";
import printShader from './print.wgsl';
import computeShader from './compute.wgsl';
// import imgUrl from './ball.png';
import { textureUrls } from './texture';
import type { RenderPipelineConfig } from "./core/type";
import { getRenderPipeline, render, RenderPassConfig } from "./core/render";
import { compute, initCompute } from "./core/compute";
import { Pane } from "tweakpane";
import { getRandomArray, getSphere } from "./geo/sphere";
import { getBindGroup, getLayout, GPUBindingLayoutInfo } from "./core/layout";
import { getMatrix } from "./matrix";
import { getEyeAndFov, rotateWatch, spaceWatch } from "./EventListen";
import { mat4 } from "gl-matrix";

export interface Params {
  timeStride: number;
  size: number;
  number: number;
  loopNum: number | null;
  rotateX: number,
  rotateY: number,
  fov: number,
  mvp: mat4,
  aspect: number,
}

const Params: Params = {
  timeStride: 50,
  size: 50,
  number: 50,
  loopNum: null,
  rotateX: 0,
  rotateY: 0,
  fov: 30,
  mvp: mat4.create(),
  aspect: 1,
}


function init(device: GPUDevice) {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const size = Math.round(Math.min(width, height) * 0.8);
  if (size < 500) {
    canvas.width = size;
    canvas.height = size;
  } else {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.left = '0%';
    canvas.style.top = '0%';
  }

  Params.aspect = canvas.width / canvas.height;

  const context = canvas.getContext("webgpu")!;
  context?.configure({
    device,
    format: "bgra8unorm",
    alphaMode: "premultiplied",
    // alphaMode: "opaque",
  });

  const { vertices, vertexStep, indices } = getSphere(1, 20);
  // const { vertices, indices } = getRect();
  const vertexBuffer = getVertexBuffer(vertices);
  const indexBuffer = getBuffer(indices, GPUBufferUsage.INDEX);

  const bindingLayouts: GPUBindingLayoutInfo[] = [
    { type: 'buffer', visibility: GPUShaderStage.VERTEX, info: { type: "uniform" } },
    { type: 'sampler', visibility: GPUShaderStage.FRAGMENT, info: { type: "filtering" } },
    { type: 'texture', visibility: GPUShaderStage.FRAGMENT, info: { sampleType: "float" } }
  ]
  const renderLayout = getLayout(device, bindingLayouts);
  return { context, vertexBuffer, vertexStep, indexBuffer, renderLayout, canvas };
}

async function loadResource() {
  const promises = textureUrls.map(async ({ name, url }) => {
    const texture = await getTextureByUrl(url);
    return { [name]: texture };
  });

  const textures = await Promise.all(promises);
  return textures;
}

async function draw() {
  const device = await getGpuDevice();
  const { context, vertexBuffer, vertexStep, indexBuffer, renderLayout, canvas } = init(device);
  const textures = await loadResource();

  const { eye, fov } = getEyeAndFov(Params, Params.rotateX, Params.rotateY);
  console.log(fov);

  Params.mvp = getMatrix({ eye, aspect: Params.aspect, fov });
  // const mvp = mat4.create()
  const paramBuffer = getUniformBuffer(Params.mvp as Float32Array);

  // const instanceCount = Params.number * 10;
  const instanceCount = 1000;
  const baseInstanceNum = 8; // num should be multiple of 4, or you will get error when instanceCount is not small
  const randomArray = getRandomArray(instanceCount, baseInstanceNum, Params.size * 2E-3);

  const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
  const instanceBuffers = [getBuffer(randomArray, usage), getBuffer(randomArray, usage)];

  console.log(textures);
  
  let resources = [{ buffer: paramBuffer }, getSampler(), textures[0].baseColor.createView()];
  const renderBindGroup = getBindGroup(device, renderLayout, resources);

  const vertexBuffers = new Map<number, GPUBuffer>();
  vertexBuffers.set(0, vertexBuffer);
  const renderBindGroups = new Map<number, GPUBindGroup>();
  renderBindGroups.set(0, renderBindGroup);

  const computeBuffer = device.createBuffer({
    size: 4 * 1,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Float32Array(computeBuffer.getMappedRange()).set([Params.timeStride * 5E-5]);
  computeBuffer.unmap();

  const bindingLayouts: GPUBindingLayoutInfo[] = [
    { type: 'buffer', visibility: GPUShaderStage.COMPUTE, info: { type: "read-only-storage" } },
    { type: 'buffer', visibility: GPUShaderStage.COMPUTE, info: { type: "storage" } },
    { type: 'buffer', visibility: GPUShaderStage.COMPUTE, info: { type: "uniform" } }
  ]

  const computeLayout = getLayout(device, bindingLayouts);

  const computeBindGroupArray = [
    getBindGroup(device, computeLayout, [{ buffer: instanceBuffers[0] }, { buffer: instanceBuffers[1] }, { buffer: computeBuffer }]),
    getBindGroup(device, computeLayout, [{ buffer: instanceBuffers[1] }, { buffer: instanceBuffers[0] }, { buffer: computeBuffer }]),
  ]

  const computeBindGroups = new Map<number, GPUBindGroup>();
  const computeModule = device.createShaderModule({ code: computeShader });

  const size = instanceCount * baseInstanceNum * Float32Array.BYTES_PER_ELEMENT;
  const readBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  let i = 0;
  const show = async () => {
    // let time = performance.now();
    device.queue.writeBuffer(paramBuffer, 0, Params.mvp as Float32Array);

    vertexBuffers.set(1, instanceBuffers[i % 2]);
    computeBindGroups.set(0, computeBindGroupArray[i % 2]);
    const commandEncoder = device.createCommandEncoder();
    const computeConfig = initCompute(device, computeModule, computeLayout, computeBindGroups, instanceCount);
    const textureView = context.getCurrentTexture().createView();
    const renderConfig = initRender(device, vertexBuffers, renderBindGroups, renderLayout, indexBuffer, textureView, instanceCount, baseInstanceNum, vertexStep);
    compute(commandEncoder, computeConfig);

    commandEncoder.copyBufferToBuffer(instanceBuffers[i % 2], 0, readBuffer, 0, size);
    render(commandEncoder, renderConfig);
    device.queue.submit([commandEncoder.finish()]);
    // await device.queue.onSubmittedWorkDone();
    // // console.log(`time: ${(performance.now() - time).toFixed(2)}ms`)

    // await readBuffer.mapAsync(GPUMapMode.READ);
    // const arrayBuffer = readBuffer.getMappedRange();
    // const floatArray = new Float32Array(arrayBuffer);

    // let text = '';
    // for (let i = 6; i < floatArray.length; i += baseInstanceNum) {
    //   text += floatArray[i].toFixed(4) + ',';
    // }
    // readBuffer.unmap();
    // console.log(text);
    Params.loopNum = requestAnimationFrame(show);


    i++;
    // console.log(i);

  }
  show();
  spaceWatch(Params, show);
  rotateWatch(canvas, Params);
  // rotateWatch(Params, show);
}

function initRender(device: GPUDevice, vertexBuffers: Map<number, GPUBuffer>, bindGroups: Map<number, GPUBindGroup>, renderLayout: GPUBindGroupLayout, indexBuffer: GPUBuffer, textureView: GPUTextureView, instanceCount: number, baseInstanceNum: number, vertexStep: number) {
  const shaderModule = device.createShaderModule({ code: printShader });
  // const computeModule = device.createShaderModule({ code: computeShader });

  const renderConfig: RenderPipelineConfig = {
    layout: renderLayout,
    module: shaderModule,
    vertexArrayStride: 4 * vertexStep,
    instanceStride: 4 * baseInstanceNum,
  }

  const { renderPipeline } = getRenderPipeline(device, renderConfig);

  const config: RenderPassConfig = {
    renderPipeline,
    colorAttachments: [{
      view: textureView,
      loadOp: "clear",
      storeOp: "store",
    }],
    vertexBuffers,
    bindGroups,
    indexData: { buffer: indexBuffer },
    instanceCount: instanceCount,
  }
  return config;
}

draw();

const pane = new Pane();

pane.addInput(Params, 'number', { min: 1, max: 100, step: 1 });
pane.addInput(Params, 'timeStride', { min: 1, max: 100, step: 1 });
pane.addInput(Params, 'size', { min: 1, max: 100, step: 1 })

pane.on('change', draw)

