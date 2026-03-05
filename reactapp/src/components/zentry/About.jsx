import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
import AnimatedTitle from "./AnimatedTitle";
import { IMAGES } from "../../config/assets";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
      borderRadius: "0",
    });
  });

  return (
    <div id="about" className="w-screen min-h-screen bg-[#0a0a0a] dark:bg-blue-50">
      <div className="relative mt-36 mb-8 flex flex-col items-center gap-5">
          <h2 className="uppercase text-sm md:text-[12px] text-gray-400 dark:text-black">
          Welcome to Vantage
        </h2>

        <AnimatedTitle
          title="Master <b>a</b>lgorithms through <br /> visual <b>l</b>earning"
          containerClass="mt-5 !text-white dark:!text-black text-center"
        />

        <div className="about-subtext">
          <p className="text-gray-400 dark:text-black/70">Transform complex algorithms into intuitive visual experiences</p>

          <p className="text-gray-400 dark:text-black/70">Interactive learning platform for developers at every level</p>
        </div>
      </div>

      <div id="clip" className="h-screen w-screen">
        <div className="mask-clip-path about-image">
          <img
            src={IMAGES.about}
            className="absolute top-0 left-0 size-full object-cover"
            alt="Algorithm visualization background"
          />
        </div>
      </div>
    </div>
  );
};

export default About;
