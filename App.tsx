
import React, { useState, useEffect, useRef } from 'react';
import { Campaign, Character, AppState, CampaignTheme } from './types';
import { CampaignIcon } from './components/IconComponents';
import { CharacterFile } from './components/CharacterFile';
import { CharacterDetail } from './components/CharacterDetail';
import { ArrowLeft, Plus, Image as ImageIcon, Settings, Upload, Check, Trash2, RefreshCw, Lock, Unlock, User, Users } from 'lucide-react';

// --- INITIAL MOCK DATA ---
const INITIAL_DATA: Campaign[] = [
  {
    id: 'setting_fr',
    title: '포가튼 렐름',
    system: 'DnD 5e',
    setting: 'Forgotten Realms',
    theme: 'fantasy',
    description: '워터딥과 판델버 캠페인을 포함한 포가튼 렐름의 모험가들입니다.',
    logo: '',
    characters: [
      {
        id: 'w1',
        name: 'Gromph',
        type: 'PC',
        race: '하프 오크',
        class: '바바리안',
        level: 5,
        status: 'Alive',
        description: '돌주먹과 금빛 심장을 가진 술집 경비원입니다. 새끼 고양이를 좋아합니다.',
        imageUrl: 'https://picsum.photos/id/1012/1024/1024',
      },
      {
        id: 'w2',
        name: 'Elara Moonwhisper',
        type: 'PC',
        race: '엘프',
        class: '위저드',
        level: 5,
        status: 'Alive',
        description: '선조들의 잃어버린 도서관을 찾아다니는 마법사입니다.',
        imageUrl: 'https://picsum.photos/id/1027/1024/1024',
      },
      {
        id: 'p1',
        name: 'Seraphina',
        type: 'PC',
        race: '티플링',
        class: '클레릭',
        level: 8,
        status: 'MIA',
        description: '일마터의 사제로, 구원을 찾아 국경지대를 방랑하고 있었습니다.',
        imageUrl: 'https://picsum.photos/id/1025/1024/1024',
      }
    ]
  },
  {
    id: 'setting_rl',
    title: '레이븐로프트',
    system: 'DnD 5e',
    setting: 'Ravenloft',
    theme: 'gothic',
    description: '스트라드 폰 자로비치의 영지, 바로비아의 안개 속에 갇힌 자들입니다.',
    logo: '',
    characters: [
      {
        id: 's1',
        name: 'Ismark the Lesser',
        type: 'NPC',
        race: '인간',
        class: '파이터',
        level: 9,
        status: 'Alive',
        description: '동생 이리나를 지키기 위해 검을 든 전사입니다. 우울하지만 결의에 차 있습니다.',
        imageUrl: 'https://picsum.photos/id/1005/1024/1024',
        secretFile: {
            title: '늑대인간화 진행 기록',
            content: '세 번째 보름달이 떴을 때 늑대인간에게 물렸습니다. 신선한 고기 냄새를 맡으면 폭력적으로 변합니다.',
            isUnlocked: false,
            imageUrl: 'https://picsum.photos/id/237/1024/1024' // Dog/Wolf placeholder
        }
      }
    ]
  },
  {
    id: 'setting_nc',
    title: '나이트 시티',
    system: 'Cyberpunk RED',
    setting: 'Night City',
    theme: 'cyberpunk',
    description: '하이 테크, 로우 라이프. 기업의 지배 아래 살아남은 엣지러너들입니다.',
    logo: '',
    characters: [
      {
        id: 'cp1',
        name: 'V0iD',
        type: 'PC',
        race: 'Human',
        class: 'Netrunner',
        level: 4, // Rank
        status: 'Alive',
        description: '네트워크의 유령입니다. 아라사카를 증오합니다.',
        imageUrl: 'https://picsum.photos/id/1/1024/1024',
        secretFile: {
            title: '과거 신원: 기업 요원',
            content: '밀리테크의 전 대정보부 요원입니다. 탈출하기 위해 스스로 기억을 삭제했습니다.',
            isUnlocked: false,
            imageUrl: 'https://picsum.photos/id/2/1024/1024'
        }
      }
    ]
  }
];

