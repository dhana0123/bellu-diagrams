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

// Helper function for animating between two vectors with an easing function
export function animateBetween(
  start: Vector2,
  end: Vector2,
  duration: number,
  onUpdate: (position: Vector2) => void,
  easing: (t: number) => number = easeLinear // Default easing is linear
) {
  let startTime: number | null = null;

  // The animation loop
  const animate = (timestamp: number) => {
    if (startTime === null) startTime = timestamp;

    // Calculate elapsed time
    const elapsed = timestamp - startTime!;
    const t = Math.min(elapsed / duration, 1); // Progress (0 to 1)

    // Apply easing function to the progress
    const easedT = easing(t);

    // Interpolate between start and end position using eased progress
    const currentPosition = start.lerp(end, easedT);

    // Call the callback with the current position
    onUpdate(currentPosition);

    // Continue the animation if not finished
    if (t < 1) {
      requestAnimationFrame(animate);
    }
  };

  // Start the animation loop
  requestAnimationFrame(animate);
}
