import { PixelCounts } from "@/utils/imageProcessing";

export interface Profile {
    numid: number;
    id: string;
    uploadedImage: File | null;
    imageUrl: string | null;
    pixelCounts: PixelCounts | null;
    measurementPixels: number | null;
    measurementMm: number | null;
    cachedImage: File | null;
    cachedImageUrl: string | null;
  }