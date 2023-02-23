struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
    @location(1) normal: vec3<f32>,
};
struct Params {
    mvp: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;

@vertex
fn vert(@location(0) baseOffset: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) texCoord: vec2<f32>, @location(3) center: vec3<f32>, @location(4) radius: f32) -> VertexOutput {
    // why radius may be negative?
    let position = (baseOffset * abs(radius) + center);
    var output: VertexOutput;
    output.position = params.mvp * vec4<f32>(position, 1.0);
    output.texCoord = texCoord;
    output.normal = normal;
    return output;
}

@fragment
fn frag(@location(0) texCoord: vec2<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
    var color: vec4<f32> = textureSample(myTexture, mySampler, texCoord);
    return color;
}

struct MaterialConstants {
  baseColorFactor: vec4<f32>,
  metallicFactor: f32,
  roughnessFactor: f32,
};

// @group(0) @binding(3) var<uniform> materialConstants: MaterialConstants;


// fn calculatePBR(baseColor: vec4<f32>, metallic: f32, roughness: f32, normal: vec3<f32>, lightDirection: vec3<f32>, viewDirection: vec3<f32>) -> vec4<f32> {
//   var albedo = baseColor.rgb * materialConstants.baseColorFactor.rgb;
//   var metallicFactor = materialConstants.metallicFactor * metallic;
//   var roughnessFactor = materialConstants.roughnessFactor * roughness;

//   var NdotL = max(dot(normal, lightDirection), 0.0);
//   var NdotV = max(dot(normal, viewDirection), 0.0);
//   var H = normalize(lightDirection + viewDirection);
//   var NdotH = max(dot(normal, H), 0.0);

//   var F0 = vec3<f32>(0.04);
//   var F = mix(F0, albedo.rgb, metallicFactor);
//   var D = 
// //   var D = d_ggx(NdotH, roughnessFactor);
// //   var G = g_Smith(NdotL, NdotV, roughnessFactor);
// //   var specular = F * D * G / (4.0 * NdotL * NdotV);

// //   var diffuse = (1.0 - metallicFactor) * albedo.rgb / 3.14159265;

// //   var color = vec4<f32>((diffuse + specular) * NdotL * 2.0, baseColor.a);
//   return color;
// }
