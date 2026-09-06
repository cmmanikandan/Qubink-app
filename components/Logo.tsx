import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  lightText?: boolean;
  className?: string;
}

export default function QubinkLogo({
  size = 'md',
  showText = true,
  showTagline = false,
  lightText = false,
  className = '',
}: LogoProps) {
  const dimensionMap = {
    sm: { img: 28, text: 'text-lg', tag: 'text-[9px]', gap: 'gap-1.5' },
    md: { img: 36, text: 'text-xl', tag: 'text-[10px]', gap: 'gap-2' },
    lg: { img: 48, text: 'text-2xl', tag: 'text-xs', gap: 'gap-2.5' },
    xl: { img: 64, text: 'text-3xl', tag: 'text-sm', gap: 'gap-3' },
  };

  const dim = dimensionMap[size];

  return (
    <div className={`flex items-center ${dim.gap} select-none ${className}`}>
      <div
        className="relative flex-shrink-0 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: dim.img, height: dim.img }}
      >
        <Image
          src="/logo.png"
          alt="Qubink Logo"
          width={dim.img}
          height={dim.img}
          className="w-full h-full object-contain drop-shadow-sm"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={`font-black tracking-tight font-heading leading-none ${
              dim.text
            } ${lightText ? 'text-white' : 'text-qubink-navy'}`}
          >
            QUB<span className="text-qubink-teal">INK</span>
          </span>
          {showTagline && (
            <span
              className={`font-medium tracking-wide uppercase mt-0.5 ${
                dim.tag
              } ${lightText ? 'text-qubink-softmint' : 'text-qubink-muted'}`}
            >
              Print. Collect. Delivered.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
