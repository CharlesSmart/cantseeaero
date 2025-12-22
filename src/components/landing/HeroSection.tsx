import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative w-full min-w-full bg-white bg-[radial-gradient(rgb(255,255,255),rgb(239,242,245))] pt-16 px-0 pb-0 overflow-hidden">
      {/* Pattern Background */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-repeat-x bg-[50%_0] -z-[2]"
        style={{ backgroundImage: 'url(/Pattern-Top.svg)' }}
      />
      
      {/* Fade to white gradient */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(255, 255, 255, 0.8) 85%, rgb(255, 255, 255) 100%)'
        }}
      />

      <div className="max-w-[1200px] mx-auto flex flex-col gap-20 pt-8 px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6 md:gap-20 relative z-[1]">
          {/* Content */}
          <div className="flex flex-col gap-10 w-full max-w-[500px] items-start md:items-start text-left md:text-left">
            <img 
              src="/cantseeaero_logo.svg" 
              alt="cantseeaero logo" 
              className="w-8 h-[31px]"
              loading="lazy"
            />
            
            <div className="flex flex-col gap-4">
              <h1 className="text-black m-0 font-sans text-3xl sm:text-4xl md:text-5xl font-semibold leading-[130%]">
                Aero testing with<br />your phone
              </h1>
              <p className="text-[#6b7280] m-0 font-sans text-base sm:text-lg font-normal leading-[150%]">
                A virtual wind tunnel to estimate aero drag
              </p>
            </div>

            <Link to="/app">
              <Button 
                className="bg-white text-black border border-black/10 rounded-lg h-12 px-6 py-4 gap-2 hover:bg-[#f9f9f9] shadow-[inset_0_-2px_0px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)] transition-all"
              >
                <span className="font-sans text-base font-semibold leading-5">Start testing</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </Button>
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative flex-1 max-w-[600px] w-full md:w-auto h-auto">
            <img 
              src="/hero.png" 
              alt="Hero illustration" 
              className="relative w-full h-auto"
              loading="lazy"
              sizes="(max-width: 479px) 180vw, (max-width: 767px) 85vw, 89vw"
            />
            
            {/* CdA Label */}
            <div className="absolute left-[-60px] sm:left-[-80px] md:left-[-120px] top-[30%] sm:top-[35%] md:top-[40%] flex items-center gap-1.5 sm:gap-2 z-10">
              <div className="text-[#3b82f6] font-mono text-xs sm:text-sm md:text-sm font-normal leading-none whitespace-nowrap">
                <span className="text-[#6b7280]">CdA:</span> 0.22
              </div>
              <img 
                src="/connection.svg" 
                alt="" 
                className="w-10 sm:w-[50px] md:w-[60px] h-auto opacity-70"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

