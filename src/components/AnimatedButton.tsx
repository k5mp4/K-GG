import {useRef} from 'react';
import {gsap} from 'gsap';

interface Props { //受け取るデータの型定義
    onClick: () => void; 
    isActive: boolean;
    children: React.ReactNode; //JSXの中身(ボタンのテキストなど)
    className?: string; // ?で省略可能
    title?: string;
}

export function AnimatedButton ({ onClick, isActive, children, className = '', title}: Props) {
    const btnRef = useRef<HTMLButtonElement>(null); // ボタンのDOM要素を掴むための参照
    const handleClick = () => {
        onClick();
        btnRef.current?.blur();
        gsap.timeline()
            .to(btnRef.current, { scale: 0.7, duration: 0.04, ease: 'power2.in'})
            .to(btnRef.current, { scale: 1, duration: 0.3, ease: 'elastic.out(2, 0.5)'});
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