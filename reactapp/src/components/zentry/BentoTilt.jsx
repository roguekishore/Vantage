import { useRef } from "react";
import gsap from "gsap";

const BentoTilt = ({ children, className = "", isMainCard = false }) => {
  const itemRef = useRef();

  const handleMouseMove = (e) => {
    if (!itemRef.current) return;

    const { left, top, width, height } =
      itemRef.current.getBoundingClientRect();

    const relativeX = (e.clientX - left) / width;
    const relativeY = (e.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * (isMainCard ? 7 : 10);
    const tiltY = (relativeX - 0.5) * (isMainCard ? -7 : -10);

    gsap.to(itemRef.current, {
      transformPerspective: 800,
      rotationX: tiltX,
      rotationY: tiltY,
      scale: 0.93,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(itemRef.current, {
      rotationX: 0,
      rotationY: 0,
      scale: 1,
    });
  };

  return (
    <div
      className={className}
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default BentoTilt;
