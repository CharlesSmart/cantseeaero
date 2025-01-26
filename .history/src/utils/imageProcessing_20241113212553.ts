// src/utils/imageProcessing.ts

export interface PixelCounts {
    opaque: number;
    opaquePercentage: number;
    transparent: number;
    transparentPercentage: number;
    semiTransparent: number;
    semiTransparentPercentage: number;
  }
  
  export const getPixelData = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      if (!(file instanceof File)) {
        reject(new Error('Invalid file input'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to get 2D context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };
  
  export const classifyPixel = (r: number, g: number, b: number, a: number): keyof PixelCounts => {
    if (a === 0) return 'transparent';
    if (a < 255) return 'semiTransparent';
    return 'opaque';
  };
  
  export const countPixels = (imageData: ImageData): PixelCounts => {
    const counts: PixelCounts = { opaque: 0, transparent: 0, semiTransparent: 0, opaquePercentage: 0, transparentPercentage: 0, semiTransparentPercentage: 0 };
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      const pixelType = classifyPixel(data[i], data[i + 1], data[i + 2], data[i + 3]);
      counts[pixelType]++;
    }

    const totalPixels = counts.opaque + counts.transparent + counts.semiTransparent;
    const calculatePercentage = (count: number) => Number(((count / totalPixels) * 100).toFixed(2));

    ['opaque', 'transparent', 'semiTransparent'].forEach(type => {
      counts[`${type}Percentage` as keyof PixelCounts] = calculatePercentage(counts[type as keyof PixelCounts]);
    });

    return counts;
  };