type LumbreLogoProps = {
  className?: string;
};

/*
  Recolorea el favicon.svg vía máscara CSS (mismo archivo, cualquier color de texto).
*/
export const LumbreLogo = ({ className = "" }: LumbreLogoProps) => (
  <span
    aria-hidden
    className={`inline-block shrink-0 bg-current mask-url(/favicon.svg)] mask-contain mask-no-repeat mask-center [-webkit-mask-image:url(/favicon.svg)] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center] ${className}`}
  />
);
