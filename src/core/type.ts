export interface ModuleConfig{
    layout: GPUBindGroupLayout;
    computePipeline: GPUComputePipeline;
    bindGroups: Map<number, GPUBindGroup>;
}

export interface ComputePipelineConfig {
    layout: GPUBindGroupLayout;
    module: GPUShaderModule;
    constants?: Record<string, number>;
}

export type RenderPipelineConfig = ComputePipelineConfig & {
    vertexArrayStride?: number;
    instanceStride?: number;
}