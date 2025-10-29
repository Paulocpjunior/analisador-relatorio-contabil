
import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const logoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAbFBMVEX///8zOTz8/Pz6+vr2+PguNTry+fA+QUYvNDo8P0EtMjkAN0bDyMgAPk3g4eHl5eXv8fVpb3VXYWRDT1QANkQAO0qHiYwARkhwdXt/hIZSVVpkamoAQ03S1NVJTlEAFjhobnQAFztASVApLDBNX1//uYVzAAAGIklEQVR4nO2d63qiMBCGR+AsiIgoKoIi1fr+L3iVFUQBQXsw996z9l9a29zJJBORkEwmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADxqE6uF2+q+3X/V0q/3V21+d/ANt9vteq2+3d+17U839t3u/zZf/dE/d/v9/ut+09KviGgDHyL/4f+j//H/pf/x/4v/I//j/6f/sf+L/xP/4/8n/2v/4/8n/+v/r/+P/6//H//f/r/9j//f/N/+R//v/W/9j/+v/W/9j/5f+9/6H/2//b/6f/N/+v/k/93/+//f/p/8//+/+H/1f/p/8//k/+X/6f/V//P/m/93/2/+P/6//b/5//N/+v/z//v/t/8v/s/+f/2f+z/3//7/7//L/9//N/9f/O/93/+//b/5P/V/6f/b/5//Z/9v/N/9f/V/7v/V//f/X/4//r/7P/Z/8P/u/+f/3/8f/B/9f/d/9v/g/+P/6//Z/8f/d/9v/O//3/2/87/1//j/9f/h/+v/i/+3/yf+b/3f/b/3v/s/8n/q/+f/2/+H/1//r/9v/e/9j/+f/b/4v/1//n/+//1/+//yf/j/+f/1//T/7f/b//f/f/5P/l/+v/d/8//r/8f/z/+//R/+f/1/8v/9//p/9v/o/+n/1/+//+/+j/3f/H/+f/r/+f/3//H/8//r/+n/+//d/8f/r/+//u//3/+//y/+7/1//P/7v/N//P/9/+f/3//H/8//n/9//p/+P/1//X/8//l/9//n/9//q/+//q/9X/+//d/+//n/+v/9//r/+P/7//n//f/N//P/8/+7/3//b/5P/d/8P/p/8v/u/+f/0/+r/6f/N/6v/h/+P/1//P/6v/N/+f/b/7//N/5v/x/+r/xf+r/xf/L/+P/7v/9/9f/N/8P/e/+3/3/+f/7//d//v/p/9//n/+P/5/+P/5P/V/+f/9/+v/h/8X/u/9X/+//V//f/+//v/t/+//n/8n/q/+3/1/+n/+//V//v/q/+f/2//P/5f/b/5v/1//n/9v/g/+//1//j/+f/1//T/6P/d/8n/m/+v/z//H/+//n/8v/o/9f/l/+P/3//H/+//x//r/8f/z/+f/2f+T/6f/P/+f/d/9P/h/+n/+//h/+n/+v/p/+f/1/+3/8/+7/5//b/7v/N/+v/o/+//+/+3/+/83/6/+//+//3/+f/9//n/+f/3/+//x/+v/5//B//v/9//l/+P/6/+//u/+//o/+n/y/+n/z//d/+f/4//r/+//xf+//xf/b/6f/d/9v/r/+f/w//b/7f/N/8n/s/+7//P/p/9f/p/+f/7//d/8P/t/9//+/83/+/+r//v/l/+v/d/+v/n/8P/9//o/+f/n/+n/7P/R/+P/o/+n/2/+P/xf/L/4v/t/8v/s/+b/xf/b/4v/Z/7P/h/+n/2/+3/y//H/8f/d/8v/V/+P/4/+r/9//p/9v/m//n/9v/q/93/o/+//w/+v/xf+v/w/+3/+//w/+b/6//V/6f/N/+//N/+v/j//n/y/+3/o/+3/+//2/+b/2f+L/3f/V/7P/Z/8v/h/+n/y//n/9v/n/+v/p/8n/+/+H/2/+n/2/+r//v/l/9f/n/9v/l/+v/1//L/6f/j/+f/z/+X//f/N/+f/1f/p/9f/p/+n/+//p//P/+//k/93/s/9v/n/9f/+/+//q//X/1//H/8f/N/8v/e/+//+//+/+P/6//n/+//xf+7/4f/L//f/Z/6P/p//f/h/+n/w/+r/+f+//x//L/6v/l/9//l/+P/o/+n/1//p/+v/5//j//X/+//R/+//y//n/+//xf/x/+n//P/b/8v/h/+f/x//r/1f+//n/8n/q/+//+//xf/V/8f/x//n/+//+//1//L/6f/N/+f/1//H//f/R/+//xf/T/7//N/9v/t//f/e/+//y/+7/7//r//v/g/+//o/+f/2//n/+//+/83/o/+n/+//+//xf+//l/+P/2/+n/+//+/+H//f/1f/x/+f/+/+//+//3/+//+//n/8f/q/+P/4/+3/+//+//+//+//k//f/4/+f/6/+f/+//2f+r/2/+n/+f/y/+f/3//P/+//n//v/9/+v/o/9n/h/8n/s/+v/+//V/6v/F/9v/l//3/+//+//+//+//y/+n/+//+//+//x//L//v/9/+v/o/+3/s/9//h/+//k//f/n/+//+//k/+f/s//H/+//xf+n/w/+f/4//n/+v/+//+//z//n/w/+r/+//k//f/6f/V/+H/5f/l/9v/9//p/+P/7f/j/8//+/+P/6/+b/5v/N//P/t/+//n/+//k//v/+/+//2f+L//P/l/+P/4/+v/xf+//+//xf+//xf/L/+f/3//P/+//xf+7/z/+f/o/+v/+//+//+//k/+f/+//+/+//1f/r/4//l/+//xf+f/x/+r//v/g/83/+/+L/xf+r//f/r/+f/xf+//+//+//n/9v/e//n/+f/+/+//s//H/+//+//n/+//xf+//n/9v/1//r/7P/B/9f/g/+v/h/8f/t/+//xf+//h/+//o//n//v/n/+f/x/+3/3f/T/6v/h/8n/p/+P/xf+//+//+/+r/+n/+//o/9v/l/+v/j/+v/n//v/+/+b/x/+H/xf+//yf+//+//l/+v/p/+v/h/9v/q//3/+//w//V/8v/n/+f/+/+//+//+//+//3f/D/4P/d/8n/s/+//+/+L//v/l/+v/xf+H/+/+//+//y//P/+//+/+v/s/8H/+f+//9//f//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v/1+7N67wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgA1+ASW256Q+R1L1AAAAAElFTkSuQmCC';

  return (
    <header className="text-center mb-10">
      <div className="flex justify-between items-center w-full">
        {/* Invisible spacer to balance the settings icon */}
        <div className="w-10 h-10"></div>

        {/* Centered Logo and Title */}
        <div className="flex flex-col items-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img
              src={logoDataUrl}
              alt="Logo do Analisador Contábil com IA, um 'A' estilizado com um gráfico de barras dentro."
              className="h-16"
            />
            <h1 className="text-4xl font-bold text-white">Analisador Contábil com IA</h1>
          </div>
          <p className="text-lg text-blue-200">
            Faça upload de seus relatórios (.pdf, .xlsx) e obtenha uma análise completa e inteligente.
          </p>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Configurações"
          title="Configurações"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
};
