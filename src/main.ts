import "./index.css";
import { getBuffer, getGpuDevice, getSampler, getTextureByUrl, getUniformBuffer, getVertexBuffer } from "./utils";
import printShader from './print.wgsl';
import computeShader from './compute.wgsl';
import imgUrl from './ball.png';
import type { RenderPipelineConfig } from "./core/type";
import { getRenderPipeline, render, RenderPassConfig } from "./core/render";
import { compute, initCompute } from "./core/compute";
import { Pane } from "tweakpane";

const Params = {
  timeStride: 50,
  size: 50,
  number: 50,
}

function init(device: GPUDevice) {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const size = Math.round(Math.min(width, height) * 0.8);
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("webgpu")!;
  context?.configure({
    device,
    format: "bgra8unorm",
    alphaMode: "premultiplied",
    // alphaMode: "opaque",
  });

  const spriteCount = 20;
  const indexArray = new Uint16Array(spriteCount * 3);
  const floatArray = new Float32Array(spriteCount * 2 + 2);
  floatArray[0] = 0;
  floatArray[1] = 0;
  for (let i = 1; i <= spriteCount; i++) {
    const angle = i * Math.PI * 2 / spriteCount;
    const scale = 1;
    const x = Math.cos(angle) * scale;
    const y = Math.sin(angle) * scale;
    floatArray[i * 2 + 0] = x;
    floatArray[i * 2 + 1] = y;
    indexArray[(i - 1) * 3 + 0] = 0;
    indexArray[(i - 1) * 3 + 1] = i;
    indexArray[(i - 1) * 3 + 2] = i % spriteCount + 1;
  }

  const vertexBuffer = getVertexBuffer(floatArray);
  const indexBuffer = device.createBuffer({
    size: 2 * spriteCount * 3,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true
  });

  new Uint16Array(indexBuffer.getMappedRange()).set(indexArray);
  indexBuffer.unmap();
  const paramBuffer = getUniformBuffer(new Float32Array([1, canvas.height / canvas.width]));

  const renderLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {
          type: "filtering"
        }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: "float"
        }
      }
    ]
  })
  return { context, vertexBuffer, indexBuffer, paramBuffer, renderLayout };
}

async function loadResource() {
  const texture = await getTextureByUrl(imgUrl);
  return { texture }
}

async function draw() {
  const device = await getGpuDevice();
  const { context, vertexBuffer, indexBuffer, renderLayout, paramBuffer } = init(device);
  const { texture } = await loadResource();

  const instanceCount = Params.number * 10;
  const baseInstanceNum = 6;
  const randomArray = new Float32Array(instanceCount * baseInstanceNum);
  for (let i = 0; i < instanceCount; i++) {
    const baseIndex = i * baseInstanceNum;
    randomArray[baseIndex + 0] = Math.random() * 2 - 1;
    randomArray[baseIndex + 1] = Math.random() * 2 - 1;
    randomArray[baseIndex + 2] = Math.random() * 2 - 1;
    randomArray[baseIndex + 3] = Math.random() * 2 - 1;
    randomArray[baseIndex + 4] = (Math.random() * 0.6 + 0.4) * 4E-4 * Params.size;
  }

  // const randomArray = new Float32Array([0, 0, 0.1, 0, 1, 0]);

  const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  const instanceBuffers = [getBuffer(randomArray, usage), getBuffer(randomArray, usage)];

  const renderBindGroup = device.createBindGroup({
    layout: renderLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: paramBuffer }
      },
      {
        binding: 1,
        resource: getSampler(),
      },
      {
        binding: 2,
        resource: texture.createView(),
      },
    ]
  });

  const vertexBuffers = new Map<number, GPUBuffer>();
  vertexBuffers.set(0, vertexBuffer);
  const renderBindGroups = new Map<number, GPUBindGroup>();
  renderBindGroups.set(0, renderBindGroup);

  const computeLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage"
        }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage"
        }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform"
        }
      },
    ]
  });

  const computeBuffer = device.createBuffer({
    size: 4 * 1,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
  new Float32Array(computeBuffer.getMappedRange()).set([Params.timeStride * 1E-4]);
  computeBuffer.unmap();


  const computeBindGroupArray = [device.createBindGroup({
    layout: computeLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: instanceBuffers[0] }
      },
      {
        binding: 1,
        resource: { buffer: instanceBuffers[1] }
      },
      {
        binding: 2,
        resource: { buffer: computeBuffer }
      },
    ]
  }),
  device.createBindGroup({
    layout: computeLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: instanceBuffers[1] }
      },
      {
        binding: 1,
        resource: { buffer: instanceBuffers[0] }
      },
      {
        binding: 2,
        resource: { buffer: computeBuffer }
      },
    ]
  })
  ]

  const computeBindGroups = new Map<number, GPUBindGroup>();
  const computeModule = device.createShaderModule({ code: computeShader });

  let loopNum: number | null = 0;
  let i = 0;
  const show = () => {
    vertexBuffers.set(1, instanceBuffers[i % 2]);
    computeBindGroups.set(0, computeBindGroupArray[i % 2]);
    const commandEncoder = device.createCommandEncoder();
    const computeConfig = initCompute(device, computeModule, computeLayout, computeBindGroups, instanceCount);
    const textureView = context.getCurrentTexture().createView();
    const renderConfig = initRender(device, vertexBuffers, renderBindGroups, renderLayout, indexBuffer, textureView, instanceCount, baseInstanceNum);
    compute(commandEncoder, computeConfig);
    render(commandEncoder, renderConfig);
    device.queue.submit([commandEncoder.finish()]);
    loopNum = requestAnimationFrame(show);
    i++;
  }
  show();

  document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      if (loopNum) {
        cancelAnimationFrame(loopNum);
        loopNum = null;
      } else {
        show();
      }
    }
  });
}

function initRender(device: GPUDevice, vertexBuffers: Map<number, GPUBuffer>, bindGroups: Map<number, GPUBindGroup>, renderLayout: GPUBindGroupLayout, indexBuffer: GPUBuffer, textureView: GPUTextureView, instanceCount: number, baseInstanceNum: number) {
  const shaderModule = device.createShaderModule({ code: printShader });
  // const computeModule = device.createShaderModule({ code: computeShader });

  const renderConfig: RenderPipelineConfig = {
    layout: renderLayout,
    module: shaderModule,
    vertexArrayStride: 4 * 2,
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

