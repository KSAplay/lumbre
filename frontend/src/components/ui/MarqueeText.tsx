import { useEffect, useRef, useState, type CSSProperties } from "react";

type MarqueeTextProps = {
  text: string;
  className?: string;
  as?: "h3" | "p" | "span";
};

export const MarqueeText = ({
  text,
  className = "",
  as: Tag = "span",
}: MarqueeTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const label = textRef.current;
    if (!container || !label) return;

    const updateDistance = () => {
      const overflow = label.scrollWidth - container.clientWidth;
      setDistance(overflow > 1 ? overflow : 0);
    };

    updateDistance();
    const observer = new ResizeObserver(updateDistance);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className="min-w-0 overflow-hidden">
      <Tag
        ref={textRef as never}
        className={`inline-block max-w-none whitespace-nowrap ${
          distance > 0 ? "animate-dish-marquee" : ""
        } ${className}`}
        style={
          distance > 0
            ? ({ "--marquee-distance": `${distance}px` } as CSSProperties)
            : undefined
        }
      >
        {text}
      </Tag>
    </div>
  );
};
