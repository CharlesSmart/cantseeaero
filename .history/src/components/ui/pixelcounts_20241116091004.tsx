import React from 'react';

export const PixelCountsUI: React.FC<{ pixelCounts: { value: number }[] }> = ({ pixelCounts }) => {

    const colorMapping = ['Primary Color', 'Secondary Color', 'Tertiary Color'];

    return (
        <div className='grid grid-cols-2 text-sm text-muted-foreground'>
            {pixelCounts.map((pixel, index) => (
                <div key={index} className='flex justify-between'>
                    <p>{colorMapping[index] || 'Other Color'}</p>
                    <p className='text-right font-mono text-muted-foreground'>{pixel.value}%</p>
                </div>
            ))}
        </div>
    );
};