const App: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('rpg_archives_data');
    let parsed: Campaign[] = saved ? JSON.parse(saved) : INITIAL_DATA;
    
    // Migration: Ensure 'type' field exists
    parsed = parsed.map(c => ({
        ...c,
        characters: c.characters.map((char: any) => ({
            ...char,
            type: char.type || 'PC' // Default to PC if missing
        }))
    }));
    return parsed;
  });
  
  // Update state types to support array of strings for rotating backgrounds
  const [campaignBackgrounds, setCampaignBackgrounds] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('rpg_archives_campaign_bgs');
    const parsed = saved ? JSON.parse(saved) : {};
    const migrated: Record<string, string[]> = {};
    Object.keys(parsed).forEach(key => {
        if (typeof parsed[key] === 'string') {
            migrated[key] = [parsed[key]];
        } else {
            migrated[key] = parsed[key];
        }
    });
    return migrated;
  });

  const [globalBackground, setGlobalBackground] = useState<string[]>(() => {
    const saved = localStorage.getItem('rpg_archives_global_bg');
    if (!saved) return [];
    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [saved];
    } catch {
        return [saved];
    }
  });

  const [bgIndex, setBgIndex] = useState(0);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  // Admin / Auth state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // Forms state for new campaign
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampSystem, setNewCampSystem] = useState<string>('DnD 5e');
  const [newCampTheme, setNewCampTheme] = useState<CampaignTheme>('fantasy');
  const [newCampSetting, setNewCampSetting] = useState('');

  const bgInputRef = useRef<HTMLInputElement>(null);
  const globalBgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Background Rotation Logic
  useEffect(() => {
    const interval = setInterval(() => {
        setBgIndex(prev => prev + 1);
    }, 10000); // Rotate every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Persistence
useEffect(() => {
  try {
    localStorage.setItem('rpg_archives_data', JSON.stringify(campaigns));
  } catch (e) {
    console.error('localStorage save failed:', e);
    alert('저장 용량이 초과되어 저장에 실패했습니다. 이미지 용량을 줄이거나 일부 이미지를 제거해 주세요.');
  }
}, [campaigns]);

  // --- Handlers ---

  const handleAdminLogin = () => {
    if (adminPasswordInput === 'dnjsdiddjtjs') {
        setIsAdmin(true);
        setAdminPasswordInput('');
        alert("관리자 권한이 승인되었습니다. 삭제 및 편집 기능이 활성화됩니다.");
    } else {
        alert("암호가 올바르지 않습니다.");
    }
  };

  const handleAdminLogout = () => {
      setIsAdmin(false);
      alert("관리자 모드가 해제되었습니다.");
  };

  const handleDeleteCampaign = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevent opening the campaign
      // Double check admin status
      if (!isAdmin) {
          alert("관리자 권한이 필요합니다. 설정에서 암호를 입력하십시오.");
          return;
      }

      if (window.confirm("정말로 이 캠페인을 삭제하시겠습니까? 포함된 모든 캐릭터가 삭제됩니다.")) {
          setCampaigns(prev => prev.filter(c => c.id !== id));
          // Also clean up backgrounds
          const newBgs = { ...campaignBackgrounds };
          delete newBgs[id];
          setCampaignBackgrounds(newBgs);
      }
  };

  const handleDeleteCharacter = (characterId: string) => {
      if (!selectedCampaignId) return;
      if (!isAdmin) return;

      if (window.confirm("이 캐릭터 데이터를 영구적으로 삭제하시겠습니까?")) {
          setCampaigns(prev => prev.map(camp => {
              if (camp.id !== selectedCampaignId) return camp;
              return {
                  ...camp,
                  characters: camp.characters.filter(c => c.id !== characterId)
              };
          }));
      }
  };

  const handleUpdateCharacter = (updatedChar: Character) => {
    if (!selectedCampaignId) return;

    setCampaigns(prev => prev.map(camp => {
      if (camp.id !== selectedCampaignId) return camp;
      return {
        ...camp,
        characters: camp.characters.map(char => char.id === updatedChar.id ? updatedChar : char)
      };
    }));
    setSelectedCharacterId(null); // Close modal on save
  };

  const handleCreateNewCharacter = (type: 'PC' | 'NPC') => {
    if (!selectedCampaignId) return;
    
    const newChar: Character = {
        id: Date.now().toString(),
        name: type === 'PC' ? '새로운 모험가' : '새로운 NPC',
        type: type,
        race: '',
        class: '',
        level: type === 'PC' ? 1 : 0,
        status: 'Alive',
        description: '',
        imageUrl: '',
        // Only PC gets secret file in specific themes
        secretFile: (type === 'PC' && (activeCampaign?.theme === 'gothic' || activeCampaign?.theme === 'cyberpunk' || activeCampaign?.theme === 'sci-fi' || activeCampaign?.theme === 'noir')) ? {
            title: '기밀 기록',
            content: '기록된 데이터 없음.',
            isUnlocked: false
        } : undefined
    };

    setCampaigns(prev => prev.map(camp => {
        if (camp.id !== selectedCampaignId) return camp;
        return { ...camp, characters: [...camp.characters, newChar] };
    }));
    
    setIsCreationModalOpen(false);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCampaignId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCampaignBackgrounds(prev => ({
            ...prev,
            [selectedCampaignId]: [...(prev[selectedCampaignId] || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGlobalBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGlobalBackground(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearGlobalBgs = () => setGlobalBackground([]);
  const clearCampaignBg = () => {
      if (selectedCampaignId) {
          setCampaignBackgrounds(prev => ({ ...prev, [selectedCampaignId]: [] }));
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, campaignId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          setCampaigns(prev => prev.map(camp => {
              if (camp.id !== campaignId) return camp;
              return { ...camp, logo: reader.result as string };
          }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCampaign = () => {
      if (!newCampTitle) return;
      const newCamp: Campaign = {
          id: `custom_${Date.now()}`,
          title: newCampTitle,
          system: newCampSystem as any,
          theme: newCampTheme,
          setting: newCampSetting || newCampTitle,
          description: '새로운 모험이 기다립니다.',
          logo: '',
          characters: []
      };
      setCampaigns(prev => [...prev, newCamp]);
      setNewCampTitle('');
      setNewCampSetting('');
      alert('캠페인이 생성되었습니다!');
  };

  // Determine current background image
  const getCurrentBg = () => {
      const bgList = selectedCampaignId 
        ? (campaignBackgrounds[selectedCampaignId]?.length ? campaignBackgrounds[selectedCampaignId] : globalBackground)
        : globalBackground;

      if (!bgList || bgList.length === 0) return null;
      return bgList[bgIndex % bgList.length];
  };

  const currentBgImage = getCurrentBg();

  // Render Theme Logic
  const getBackgroundClass = () => {
    if (currentBgImage) return "bg-gray-900"; // Base color if image exists

    // Campaign View Defaults
    if (activeCampaign) {
        switch(activeCampaign.theme) {
            case 'fantasy': return "bg-[#e8dcb5] pattern-paper"; 
            case 'gothic': return "bg-[#111] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black";
            case 'cyberpunk': return "bg-[#050510] bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]";
            case 'sci-fi': return "bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b] via-[#020617] to-black";
            case 'dark-fantasy': return "bg-[#0c0a09] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1c1917] to-black";
            case 'modern': return "bg-gray-100 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]";
            case 'comedy': return "bg-[#fff1f2] bg-[radial-gradient(#f472b6_2px,transparent_2px)] [background-size:16px_16px]";
            case 'horror': return "bg-black bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#064e3b] to-black";
            case 'post-apoc': return "bg-[#451a03] bg-[url('https://www.transparenttextures.com/patterns/rust.png')]"; // Fallback pattern usually ignored, using color mainly
            case 'western': return "bg-[#d6c0a0] bg-[url('https://www.transparenttextures.com/patterns/paper.png')]";
            case 'noir': return "bg-[#171717] bg-[repeating-linear-gradient(45deg,#000_0px,#000_2px,#171717_2px,#171717_8px)]";
            case 'steampunk': return "bg-[#271c19] bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:20px_20px]";
            case 'superhero': return "bg-[#172554] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3b82f6] to-[#1e3a8a]";
            default: return "bg-gray-900";
        }
    }

    // Landing View Default
    return "bg-gray-900";
  };

  const getTitleColor = () => {
    if (!activeCampaign) return "text-white";
    switch(activeCampaign.theme) {
        case 'fantasy': return "text-[#4a3b32]";
        case 'gothic': return "text-[#8a0000]";
        case 'cyberpunk': return "text-[#0ff] shadow-[0_0_10px_#0ff]";
        case 'sci-fi': return "text-blue-200 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]";
        case 'dark-fantasy': return "text-[#d6d3d1]";
        case 'modern': return "text-gray-900";
        case 'comedy': return "text-[#db2777] drop-shadow-md";
        case 'horror': return "text-[#4ade80] shadow-[0_0_10px_#14532d]";
        case 'post-apoc': return "text-[#fdba74]";
        case 'western': return "text-[#451a03]";
        case 'noir': return "text-gray-200";
        case 'steampunk': return "text-[#fbbf24] shadow-[0_0_5px_#78350f]";
        case 'superhero': return "text-[#facc15] drop-shadow-[4px_4px_0_#b91c1c]";
        default: return "text-white";
    }
  };

  const getAddButtonStyle = () => {
     if (!activeCampaign) return "";
     switch (activeCampaign.theme) {
        case 'fantasy': return 'border-[#8b5a2b] bg-[#f4e4bc]/10 text-[#f4e4bc]';
        case 'gothic': return 'border-gray-500 bg-gray-900/40 text-gray-300 hover:border-white hover:text-white';
        case 'cyberpunk': return 'border-[#0ff] bg-[#000]/40 text-[#0ff] hover:bg-[#0ff]/10 hover:shadow-[0_0_10px_#0ff]';
        case 'sci-fi': return 'border-blue-500 bg-blue-900/20 text-blue-200 hover:shadow-[0_0_20px_#3b82f6]';
        case 'dark-fantasy': return 'border-[#78716c] bg-black/50 text-[#a8a29e] hover:border-[#d6d3d1]';
        case 'modern': return 'border-gray-300 bg-white/50 text-gray-600 hover:bg-white hover:text-blue-600';
        case 'comedy': return 'border-[#f472b6] bg-white/60 text-[#db2777] hover:scale-105 border-dashed border-4';
        case 'horror': return 'border-[#15803d] bg-black/60 text-[#4ade80] hover:animate-pulse';
        case 'post-apoc': return 'border-[#c2410c] bg-[#451a03]/50 text-[#fdba74] border-dashed';
        case 'western': return 'border-[#78350f] bg-[#d6c0a0]/30 text-[#fef3c7]';
        case 'noir': return 'border-gray-500 bg-black/50 text-gray-400 hover:bg-white hover:text-black';
        case 'steampunk': return 'border-[#b45309] bg-[#451a03]/30 text-[#fdba74] border-double border-4';
        case 'superhero': return 'border-[#facc15] bg-[#1e40af]/40 text-[#facc15] hover:skew-x-[-6deg]';
        default: return 'border-gray-500 text-gray-300';
     }
  }

  const rootStyle = currentBgImage ? {
    backgroundImage: `url(${currentBgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    transition: 'background-image 1s ease-in-out'
  } : {};

  return (
    <div 
        className={`min-h-screen transition-colors duration-500 relative ${getBackgroundClass()}`}
        style={rootStyle}
    >
      {/* Overlay to ensure text readability if BG image is active */}
      {currentBgImage && <div className="absolute inset-0 bg-black/70 pointer-events-none z-0" />}
      
      {/* --- GLOBAL SETTINGS MODAL --- */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Settings className="w-5 h-5" /> 시스템 설정
                      </h2>
                      <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white">
                          <Check className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-8 text-gray-300">
                      
                      {/* Section 0: Admin Auth */}
                      <section>
                          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                              <Lock size={14}/> 관리자 권한 인증
                          </h3>
                          <div className="bg-gray-800 p-4 rounded flex flex-col gap-4">
                              {isAdmin ? (
                                  <div className="flex items-center justify-between text-green-400">
                                      <span className="flex items-center gap-2"><Unlock size={16}/> 관리자 모드 활성화됨</span>
                                      <button onClick={handleAdminLogout} className="text-xs border border-red-500 text-red-500 px-2 py-1 rounded hover:bg-red-500 hover:text-white">
                                          로그아웃
                                      </button>
                                  </div>
                              ) : (
                                  <div className="flex gap-2">
                                      <input 
                                        type="password"
                                        placeholder="관리자 암호 입력"
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        value={adminPasswordInput}
                                        onChange={e => setAdminPasswordInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                                      />
                                      <button 
                                        onClick={handleAdminLogin}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                      >
                                          인증
                                      </button>
                                  </div>
                              )}
                              <p className="text-xs text-gray-500">
                                  캠페인 및 캐릭터 삭제 권한을 얻으려면 암호를 입력하십시오.
                              </p>
                          </div>
                      </section>

                      {/* Section 1: Global Background */}
                      <section>
                          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 border-b border-gray-700 pb-2">메인 로비 배경 설정</h3>
                          <div className="flex flex-col gap-4">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {globalBackground.length > 0 ? globalBackground.map((bg, idx) => (
                                        <div key={idx} className="w-24 h-16 shrink-0 bg-gray-800 rounded border border-gray-600 flex items-center justify-center overflow-hidden relative">
                                            <img src={bg} alt={`BG ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    )) : (
                                        <div className="w-24 h-16 bg-gray-800 rounded flex items-center justify-center text-xs">No Image</div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => globalBgInputRef.current?.click()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-2"
                                    >
                                        <Upload size={16} /> 이미지 추가 ({globalBackground.length})
                                    </button>
                                    {globalBackground.length > 0 && (
                                        <button 
                                            onClick={clearGlobalBgs}
                                            className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded text-sm flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> 초기화
                                        </button>
                                    )}
                                    <input type="file" ref={globalBgInputRef} className="hidden" accept="image/*" onChange={handleGlobalBgUpload} />
                                </div>
                                <p className="text-xs text-gray-500">여러 장을 추가하면 10초마다 자동으로 변경됩니다.</p>
                          </div>
                      </section>

                      {/* Section 2: Manage Existing Campaigns */}
                      <section>
                          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 border-b border-gray-700 pb-2">캠페인 로고 관리</h3>
                          <div className="space-y-4">
                              {campaigns.map(camp => (
                                  <div key={camp.id} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-gray-900 border border-gray-700">
                                              {camp.logo && camp.logo.startsWith('data:') ? (
                                                  <img src={camp.logo} alt="logo" className="w-full h-full object-cover" />
                                              ) : (
                                                  <CampaignIcon type={camp.theme} className="w-5 h-5 opacity-50" />
                                              )}
                                          </div>
                                          <div>
                                              <div className="font-bold text-sm text-white">{camp.title}</div>
                                              <div className="text-xs text-gray-500">{camp.system}</div>
                                          </div>
                                      </div>
                                      <div>
                                        <button 
                                            onClick={() => logoInputRefs.current[camp.id]?.click()}
                                            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-white flex items-center gap-1"
                                        >
                                            <Upload size={12} /> 로고 변경
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={(el) => { logoInputRefs.current[camp.id] = el; }} 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={(e) => handleLogoUpload(e, camp.id)} 
                                        />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </section>

                       {/* Section 3: Add New Campaign */}
                       <section>
                          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4 border-b border-gray-700 pb-2">신규 캠페인 생성</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs text-gray-400 block mb-1">캠페인 제목</label>
                                  <input 
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500" 
                                    placeholder="예: 스타워즈 RPG"
                                    value={newCampTitle}
                                    onChange={e => setNewCampTitle(e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-gray-400 block mb-1">시스템</label>
                                  <input 
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500" 
                                    placeholder="예: FFG Star Wars"
                                    value={newCampSystem}
                                    onChange={e => setNewCampSystem(e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-gray-400 block mb-1">배경 설정 (Setting)</label>
                                  <input 
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500" 
                                    placeholder="예: 아우터 림"
                                    value={newCampSetting}
                                    onChange={e => setNewCampSetting(e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-gray-400 block mb-1">테마</label>
                                  <select 
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newCampTheme}
                                    onChange={e => setNewCampTheme(e.target.value as CampaignTheme)}
                                  >
                                      <option value="fantasy">판타지 (Fantasy)</option>
                                      <option value="gothic">고딕 호러 (Gothic)</option>
                                      <option value="cyberpunk">사이버펑크 (Cyberpunk)</option>
                                      <option value="sci-fi">SF (Sci-Fi)</option>
                                      <option value="dark-fantasy">다크 판타지 (Dark Fantasy)</option>
                                      <option value="modern">현대 (Modern)</option>
                                      <option value="comedy">개그/툰 (Comedy)</option>
                                      <option value="horror">공포 (Horror)</option>
                                      <option value="post-apoc">포스트 아포칼립스 (Wasteland)</option>
                                      <option value="western">웨스턴 (Western)</option>
                                      <option value="noir">느와르 (Noir)</option>
                                      <option value="steampunk">스팀펑크 (Steampunk)</option>
                                      <option value="superhero">슈퍼히어로 (Superhero)</option>
                                  </select>
                              </div>
                          </div>
                          <button 
                            onClick={handleAddCampaign}
                            className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded font-bold text-white hover:opacity-90 transition-opacity"
                          >
                              + 캠페인 생성하기
                          </button>
                      </section>
                  </div>
              </div>
          </div>
      )}

      {/* --- CHARACTER TYPE SELECTION MODAL --- */}
      {isCreationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform scale-100">
                  <div className="p-6 text-center border-b border-gray-800">
                      <h3 className="text-xl font-bold text-white mb-2">새 캐릭터 유형 선택</h3>
                      <p className="text-sm text-gray-400">생성할 항목의 유형을 선택하십시오.</p>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                      <button 
                          onClick={() => handleCreateNewCharacter('PC')}
                          className="flex flex-col items-center justify-center p-6 gap-3 bg-blue-600/10 border-2 border-blue-600/50 hover:border-blue-500 hover:bg-blue-600/20 rounded-xl transition-all group"
                      >
                          <div className="p-3 bg-blue-600 rounded-full text-white group-hover:scale-110 transition-transform">
                              <User size={32} />
                          </div>
                          <div className="text-center">
                              <span className="block font-bold text-blue-400 group-hover:text-blue-300">플레이어 캐릭터</span>
                              <span className="block text-xs text-gray-500 mt-1">상세 기록 / 시크릿 파일</span>
                          </div>
                      </button>
                      
                      <button 
                          onClick={() => handleCreateNewCharacter('NPC')}
                          className="flex flex-col items-center justify-center p-6 gap-3 bg-green-600/10 border-2 border-green-600/50 hover:border-green-500 hover:bg-green-600/20 rounded-xl transition-all group"
                      >
                          <div className="p-3 bg-green-600 rounded-full text-white group-hover:scale-110 transition-transform">
                              <Users size={32} />
                          </div>
                          <div className="text-center">
                              <span className="block font-bold text-green-400 group-hover:text-green-300">NPC</span>
                              <span className="block text-xs text-gray-500 mt-1">간소화된 기록</span>
                          </div>
                      </button>
                  </div>
                  <div className="p-4 bg-gray-800 text-center">
                      <button 
                          onClick={() => setIsCreationModalOpen(false)}
                          className="text-gray-400 hover:text-white text-sm"
                      >
                          취소
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- LANDING PAGE --- */}
      {!selectedCampaignId && (
        <div className="container mx-auto px-4 py-12 relative z-10 flex flex-col items-center justify-center min-h-screen">
            {/* Global Settings Button (Visible only on Landing) */}
            <div className="absolute top-6 right-6 z-20">
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-3 bg-black/40 hover:bg-black/80 rounded-full text-gray-300 hover:text-white transition-all backdrop-blur-sm border border-transparent hover:border-gray-500"
                >
                    <Settings size={24} />
                </button>
            </div>

            <header className="text-center mb-16 space-y-4 animate-fade-in-down">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                    원양어선 캐릭터 데이터베이스
                </h1>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto break-keep drop-shadow-md">
                    열람할 캐릭터 데이터베이스를 선택하십시오.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
                {campaigns.map((camp) => (
                    <div
                        key={camp.id}
                        onClick={() => setSelectedCampaignId(camp.id)}
                        className={`
                            relative group h-80 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                            hover:scale-105 border-2 shadow-xl backdrop-blur-sm overflow-hidden
                            ${camp.theme === 'fantasy' ? 'bg-[#3e2723]/90 border-[#8d6e63] text-[#d7ccc8] hover:bg-[#4e342e]' : ''}
                            ${camp.theme === 'gothic' ? 'bg-black/90 border-[#8a0000] text-gray-300 hover:shadow-[0_0_20px_#500]' : ''}
                            ${camp.theme === 'cyberpunk' ? 'bg-black/90 border-[#0ff] text-[#0ff] hover:shadow-[0_0_20px_#0ff]' : ''}
                            ${camp.theme === 'sci-fi' ? 'bg-[#0f172a]/90 border-blue-500 text-blue-100 hover:shadow-[0_0_20px_#3b82f6]' : ''}
                            ${camp.theme === 'dark-fantasy' ? 'bg-[#1c1917]/95 border-[#57534e] text-[#a8a29e] hover:border-[#d6d3d1]' : ''}
                            ${camp.theme === 'modern' ? 'bg-white/90 border-gray-300 text-gray-800 hover:border-blue-500' : ''}
                            ${camp.theme === 'comedy' ? 'bg-[#fff1f2]/90 border-[#f472b6] text-[#db2777] hover:rotate-1' : ''}
                            ${camp.theme === 'horror' ? 'bg-black/95 border-[#15803d] text-[#4ade80] hover:shadow-[0_0_30px_#15803d]' : ''}
                            ${camp.theme === 'post-apoc' ? 'bg-[#451a03]/90 border-[#ea580c] text-[#fdba74] hover:bg-[#7c2d12]' : ''}
                            ${camp.theme === 'western' ? 'bg-[#d6c0a0]/90 border-[#78350f] text-[#451a03] hover:sepia' : ''}
                            ${camp.theme === 'noir' ? 'bg-[#171717]/95 border-gray-500 text-gray-200 hover:bg-white hover:text-black grayscale' : ''}
                            ${camp.theme === 'steampunk' ? 'bg-[#271c19]/90 border-[#b45309] text-[#fbbf24] hover:shadow-[0_0_15px_#b45309]' : ''}
                            ${camp.theme === 'superhero' ? 'bg-[#1e40af]/90 border-[#facc15] text-white hover:skew-x-[-2deg]' : ''}
                        `}
                    >
                        {/* Delete Button for Campaign - Only if Admin */}
                        {isAdmin && (
                            <button 
                                onClick={(e) => handleDeleteCampaign(e, camp.id)}
                                className="absolute top-4 right-4 z-20 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 hover:scale-110 shadow-lg"
                                title="캠페인 삭제"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                             {camp.logo && camp.logo.startsWith('data:') ? (
                                 <img src={camp.logo} alt="logo" className="w-32 h-32 object-contain drop-shadow-md" />
                             ) : (
                                <CampaignIcon type={camp.theme} className="w-16 h-16" />
                             )}
                        </div>
                        <h2 className="text-3xl font-bold mb-2 z-10">{camp.title}</h2>
                        <span className="text-xs uppercase tracking-widest opacity-70 mb-4 block z-10">{camp.system}</span>
                        
                        <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold border-b border-current pb-1 z-10">
                            파일 열람 &rarr;
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- CAMPAIGN DASHBOARD --- */}
      {activeCampaign && (
        <div className="min-h-screen flex flex-col relative z-10">
            {/* Top Navigation Bar */}
            <div className={`
                sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md transition-all
                ${activeCampaign.theme === 'cyberpunk' ? 'border-[#0ff]/30 bg-black/80' : 
                  activeCampaign.theme === 'modern' ? 'border-gray-200 bg-white/80' : 'border-white/10 bg-black/60'}
            `}>
                <button 
                    onClick={() => setSelectedCampaignId(null)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border border-transparent hover:border-current
                        ${activeCampaign.theme === 'cyberpunk' ? 'text-[#0ff] hover:bg-[#0ff]/10' : 
                          activeCampaign.theme === 'modern' ? 'text-gray-800 hover:bg-gray-200' : 'text-gray-200 hover:bg-white/10'}
                    `}
                >
                    <ArrowLeft size={18} />
                    <span className="font-bold text-sm">로비로 돌아가기</span>
                </button>

                <div className="flex items-center gap-2">
                    {/* Background Manager */}
                    <div className="flex items-center">
                        <button 
                            onClick={() => bgInputRef.current?.click()}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border border-transparent hover:border-current
                                ${activeCampaign.theme === 'cyberpunk' ? 'text-[#0ff] hover:bg-[#0ff]/10' : 
                                activeCampaign.theme === 'modern' ? 'text-gray-800 hover:bg-gray-200' : 'text-gray-300 hover:bg-white/10'}
                            `}
                        >
                            <ImageIcon size={16} />
                            <span className="text-xs font-semibold">배경 추가 ({campaignBackgrounds[activeCampaign.id]?.length || 0})</span>
                        </button>
                        <input 
                            type="file" 
                            ref={bgInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleBgUpload}
                        />
                        {(campaignBackgrounds[activeCampaign.id]?.length || 0) > 0 && (
                            <button 
                                onClick={clearCampaignBg}
                                className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors ml-1"
                                title="배경 초기화"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Campaign Header */}
            <header className="container mx-auto px-4 py-12 text-center">
                <div className="inline-block relative">
                     <h1 className={`text-5xl md:text-7xl font-bold uppercase tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] ${getTitleColor()}`}>
                        {activeCampaign.title}
                    </h1>
                    <div className={`mt-2 h-1 w-full opacity-50 mx-auto rounded-full ${activeCampaign.theme === 'cyberpunk' ? 'bg-[#0ff] shadow-[0_0_10px_#0ff]' : 'bg-current'}`}></div>
                </div>
                <p className={`mt-4 text-lg font-semibold opacity-90 drop-shadow-md tracking-widest ${getTitleColor()}`}>
                    // {activeCampaign.setting} //
                </p>
            </header>

            {/* Content Grid */}
            <div className="flex-1 container mx-auto px-4 pb-20">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {activeCampaign.characters.map(char => (
                        <div key={char.id} className="animate-in fade-in zoom-in duration-500">
                            <CharacterFile 
                                character={char} 
                                theme={activeCampaign.theme}
                                onClick={() => setSelectedCharacterId(char.id)}
                                onDelete={isAdmin ? () => handleDeleteCharacter(char.id) : undefined}
                            />
                        </div>
                    ))}
                    
                    {/* Add New Button */}
                    <button 
                        onClick={() => setIsCreationModalOpen(true)}
                        className={`
                            w-full h-full min-h-[144px] border-2 rounded-lg flex flex-col items-center justify-center p-6 transition-all backdrop-blur-sm opacity-60 hover:opacity-100 hover:backdrop-blur-md hover:scale-[1.02]
                            ${getAddButtonStyle()}
                        `}
                    >
                        <Plus size={48} className="mb-2" />
                        <span className="font-bold uppercase tracking-widest text-sm">새 항목 작성</span>
                    </button>
                 </div>
            </div>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {activeCharacter && activeCampaign && (
        <CharacterDetail 
            character={activeCharacter}
            theme={activeCampaign.theme}
            campaignSetting={activeCampaign.title}
            onClose={() => setSelectedCharacterId(null)}
            onUpdate={handleUpdateCharacter}
        />
      )}

    </div>
  );
};

export default App;
