import { Profile } from '../types/Profile';

async function createFileFromUrl(url: string, fileName: string, mimeType: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType });
}

export const demoProfiles: Profile[] = [
  {
    id: 1,
    uploadedImage: await createFileFromUrl("/app/demo/demoImage1.png", "Demo Image 1", "image/png"),
    imageUrl: "/app/demo/demoImage1.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: "/app/demo/demoImage1.png",
    cachedImage: null,
  },
  {
    id: 2,
    uploadedImage: await createFileFromUrl("/app/demo/demoImage2.png", "Demo Image 2", "image/png"),
    imageUrl: "/app/demo/demoImage2.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: "/demo/demoImage2.png",
    cachedImage: null,
  },
  {
    id: 3,
    uploadedImage: await createFileFromUrl("/app/demo/demoImage3.png", "Demo Image 3", "image/png"),
    imageUrl: "/app/demo/demoImage3.png",
    pixelCounts: null,
    measurementPixels: null,
    measurementMm: null,
    cachedImageUrl: null,
    cachedImage: null,
  }
];

// console.log(demoProfiles[1].uploadedImage); // Log the File object for the second profile