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
    var curVel = curBall.velocity.xy;
    var curPos = (curBall.position + curVel * params.deltaT+ vec2<f32>(3.0)) % vec2<f32>(2.0) - vec2<f32>(1.0);
    let curRad = curBall.radius;

    var ball: Ball;
    var pos: vec2<f32>;
    var vel: vec2<f32>;
    var rad: f32;

    for(var i =0u; i<arrayLength(&balls0.balls); i++){
        if(i == index){
            continue;
        }
        ball = balls0.balls[i];
        pos = (ball.position + ball.velocity * params.deltaT + vec2<f32>(3.0)) % vec2<f32>(2.0) - vec2<f32>(1.0);
        let dis = distance(curPos, pos);
        if(dis < curRad + ball.radius){
            let len = curRad + ball.radius - dis;
            let velRelative= curVel - ball.velocity;
            let t = len / length(velRelative);

            curPos -= curVel * t;
            pos -= ball.velocity * t;

            let normal = normalize(pos - curPos);
            let tangent = vec2<f32>(-normal.y, normal.x);
            let m1 = curRad * curRad;
            let v1n = dot(curVel, normal);
            let v1t = dot(curVel, tangent);
            let m2 = ball.radius * ball.radius;
            let v2n = dot(ball.velocity, normal);
            let v2t = dot(ball.velocity, tangent);


            let v1nNew = (v1n * (m1 - m2) + 2.0 * m2 * v2n) / (m1 + m2);
            let v2nNew = (v2n * (m2 - m1) + 2.0 * m1 * v1n) / (m1 + m2);
            curVel = v1nNew * normal + v1t * tangent;
            curPos += curVel * t;

            break;
        }
        
    }

    balls1.balls[index] = Ball(curPos, curVel, curRad);
    // balls0.balls[index] = Ball(pos, vel, rad);
}