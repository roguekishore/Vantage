import { useRef } from "react";

const BentoCard = ({ src, title, description, isImage = false }) => {
  const containerRef = useRef();

  return (
    <div
      ref={containerRef}
      className="relative size-full cursor-grab active:cursor-grabbing"
    >
      {isImage ? (
        <img
          src={src}
          alt={title}
          className="absolute top-0 left-0 size-full object-cover object-center"
        />
      ) : (
        <div className="absolute top-0 left-0 size-full bg-gradient-to-br from-violet-300 to-blue-300" />
      )}

      <div className="relative z-10 size-full flex flex-col justify-between p-5 text-blue-50 dark:text-blue-50">
        <div>
          <h1 className="bento-title special-font">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BentoCard;
