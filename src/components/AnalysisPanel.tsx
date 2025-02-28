import React, { useState } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface AnalysisPanelProps {
    pixelCounts: PixelCounts | null;
    measurementPixels: number | null;
    measurementMm: number | null;
    onLengthUpdate: (mm: number) => void;
    uploadedImage: (File);
    imageUrl: string;
    handleImageUpload: (file: File | null) => void; 
    profiles: Profile[];
    onAddProfile: () => void; 
    onSelectProfile: (id: number) => void; 
    selectedProfileId: number | null;
    onDeleteProfile: (id: number) => void;
    onPhoneCameraConnected?: (sessionId: string) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
    pixelCounts,
    measurementPixels,
    measurementMm,
    onLengthUpdate,
    uploadedImage,
    handleImageUpload,
    profiles,
    onAddProfile,
    onSelectProfile,
    selectedProfileId,
    onDeleteProfile,
    onPhoneCameraConnected
}) => {

    const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);

    const togglePanelVisibility = () => {
        setIsPanelVisible(!isPanelVisible);
    };

    const handleActualLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const length = parseFloat(event.target.value);
            onLengthUpdate(length)
    };


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
        <Card className='max-w-xs max-h-[calc(100vh-2rem)] overflow-y-auto fixed left-4 top-4'>
            <CardHeader className='pb-0'>
                <div><img src={Logo} alt="Windtunnel Logo" /></div>
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
                        onClick={onAddProfile} 
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
                profiles={profiles}
                onSelectProfile={onSelectProfile}
                selectedProfileId={selectedProfileId}
                onDeleteProfile={onDeleteProfile}
                onImageUpload={handleImageUpload}
            />
            <ImageUploader 
                onImageUpload={handleImageUpload} 
                uploadedImage={uploadedImage}
                onPhoneCameraConnected={onPhoneCameraConnected}
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
                <DataRowWithInput label={'Measured length'} value={measurementPixels ?? ''} onChange={() => {}} disabled={true} unit={'px'}></DataRowWithInput>
                <DataRowWithInput label={'Known length'} value={measurementMm ?? ''} onChange={handleActualLengthChange} disabled={false} unit={'mm'}></DataRowWithInput>
        <hr className='-mx-4 my-2' aria-hidden="true"></hr> 
            <AreaCalculator 
                pixelCounts={pixelCounts}
                measurementPixels={measurementPixels}
                measurementMm={measurementMm}
            /></section>
            </CardContent>
        </Card>
        )}
    </div>
    );
};

export default AnalysisPanel;
