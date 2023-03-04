struct Ball {
    @align(16) position: vec3<f32>,
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
    let index: i32 = i32(GlobalInvocationID.x);
    let len = i32(arrayLength(&balls0.balls));
    let time = params.deltaT;
    if index >= len {
        return;
    }
    let curBall: Ball = balls0.balls[index];
    var curVel: vec3<f32> = curBall.velocity;
    var curPos = curBall.position + curVel * time;
    let curRad = curBall.radius;

    var diff = curPos - vec3(1.0);
    var signal = step(vec3(-curBall.radius), diff);
    curPos += signal * (-diff - vec3(curBall.radius)) * 2.;
    curVel *= (-2. * signal + 1.);
    diff = curPos + vec3(1.0);
    signal = step(vec3(diff), vec3(curBall.radius));
    curPos += signal * (-diff + vec3(curBall.radius)) * 2.;
    curVel *= (-2. * signal + 1.);

    
    for (var i = 0; i < len; i++) {
        if i == index { 
            continue;
        }
        let ball = balls0.balls[i];
        let vel = ball.velocity;
        let rad = ball.radius;
        var pos = ball.position + vel * time;
        let dis = distance(curPos, pos);
        if dis < curRad + rad {
            let len = curRad + rad - dis;
            let velRelative = curVel - vel;
            let t = len / length(velRelative);

            curPos -= curVel * t;
            pos -= vel * t;

            let normal = normalize(pos - curPos);
            let m1 = curRad * curRad * curRad;
            let v1n = dot(curVel, normal);
            let v1t = curVel - v1n * normal;
            let m2 = rad * rad * rad;
            let v2n = dot(vel, normal);


            let v1nNew = (v1n * (m1 - m2) + 2.0 * m2 * v2n) / (m1 + m2);
            curVel = v1nNew * normal + v1t;
            curPos += curVel * (time - t);
            break;
        }
    }

    balls1.balls[index] = Ball(curPos, curVel, curRad);
}