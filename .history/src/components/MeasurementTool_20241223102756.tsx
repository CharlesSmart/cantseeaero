import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Eraser, MousePointer2, Ruler } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Profile } from '@/types/Profile';

interface Point {
  x: number;
  y: number;
}

interface MeasurementToolProps {
  imageUrl: string;
  onRulerUpdate: (pixels: number) => void;
  onRemoveBG: () => void;
  isBGRemovalLoading: boolean;
  selectedProfileId: number | null;
  profiles: Profile[];
}

const MeasurementTool: React.FC<MeasurementToolProps> = ({ imageUrl, onRulerUpdate, onRemoveBG, isBGRemovalLoading, selectedProfileId, profiles }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'line' | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedTool, setSelectedTool] = useState<'move' | 'ruler'>('move'); // New state for selected tool
  const [imagePosition, setImagePosition] = useState<Point>({ x: 0, y: 0 });
  const [isImageDragging, setIsImageDragging] = useState<boolean>(false);


  const handleZoomChange = (newZoomLevel: number) => {
    setZoomLevel(newZoomLevel);
  };

  const calculateDistance = useCallback((start: Point, end: Point) => {
    return Math.round(Math.sqrt(Math.pow((end.x - start.x), 2) + Math.pow((end.y - start.y), 2)));
  }, [zoomLevel]);

  // Update cursor style based on selected tool
  useEffect(() => {
    if (selectedTool === 'ruler') {
      setCursorStyle('crosshair');
    } else {
      setCursorStyle('default');
    }
  }, [selectedTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Set the canvas to a larger size initially
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    const img = new Image();
    img.onload = () => {
      // Draw the image onto the canvas after it loads
      canvas.width = Math.max(img.width * zoomLevel, window.innerWidth);
      canvas.height = Math.max(img.height * zoomLevel, window.innerHeight);
      ctx.drawImage(img, 0, 0, img.width * zoomLevel, img.height * zoomLevel);
      imageRef.current = img;
    };
    img.src = imageUrl;
    
  }, [imageUrl, zoomLevel]);

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

    if (selectedTool === 'move') {
      setIsImageDragging(true);
    } else if (selectedTool === 'ruler') {
      if (!startPoint) {
        setStartPoint({ x, y });
        setEndPoint({ x, y }); // Initialize endPoint to startPoint to start drawing
      } else if (!endPoint) {
        setEndPoint({ x, y });
        setDistance(calculateDistance({ x, y }, startPoint));
      } else {
        const startDist = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
        const endDist = Math.sqrt(Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2));
        if (startDist < 10 / zoomLevel) {
          setIsDragging('start');
        } else if (endDist < 10 / zoomLevel) {
          setIsDragging('end');
        } else if (isNearLine(x, y)) {
          setIsDragging('line');
        } else {
          setStartPoint({ x, y });
          setEndPoint(null);
          setDistance(null);
        }
      }
    }
  };

  const drawMeasurementTool = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    // Redraw the background image with the updated position
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, imagePosition.x, imagePosition.y);
    }

    if (startPoint && endPoint) {
      const baseSize = 20; // Base size of the point
      const scaledSize = baseSize / zoomLevel;
      // const leftPoint = {x: Math.min(startPoint.x, endPoint.x), y: Math.min(startPoint.y, endPoint.y)};
      // const rightPoint = {x: Math.max(startPoint.x, endPoint.x), y: Math.max(startPoint.y, endPoint.y)};
      // const angle = Math.atan2(rightPoint.y - leftPoint.y, rightPoint.x - leftPoint.x);
         
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

      // Draw the distance text - to do once I understand trigonometry
      // ctx.translate((startPoint.x + endPoint.x)/2, (startPoint.y + endPoint.y)/2 - scaledSize);
      // ctx.rotate(-angle);
      // ctx.beginPath();
      // ctx.fillStyle = 'hsl(217 91% 60%)';
      // ctx.fillRect(0, 0, scaledSize, scaledSize);
      // ctx.restore();
      // ctx.save();

      // ctx.translate((startPoint.x + endPoint.x)/2, (startPoint.y + endPoint.y)/2 - 8);
      // ctx.rotate(-angle);
      // ctx.fillStyle = 'white';
      // ctx.fillText(distance !== null ? distance.toString() : '', 0, 0);
      // ctx.restore();
    }

    ctx.restore();
  }, [startPoint, endPoint, zoomLevel, imagePosition]);
  
  // Redraw after mouse down/up
  useEffect(() => {
    drawMeasurementTool();
  }, [drawMeasurementTool, selectedProfileId]);

  //Redraw after profile change with a delay to avoid async drawing issues - messy
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      drawMeasurementTool();
    }, 50);
  
    return () => clearTimeout(timeoutId);
  }, [selectedProfileId]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    if (selectedTool === 'move' && isImageDragging) {
      const dx = event.movementX / zoomLevel;
      const dy = event.movementY / zoomLevel;
      setImagePosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (selectedTool === 'ruler' && startPoint && !isDragging) {
      setEndPoint({ x, y }); // Update endPoint to current mouse position
      setDistance(calculateDistance(startPoint, { x, y }));
    }

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
  }, [startPoint, isDragging, zoomLevel, calculateDistance, selectedTool, isImageDragging]);

  const handleCanvasMouseUp = () => {
    setIsDragging(null);
    setIsImageDragging(false);
    handleDistanceChange();
  };




  const handleDistanceChange = () => {
    if (distance) {
      onRulerUpdate(distance); 
    }
  }

  // const isLoading = isBGRemovalLoading;

  // Define the onboarding steps in a configuration object
  const onboardingSteps = [
    {
      condition: (profiles: Profile[]) => profiles.every(profile => profile.measurementMm === null),
      badge: "2",
      title: "Measure a known length",
      description: "Use the ruler tool to measure a known length in pixels. <br />Then enter the length in mm",
    },
    {
      condition: (profiles: Profile[]) => 
        profiles.every(profile => profile.measurementMm !== null) && // Ensure the previous step is met
        profiles.every(profile => profile.cachedImageUrl === null),
      badge: "3",
      title: "Remove the background",
      description: "To get a frontal area estimate, use the background removal tool. This will take a few seconds.",
    },
  ];

  

  return (
    <div>
      {imageUrl && ( 
        <>
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className={`border border-gray-300`}
            style={{ cursor: cursorStyle }}
          />

          <Card className="fixed mx-auto inset-x-0 max-w-fit bottom-4 gap-2">          
          {isBGRemovalLoading && 
            <Progress className='w-full absolute -top-4 left-0 h-2' indeterminate={isBGRemovalLoading} />
          }

          {/* Render the onboarding steps */}
          {onboardingSteps.map((step, index) => (
            step.condition(profiles) && (
              <CardHeader key={index} className='flex flex-col gap-2 pb-0'>
                <div className="">
                  <Badge variant="info">{step.badge}</Badge>
                  <h3 className='text-lg font-semibold'>{step.title}</h3>
                  <p className='text-sm text-gray-500 max-w-sm' dangerouslySetInnerHTML={{ __html: step.description }} />
                  <hr className='-mx-4 mt-4' />
                </div>
              </CardHeader>
            )
          ))}

          <CardContent className='pt-4'>
          <div className='flex flex-row gap-2'>
          <ToggleGroup defaultValue="move" type="single" onValueChange={(value) => setSelectedTool(value as 'move' | 'ruler')}>
              <ToggleGroupItem value="move" className='gap-2 group'><MousePointer2 className="w-4 h-4" /><span className='hidden md:block'>Move</span></ToggleGroupItem>
              <ToggleGroupItem value="ruler" className='gap-2 group'><Ruler className="w-4 h-4" /><span className='hidden md:block'>Ruler</span></ToggleGroupItem>
            </ToggleGroup>
            <Button variant="ghost" onClick={onRemoveBG}><Eraser className="w-4 h-4" /><span className='hidden md:block'>Remove BG</span></Button>
            <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="secondary">{zoomLevel*100}%<ChevronDown className="ml-2 w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleZoomChange(2)}>200%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(1)}>100%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(0.5)}>50%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(0.25)}>25%</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MeasurementTool;
