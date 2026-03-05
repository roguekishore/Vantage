import { useRef } from "react";

const LinkGroup = ({ title, items }) => {
  return (
    <div className={`${title === "Resources" ? "max-[900px]:hidden" : ""}`}>
      <p className="text-sm md:text-[12px] text-indigo-900 dark:text-black uppercase mb-7">
        {title}
      </p>
      {items.map(({ name, link, active = true }) => (
        <div key={name} className="group relative overflow-hidden">
          <div className="translate-y-0 skew-y-0 transition duration-700 group-hover:translate-y-[-160%] group-hover:skew-y-[24deg]">
            <a
              key={name}
              href={link}
              className={`block text-[1.8rem] ${
                active ? "text-indigo-800 dark:text-black" : "text-indigo-400 dark:text-black/40"
              } leading-none py-2`}
            >
              {name}
            </a>
          </div>
          <div className="absolute translate-y-[164%] skew-y-12 transition duration-700 group-hover:translate-y-[-100%] group-hover:skew-y-0">
            <a
              key={name}
              href={link}
              className={`block text-[1.8rem] ${
                active ? "text-indigo-800 dark:text-black" : "text-indigo-400 dark:text-black/40"
              } leading-none py-2`}
            >
              {name}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

const Footer = () => {
  const textRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    const text = textRef.current;
    const container = containerRef.current;

    if (!text || !container) return;

    const { width, left } = container.getBoundingClientRect();
    const centerX = width / 2;

    const mouseX = e.clientX - left;
    const relativeX = (mouseX - centerX) / centerX;

    let matrix;

    if (Math.abs(relativeX) < 0.1) {
      // at Center
      matrix = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";
    } else if (relativeX > 0) {
      // at Right
      const intensity = Math.min(Math.abs(relativeX), 1);
      matrix = `matrix3d(
                ${0.912144 + (1 - 0.912144) * (1 - intensity)}, 
                ${-0.221361 * intensity}, 
                0, 
                ${0.0011759 * intensity}, 
                ${0.266799 * intensity}, 
                ${0.327775 + (1 - 0.327775) * (1 - intensity)}, 
                0, 
                ${-0.0004667 * intensity}, 
                0, 0, 1, 0, 
                ${334.04 * intensity}, 
                ${-143.073 * intensity}, 
                0, 1)`;
    } else {
      // at Left
      const intensity = Math.min(Math.abs(relativeX), 1);
      matrix = `matrix3d(
                ${0.956236 + (1 - 0.956236) * (1 - intensity)}, 
                ${0.232741 * intensity}, 
                0, 
                ${-0.0012364 * intensity}, 
                ${-0.1329 * intensity}, 
                ${0.293217 + (1 - 0.293217) * (1 - intensity)}, 
                0, 
                ${-0.0002324 * intensity}, 
                0, 0, 1, 0, 
                ${-378.999 * intensity}, 
                ${-141.278 * intensity}, 
                0, 1)`;
    }

    text.style.transform = matrix;
  };

  const handleMouseLeave = () => {
    const text = textRef.current;

    if (!text) return;

    text.style.transform =
      "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";
  };

  const exploreItems = [
    { name: "Home", link: "/" },
    { name: "Visualizer", link: "/sorting" },
    { name: "Problems", link: "/problems" },
    { name: "Judge", link: "/judge" },
    { name: "Map", link: "/map" },
  ];

  const resourceItems = [
    { name: "GitHub", link: "https://github.com" },
    { name: "Documentation", link: "#docs" },
  ];

  const followItems = [
    { name: "GitHub", link: "https://github.com" },
    { name: "LinkedIn", link: "https://linkedin.com" },
    { name: "Twitter", link: "https://twitter.com" },
  ];

  return (
    <footer className="h-auto lg:min-h-screen bg-indigo-100 dark:bg-violet-300">
      <div
        className="relative w-full flex flex-col items-center overflow-hidden"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <h1
          ref={textRef}
          className="animated-text h-fit font-zentry special-font py-10 md:py-5 leading-[.9] text-[8rem] md:text-[8rem] lg:text-[16rem] xl:text-[24rem] 2xl:text-[36rem] min-[1800px]:text-[24rem] text-indigo-900 dark:text-[#000] will-change-transform transition-transform duration-700 ease-out"
        >
          Vant<b>a</b>ge
        </h1>

        <div className="w-full px-10 py-20 lg:py-44">
          <div className="w-[94%] flex flex-wrap gap-10 justify-between">
            <div className="w-full md:w-auto">
              <span className="font-zentry text-6xl font-black text-indigo-900 dark:text-black">
                AV
              </span>
            </div>

            {[
              ["Explore", exploreItems],
              ["Resources", resourceItems],
              ["Follow Us", followItems],
            ].map(([title, items]) => (
              <LinkGroup key={title} title={title} items={items} />
            ))}
          </div>
        </div>

        <div className="w-full flex justify-between items-center px-4 py-4 md:px-10 md:py-6">
          <p className="uppercase text-[0.7rem] md:text-[12px] text-indigo-800 dark:text-black/70">
            &copy;Vantage 2026. All rights reserved
          </p>
          <a
            className="uppercase text-[0.7rem] md:text-[12px] text-indigo-800 dark:text-black/70"
            href="#privacy"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
