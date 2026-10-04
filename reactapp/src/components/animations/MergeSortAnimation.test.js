import React, { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { MergeSortAnimation } from "./MergeSortAnimation";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Render a React element into a fresh DOM container, flushing effects. */
function render(element) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root;
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return {
    container,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("MergeSortAnimation", () => {
  let originalGetContext;

  beforeEach(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      setTransform: jest.fn(),
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      fillText: jest.fn(),
      setLineDash: jest.fn(),
      roundRect: jest.fn(),
      quadraticCurveTo: jest.fn(),
      closePath: jest.fn(),
      arc: jest.fn(),
      shadowColor: "transparent",
      shadowBlur: 0,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "",
      textBaseline: "",
    });
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  test("renders canvas element with defaults", () => {
    const { container, unmount } = render(<MergeSortAnimation />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas.style.display).toBe("block");
    expect(canvas.style.contain).toBe("strict");
    unmount();
  });

  test("applies custom className and dimensions", () => {
    const { container, unmount } = render(
      <MergeSortAnimation
        className="custom-canvas"
        width={320}
        height={180}
        style={{ opacity: 0.9 }}
      />
    );
    const canvas = container.querySelector("canvas");
    expect(canvas.classList.contains("custom-canvas")).toBe(true);
    expect(canvas.style.width).toBe("320px");
    expect(canvas.style.height).toBe("180px");
    expect(canvas.style.opacity).toBe("0.9");
    unmount();
  });

  test("exposes imperative handle with reset, play, pause, step, getState", () => {
    const ref = createRef();
    const { unmount } = render(
      <MergeSortAnimation ref={ref} initialData={[5, 2, 8, 1, 9]} paused={true} />
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current.reset).toBe("function");
    expect(typeof ref.current.play).toBe("function");
    expect(typeof ref.current.pause).toBe("function");
    expect(typeof ref.current.step).toBe("function");
    expect(typeof ref.current.getState).toBe("function");

    const stateBefore = ref.current.getState();
    expect(stateBefore.stepIndex).toBe(0);
    expect(stateBefore.totalSteps).toBeGreaterThan(0);
    expect(stateBefore.isFinished).toBe(false);

    // Step manually
    act(() => {
      ref.current.step();
    });

    const stateAfterStep = ref.current.getState();
    expect(stateAfterStep.stepIndex).toBe(1);

    // Reset
    act(() => {
      ref.current.reset();
    });

    const stateAfterReset = ref.current.getState();
    expect(stateAfterReset.stepIndex).toBe(0);

    unmount();
  });

  test("fires onStep and onComplete callbacks during stepping", () => {
    const ref = createRef();
    const onStep = jest.fn();
    const onComplete = jest.fn();

    const { unmount } = render(
      <MergeSortAnimation
        ref={ref}
        initialData={[3, 1]}
        paused={true}
        onStep={onStep}
        onComplete={onComplete}
      />
    );

    const totalSteps = ref.current.getState().totalSteps;
    expect(totalSteps).toBeGreaterThan(0);

    // Step through to completion
    for (let i = 0; i < totalSteps; i++) {
      act(() => {
        ref.current.step();
      });
    }

    expect(onStep).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(ref.current.getState().isFinished).toBe(true);

    unmount();
  });
});
