import fs from 'fs';
import path from 'path';
import { Profile } from '../types/Profile';

const demoImage2Path = path.resolve(__dirname, '../assets/demoImage2.png');
const demoImage2Data = fs.readFileSync(demoImage2Path);

export const demoProfiles: Profile[] = [
  {
    id: 1,
    uploadedImage: new File(["demoImage1"], "../assets/demoImage1.png", { type: "image/png" }), // Replace with actual image data
    imageUrl: URL.createObjectURL(new Blob(["demoImage1"])), // Replace with actual image data
    cachedImageUrl: null,
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  },
  {
    id: 2,
    uploadedImage: new File([demoImage2Data], "demoImage2.png", { type: "image/png" }), // Use actual image data
    imageUrl: URL.createObjectURL(new Blob([demoImage2Data])), // Use actual image data
    cachedImageUrl: null,
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  }
];