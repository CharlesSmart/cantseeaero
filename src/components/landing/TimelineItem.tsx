interface TimelineItemProps {
  title: string;
  description: string;
  isLast?: boolean;
}

export function TimelineItem({ title, description, isLast = false }: TimelineItemProps) {
  return (
    <div className="flex flex-col items-center relative w-full">
      <div className="flex flex-col items-center text-center gap-6 p-4 sm:p-7 md:p-10 w-full max-w-[600px]">
        <div className="w-full max-w-[300px] sm:max-w-[350px] md:w-[400px] h-[200px] sm:h-[250px] md:h-[300px] bg-[#9ca3af] rounded-xl flex justify-center items-center relative">
          {/* Placeholder for step image */}
        </div>
        <div className="flex flex-col gap-3 max-w-[500px]">
          <h3 className="text-black font-sans text-2xl sm:text-3xl md:text-3xl font-semibold leading-[130%] m-0">
            {title}
          </h3>
          <p className="text-[#6b7280] font-sans text-sm sm:text-base md:text-lg font-normal leading-[150%] m-0">
            {description}
          </p>
        </div>
      </div>
      {!isLast && (
        <div className="w-0.5 h-20 bg-[#9ca3af] relative my-5" />
      )}
    </div>
  );
}

