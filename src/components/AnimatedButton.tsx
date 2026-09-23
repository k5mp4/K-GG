import {useRef, useEffect} from 'react';

interface Props { //受け取るデータの型定義
    onClick: () => void; 
    isActive: boolean;
    children: React.ReactNode; //JSXの中身(ボタンのテキストなど)
    className?: string; // ?で省略可能
    title?: string;
}

export function AnimatedButton ({ onClick, isActive, children, className = '', title}: Props) {
    const btnRef = useRef<HTMLButtonElement>(null); // ボタンのDOM要素を掴むための参照
    const animationRef = useRef<Animation | null>(null);
    useEffect(() => () => animationRef.current?.cancel(), []);
    const handleClick = () => {
        onClick();
        btnRef.current?.blur();
        animationRef.current?.cancel();
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            animationRef.current = btnRef.current?.animate?.([
                { transform: 'scale(1)' },
                { transform: 'scale(0.7)', offset: 0.12 },
                { transform: 'scale(1.06)', offset: 0.65 },
                { transform: 'scale(1)' },
            ], { duration: 340, easing: 'ease-out' }) ?? null;
        }
    };
    return (
        <button
            ref={btnRef} // useRefとボタンが繋がる
            onClick={handleClick}
            title={title}
            className={`py-1.5 rounded-none text-xs font-display uppercase tracking-wider transition-colors text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${
            isActive ? 'bg-fire' : 'bg-k-muted hover:bg-[#3D3D3D]'
      } ${className}`}
   
    >
        {children}
    </button>
    );    
}