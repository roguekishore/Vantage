import BentoTilt from "./BentoTilt";
import BentoCard from "./BentoCard";
import { IMAGES } from "../../config/assets";

const Features = () => {
  return (
    <section className="bg-blue-50 dark:bg-black pb-52">
      <div className="container mx-auto px-3 md:px-10">
        <div className="px-5 py-32">
          <p className="text-lg text-black dark:text-blue-50">
            Explore the Vantage Ecosystem
          </p>

          <p className="max-w-md text-lg text-black/50 dark:text-blue-50 dark:opacity-50">
            Immerse yourself in a comprehensive learning platform where
            algorithms come to life through interactive visualizations and
            hands-on practice.
          </p>
        </div>

        <BentoTilt
          className="border-hsla w-full h-96 md:h-[65vh] relative mb-7 overflow-hidden rounded-md"
          isMainCard={true}
        >
          <BentoCard
            src={IMAGES.visualizer}
            title={
              <>
                Visual<b>i</b>zer
              </>
            }
            description="Interactive algorithm visualizations that transform complex concepts into intuitive, step-by-step animations."
            isImage={true}
          />
        </BentoTilt>

        {/* Other Bento Cards */}
        <div className="h-[135vh] grid grid-cols-2 grid-rows-3 gap-7">
          <BentoTilt className="bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2 me-16 md:me-0">
            <BentoCard
              src={IMAGES.problems}
              title={
                <>
                  Pr<b>o</b>blems
                </>
              }
              description="Curated problem sets from sorting algorithms to dynamic programming, organized by difficulty and topic."
              isImage={true}
            />
          </BentoTilt>

          <BentoTilt className="bento-tilt_1 row-span-1 ms-16 md:col-span-1 md:ms-0">
            <BentoCard
              src={IMAGES.judge}
              title={
                <>
                  J<b>u</b>dge
                </>
              }
              description="Online code judge with instant feedback - write, test, and validate your solutions in real-time."
              isImage={true}
            />
          </BentoTilt>

          <BentoTilt className="bento-tilt_1 md:col-span-1">
            <BentoCard
              src={IMAGES.skillMap}
              title={
                <>
                  Skill M<b>a</b>p
                </>
              }
              description="Navigate your learning journey with an interactive skill tree that tracks your progress across topics."
              isImage={true}
            />
          </BentoTilt>

          <BentoTilt className="bento-tilt_2">
            <div className="flex flex-col justify-between size-full bg-violet-300 p-5">
              <h1 className="bento-title special-font max-w-64 text-white dark:text-black">
                m<b>o</b>re feat<b>u</b>res co<b>m</b>ing s<b>o</b>on.
              </h1>

              <div className="mt-auto self-end">
                <span className="font-zentry text-6xl font-black text-white dark:text-black">
                  AV
                </span>
              </div>
            </div>
          </BentoTilt>

          <BentoTilt className="bento-tilt_2">
            <div className="size-full bg-gradient-to-br from-blue-300 via-violet-300 to-yellow-300" />
          </BentoTilt>
        </div>
      </div>
    </section>
  );
};

export default Features;
