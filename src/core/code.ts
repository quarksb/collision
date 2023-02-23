import { BindingType, BindingTypeInfos } from "./type";

export const DefaultFormat: GPUTextureFormat = 'bgra8unorm';

export function parseWGSL(code: string) {
    // todo 正则表达式不完善，没有 cover 所有场景
    const computeEntryData = (code.matchAll(/@compute\s*@workgroup_size\(\s?([0-9]*),\s?([0-9]*)\s?,\s?([0-9]*)\s?\)\s*fn\s*(\w+)\(/g)).next().value;

    let vertexEntryPoint = '';
    let fragmentEntryPoint = '';
    let computeEntryPoint = '';
    let visibility: number = 0;
    let workgroupSize: number[] = [];

    if (!computeEntryData) {
        const vertexEntryData = (code.matchAll(/@vertex\s*fn (\w+)\(/g)).next().value;

        if (!vertexEntryData) {
            console.error('no vertex entry point');
        } else {
            vertexEntryPoint = vertexEntryData[1];
            visibility |= GPUShaderStage.VERTEX;
        }

        const fragmentEntryData = (code.matchAll(/@fragment\s*fn (\w+)\(/g)).next().value;

        if (!vertexEntryData) {
            console.error('no fragment entry point');
        } else {
            fragmentEntryPoint = fragmentEntryData[1];
            visibility |= GPUShaderStage.FRAGMENT;
        }
    } else {
        const getInt = (i: number) => parseInt(computeEntryData[i]);
        workgroupSize = [getInt(1), getInt(2), getInt(3)];
        computeEntryPoint = computeEntryData[4];
        visibility |= GPUShaderStage.COMPUTE;
    }

    const datas = code.matchAll(/@group\(([0-9])\)\s+@binding\(([0-9])\)\s+var(<\w+\s*(,\s*\w+\s*)*>)?\s+(\w+)\s*:\s*(\w+)(<\s*(\w+)(\s*,\s*\w+)?>)?;/g);

    const bindingTypeInfos: BindingTypeInfos = [];
    for (let data of datas) {

        const groupIndex = parseInt(data[1]);
        const bindingIndex = parseInt(data[2]);
        const isUniform = !!(data[3]);
        const name = data[5];
        const type = data[6];

        let bindingType: BindingType | undefined;
        let viewDimension: GPUTextureViewDimension = '2d';
        let textureFormat: GPUTextureFormat = DefaultFormat;
        if (type === 'sampler') {
            bindingType = 'sampler';
        } else if (type.includes("texture")) {
            // todo external texture
            const arr = type.split("_");
            if (arr[1] === "storage") {
                bindingType = 'storageTexture';
            } else {
                bindingType = 'texture';
            }
            viewDimension = arr[arr.length - 1] as GPUTextureViewDimension;
            textureFormat = data[8] as GPUTextureFormat;

        } else if (isUniform) {
            bindingType = 'buffer';
        } else {
            console.error(`can't analyze @group(${groupIndex} @binding(${bindingIndex}) in your wgsl`);
            console.error('your wgsl: ', code);
        }
        if (bindingType) {
            bindingTypeInfos.push({ groupIndex, bindingIndex, bindingType, name, visibility, viewDimension, format: textureFormat })
        }
    }
    return { computeEntryPoint, vertexEntryPoint, fragmentEntryPoint, bindingTypeInfos, workgroupSize };
}