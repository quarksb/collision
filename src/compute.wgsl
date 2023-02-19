struct Ball {
    position: vec2<f32>,
    velocity: vec2<f32>,
    radius: f32,
};

struct Params {
    deltaT: f32,
}

struct Balls {
    balls: array<Ball>,
};

@group(0) @binding(0) var<storage, read> params: Params;
@group(0) @binding(1) var<storage, read> balls0: Balls;
@group(0) @binding(2) var<storage, read_write> balls1: Balls;


@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>){
    let index: u32 = GlobalInvocationID.x;
    if (index >= balls0.balls.length()) {
        return;
    }
    let curBall: Ball = balls0.balls[index];
    let curPos = curBall.position;
    let curVel = curBall.velocity;
    let curRad = curBall.radius;

    var pos: vec2<f32>;
    var vel: vec2<f32>;
    var rad: f32;

    // for(var i =0u; i<arrayLength(&balls0.balls); i++){
    //     if(i == index){
    //         continue;
    //     }
    // }

    pos = curPos + curVel * params.deltaT;
    vel = curVel;
    rad = curRad;

    balls1.balls[index] = Ball(pos, vel, rad);
}