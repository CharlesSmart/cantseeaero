import React, { useState } from 'react'; // Import useState here
import AreaCalculator from './AreaCalculator';
import { PixelCounts } from '../utils/imageProcessing';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import ImageUploader from './ImageUploader';
import { Profile } from '../types/Profile';
import ProfileManager from './ProfileManager';
import { Button } from './ui/button';
import { PlusIcon } from 'lucide-react';
import { DataRow, DataRowWithInput } from './ui/datarow'; // Import the new components
import Logo from '../assets/logo.svg';



interface AnalysisPanelProps {
    pixelCounts: PixelCounts | null;
    measurementPixels: number | null;
    measurementMm: number | null;
    // onPixelCountUpdate: (counts: PixelCounts) => void;
    onLengthUpdate: (mm: number) => void;
    uploadedImage: (File); // Add uploadedImage to props
    imageUrl: string;
    handleImageUpload: (file: File) => void; 
    profiles: Profile[]; // Add profiles prop
    onAddProfile: () => void; // Add onAddProfile prop
    onSelectProfile: (id: number) => void; // Add onSelectProfile prop
    selectedProfileId: number | null;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
    pixelCounts,
    measurementPixels,
    measurementMm,
    // onPixelCountUpdate,
    onLengthUpdate,
    uploadedImage,
    imageUrl,
    handleImageUpload,
    profiles,
    onAddProfile,
    onSelectProfile,
    selectedProfileId
}) => {

    const handleActualLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const length = parseFloat(event.target.value);
        onLengthUpdate(length)
 
    };


    return (
        <Card className='max-w-xs fixed left-4 top-4'>
            <CardHeader className='pb-0'>
                <div><img src={Logo} alt="Windtunnel Logo" /></div>
                <div className='grid grid-cols-2 items-center'>
                    <h3 className='text-lg font-bold'>Positions</h3>
                    <Button variant="ghost" onClick={onAddProfile} className='justify-self-end gap-2 -mr-2 px-2'>
                        <PlusIcon className='w-4 h-4 text-muted-foreground'/>
                        Add
                    </Button>
                </div>
            </CardHeader>
        <CardContent className='flex flex-col gap-4'>
            <div>
            <ProfileManager 
                profiles={profiles}
                onAddProfile={onAddProfile}
                onSelectProfile={onSelectProfile}
                selectedProfileId={selectedProfileId}
            />
            <ImageUploader onImageUpload={handleImageUpload} uploadedImage={uploadedImage} imageUrl={imageUrl} /> 
            {uploadedImage &&
            <>  
            <DataRow label={'Opaque'} value={pixelCounts?.opaquePercentage ?? ' '}/>
            <DataRow label={'Transparent'} value={pixelCounts?.transparentPercentage ?? ' '}/>
            <DataRow label={'Semi-transparent'} value={pixelCounts?.semiTransparentPercentage ?? ' '}/>
            </>
            }
            </div>
        <hr className='-mx-6'></hr>
            <div className='flex flex-col gap-2'>
            <h3 className='text-lg font-bold'>Measurements</h3>

                <DataRowWithInput label={'Measured length'} value={measurementPixels ?? ' '} onChange={() => {}} disabled={true} unit={'px'}></DataRowWithInput>
                <DataRowWithInput label={'Known length'} value={measurementMm ?? ' '} onChange={handleActualLengthChange} disabled={false} unit={'mm'}></DataRowWithInput>
                <hr></hr>
            </div>
            <AreaCalculator 
                pixelCounts={pixelCounts}
                measurementPixels={measurementPixels}
                measurementMm={measurementMm}
            />
            </CardContent>
        </Card>
    );
};

export default AnalysisPanel;
