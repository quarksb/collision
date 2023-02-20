## WebGPU Ball Collision Simulator
This is a simple demo program that uses WebGPU to simulate ball collisions in two dimensions.

## Getting Started
[Online Demo](https://quarksb.github.io/collision/)

To run the demo, you'll need a browser that supports the WebGPU API, such as Google Chrome or Mozilla Firefox. Note that support for WebGPU is currently experimental and may require enabling certain flags or features in your browser.

To run the demo:
```
pnpm i
pnpm dev
```

## Features
The demo includes several features that you can experiment with:

- **Adjust the number of balls:**
 You can change the number of balls in the simulation by adjusting the number variable in the control pane. Note that increasing the number of balls may affect performance.

- **Adjust the size balls:** You can adjust the radius of the balls by modifying the size in the right control pane.

- **Adjust the simulation speed:** You can adjust the speed of the simulation by modifying the timeStride variable in the right control pane. Note that increasing the simulation speed may affect the accuracy of the collision detection.


## How it Works
The demo uses a simple physics engine to simulate the motion and collision of the balls. Each ball is represented as a circle with a position, velocity, and mass(Mass is ratio to radius’s square). The program calculates the forces acting on each ball (such as gravity and collisions with other balls), and uses these forces to update the positions and velocities of the balls over time.

The collision detection algorithm used in the program checks for collisions between pairs of balls using their positions and radii. If two balls overlap, the program calculates the new velocities of the balls using the principles of conservation of momentum and kinetic energy.

## Contributing
This is a simple demo program, but if you'd like to contribute to the project, feel free to submit a pull request or open an issue on the GitHub repository.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements
This demo was inspired by the https://github.com/webgpu/webgpu-samples, and the code is based on their examples.