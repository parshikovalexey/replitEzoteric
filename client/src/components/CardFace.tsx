import { cn } from "@/lib/utils";

interface CardFaceProps {
  card: {
    image: string;
    name: string;
    orientation: string;
  };
  isChosen?: boolean;
  className?: string;
}

export function CardFace({ card, isChosen, className }: CardFaceProps) {
  const isPortrait = card.orientation === 'portrait';
  return (
    <div className={cn(
      "w-full relative bg-card border-2 shadow-xl rounded-xl overflow-hidden",
      isChosen ? "border-primary shadow-[0_0_15px_var(--primary)]" : "border-primary/50",
      className
    )}>
      <img
        src={card.image}
        alt={card.name}
        className={`w-full h-full object-contain ${isPortrait ? '' : 'object-top'}`}
      />
    </div>
  );
}