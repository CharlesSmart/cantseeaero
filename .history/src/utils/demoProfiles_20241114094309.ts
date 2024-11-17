import { Profile } from '../types/Profile';

async function createFileFromUrl(url: string, fileName: string, mimeType: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType });
}

export const demoProfiles: Profile[] = [
  {
    id: 1,
    uploadedImage: await createFileFromUrl("/demo/demoImage1.png", "Demo Image 1", "image/png"),
    imageUrl: "/demo/demoImage1.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: null,
    cachedImage: null,
  },
  {
    id: 2,
    uploadedImage: await createFileFromUrl("/demo/demoImage2.png", "Demo Image 2", "image/png"),
    imageUrl: "/demo/demoImage2.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: null,
    cachedImage: null,
  }
];

// console.log(demoProfiles[1].uploadedImage); // Log the File object for the second profile