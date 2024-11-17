import { Profile } from '../types/Profile';

export const demoProfiles: Profile[] = [
  {
    id: 1,
    uploadedImage: new File(["demoImage1"], "/demo/demoImage1.png", { type: "image/png" }),
    imageUrl: "/demo/demoImage1.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: null,
    cachedImage: null,
  },
  {
    id: 2,
    uploadedImage: new File(["demoImage2"], "demoImage2.png", { type: "image/png" }),
    imageUrl: "/demo/demoImage2.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: null,
    cachedImage: null,
  }
];

// console.log(demoProfiles[1].uploadedImage); // Log the File object for the second profile