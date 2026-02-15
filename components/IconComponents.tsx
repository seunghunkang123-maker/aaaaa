
import React from 'react';
import { 
  Shield, Skull, Zap, Scroll, Ghost, Cpu, Sword, 
  Rocket, Moon, Building2, Smile, Biohazard, Radiation, 
  Star, Search, Wrench, Zap as Lightning 
} from 'lucide-react';

export const CampaignIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'fantasy': return <Sword className={className} />;
    case 'gothic': return <Skull className={className} />;
    case 'cyberpunk': return <Cpu className={className} />;
    case 'sci-fi': return <Rocket className={className} />;
    case 'dark-fantasy': return <Moon className={className} />;
    case 'modern': return <Building2 className={className} />;
    case 'comedy': return <Smile className={className} />;
    case 'horror': return <Ghost className={className} />;
    case 'post-apoc': return <Radiation className={className} />;
    case 'western': return <Star className={className} />;
    case 'noir': return <Search className={className} />;
    case 'steampunk': return <Wrench className={className} />;
    case 'superhero': return <Lightning className={className} />;
    default: return <Shield className={className} />;
  }
};
