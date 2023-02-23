export type GPUBindingLayoutInfo =
    { type: 'buffer', visibility: GPUShaderStageFlags, info: GPUBufferBindingLayout } |
    { type: 'sampler', visibility: GPUShaderStageFlags, info: GPUSamplerBindingLayout } |
    { type: 'texture', visibility: GPUShaderStageFlags, info: GPUTextureBindingLayout } |
    { type: 'storageTexture', visibility: GPUShaderStageFlags, info: GPUStorageTextureBindingLayout } |
    { type: 'externalTexture', visibility: GPUShaderStageFlags, info: GPUExternalTextureBindingLayout };

export function getLayout(device: GPUDevice, bindingLayouts: GPUBindingLayoutInfo[]) {
    const entries: Iterable<GPUBindGroupLayoutEntry> = bindingLayouts.map((item, index) => {
        return { binding: index, visibility: item.visibility, [item.type]: item.info };
    });
    const layout = device.createBindGroupLayout({ entries });
    return layout;
}

export function getBindGroup(device: GPUDevice, layout: GPUBindGroupLayout, resources: GPUBindingResource[]){
    return device.createBindGroup({
        layout,
        entries: resources.map((resource, index)=>{
            return {
                binding: index,
                resource
            }
        })
    })
}



