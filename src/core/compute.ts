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
    const { layout, module, constants } = config;
    const computeScript: GPUComputePipelineDescriptor = {
        layout: device.createPipelineLayout({
            bindGroupLayouts: [layout]
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

export function initCompute(device: GPUDevice, computeModule: GPUShaderModule, computeLayout: GPUBindGroupLayout, bindGroups: Map<number, GPUBindGroup>, moleculeCount: number) {
    const computePipelineConfig: ComputePipelineConfig = {
        module: computeModule,
        layout: computeLayout,
    }
    const { computePipeline } = getComputePipeline(device, computePipelineConfig);

    const computeConfig: ComputeConfig = {
        layout: computeLayout,
        computePipeline,
        bindGroups,
        workgroupCounts: [Math.ceil(moleculeCount / 64), 1, 1],
    }
    return computeConfig;
}

