import React, { useEffect, useState } from 'react';
import { PixelCounts } from '../utils/imageProcessing';
import { Input } from "@/components/ui/input";
import { DataRowWithInput } from './ui/datarow';

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
  const [cd, setCd] = useState<number>(0.65);
  const [cdA, setCdA] = useState<number | null>(null);

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

    if (areaM2 !== null) {
      setCdA(cd * areaM2);
    } else {
      setCdA(null);
    }
  }, [pixelCounts, measurementPixels, measurementMm, cd]);

  return (
    <div className="">
        <>
        <div className='flex flex-col gap-2 mt-4'>
          <DataRowWithInput label={'Frontal area'} value={areaM2?.toFixed(2)} onChange={() => {}} disabled={true} unit={'m²'}/>
          <DataRowWithInput label={'Drag (Cd)'} value={cd} onChange={(e) => setCd(parseFloat(e.target.value))} disabled={false} unit={' '}/>
          {/* <DataRowWithInput label={'CdA:'} value={cdA?.toFixed(2  )} onChange={() => {}} disabled={true}/> */}
          <div className='grid grid-cols-2 gap-8 items-center'>
          <h3 className="text-lg font-bold">CdA</h3><span className='font-mono font-bold text-right'>{cdA !== null ? cdA.toFixed(4) : 'N/A'}</span>
          </div>
        </div>
        </>

    </div>
  );
};

export default AreaCalculator;