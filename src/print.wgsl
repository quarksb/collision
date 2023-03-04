struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) pos: vec3<f32>,
    @location(3) tangent: vec3<f32>,
};
struct Params {
    mvp: mat4x4<f32>,
}

struct MaterialConstants {
  baseColorFactor: vec4<f32>,
  metallicFactor: f32,
  roughnessFactor: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var<uniform> materialConstants: MaterialConstants;
@group(1) @binding(0) var baseColorMap: texture_2d<f32>;
@group(1) @binding(1) var normalMap: texture_2d<f32>;
@group(1) @binding(2) var specularMap: texture_2d<f32>;

@vertex
fn vert(@location(0) baseOffset: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) texCoord: vec2<f32>, @location(3) center: vec3<f32>, @location(4) radius: f32) -> VertexOutput {
    // why radius may be negative?
    let position = (baseOffset * radius + center);
    var output: VertexOutput;
    output.position = params.mvp * vec4<f32>(position, 1.0);
    output.texCoord = texCoord;
    output.normal = vec3<f32>(normal);

    output.pos = position;
    return output;
}

@fragment
fn frag(@location(0) texCoord: vec2<f32>, @location(1) baseNormal: vec3<f32>, @location(2) pos: vec3<f32>) -> @location(0) vec4<f32> {
    let baseColor: vec4<f32> = textureSample(baseColorMap, mySampler, texCoord);
    let tangentNormal: vec4<f32> = textureSample(normalMap, mySampler, texCoord);
    let specularColor: vec4<f32> = textureSample(specularMap, mySampler, texCoord);
    let tbn = getTBNMatrix(baseNormal);
    let normal = normalize(tbn * (2. * tangentNormal.xyz - 1.0));

    let viewDirection: vec3<f32> = normalize(vec3<f32>(0.0, 0.0, 10.0) - pos);
    var lightDirection: vec3<f32> = normalize(vec3<f32>(0.0, 0.0, -1.0));
    var light = 2. * vec3<f32>(1.0, 1.0, 1.0);
    var pbrColor: vec4<f32> = calculatePBR(light, baseColor.rgba, specularColor.r, 1.0, normal, lightDirection, viewDirection);

    return pbrColor;
}



fn calculatePBR(light: vec3<f32>, baseColor: vec4<f32>, metallic: f32, roughness: f32, normal: vec3<f32>, lightDirection: vec3<f32>, viewDirection: vec3<f32>) -> vec4<f32> {
    var albedo = baseColor.rgb * materialConstants.baseColorFactor.rgb;
    var metallicFactor = materialConstants.metallicFactor * metallic;
    var roughnessFactor = materialConstants.roughnessFactor * roughness;

    // var albedo = baseColor.rgb;
    // var metallicFactor = metallic;
    // var roughnessFactor = roughness;

    var NdotL = max(dot(normal, lightDirection), 0.0);
    var NdotV = max(dot(normal, viewDirection), 0.0);
    var H = normalize(lightDirection + viewDirection);
    var NdotH = max(dot(normal, H), 0.0);

    var F0 = vec3<f32>(0.04);

    var D = D_ggx(NdotH, roughnessFactor);
    var G = G_smith(NdotL, NdotV, roughnessFactor);
    var F = F_UE4(F0, NdotH);
    var specular = max(F * D * G / (4.0 * NdotL * NdotV), vec3(0.0));

    var diffuse = max((1.0 - metallicFactor) * albedo.rgb / 3.14159265, vec3(0.0));

    var color = vec4<f32>(light * (diffuse + specular) * NdotL * 2.0, baseColor.a);
    return color;
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

fn EnvDFGLazarov(specularColor: vec3<f32>, gloss: f32, NdotV: f32) -> vec3<f32> {
    let p0 = vec4<f32>(0.5745, 1.548, -0.02397, 1.301);
    let p1 = vec4<f32>(0.5753, -0.2511, -0.02066, 0.4755);
    let t = gloss * p0 + p1;
    var bias = clamp(t.x * min(t.y, exp2(-7.672 * NdotV)) + t.z, 0., 1.);
    let delta = clamp(t.w, 0., 1.);
    let scale = delta - bias;
    bias *= clamp(50.0 * specularColor.y, 0., 1.0);
    return specularColor * scale + bias;
}

fn getTBNMatrix(pos: vec3<f32>) -> mat3x3<f32> {
    let N = normalize(pos);
    let up = vec3(pos.y, -pos.x, 0.0);
    let T = normalize(cross(up, N));
    let B = cross(N, T);
    let TBN = mat3x3(T, B, N);
    return TBN;
}
