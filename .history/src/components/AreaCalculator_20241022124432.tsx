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
        <div className='flex flex-col gap-4'>
          <DataRowWithInput label={'Frontal area'} value={areaM2?.toFixed(4)} onChange={() => {}} disabled={true} unit={'m²'}/>
          <DataRowWithInput label={'Drag (Cd)'} value={cd} onChange={(e) => setCd(parseFloat(e.target.value))} disabled={false} unit={' '}/>
          <DataRowWithInput className="text-lg mt-2" label={'CdA:'} value={cdA?.toFixed(4)} onChange={() => {}} disabled={true}/>
          {/* <h3 className="text-lg mt-2">CdA: {cdA !== null ? cdA.toFixed(4) : 'N/A'}</h3> */}
        </div>
        </>

    </div>
  );
};

export default AreaCalculator;