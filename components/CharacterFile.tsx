
import React from 'react';
import { Character, CampaignTheme } from '../types';
import { FileText, User, Trash2, Users } from 'lucide-react';

interface CharacterFileProps {
  character: Character;
  theme: CampaignTheme;
  onClick: () => void;
  onDelete?: () => void; // Made optional
}

export const CharacterFile: React.FC<CharacterFileProps> = ({ character, theme, onClick, onDelete }) => {
  // Theme-based styling
  const styles: Record<string, string> = {
    fantasy: "bg-[#f4e4bc] border-[#8b5a2b] text-[#4a3b32] font-serif hover:shadow-xl hover:scale-105",
    gothic: "bg-[#2a2a2a] border-[#8a0000] text-gray-200 font-serif border-double hover:shadow-[0_0_15px_rgba(138,0,0,0.5)] hover:scale-105",
    cyberpunk: "bg-black border-cyan-500 text-cyan-400 font-mono border-l-4 hover:shadow-[0_0_15px_#0ff] hover:translate-x-2",
    'sci-fi': "bg-[#0f172a] border-blue-400 text-blue-100 font-sans border-2 rounded-xl hover:shadow-[0_0_20px_#60a5fa] hover:-translate-y-1",
    'dark-fantasy': "bg-[#1c1917] border-[#44403c] text-[#a8a29e] font-serif grayscale-[0.3] hover:grayscale-0 hover:border-[#78716c]",
    modern: "bg-white border-gray-200 text-gray-800 font-sans shadow-sm hover:shadow-lg hover:border-blue-500",
    comedy: "bg-[#fef08a] border-[#ec4899] text-[#be185d] font-bold border-4 rounded-3xl hover:rotate-2 hover:scale-110 shadow-[4px_4px_0px_#ec4899]",
    horror: "bg-[#022c22] border-[#34d399] text-[#6ee7b7] font-serif border-dashed hover:animate-pulse hover:border-red-600 hover:text-red-500",
    'post-apoc': "bg-[#451a03] border-[#ea580c] text-[#fdba74] font-mono border-2 border-dashed hover:rotate-1 hover:bg-[#7c2d12]",
    western: "bg-[#d6c0a0] border-[#78350f] text-[#451a03] font-serif border-4 hover:sepia hover:scale-105",
    noir: "bg-[#171717] border-gray-600 text-gray-300 font-sans border-r-8 hover:bg-white hover:text-black hover:border-black transition-colors duration-500",
    steampunk: "bg-[#2e2018] border-[#b45309] text-[#d6d3d1] font-serif border-4 border-double hover:shadow-[0_0_15px_#b45309]",
    superhero: "bg-[#1e3a8a] border-[#fbbf24] text-white font-sans font-black italic border-b-8 hover:skew-x-[-6deg] hover:scale-105",
  };

  const imageStyles: Record<string, string> = {
    fantasy: "sepia-[.3]",
    gothic: "grayscale contrast-125",
    cyberpunk: "brightness-110 contrast-110",
    'sci-fi': "hue-rotate-15 contrast-125",
    'dark-fantasy': "grayscale-[0.5] brightness-75",
    modern: "brightness-105",
    comedy: "saturate-150 contrast-125",
    horror: "hue-rotate-90 contrast-150 grayscale-[0.3]",
    'post-apoc': "sepia-[.6] contrast-125",
    western: "sepia contrast-110",
    noir: "grayscale contrast-150 brightness-90",
    steampunk: "sepia-[.4] contrast-110 warm-gray",
    superhero: "saturate-200 contrast-125",
  };

  const selectedStyle = styles[theme] || styles.fantasy;
  const selectedImgStyle = imageStyles[theme] || "";
  const isNPC = character.type === 'NPC';

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) onDelete();
  };

  return (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer p-4 h-36 rounded-lg border-2 transition-all duration-300 relative overflow-hidden group flex items-center pr-12
        ${selectedStyle}
      `}
    >
      {/* Decorative Tab/Corner */}
      <div className={`absolute top-0 right-0 p-2 opacity-30 pointer-events-none`}>
        <FileText size={24} />
      </div>

      {/* Delete Button - Only shown if onDelete is provided */}
      {onDelete && (
        <button 
            onClick={handleDelete}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-colors z-10 opacity-0 group-hover:opacity-100"
            title="항목 삭제"
        >
            <Trash2 size={16} />
        </button>
      )}

      <div className="flex items-center gap-4 w-full">
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 border-current shadow-inner`}>
            {character.imageUrl ? (
                <img src={character.imageUrl} alt={character.name} className={`w-full h-full object-cover ${selectedImgStyle}`} />
            ) : (
                <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                    {isNPC ? <Users size={24} /> : <User size={24} />}
                </div>
            )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold uppercase tracking-wider truncate" title={character.name}>
            {character.name}
          </h3>
          <p className="text-sm opacity-80 truncate">
            {character.race} {character.class}
          </p>
          <div className={`mt-1 inline-block px-2 py-0.5 text-xs border rounded opacity-70 whitespace-nowrap font-bold ${isNPC ? 'bg-black/10' : ''}`}>
            {isNPC ? 'NPC' : `Lv. ${character.level}`}
          </div>
        </div>
      </div>
      
      {/* Secret File Indicator (Only for PCs) */}
      {!isNPC && character.secretFile && (
        <div className="absolute bottom-2 right-2">
            <span className={`text-xs px-2 py-1 rounded border opacity-90 font-bold bg-black/20`}>
                SECRET
            </span>
        </div>
      )}
    </div>
  );
};
