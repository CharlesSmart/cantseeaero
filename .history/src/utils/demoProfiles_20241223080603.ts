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
    cachedImageUrl: "blob:http://localhost:5173/cbe5b8b2-b4b6-4e1c-a44e-da3d549f882c",
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
  },
  {
    id: 3,
    uploadedImage: await createFileFromUrl("/demo/demoImage3.png", "Demo Image 3", "image/png"),
    imageUrl: "/demo/demoImage3.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: null,
    cachedImage: null,
  }
];

// console.log(demoProfiles[1].uploadedImage); // Log the File object for the second profile