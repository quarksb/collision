import "./index.css";
import { getGpuDevice, getSampler, getTextureByUrl, getUniformBuffer, getVertexBuffer } from "./utils";
import printShader from './print.wgsl';
import computeShader from './compute.wgsl';
import imgUrl from './ball.png';
import type { ComputePipelineConfig, RenderPipelineConfig } from "./core/type";
import { getRenderPipeline, render, RenderPassConfig } from "./core/render";
import { compute, ComputeConfig, getComputePipeline } from "./core/compute";

function init(device: GPUDevice) {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
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
  return { context, vertexBuffer, indexBuffer, paramBuffer };
}

async function loadResource() {
  const texture = await getTextureByUrl(imgUrl);
  return { texture }
}

async function draw() {
  const device = await getGpuDevice();
  const { context, vertexBuffer, indexBuffer, paramBuffer } = init(device);
  const { texture } = await loadResource();
  const shaderModule = device.createShaderModule({ code: printShader });
  const computeModule = device.createShaderModule({ code: computeShader });
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
  const bindGroup = device.createBindGroup({
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

  const moleculeCount = 100;
  const baseInstanceNum = 5;
  const randomArray = new Float32Array(moleculeCount * baseInstanceNum);
  for (let i = 0; i < moleculeCount; i++) {
    const baseIndex = i * baseInstanceNum;
    randomArray[baseIndex + 0] = Math.random() * 2 - 1;
    randomArray[baseIndex + 1] = Math.random() * 2 - 1;
    randomArray[baseIndex + 2] = Math.random() * 2 - 1;
    randomArray[baseIndex + 3] = Math.random() * 2 - 1;
    randomArray[baseIndex + 4] = Math.random() * 0.08 + 0.02;
  }

  // const randomArray = new Float32Array([0, 0, 0, 0, 1])
  const instanceBuffer0 = getVertexBuffer(randomArray);
  const instanceBuffer1 = getVertexBuffer(randomArray);

  const textureView = context.getCurrentTexture().createView();
  const renderConfig: RenderPipelineConfig = {
    layout: renderLayout,
    module: shaderModule,
    vertexArrayStride: 4 * 2,
    instanceStride: 4 * baseInstanceNum,
  }
  const { renderPipeline } = getRenderPipeline(device, renderConfig);
  const computePipelineConfig: ComputePipelineConfig = {
    module: computeModule,
    layout: renderLayout,
  }
  const { computePipeline } = getComputePipeline(device, computePipelineConfig);
  const commandEncoder = device.createCommandEncoder();
  const vertexBuffers = new Map<number, GPUBuffer>();
  vertexBuffers.set(0, vertexBuffer);
  vertexBuffers.set(1, instanceBuffer1);
  const bindGroups = new Map<number, GPUBindGroup>();
  bindGroups.set(0, bindGroup);

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
    instanceCount: moleculeCount,
  }
  const computeConfig: ComputeConfig = {
    layout: renderLayout,
    computePipeline,
    bindGroups,
    workgroupCounts: [Math.ceil(moleculeCount / 64), 1, 1],
  }

  // compute(commandEncoder, computeConfig);
  render(commandEncoder, config);
  device.queue.submit([commandEncoder.finish()]);
}

draw();

