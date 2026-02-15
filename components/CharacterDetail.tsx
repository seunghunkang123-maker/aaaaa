
import React, { useState, useRef } from 'react';
import { Character, CampaignTheme, SecretFile } from '../types';
import { Camera, Save, X, Sparkles, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { enhanceDescription } from '../services/geminiService';

interface CharacterDetailProps {
  character: Character;
  theme: CampaignTheme;
  campaignSetting: string;
  onClose: () => void;
  onUpdate: (updatedChar: Character) => void;
}

// DnD 5e Class Data (Korean Translation)
const DND_CLASSES: Record<string, string[]> = {
  "바바리안": ["광전사의 길", "토템 전사의 길", "선조의 수호자", "광신의 길", "야수의 길", "야생 마법의 길"],
  "바드": ["전승의 학파", "용맹의 학파", "매혹의 학파", "검의 학파", "속삭임의 학파", "웅변의 학파", "창조의 학파", "혼령의 학파"],
  "클레릭": ["지식 권역", "생명 권역", "광명 권역", "자연 권역", "폭풍 권역", "기만 권역", "전쟁 권역", "죽음 권역", "대장장이 권역", "무덤 권역", "질서 권역", "평화 권역", "황혼 권역"],
  "드루이드": ["땅의 회합", "달의 회합", "꿈의 회합", "양치기의 회합", "포자의 회합", "별의 회합", "산불의 회합"],
  "파이터": ["챔피언", "배틀 마스터", "엘드리치 나이트", "비전 궁수", "캐벌리어", "사무라이", "사이 워리어", "룬 나이트", "에코 나이트"],
  "몽크": ["오픈 핸드의 길", "그림자의 길", "4원소의 길", " 켄세이의 길", "태양 영혼의 길", "자비의 길", "아스트랄 자아의 길", "승천한 용의 길"],
  "팔라딘": ["헌신의 맹세", "고대의 맹세", "복수의 맹세", "정복의 맹세", "구원의 맹세", "영광의 맹세", "감시자의 맹세", "맹세 파기자"],
  "레인저": ["헌터", "비스트 마스터", "글룸 스토커", "호라이즌 워커", "몬스터 슬레이어", "페이 원더러", "스웜키퍼", "드레이크워든"],
  "로그": ["시프", "암살자", "아케인 트릭스터", "인퀴지티브", "마스터마인드", "스카우트", "스워시버클러", "팬텀", "소울나이프"],
  "소서러": ["용의 혈통", "와일드 매직", "디바인 소울", "쉐도우 매직", "폭풍 술사", "애버런트 마인드", "클락워크 소울"],
  "워락": ["아크페이", "핀드", "그레이트 올드 원", "셀레스티얼", "헥스블레이드", "심해의 존재", "지니", "언데드"],
  "위저드": ["방호 학파", "소환 학파", "예지 학파", "현혹 학파", "방출 학파", "환영 학파", "사령 학파", "변환 학파", "필경사 학파", "블레이드싱어"],
  "아티피서": ["연금술사", "아머러", "포격술사", "배틀 스미스"],
  "블러드 헌터": ["고스트슬레이어 오더", "라이칸 오더", "뮤턴트 오더", "프로페인 소울 오더"]
};

export const CharacterDetail: React.FC<CharacterDetailProps> = ({ 
  character, 
  theme, 
  campaignSetting,
  onClose, 
  onUpdate 
}) => {
  const [editedChar, setEditedChar] = useState<Character>({ ...character });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secretFileInputRef = useRef<HTMLInputElement>(null);

  const isNPC = editedChar.type === 'NPC';

  // Styling maps
  const containerStyles: Record<string, string> = {
    fantasy: "bg-[#fcf5e5] text-[#2c1810] font-serif border-4 border-[#8b5a2b]",
    gothic: "bg-[#1a1a1a] text-[#e5e5e5] font-serif border-4 border-double border-[#8a0000]",
    cyberpunk: "bg-[#050510]/95 backdrop-blur-xl text-[#0ff] font-mono border-2 border-[#0ff] shadow-[0_0_20px_rgba(0,255,255,0.3)]",
    'sci-fi': "bg-[#0f172a]/95 text-blue-50 font-sans border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    'dark-fantasy': "bg-[#0c0a09] text-[#d6d3d1] font-serif border-2 border-[#44403c] grayscale-[0.2]",
    modern: "bg-white text-gray-900 font-sans border border-gray-200 shadow-xl rounded-2xl",
    comedy: "bg-[#fffbeb] text-[#be185d] font-bold border-[6px] border-[#f472b6] rounded-[2rem] shadow-[8px_8px_0px_#f472b6]",
    horror: "bg-[#020617] text-[#86efac] font-serif border border-[#14532d] shadow-[inset_0_0_50px_#022c22]",
    'post-apoc': "bg-[#271004] text-[#fdba74] font-mono border-4 border-dashed border-[#ea580c]",
    western: "bg-[#e7d5c0] text-[#451a03] font-serif border-8 border-[#78350f] double",
    noir: "bg-[#0a0a0a] text-[#e5e5e5] font-sans border-r-8 border-gray-600 grayscale",
    steampunk: "bg-[#271c19] text-[#d6d3d1] font-serif border-4 border-double border-[#b45309]",
    superhero: "bg-[#172554] text-white font-sans italic border-4 border-[#facc15] shadow-[10px_10px_0px_#facc15]",
  };

  const inputStyles: Record<string, string> = {
    fantasy: "bg-transparent border-b border-[#8b5a2b] focus:outline-none focus:border-b-2 placeholder-[#8b5a2b]/50",
    gothic: "bg-[#2a2a2a] border border-[#555] p-1 focus:border-[#8a0000] focus:outline-none placeholder-gray-600",
    cyberpunk: "bg-[#000] border border-[#0ff] p-1 text-[#0ff] focus:shadow-[0_0_10px_#0ff] focus:outline-none placeholder-[#0ff]/30",
    'sci-fi': "bg-[#1e293b] border border-blue-500/30 p-2 rounded text-blue-100 focus:border-blue-400 focus:outline-none",
    'dark-fantasy': "bg-[#1c1917] border-b border-[#57534e] p-1 focus:border-[#a8a29e] focus:outline-none placeholder-[#57534e]",
    modern: "bg-gray-50 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none",
    comedy: "bg-white border-4 border-[#fbcfe8] p-2 rounded-xl text-[#db2777] focus:border-[#f472b6] focus:outline-none font-black",
    horror: "bg-black border border-[#15803d] p-1 text-[#4ade80] focus:shadow-[0_0_10px_#22c55e] focus:outline-none placeholder-[#15803d]",
    'post-apoc': "bg-[#431407] border border-[#c2410c] p-1 text-[#fdba74] focus:bg-[#7c2d12] focus:outline-none font-mono",
    western: "bg-[#d6c0a0] border-b-2 border-[#78350f] p-1 text-[#451a03] focus:border-black focus:outline-none placeholder-[#78350f]/50",
    noir: "bg-[#262626] border-b border-white p-1 text-white focus:bg-black focus:outline-none",
    steampunk: "bg-[#451a03]/50 border border-[#b45309] p-1 text-[#fed7aa] focus:shadow-[0_0_10px_#b45309] focus:outline-none",
    superhero: "bg-[#1e40af] border-2 border-[#facc15] p-2 skew-x-[-6deg] text-white focus:bg-[#1d4ed8] focus:outline-none",
  };

  const buttonStyles: Record<string, string> = {
    fantasy: "bg-[#8b5a2b] text-[#f4e4bc] hover:bg-[#6b4220]",
    gothic: "bg-[#500] text-white hover:bg-[#700]",
    cyberpunk: "bg-[#0ff] text-black font-bold hover:shadow-[0_0_15px_#0ff]",
    'sci-fi': "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30",
    'dark-fantasy': "bg-[#44403c] text-[#e7e5e4] hover:bg-[#292524]",
    modern: "bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow",
    comedy: "bg-[#f472b6] text-white font-black hover:bg-[#ec4899] hover:scale-110 border-b-4 border-[#be185d] active:border-b-0 active:translate-y-1",
    horror: "bg-[#064e3b] text-[#86efac] border border-[#34d399] hover:bg-[#065f46] hover:text-white",
    'post-apoc': "bg-[#c2410c] text-black font-bold hover:bg-[#ea580c] border-2 border-black",
    western: "bg-[#78350f] text-[#fef3c7] hover:bg-[#92400e] border border-[#451a03]",
    noir: "bg-white text-black hover:bg-gray-200 border border-black",
    steampunk: "bg-[#b45309] text-[#2e1065] font-bold border-2 border-[#78350f] hover:bg-[#d97706]",
    superhero: "bg-[#ef4444] text-white border-2 border-[#facc15] hover:bg-[#dc2626] font-black italic",
  };

  const isDnD = theme === 'fantasy' || theme === 'gothic' || theme === 'dark-fantasy' || theme === 'western';

  // Helper to parse "Class (Subclass)" string
  const parseClassString = (fullClass: string) => {
    const match = fullClass.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
    if (match) {
      return { main: match[1].trim(), sub: match[2]?.trim() || '' };
    }
    return { main: fullClass, sub: '' };
  };

  const { main: currentMainClass, sub: currentSubClass } = isDnD ? parseClassString(editedChar.class) : { main: '', sub: '' };

  const handleClassChange = (main: string, sub: string) => {
    const newClassString = sub ? `${main} (${sub})` : main;
    setEditedChar({ ...editedChar, class: newClassString });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isSecret: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isSecret && editedChar.secretFile) {
            setEditedChar(prev => ({
                ...prev,
                secretFile: { ...prev.secretFile!, imageUrl: result }
            }));
        } else {
            setEditedChar(prev => ({ ...prev, imageUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiEnhance = async () => {
    setIsEnhancing(true);
    const newDesc = await enhanceDescription(editedChar.description, editedChar.name, campaignSetting);
    setEditedChar(prev => ({ ...prev, description: newDesc }));
    setIsEnhancing(false);
  };

  const toggleSecret = () => {
    setShowSecret(!showSecret);
  };

  const inputBaseClass = inputStyles[theme] || inputStyles.fantasy;
  const btnBaseClass = buttonStyles[theme] || buttonStyles.fantasy;
  const containerBaseClass = containerStyles[theme] || containerStyles.fantasy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
      <div className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl ${containerBaseClass}`}>
        
        {/* Header / Toolbar */}
        <div className={`shrink-0 p-4 flex justify-between items-center border-b ${theme === 'cyberpunk' ? 'border-[#0ff] bg-black/50' : 'border-current/20 bg-black/5'}`}>
          <h2 className="text-2xl font-bold uppercase flex items-center gap-2">
            {theme === 'cyberpunk' && '>>'}
            {theme === 'comedy' && '★'}
            {theme === 'superhero' && '⚡'}
             {isNPC ? 'NPC_FILE' : 'CHARACTER_FILE'}
            {theme === 'cyberpunk' && '_'}
            {theme === 'comedy' && '★'}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdate(editedChar)}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-transform active:scale-95 ${btnBaseClass}`}
            >
              <Save size={18} /> 저장
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded hover:bg-red-500/20 text-red-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Image & Stats */}
            <div className="md:col-span-1 space-y-6">
                <div className="relative group aspect-square w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-500 hover:border-current transition-colors">
                <img 
                    src={editedChar.imageUrl || 'https://picsum.photos/1024/1024'} 
                    alt={editedChar.name} 
                    className="w-full h-full object-cover"
                />
                <div 
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="text-white flex flex-col items-center">
                    <Camera size={32} />
                    <span className="text-xs mt-2">사진 변경 (1024x1024)</span>
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e)}
                />
                </div>

                <div className="space-y-4">
                <div>
                    <label className="text-xs opacity-70 uppercase block mb-1">이름</label>
                    <input 
                    value={editedChar.name}
                    onChange={(e) => setEditedChar({...editedChar, name: e.target.value})}
                    className={`w-full text-lg font-bold ${inputBaseClass}`}
                    />
                </div>
                
                {/* NPC: Simplified Role Input */}
                {isNPC ? (
                     <div>
                        <label className="text-xs opacity-70 uppercase block mb-1">역할 / 직업</label>
                        <input 
                            value={editedChar.class}
                            onChange={(e) => setEditedChar({...editedChar, class: e.target.value})}
                            className={`w-full ${inputBaseClass}`}
                            placeholder="예: 상점 주인, 경비병"
                        />
                    </div>
                ) : (
                    // PC: Full Class Inputs
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`${isDnD ? 'col-span-2' : ''}`}>
                            <label className="text-xs opacity-70 uppercase block mb-1">
                                {isDnD ? '클래스 (Class)' : '역할 (Role)'}
                            </label>
                            {isDnD ? (
                            <div className="space-y-2">
                                <select
                                value={DND_CLASSES[currentMainClass] ? currentMainClass : ''}
                                onChange={(e) => handleClassChange(e.target.value, '')}
                                className={`w-full appearance-none p-1 ${inputBaseClass} ${theme === 'fantasy' ? 'bg-[#f4e4bc]' : ''}`}
                                >
                                    <option value="">클래스 선택</option>
                                    {Object.keys(DND_CLASSES).map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                {currentMainClass && DND_CLASSES[currentMainClass] && (
                                    <select
                                        value={currentSubClass}
                                        onChange={(e) => handleClassChange(currentMainClass, e.target.value)}
                                        className={`w-full text-sm appearance-none p-1 ${inputBaseClass} ${theme === 'fantasy' ? 'bg-[#f4e4bc]' : ''}`}
                                    >
                                        <option value="">서브클래스 선택 (선택사항)</option>
                                        {DND_CLASSES[currentMainClass].map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            ) : (
                                <input 
                                    value={editedChar.class}
                                    onChange={(e) => setEditedChar({...editedChar, class: e.target.value})}
                                    className={`w-full ${inputBaseClass}`}
                                />
                            )}
                        </div>
                    </div>
                )}
                
                {/* Race / Origin */}
                <div>
                     <label className="text-xs opacity-70 uppercase block mb-1">
                         {theme === 'cyberpunk' || theme === 'sci-fi' ? '출신 (Origin)' : '종족 (Race)'}
                     </label>
                     <input 
                         value={editedChar.race}
                         onChange={(e) => setEditedChar({...editedChar, race: e.target.value})}
                         className={`w-full ${inputBaseClass}`}
                     />
                 </div>

                <div>
                    <label className="text-xs opacity-70 uppercase block mb-1">상태</label>
                    <select 
                        value={editedChar.status}
                        onChange={(e) => setEditedChar({...editedChar, status: e.target.value as any})}
                        className={`w-full appearance-none p-1 ${inputBaseClass} ${theme === 'fantasy' ? 'bg-[#f4e4bc]' : ''}`}
                    >
                        <option value="Alive">생존 (Alive)</option>
                        <option value="Dead">사망 (Dead)</option>
                        <option value="MIA">실종 (MIA)</option>
                        <option value="Retired">은퇴 (Retired)</option>
                    </select>
                    </div>
                </div>
            </div>

            {/* Right Column: Bio & Secrets */}
            <div className="md:col-span-2 space-y-6">
                
                {/* Main Bio */}
                <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold uppercase tracking-wider">전기 / 노트</label>
                    <button 
                    onClick={handleAiEnhance}
                    disabled={isEnhancing}
                    className={`text-xs px-2 py-1 rounded border flex items-center gap-1 opacity-70 hover:opacity-100 transition-all border-current`}
                    >
                    <Sparkles size={12} />
                    {isEnhancing ? '작성 중...' : 'AI 윤문'}
                    </button>
                </div>
                <textarea 
                    value={editedChar.description}
                    onChange={(e) => setEditedChar({...editedChar, description: e.target.value})}
                    className={`w-full h-64 p-4 rounded text-sm leading-relaxed resize-none ${inputBaseClass}`}
                />
                </div>

                {/* Secret File Section - HIDDEN FOR NPCs */}
                {!isNPC && editedChar.secretFile && (
                <div className={`border-2 mt-8 rounded p-4 transition-all duration-500 ${
                    showSecret 
                    ? (theme === 'cyberpunk' ? 'border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.4)]' : 'border-red-900 bg-red-900/10')
                    : 'border-dashed border-gray-500 opacity-70'
                }`}>
                    <div 
                        className="flex items-center justify-between cursor-pointer mb-4"
                        onClick={toggleSecret}
                    >
                        <div className="flex items-center gap-2">
                        {showSecret ? <Unlock className="text-red-500" /> : <Lock />}
                        <h3 className={`font-bold uppercase ${showSecret ? 'text-red-500' : ''}`}>
                            {editedChar.secretFile.title || '기밀 파일 (CLASSIFIED)'}
                        </h3>
                        </div>
                        {!showSecret && <span className="text-xs uppercase blink animate-pulse">클릭하여 암호 해독</span>}
                    </div>

                    {showSecret && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-start gap-4 p-4 border border-red-500/30 rounded bg-black/20">
                            <AlertTriangle className="text-red-500 shrink-0" />
                            <p className="text-xs opacity-80 italic break-keep">
                            이 파일에는 캐릭터의 과거사, 변신 기믹 혹은 기업 기밀과 관련된 민감한 정보가 포함되어 있습니다.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative group aspect-square bg-black/40 rounded border border-gray-700 overflow-hidden">
                                {editedChar.secretFile.imageUrl ? (
                                    <img src={editedChar.secretFile.imageUrl} className="w-full h-full object-cover" alt="Secret" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">이미지 없음</div>
                                )}
                                <div 
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"
                                    onClick={() => secretFileInputRef.current?.click()}
                                >
                                    <Camera className="text-white" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={secretFileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, true)}
                                />
                            </div>
                            <textarea 
                            value={editedChar.secretFile.content}
                            onChange={(e) => setEditedChar({
                                ...editedChar, 
                                secretFile: { ...editedChar.secretFile!, content: e.target.value }
                            })}
                            className={`w-full h-full min-h-[150px] p-2 text-sm ${inputBaseClass}`}
                            placeholder="기밀 내용을 입력하세요..."
                            />
                        </div>
                    </div>
                    )}
                </div>
                )}

            </div>
            </div>
        </div>
      </div>
    </div>
  );
};
