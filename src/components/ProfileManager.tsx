import React from 'react';
import { Profile } from '@/types/Profile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/verticaltabs';
import { toWords } from 'number-to-words';
import { Trash } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProfileManagerProps {
  profiles: Profile[];
  onSelectProfile: (id: number) => void;
  selectedProfileId: number | null;
  onDeleteProfile: (id: number) => void;
  onImageUpload: (file: File | null) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onSelectProfile, selectedProfileId, onDeleteProfile }) => {
  
  const selectedProfileIdString = selectedProfileId ? toWords(selectedProfileId) : "";
  const capitalize = (s: string) => (s && s[0].toUpperCase() + s.slice(1)) || "";
  
  const handleDeleteKeyDown = (event: React.KeyboardEvent, profileId: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      onDeleteProfile(profileId);
    }
  };

  return (
    <div>
      <Tabs value={selectedProfileIdString || ""}>
        <div className="w-full relative">
        <TabsList>

          {profiles.map(profile => (
            <TabsTrigger 
              key={profile.id}
              value={toWords(profile.id)} 
              onClick={() => onSelectProfile(profile.id)} 
              className="relative group"
              aria-label={`Select profile ${capitalize(toWords(profile.id))}`}
            >
              <div className="h-10 w-10 rounded-md bg-secondary overflow-hidden">
                {profile.imageUrl && <img src={profile.cachedImageUrl || profile.imageUrl || ''} alt={`Profile ${profile.id} preview`} className="h-full object-cover" />}
              </div>

              <div className='min-w-10 text-left'>{capitalize(toWords(profile.id))}</div>

              {profile.pixelCounts &&
                  <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='grid grid-cols-3 gap-1 text-muted-foreground font-mono text-xs'>
                        <div className='flex items-center gap-1'><div className="h-2 w-2 rounded-full bg-primary"></div>{Math.round(profile.pixelCounts?.opaquePercentage + profile.pixelCounts?.semiTransparentPercentage)}%</div>
                        <div className='flex items-center gap-1'><div className="h-2 w-2 rounded-full bg-none border border-primary"></div>{Math.round(profile.pixelCounts?.transparentPercentage)}%</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className='max-w-sm text-left'>
                      <p>Pixel analysis:<br />Opaque: {profile.pixelCounts?.opaquePercentage + profile.pixelCounts?.semiTransparentPercentage}%<br />Transparent: {profile.pixelCounts?.transparentPercentage}%</p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>   
              }
              <div className='flex grow justify-end'>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProfile(profile.id);
                  }}
                  onKeyDown={(e) => handleDeleteKeyDown(e, profile.id)}
                  aria-label={`Delete profile ${capitalize(toWords(profile.id))}`}
                  className='flex h-8 w-8 self-center content-center gap-2 px-2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-primary focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                >
                  <Trash className='w-4 h-4 self-center' aria-hidden="true" />
                </div>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        
      </Tabs>
    </div>
  );
};


export default ProfileManager;
