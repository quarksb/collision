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

// todo external GPUTexture
export type BindingData = { type: 'buffer', buffer: GPUBuffer } | { type: 'sampler', sampler: GPUSampler } 
| { type: 'texture', texture: GPUTexture } | { type: 'storageTexture', texture: GPUTexture } | { type: 'externalTexture', texture: GPUTexture };
export interface BindingInfo {
    groupIndex: number;
    bindingIndex: number;
    bindingData: BindingData;
}
export type BindingInfos = BindingInfo[];

export type BindingType = 'buffer' | 'sampler' | 'texture' | 'storageTexture';
export interface BindingTypeInfo {
    groupIndex: number;
    bindingIndex: number;
    bindingType: BindingType;
    name: string;
    visibility: number;
    viewDimension: GPUTextureViewDimension;
    format: GPUTextureFormat;
}
export type BindingTypeInfos = BindingTypeInfo[];