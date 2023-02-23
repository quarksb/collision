struct Ball {
    position: vec3<f32>,
    velocity: vec3<f32>,
    radius: f32,
};

struct Params {
    deltaT: f32,
}

struct Balls {
    balls: array<Ball>,
};

// struct Node {
//     left: u32,
//     right: u32,
//     parent: u32,
//     isLeaf: bool,
//     start: u32,
//     end: u32,
//     mass: f32,
//     centerOfMass: vec3<f32>,
//     radius: f32,
// };



@group(0) @binding(0) var<storage, read> balls0: Balls;
@group(0) @binding(1) var<storage, read_write> balls1: Balls;
@group(0) @binding(2) var<uniform> params: Params;


@compute @workgroup_size(64,1,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let index: u32 = GlobalInvocationID.x;
    // if (index >= arrayLength(&balls0.balls)) {
    //     return;
    // }
    let curBall: Ball = balls0.balls[index];
    var curVel = curBall.velocity.xyz;
    // var curPos = (curBall.position + curVel * params.deltaT + vec3<f32>(3.0)) % vec3<f32>(2.0) - vec3<f32>(1.0);
    var curPos = curBall.position + curVel * params.deltaT;

    var diff = curPos - vec3(1.0);
    var signal = step(vec3(-curBall.radius), diff);
    curPos += signal * diff * -2.;
    curVel *= (-2. * signal + 1.);
    diff = vec3(-1.0) - curPos;
    signal = step(vec3(-curBall.radius), diff);
    curPos += signal * diff * 2.;
    curVel *= (-2. * signal + 1.);

    let curRad = curBall.radius;

    var ball: Ball;
    var pos: vec3<f32>;
    var vel: vec3<f32>;
    var rad: f32;

    for(var i =0u; i<arrayLength(&balls0.balls); i++){
        if(i == index){
            continue;
        }
        ball = balls0.balls[i];
        pos = (ball.position + ball.velocity * params.deltaT + vec3<f32>(3.0)) % vec3<f32>(2.0) - vec3<f32>(1.0);
        let dis = distance(curPos, pos);
        if(dis < curRad + ball.radius){
            let len = curRad + ball.radius - dis;
            let velRelative= curVel - ball.velocity;
            let t = len / length(velRelative);

            curPos -= curVel * t;
            pos -= ball.velocity * t;

            let normal = normalize(pos - curPos);
            // let tangent = 
            let m1 = curRad * curRad;
            let v1n = dot(curVel, normal);
            let v1t = curVel - v1n * normal;
            let m2 = ball.radius * ball.radius;
            let v2n = dot(ball.velocity, normal);


            let v1nNew = (v1n * (m1 - m2) + 2.0 * m2 * v2n) / (m1 + m2);
            curVel = v1nNew * normal + v1t;
            curPos += curVel * t;
            break;
        }
    }

    balls1.balls[index] = Ball(curPos, curVel, curRad);
}