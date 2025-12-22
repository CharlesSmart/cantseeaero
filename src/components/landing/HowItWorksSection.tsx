import { Timeline } from './Timeline';

const steps = [
  {
    title: 'Take photos on your trainer',
    description: 'Stream from your phone to make it easy.'
  },
  {
    title: 'Remove the background',
    description: 'Background removal in one click thanks to AI'
  },
  {
    title: 'Calibrate your measurements',
    description: 'Include a ruler in one of the photos to convert pixels → mm.'
  },
  {
    title: 'Get aero drag estimate',
    description: 'Compare positions easily and understand how much you\'re losing to aerodynamics.'
  }
];

export function HowItWorksSection() {
  return (
    <div className="bg-white w-full min-w-full py-16 sm:py-20 md:py-32 px-4 sm:px-6 md:px-8 flex justify-center items-center">
      <div className="max-w-[1200px] w-full flex flex-col items-center gap-[60px] sm:gap-20">
        <h2 className="text-black font-sans text-3xl sm:text-4xl md:text-[40px] font-semibold leading-[120%] m-0 text-center">
          How it works
        </h2>
        <Timeline steps={steps} />
      </div>
    </div>
  );
}

