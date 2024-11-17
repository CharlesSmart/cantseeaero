import React from 'react';
import { Profile } from '../types/Profile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/verticaltabs';
import { toWords } from 'number-to-words';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProfileManagerProps {
  profiles: Profile[];
  onSelectProfile: (id: number) => void;
  selectedProfileId: number | null;
  onDeleteProfile: (id: number) => void;
  onImageUpload: (file: File | null) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onSelectProfile, selectedProfileId, onDeleteProfile, onImageUpload }) => {
  
  const selectedProfileIdString = selectedProfileId ? toWords(selectedProfileId) : "";
  const capitalize = (s: string) => (s && s[0].toUpperCase() + s.slice(1)) || ""

  return (
    <div>
      <Tabs value={selectedProfileIdString || ""} className='pb-2'>
        <div className="w-full relative">
        <TabsList>
          {profiles.map(profile => (
            <TabsTrigger 
              key={profile.id}
              value={toWords(profile.id)} 
              onClick={() => onSelectProfile(profile.id)} 
              className="relative group"
            >
              <div className="h-10 w-10 rounded-sm bg-secondary overflow-hidden">
                {profile.imageUrl && <img src={profile.imageUrl || ''} alt={`Profile preview`} className="object-cover" />}
              </div> 
              {capitalize(toWords(profile.id))}
              {profile.pixelCounts &&
                  <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                            <div className='grid grid-cols-3 text-muted-foreground font-mono'>
                            <div className='flex items-center gap-1'><div className="h-2 w-2 rounded-full bg-primary"></div>{Math.round(profile.pixelCounts?.opaquePercentage ?? 0)}%</div>
                            <div className='flex items-center gap-1'><div className="h-2 w-2 rounded-full bg-primary opacity-25"></div>{Math.round(profile.pixelCounts?.semiTransparentPercentage ?? 0)}%</div>
                            <div className='flex items-center gap-1'><div className="h-2 w-2 rounded-full bg-none border border-primary"></div>{Math.round(profile.pixelCounts?.transparentPercentage ?? 0)}%</div>
                            </div>
                    </TooltipTrigger>
                    <TooltipContent className='max-w-sm'>
                      <p>Pixel analysis: {profile.pixelCounts?.opaquePercentage ?? 0}% opaque, <br /> {profile.pixelCounts?.semiTransparentPercentage ?? 0}% semi-transparent, \n {profile.pixelCounts?.transparentPercentage ?? 0}% transparent</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>   
              }
              <Button onClick={() => onDeleteProfile(profile.id)} variant="ghost" className='justify-self-end gap-2 -mr-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'><Trash className='w-4 h-4 text-muted-foreground'/></Button>
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        
      </Tabs>
    </div>
  );
};


export default ProfileManager;
