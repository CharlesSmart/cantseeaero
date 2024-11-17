import { Profile } from '../types/Profile';

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
    uploadedImage: new File(["demoImage2"], "../assets/demoImage2.png", { type: "image/png" }), // Replace with actual image data
    imageUrl: URL.createObjectURL(new Blob(["demoImage2"])), // Replace with actual image data
    cachedImageUrl: null,
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  }
];