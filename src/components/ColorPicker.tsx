import { HexColorPicker } from "react-colorful";
import { useState, useEffect } from "react";

interface Props {
  color: string;
  onChange: (newColor: string) => void;
  onClose?: () => void;
}

export function ColorPicker({ color, onChange, onClose }: Props) {
  const [inputValue, setInputValue] = useState(color);

  // 外部からの color 変更を反映
  useEffect(() => {
    const c = color || "#FFFFFF";
    if (c.toUpperCase() !== inputValue.toUpperCase()) {
      setInputValue(c.toUpperCase());
    }
  }, [color]);

  const handleColorChange = (newColor: string) => {
    if (newColor.toUpperCase() !== color.toUpperCase()) {
      onChange(newColor);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setInputValue(val);
    // 有効なHEX(3 or 6桁)の場合のみ親に通知
    if (/^#?([0-9A-F]{3}){1,2}$/i.test(val)) {
      const hex = val.startsWith("#") ? val : `#${val}`;
      handleColorChange(hex);
    }
  };

  return (
    <div className="relative flex flex-col gap-3 p-4 bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden group">
      {/* Header / Close button */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 select-none">Color Picker</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-8 h-8 p-0 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full z-10"
            title="閉じる"
          >
            <svg 
              width="16" height="16" viewBox="0 0 24 24" 
              fill="none" stroke="#FFFFFF" strokeWidth="2.5" 
              strokeLinecap="round" strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block', pointerEvents: 'none' }}
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="custom-color-picker relative">
        <HexColorPicker color={color} onChange={handleColorChange} />
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div 
          className="w-8 h-8 border border-white/10 shadow-inner shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="relative flex-1 group/input">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-mono group-focus-within/input:text-fire/50 transition-colors">#</span>
            <input
            type="text"
            value={inputValue.replace("#", "")}
            onChange={handleInputChange}
            className="w-full bg-black/60 border border-white/5 text-white font-mono text-xs px-2 py-2 pl-5 focus:outline-none focus:border-fire/40 focus:bg-black/80 transition-all uppercase tracking-wider"
            spellCheck={false}
            />
        </div>
      </div>
      
      <style>{`
        .custom-color-picker .react-colorful {
          width: 100%;
          height: 160px;
        }
        .custom-color-picker .react-colorful__saturation {
          border-radius: 2px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .custom-color-picker .react-colorful__hue {
          height: 14px;
          border-radius: 2px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .custom-color-picker .react-colorful__pointer {
          width: 16px;
          height: 16px;
          border-radius: 0;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
