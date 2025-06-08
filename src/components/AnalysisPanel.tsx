import React, { useState } from 'react';
import { useProfileStore } from '@/store/profileStore'; // Import Zustand store
import AreaCalculator from './AreaCalculator';
import { PixelCounts } from '@/utils/imageProcessing';
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import ImageUploader from './ImageUploader';
import { Profile } from '@/types/Profile';
import ProfileManager from './ProfileManager';
import { Button } from './ui/button';
import { PlusIcon, PanelLeftClose, PanelLeft, Link2 } from 'lucide-react';
import { DataRowWithInput } from './ui/datarow';
import Logo from '../assets/aerolens_logo.svg';
import LogoDark from '../assets/aerolens_logo_dark.svg';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme-provider';

interface AnalysisPanelProps {
    // Props related to profile state are removed
    pixelCounts: PixelCounts | null; // This might come from selectedProfile in store later
    onPhoneCameraConnected?: (sessionId: string) => void;
    onOpenCamera?: () => void;
    // measurementPixels, measurementMm, onLengthUpdate, uploadedImage, imageUrl, handleImageUpload,
    // profiles, onAddProfile, onSelectProfile, selectedProfileId, onDeleteProfile
    // are removed as they will be accessed from the Zustand store.
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
    pixelCounts, // Keep for now, might be derived from store's selectedProfile
    onPhoneCameraConnected,
    onOpenCamera
}) => {
    // const store = useProfileStore(); // No longer need to get the whole store object
    // Destructure necessary state and actions from the store
    const {
        profiles,
        selectedProfileId,
        linkedMeasurementPixels,
        linkedMeasurementMm,
        addProfile,
        setSelectedProfileId,
        deleteProfile,
        updateProfile, // Assuming updateProfile updates a single profile
        updateLinkedMeasurementAndAllProfiles,
    } = useProfileStore();

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);

    const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);

    const togglePanelVisibility = () => {
        setIsPanelVisible(!isPanelVisible);
    };
     const handleDeleteProfile = async (id: number) => {
    // The logic for handling empty list and selecting next profile is now in store action
    deleteProfile(id); // Store action now handles DB delete and subsequent logic
    };
    const handleAddProfile = () => {
        const newProfileData: Omit<Profile, 'id'> = {
            displayId: 1,
            uploadedImage: null,
            imageUrl: null,
            cachedImageUrl: null,
            cachedImage: null,
            pixelCounts: null,
            measurementPixels: linkedMeasurementPixels,
            measurementMm: linkedMeasurementMm,
        };
        addProfile(newProfileData);
    };

    const handleActualLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const length = parseFloat(event.target.value);
        if (!isNaN(length)) {
            updateLinkedMeasurementAndAllProfiles('mm', length);
        }
    };

    // Handle image upload for the selected profile
    const handleImageUploadDirect = (file: File | null) => {
        if (selectedProfile && file) {
            const updatedProfile = {
                ...selectedProfile,
                uploadedImage: file,
                imageUrl: URL.createObjectURL(file),
                // Reset cached image when new one is uploaded
                cachedImage: null,
                cachedImageUrl: null,
            };
            updateProfile(updatedProfile);
        }
    };

    const { theme } = useTheme();

    return (
    <div role="complementary" aria-label="Analysis Panel">
        {!isPanelVisible && (
        <Card className='fixed left-4 top-4'>
            <Button 
                variant="ghost" 
                onClick={togglePanelVisibility} 
                className=''
                aria-label="Show analysis panel"
                aria-expanded="false"
            >
                <PanelLeft className='w-4 h-4' aria-hidden="true" />
            </Button>
        </Card>
        )}
        {isPanelVisible && (
        <Card className='max-w-xs max-h-[calc(100vh-2rem)] overflow-y-auto fixed left-4 top-4 no-scrollbar'>
            <CardHeader className='pb-0'>
                {theme === 'dark' ? (
                    <div><img src={LogoDark} alt="Windtunnel Logo" /></div>
                ) : (
                    <div><img src={Logo} alt="Windtunnel Logo" /></div>
                )}
                <Button 
                    variant="ghost" 
                    onClick={togglePanelVisibility} 
                    className='absolute right-2 top-2'
                    aria-label="Hide analysis panel"
                    aria-expanded="true"
                >
                    <PanelLeftClose className='w-4 h-4 text-foreground' aria-hidden="true" />
                    <span className="sr-only">Hide panel</span>
                </Button>
                <div className='grid grid-cols-2 items-center'>
                    <h1 className='text-md font-semibold'>Positions</h1>
                    <Button 
                        variant="ghost" 
                        onClick={handleAddProfile} // Use direct store action
                        className='justify-self-end gap-2 px-2'
                        aria-label="Add new position"
                    >
                        <PlusIcon className='w-4 h-4 text-muted-foreground' aria-hidden="true" />
                        Add
                    </Button>
                </div>
            </CardHeader>
        <CardContent className='flex flex-col gap-4'>
            <div>
            <ProfileManager 
                profiles={profiles} // Pass from store
                onSelectProfile={setSelectedProfileId} // Pass from store
                selectedProfileId={selectedProfileId} // Pass from store
                onDeleteProfile={handleDeleteProfile} // Pass from store
                onImageUpload={handleImageUploadDirect} // Use direct handler
            />
            <ImageUploader 
                onImageUpload={handleImageUploadDirect} // Use direct handler
                uploadedImage={selectedProfile?.uploadedImage ?? null} // Get from selectedProfile in store
                onPhoneCameraConnected={onPhoneCameraConnected}
                onOpenCamera={onOpenCamera}
                hasProfiles={profiles.length > 0}
            /> 

            </div>
        <hr className='-mx-4' aria-hidden="true"></hr>
            <section className='flex flex-col gap-2' aria-labelledby="measurements-heading">
                <div className='flex flex-row gap-2 items-center'>
                    <TooltipProvider>
                    <h2 id="measurements-heading" className='text-md font-semibold'>Measurements</h2>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link2 className='w-4 h-4 text-muted-foreground rotate-90' aria-hidden="true" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Positions use the same calibration measurements</p>
                        </TooltipContent>
                    </Tooltip>  
                    </TooltipProvider>
                </div>
                {/* Use linkedMeasurementPixels and linkedMeasurementMm from store */}
                <DataRowWithInput label={'Measured length'} value={linkedMeasurementPixels ?? ''} onChange={() => {}} disabled={true} unit={'px'}></DataRowWithInput>
                <DataRowWithInput label={'Known length'} value={linkedMeasurementMm ?? ''} onChange={handleActualLengthChange} disabled={false} unit={'mm'}></DataRowWithInput>
        <hr className='-mx-4 my-2' aria-hidden="true"></hr> 
            <AreaCalculator 
                pixelCounts={pixelCounts} // This might need to come from selectedProfile.pixelCounts
                measurementPixels={linkedMeasurementPixels} // Use from store
                measurementMm={linkedMeasurementMm} // Use from store
            /></section>
            </CardContent>
        </Card>
        )}
    </div>
    );
};

export default AnalysisPanel;
