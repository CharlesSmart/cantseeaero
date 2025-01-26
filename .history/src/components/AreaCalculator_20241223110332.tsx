import React, { useEffect, useState } from 'react';
import { PixelCounts } from '../utils/imageProcessing';
import { DataRowWithInput } from './ui/datarow';
import { calculatePower } from '../utils/calculatePower';

interface AreaCalculatorProps {
  pixelCounts: PixelCounts | null;
  measurementPixels: number | null;
  measurementMm: number | null;
}

const AreaCalculator: React.FC<AreaCalculatorProps> = ({
  pixelCounts,
  measurementPixels,
  measurementMm,
}) => {
  const [areaM2, setAreaM2] = useState<number | null>(null);
  const [cd, setCd] = useState<number>(0.75);
  const [cdA, setCdA] = useState<number | null>(null);
  const [power, setPower] = useState<number | null>(null);

  useEffect(() => {
    if (pixelCounts && measurementPixels && measurementMm) {
      const pixelToMmRatio = measurementMm / measurementPixels;
      const pixelAreaMm2 = pixelToMmRatio * pixelToMmRatio;
      const totalAreaMm2 = (pixelCounts.opaque + pixelCounts.semiTransparent) * pixelAreaMm2;
      const totalAreaM2 = totalAreaMm2 / 1000000; // Convert mm² to m²
      setAreaM2(totalAreaM2);
    } else {
      setAreaM2(null);
    }
  }, [pixelCounts, measurementPixels, measurementMm]);

  // Separate useEffect to calculate cdA based on the latest areaM2
  useEffect(() => {
    if (areaM2 !== null) {
      setCdA(cd * areaM2);
      setPower(calculatePower(cdA));
    } else {
      setCdA(0);
      setPower(0);
    }
  }, [areaM2, cd]);


  return (
    <div className="">
        <>
        <div className='flex flex-col gap-2'>
          <DataRowWithInput label={'Frontal area'} value={areaM2?.toFixed(2)} onChange={() => {}} disabled={true} unit={'m²'}/>
          <DataRowWithInput label={'Drag (Cd)'} value={cd} onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
              setCd(value);
            } else {
              setCd(0);
            }
          }} disabled={false} unit={' '}/>
          <div className='grid grid-cols-2 gap-8 items-center mr-2 mt-2'>
          <h3 className="text-lg font-semibold">CdA</h3><span className='font-mono font-semibold text-right'>{cdA !== null ? cdA.toFixed(4) : 'N/A'}</span>
          <h3 className="text-lg font-semibold">Power</h3><span className='font-mono font-semibold text-right'>{power !== null ? power.toFixed(2) : 'N/A'}</span>
          </div>
          
        </div>
        </>

    </div>
  );
};

export default AreaCalculator;