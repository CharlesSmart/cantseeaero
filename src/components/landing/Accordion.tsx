import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  question: string;
  answer: string | React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ question, answer, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#d8d8d8] w-full">
      <button
        className="flex justify-between items-center w-full mb-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${question}`}
      >
        <h3 className="text-[#18181a] text-lg font-semibold m-0 text-left">
          {question}
        </h3>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-[#18181a] transition-transform duration-200",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      <div
        id={`accordion-content-${question}`}
        aria-hidden={!isOpen}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"
        )}
      >
        <div className="text-[#18181a] text-base">
          {typeof answer === 'string' ? (
            <p className="m-0 [&_a]:text-[#3b82f6] [&_a]:underline" dangerouslySetInnerHTML={{ __html: answer }} />
          ) : (
            answer
          )}
        </div>
      </div>
    </div>
  );
}

interface AccordionProps {
  children: React.ReactNode;
}

export function Accordion({ children }: AccordionProps) {
  return <div className="flex flex-col gap-6 w-full">{children}</div>;
}

