import { PixelCounts } from "@/utils/imageProcessing";

export interface Profile {
    id: string;
    uploadedImage: File | null;
    imageUrl: string | null;
    pixelCounts: PixelCounts | null;
    measurementPixels: number | null;
    measurementMm: number | null;
    cachedImage: string | null;
  }