import { ThemeProvider } from '@/components/theme-provider';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FAQSection } from '@/components/landing/FAQSection';

function LandingPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="bg-transparent flex flex-col justify-start items-center relative">
        {/* Hero Section */}
        <div className="flex flex-col bg-transparent w-full">
          <HeroSection />
          
          {/* How It Works Section */}
          <HowItWorksSection />
          
          {/* Mask wrapper for transition */}
          <div className="bg-white w-full relative">
            <div className="bg-white w-full h-20 sm:h-32 md:h-40 -mt-10 sm:-mt-16 md:-mt-20 absolute inset-0 transform skew-y-[5deg]" />
          </div>
        </div>

        {/* FAQ Section */}
        <FAQSection />

        {/* Footer */}
        <div className="flex flex-col gap-10 justify-start items-center w-full min-w-full py-6 px-6">
          <div className="flex justify-start items-center w-full max-w-[820px] pt-4 pb-4">
            <p className="text-[#65758b] m-0 font-sans text-base font-normal leading-[150%]">
              Sledging can be directed{' '}
              <a 
                href="https://x.com/CharlesMSmart" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#3b82f6] underline"
              >
                @Charles
              </a>
            </p>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default LandingPage;

