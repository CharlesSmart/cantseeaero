import { Accordion, AccordionItem } from './Accordion';

const faqItems = [
  {
    question: 'Is a virtual windtunnel accurate?',
    answer: `Nope. But it may be able to provide a helpful starting point for optimisation if used carefully. <br><br>Photo comparison can do an ok job at estimating the difference in frontal area between positions, but this is only the A of CdA. It's possible a change in position may reduce frontal area but increase your coefficient of drag (Cd). It also, certainly won't be able to tell the difference between going from box section to double disc wheels. <br><br>In my initial testing however I have seen some reasonable correlation between these estimates and estimates using the Chung method outdoors. <br><br>For a deep dive, here are some research papers attempting to use and validate this method, some have even weighed cut-out film photos: <a href="https://www.sci-sport.com/en/articles/field-method-for-assessing-the-cycling-frontal-area-005.php" target="_blank" class="text-[#3b82f6] underline"><span>Field method for assessing the cycling frontal area<br>, P Debraux</span></a> & <a href="https://www.tandfonline.com/doi/abs/10.1080/026404199366046" target="_blank" class="text-[#3b82f6] underline">Methodological considerations in the determination of projected frontal area in cyclists<br>, T Olds & S Olive.</a>`
  },
  {
    question: 'Why calibrate with a ruler',
    answer: `To convert from pixels to mm we need a reference element. <br><br>The easiest solution is to take a first photo while holding a ruler or tape measure across your bars, and use this for calibration. Following photos don't need this if the camera or bike position doesn't change as we reuse the calibration ratio.<br><br>It may be possible to use a known length like wheel diameter or bar width for this, but this is difficult to get an accurate measurement from.`
  },
  {
    question: 'Taking good comparison photos',
    answer: `Taking good photos is the hardest part of this method. I recommend placing your camera on a tripod, and your bike on the trainer as squarely in front as possible. It can also be helpful to mark on the floor the position of your wheel and trainer legs to ensure it doesn't move as you get on/off.<br><br>If using a phone it can be handy to set a timer and use burst mode to take a series of photos while pedalling then select the best one.`
  },
  {
    question: 'What sort of camera to use',
    answer: `Any camera or phone of reasonable quality should work.<br><br>However, if possible I recommend using a DSLR with a longer lens focal length positioned further away. When using a phone with a wide focal length the photo is warped slightly making the center larger and effectively hiding pixels towards the edge, see: <a href="https://www.danvojtech.cz/blog/2016/07/amazing-how-focal-length-affect-shape-of-the-face/" target="_blank" class="text-[#3b82f6] underline">visual demonstration.<br><br></a>Using a longer focal length should provide a better frontal estimate. However for comparing photos taken from the same camera, angle and distance this is optional.`
  }
];

export function FAQSection() {
  return (
    <section className="flex justify-center h-auto py-32 sm:py-40 md:py-[256px] px-4 sm:px-6 md:px-8 w-full min-w-full">
      <div className="flex-1 max-w-[820px] flex flex-col">
        <div className="mb-6">
          <h2 className="text-[#18181a] text-2xl sm:text-3xl md:text-[40px] font-semibold leading-[120%] m-0 mb-6">
            How it works
          </h2>
        </div>
        <Accordion>
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </Accordion>
      </div>
    </section>
  );
}

