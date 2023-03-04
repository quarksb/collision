import { ModuleConfig, ComputePipelineConfig } from "./type";

export interface ComputeConfig extends ModuleConfig {
    workgroupCounts: [number, number, number];
}

export function compute(commandEncoder: GPUCommandEncoder, computeConfig: ComputeConfig) {
    const { computePipeline, bindGroups, workgroupCounts: workgroupCount } = computeConfig;
    const computePass = commandEncoder.beginComputePass({ label: "compute pass" });
    computePass.setPipeline(computePipeline);
    bindGroups.forEach((bindGroup, index) => {
        computePass.setBindGroup(index, bindGroup);
    });
    computePass.dispatchWorkgroups(...workgroupCount);
    computePass.end();
}

export function getComputePipeline(device: GPUDevice, config: ComputePipelineConfig) {
    const { layouts, module, constants } = config;
    const computeScript: GPUComputePipelineDescriptor = {
        layout: device.createPipelineLayout({
            bindGroupLayouts: layouts
        }),
        compute: {
            module,
            entryPoint: "main",
            constants,
        }
    }

    const computePipeline = device.createComputePipeline(computeScript);
    return { computePipeline };
}

export function initCompute(computePipeline: GPUComputePipeline, bindGroups: Map<number, GPUBindGroup>, moleculeCount: number) {
    const computeConfig: ComputeConfig = {
        computePipeline,
        bindGroups,
        workgroupCounts: [Math.ceil(moleculeCount / 64), 1, 1],
    }
    return computeConfig;
}

export function initComputePipeline(device: GPUDevice, computeModule: GPUShaderModule, computeLayout: GPUBindGroupLayout) {
    const computePipelineConfig: ComputePipelineConfig = {
        module: computeModule,
        layouts: [computeLayout],
    }
    const { computePipeline } = getComputePipeline(device, computePipelineConfig);
    return computePipeline;
}
