struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
};
struct Params {
    canvasSize: vec2<f32>,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;

@vertex
fn vert(@location(0) baseOffset: vec2<f32>, @location(1) center: vec2<f32>, @location(2) radius: f32) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>((baseOffset * radius + center) / params.canvasSize, 0.0, 1.0);
    output.texCoord = 0.5 * (baseOffset + vec2<f32>(1.0));
    return output;
}

@fragment
fn frag(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
    var color: vec4<f32> = textureSample(myTexture, mySampler, texCoord);
    // if color.a < 0.5 {
    //     return vec4<f32>(1.0, 1.0, 0.0, 1.0);
    // }
    return color;
}