import fs from 'fs';
import { Profile } from '../types/Profile';

const demoImage2Data = fs.readFileSync("../assets/demoImage2.png");

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
    imageUrl: URL.createObjectURL(new Blob([demoImage2Data])), // Replace with actual image data
    cachedImageUrl: null,
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  }
];