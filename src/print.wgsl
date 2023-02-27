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

@group(0) @binding(3) var<uniform> materialConstants: MaterialConstants;


fn calculatePBR(baseColor: vec4<f32>, metallic: f32, roughness: f32, normal: vec3<f32>, lightDirection: vec3<f32>, viewDirection: vec3<f32>) -> vec4<f32> {
  var albedo = baseColor.rgb * materialConstants.baseColorFactor.rgb;
  var metallicFactor = materialConstants.metallicFactor * metallic;
  var roughnessFactor = materialConstants.roughnessFactor * roughness;

  var NdotL = max(dot(normal, lightDirection), 0.0);
  var NdotV = max(dot(normal, viewDirection), 0.0);
  var H = normalize(lightDirection + viewDirection);
  var NdotH = max(dot(normal, H), 0.0);

  var F0 = vec3<f32>(0.04);
  
  var D = D_ggx(NdotH, roughnessFactor);
  var G = G_smith(NdotL, NdotV, roughnessFactor);
  var F = mix(F0, albedo.rgb, metallicFactor);
  var specular = F * D * G / (4.0 * NdotL * NdotV);

  var diffuse = (1.0 - metallicFactor) * albedo.rgb / 3.14159265;

  var color = vec4<f32>((diffuse + specular) * NdotL * 2.0, baseColor.a);
  return color;
}

fn F_Schlick(f0: vec3<f32>, f90: vec3<f32>, VdotH: f32) -> vec3<f32> {
  return f0 + (f90 - f0) * pow(1.0 - VdotH, 5.0);
}

fn F_UE4(f0: vec3<f32>, VdotH: f32) -> vec3<f32> {
  return f0 + (vec3<f32>(1.0) - f0) * pow(1.0 - VdotH, 5.0);
}

fn D_ggx(NdotH: f32, roughness: f32) -> f32 {
  var a = roughness * roughness;
  var a2 = a * a;
  var NdotH2 = NdotH * NdotH;
  var denom = NdotH2 * (a2 - 1.0) + 1.0;
  return a2 / (3.14159265 * denom * denom);
}

fn G_smith(NdotL: f32, NdotV: f32, roughness: f32) -> f32 {
  var k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  var gl = NdotL / (NdotL * (1.0 - k) + k);
  var gv = NdotV / (NdotV * (1.0 - k) + k);
  return gl * gv;
}
