import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { TiLocationArrow } from "react-icons/ti";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { IMAGES } from "../../config/assets";

gsap.registerPlugin(ScrollTrigger);

const ZentryHero = () => {
  const navigate = useNavigate();

  // Handle Video Clip Animation on Scroll
  useGSAP(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0%, 74% 0%, 90% 90%, -3% 100%)",
      borderRadius: "0% 0% 39% 0%",
    });

    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0% 0% 0% 0%",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  });

  return (
    <div id="home" className="relative h-screen w-screen overflow-x-hidden">
      <div
        id="video-frame"
        className="relative z-10 h-screen w-screen overflow-hidden rounded-lg bg-blue-75"
      >
        {/* Static background image */}
        <img
          src={IMAGES.hero}
          alt="Algorithm visualization background"
          className="absolute top-0 left-0 size-full object-cover object-center"
        />

        {/* Bottom-right large text */}
        <h1 className="hero-heading special-font z-40 absolute bottom-5 right-5 text-blue-75">
          DS<b>A</b>
        </h1>

        {/* Top-left content overlay */}
        <div className="absolute top-0 left-0 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10">
            <h1 className="hero-heading special-font text-blue-100">
              Visu<b>a</b>lize
            </h1>

            <p className="mb-5 max-w-64 text-blue-100 leading-tight">
              Master Algorithms Visually
              <br />
              Learn. Build. Conquer.
            </p>

            <Button
              id="start-exploring"
              title="Start Exploring"
              leftIcon={<TiLocationArrow />}
              containerClass="!bg-yellow-300 flex-center gap-2"
            />
          </div>
        </div>
      </div>

      {/* Bottom-right text behind the clip */}
      <h1 className="hero-heading special-font absolute bottom-5 right-5 text-gray-300 dark:text-black">
        DS<b>A</b>
      </h1>
    </div>
  );
};

export default ZentryHero;
