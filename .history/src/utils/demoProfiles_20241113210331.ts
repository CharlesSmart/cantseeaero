import { Profile } from '../types/Profile';

export const demoProfiles: Profile[] = [
  {
    id: 1,
    uploadedImage: new File(["demoImage1"], "/demo/demoImage1.png", { type: "image/png" }), // Replace with actual image data
    imageUrl: "/demo/demoImage1.png", // Replace with actual image data
    cachedImageUrl: null,
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  },
  {
    id: 2,
    uploadedImage: new File(["demoImage2"], "/demo/demoImage2.png", { type: "image/png" }), // Replace with actual image data
    imageUrl: "/demo/demoImage2.png", // Replace with actual image data
    cachedImageUrl: null,
    cachedImage: null,
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
  }
];