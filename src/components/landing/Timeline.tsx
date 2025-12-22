import { TimelineItem } from './TimelineItem';

interface TimelineStep {
  title: string;
  description: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  return (
    <div className="flex flex-col w-full max-w-[800px] relative">
      {steps.map((step, index) => (
        <TimelineItem
          key={index}
          title={step.title}
          description={step.description}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
}

