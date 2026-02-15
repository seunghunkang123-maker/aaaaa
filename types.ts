
export type CampaignTheme = 
  | 'fantasy' 
  | 'gothic' 
  | 'cyberpunk' 
  | 'sci-fi' 
  | 'dark-fantasy' 
  | 'modern' 
  | 'comedy' 
  | 'horror' 
  | 'post-apoc' 
  | 'western' 
  | 'noir' 
  | 'steampunk' 
  | 'superhero';

export interface SecretFile {
  title: string;
  content: string;
  imageUrl?: string;
  isUnlocked: boolean;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string; // Or Role for Cyberpunk
  description: string;
  imageUrl: string;
  level: number | string;
  status: 'Alive' | 'Dead' | 'MIA' | 'Retired';
  // Specific for CoS / Cyberpunk
  secretFile?: SecretFile; 
}

export interface Campaign {
  id: string;
  title: string;
  system: 'DnD 5e' | 'Cyberpunk RED';
  setting: string;
  description: string;
  theme: CampaignTheme;
  logo: string; // URL or icon identifier
  characters: Character[];
}

export interface AppState {
  campaigns: Campaign[];
}
