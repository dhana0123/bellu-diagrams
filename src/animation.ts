import { Vector2 } from "./vector";
import { Diagram, DiagramStyle, Path } from "./diagram";

// Easing functions
export function easeLinear(t: number): number {
  return t;
}

export function easeIn(t: number): number {
  return t * t; // t^2
}

export function easeOut(t: number): number {
  return t * (2 - t); // t * (2 - t)
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Smooth ease in and out
}

export function easeOutElastic(t: number): number {
  return (
    Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1
  );
}
export function animateBetween(
  start: Vector2,
  end: Vector2,
  duration: number, // Duration in seconds
  onUpdate: (position: Vector2) => void,
  easing: (t: number) => number = easeLinear,
  loop: boolean = false
) {
  let startTime: number | null = null;

  // The animation loop
  const animate = (timestamp: number) => {
    if (startTime === null) startTime = timestamp;

    const elapsed = timestamp - startTime!;
    const t = Math.min(elapsed / (duration * 1000), 1);

    const easedT = easing(t);

    // Interpolate between start and end position using eased progress
    const currentPosition = start.lerp(end, easedT);

    onUpdate(currentPosition);

    // Continue the animation if not finished
    if (t < 1) {
      requestAnimationFrame(animate);
    } else if (loop) {
      startTime = null;
      requestAnimationFrame(animate);
    }
  };

  // Start the animation loop
  requestAnimationFrame(animate);
}

export function animateCustom(
  positions: Vector2[], // Array of Vector2 positions [start, intermediate1, ..., end]
  times: number[], // Array of times in seconds corresponding to each position
  onUpdate: (position: Vector2) => void,
  easing: (t: number) => number = easeLinear, // Default easing is linear
  loop: boolean = false
) {
  if (positions.length !== times.length) {
    throw new Error("positions and times arrays must have the same length.");
  }

  let startTime: number | null = null;

  const animate = (timestamp: number) => {
    if (startTime === null) startTime = timestamp;

    // Calculate elapsed time in seconds
    const elapsed = (timestamp - startTime) / 1000;

    // Find the segment of the animation to work on
    let segmentIndex = times.findIndex((t, i) => elapsed < t && i > 0);
    if (segmentIndex === -1) segmentIndex = times.length - 1; // End of animation

    const prevIndex = Math.max(segmentIndex - 1, 0);
    const nextIndex = segmentIndex;

    const segmentStartTime = times[prevIndex];
    const segmentEndTime = times[nextIndex];
    const segmentDuration = segmentEndTime - segmentStartTime;

    // Normalize the time for the current segment
    const t = Math.min(
      Math.max((elapsed - segmentStartTime) / segmentDuration, 0),
      1
    );

    // Apply easing function
    const easedT = easing(t);

    // Interpolate between the two positions
    const currentPosition = positions[prevIndex].lerp(
      positions[nextIndex],
      easedT
    );

    // Call the callback with the current position
    onUpdate(currentPosition);

    // Continue the animation if not finished
    if (elapsed < times[times.length - 1]) {
      requestAnimationFrame(animate);
    } else if (loop) {
      // Reset start time for looping
      startTime = null;
      requestAnimationFrame(animate);
    }
  };

  // Start the animation loop
  requestAnimationFrame(animate);
}
