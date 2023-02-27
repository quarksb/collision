import { RenderPipelineConfig } from "./type";

export interface RenderPassConfig {
  renderPipeline: GPURenderPipeline;
  colorAttachments: Array<GPURenderPassColorAttachment>;

  bindGroups: Map<number, GPUBindGroup>;
  vertexBuffers: Map<number, GPUBuffer>;
  indexData?: {
    buffer: GPUBuffer;
    format?: GPUIndexFormat;
    stride?: number;
  };
  vertexCount?: number;
  instanceCount?: number;


  // vertexCount: number, instanceCount?: number | undefined, firstVertex?: number | undefined, firstInstance?: number | undefined
  // indexCount: number, instanceCount?: number | undefined, firstIndex?: number | undefined, baseVertex?: number | undefined, firstInstance?: number | undefined
}

export function render(commandEncoder: GPUCommandEncoder, config: RenderPassConfig) {
  // const { buffer, format, stride} = indexData;
  const { renderPipeline, colorAttachments, bindGroups, vertexBuffers, vertexCount, indexData, instanceCount = 1 } = config;

  const renderPass = commandEncoder.beginRenderPass({ colorAttachments });
  renderPass.setPipeline(renderPipeline);
  bindGroups.forEach((bindGroup, index) => {
    renderPass.setBindGroup(index, bindGroup);
  });
  vertexBuffers.forEach((vertexBuffer, index) => {
    renderPass.setVertexBuffer(index, vertexBuffer);
  });

  const firstVertex = 0;
  const firstInstance = 0;

  if (indexData) {
    const { buffer, format = 'uint16', stride = 2 } = indexData;
    const indexCount = buffer.size / stride;
    renderPass.setIndexBuffer(buffer, format);
    const baseVertex = 0;
    renderPass.drawIndexed(indexCount, instanceCount, firstVertex, baseVertex, firstInstance);
  } else {
    renderPass.draw(vertexCount!, instanceCount, firstVertex, firstInstance);
  }

  renderPass.end();
}

export function getRenderPipeline(device: GPUDevice, config: RenderPipelineConfig) {
  const { layouts, module, vertexArrayStride = 0, instanceStride = 0 } = config;
  const primitive: GPUPrimitiveState = {
    topology: 'triangle-list',
    cullMode: 'back',
    // cullMode: 'front',
  };
  // console.log(layouts);
  
  const renderScript: GPURenderPipelineDescriptor = {
    layout: device.createPipelineLayout({
      bindGroupLayouts: layouts
    }),
    vertex: {
      module,
      entryPoint: "vert",
      buffers: [
        {
          arrayStride: vertexArrayStride,
          stepMode: 'vertex',
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x3",
            },
            {
              shaderLocation: 1,
              offset: 4 * 3,
              format: "float32x3",
            },
            {
              shaderLocation: 2,
              offset: 4 * 6,
              format: "float32x2",
            },
          ],
        },
        {
          arrayStride: instanceStride,
          stepMode: 'instance',
          attributes: [
            {
              shaderLocation: 3,
              offset: 0,
              format: "float32x3",
            },
            {
              shaderLocation: 4,
              offset: 4 * 6,
              format: "float32",
            },
          ],
        }
      ]
    },
    fragment: {
      module,
      entryPoint: "frag",
      targets: [{
        format: "bgra8unorm"
      }],
    },
    primitive
  }
  const renderPipeline = device.createRenderPipeline(renderScript);
  return { renderPipeline };
}