import { PixelCounts } from "@/utils/imageProcessing";

export interface Profile {
    id: number;
    uploadedImage: File | null;
    imageUrl: string | null;
    pixelCounts: PixelCounts | null;
    measurementPixels: number | null;
    measurementMm: number | null;
    cachedImage: File | null;
    cachedImageUrl: string | null;
  }