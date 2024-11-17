import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  Icon,
} from "lucide-react"

interface Point {
  x: number;
  y: number;
}

interface MeasurementToolProps {
  imageUrl: string;
  onRulerUpdate: (pixels: number) => void;
  onRemoveBG: () => void;
}

const MeasurementTool: React.FC<MeasurementToolProps> = ({ imageUrl, onRulerUpdate, onRemoveBG }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'line' | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('crosshair');
  const imageRef = useRef<HTMLImageElement | null>(null);
  const targetImg = useRef<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);


  const handleZoomChange = (newZoomLevel: number) => {
    setZoomLevel(newZoomLevel);
  };

  const calculateDistance = useCallback((start: Point, end: Point) => {
    return Math.round(Math.sqrt(Math.pow((end.x - start.x), 2) + Math.pow((end.y - start.y), 2)));
  }, [zoomLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      imageRef.current = img;
    };
    img.src = imageUrl;
  }, [imageUrl]);
  // console.log("Image URL measurement tool:", imageUrl);

  useEffect(() => {
    targetImg.current = new Image();
    targetImg.current.src = '/src/assets/target.png';
  }, []); // Load the image once on component mount

  const isNearLine = useCallback((x: number, y: number): boolean => {
    if (!startPoint || !endPoint) return false;

    const lineLength = calculateDistance(startPoint, endPoint);
    const d1 = calculateDistance(startPoint, { x, y });
    const d2 = calculateDistance(endPoint, { x, y });

    // Check if point is close to the line using distance formula
    return Math.abs(d1 + d2 - lineLength) < 5;
  }, [startPoint, endPoint, calculateDistance]);

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    if (startPoint && endPoint) {
      const startDist = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
      const endDist = Math.sqrt(Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2));
      if (startDist < 10/zoomLevel) {
        setIsDragging('start');
      } else if (endDist < 10/zoomLevel) {
        setIsDragging('end');
      } else if (isNearLine(x, y)) {
        setIsDragging('line');
      } else {
        setStartPoint({ x, y });
        setEndPoint(null);
        setDistance(null);
      }
    } else if (!startPoint) {
      setStartPoint({ x, y });
    } else {
      setEndPoint({ x, y });
      setDistance(calculateDistance({ x, y }, startPoint));
    }
  };

  const drawMeasurementTool = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    // Redraw the background image
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }

    if (startPoint && endPoint && targetImg.current) {
      // Calculate scaled size for draggable points
      const baseSize = 20; // Base size of the point
      const scaledSize = baseSize / zoomLevel;
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.strokeStyle = 'hsl(217 91% 60%)'; //tailwind color blue500
      ctx.lineWidth = 2 / zoomLevel; // Adjust line width for zoom
      ctx.stroke();
      ctx.save();

      // Draw start line 
      ctx.translate(startPoint.x, startPoint.y);
      ctx.rotate(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x));
      ctx.beginPath();
      ctx.rect(0, -scaledSize/2, scaledSize/10, scaledSize);
      ctx.fillStyle = 'hsl(217 91% 60%)';
      ctx.fill();

      ctx.restore();

      // Draw End line 
      ctx.translate(endPoint.x, endPoint.y);
      ctx.rotate(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x));
      ctx.beginPath();
      ctx.rect(0, -scaledSize/2, scaledSize/10, scaledSize);
      ctx.fillStyle = 'hsl(217 91% 60%)';
      ctx.fill();
 
      ctx.restore();
      ctx.save();

      ctx.translate((startPoint.x + endPoint.x)/2, (startPoint.y + endPoint.y)/2 - 8);
      ctx.rotate(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x));
      ctx.beginPath();
      ctx.rect(0, 0, scaledSize, scaledSize);
      ctx.fillText(distance !== null ? distance.toString() : '', 5, 5);
      ctx.fillStyle = 'hsl(217 91% 60%)';
      ctx.fill();
      ctx.restore();

    }

    ctx.restore();
  }, [startPoint, endPoint, zoomLevel, calculateDistance]);
  
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = (event.clientX - rect.left) / zoomLevel;
    let y = (event.clientY - rect.top) / zoomLevel;

    // Update cursor style based on mouse position
    if (startPoint && endPoint) {
      if (
        isNearLine(x, y) ||
        Math.sqrt(Math.pow((x - startPoint.x), 2) + Math.pow(y - startPoint.y, 2)) < 10/zoomLevel ||
        Math.sqrt(Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2)) < 10/zoomLevel
      ) {
        setCursorStyle('move');
      } else {
        setCursorStyle('crosshair');
      }
    }

    if (!isDragging) return;

    // Snap to 45-degree angle if shift key is pressed
    if (event.shiftKey) {
      if (isDragging === 'start' && endPoint) {
        const angle = Math.atan2(y - endPoint.y, x - endPoint.x);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const distance = Math.sqrt(Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2));
        x = endPoint.x + Math.cos(snappedAngle) * distance;
        y = endPoint.y + Math.sin(snappedAngle) * distance;
      } else if (isDragging === 'end' && startPoint) {
        const angle = Math.atan2(y - startPoint.y, x - startPoint.x);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const distance = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
        x = startPoint.x + Math.cos(snappedAngle) * distance;
        y = startPoint.y + Math.sin(snappedAngle) * distance;
      }
    }

    if (isDragging === 'start' && endPoint) {
      setStartPoint({ x, y });
      setDistance(calculateDistance({ x, y }, endPoint));
    } else if (isDragging === 'end' && startPoint) {
      setEndPoint({ x, y });
      setDistance(calculateDistance(startPoint, { x, y }));
    } else if (isDragging === 'line' && startPoint && endPoint) {
      const dx = event.movementX/zoomLevel;
      const dy = event.movementY/zoomLevel;
      setStartPoint({ x: startPoint.x + dx, y: startPoint.y + dy });
      setEndPoint({ x: endPoint.x + dx, y: endPoint.y + dy });
    }

  }, [startPoint, endPoint, isDragging, zoomLevel, calculateDistance, drawMeasurementTool]);

  const handleCanvasMouseUp = () => {
    setIsDragging(null);
    handleDistanceChange();
  };


  useEffect(() => {
    drawMeasurementTool();
  }, [drawMeasurementTool]);

  const handleDistanceChange = () => {
    if (distance) {
      onRulerUpdate(distance); // Call with null if length is not available
      console.log("Distance changed:", distance);
    }
  }

  return (
    <div>
      {imageUrl && ( // Check if imageUrl is provided
        <>
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="border border-gray-300 cursor-crosshair"
            style={{ cursor: cursorStyle }}
          />
          <Card className="fixed mx-auto inset-x-0 max-w-fit bottom-4 p-2 flex flex-row gap-2">
          <Button onClick={onRemoveBG}>Remove BG</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost">{zoomLevel*100}%<ChevronDown className="ml-2 w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleZoomChange(2)}>200%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(1)}>100%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(0.5)}>50%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(0.25)}>25%</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <Button onClick={() => handleZoomChange(zoomLevel + 0.1)}>Zoom In</Button> */}
            {/* <Button onClick={() => handleZoomChange(zoomLevel - 0.1)}>Zoom Out</Button> */}
          </Card>
        </>
      )}
    </div>
  );
};

export default MeasurementTool;
