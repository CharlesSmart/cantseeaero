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
    onSelectProfile: (id: string) => void; // Add onSelectProfile prop
    selectedProfileId: string | null;
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
        <Card className='max-w-sm fixed left-4 top-4'>
            <CardHeader className='pb-0'>
                <h1 className="text-2xl font-bold mb-4">WINDTUNNEL</h1>
                <div className='grid grid-cols-2 items-center'>
                    <h3 className='text-lg font-bold'>Positions</h3>
                    <Button variant="ghost" onClick={onAddProfile} className='justify-self-end px-2'>
                        <PlusIcon className='w-6 h-6'/>
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
            <ImageUploader onImageUpload={handleImageUpload} uploadedImage={uploadedImage} /> 
            {uploadedImage &&
            <>  
            <DataRow label={'Opaque'} value={pixelCounts?.opaquePercentage ?? ' '}/>
            <DataRow label={'Transparent'} value={pixelCounts?.transparentPercentage ?? ' '}/>
            <DataRow label={'Semi-transparent'} value={pixelCounts?.semiTransparentPercentage ?? ' '}/>
            </>
            }
            </div>
        <hr></hr>
            <div className='flex flex-col gap-4'>
                <DataRowWithInput label={'Measured length'} value={measurementPixels ?? ' '} onChange={() => {}} disabled={false} unit={'px'}></DataRowWithInput>
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
