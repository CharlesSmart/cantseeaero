import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Eraser, MousePointer2, Ruler } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Profile } from '@/types/Profile';
import { useProfileStore } from '@/store/profileStore'; // Import Zustand store

interface Point {
  x: number;
  y: number;
}

interface MeasurementToolProps {
  imageUrl: string;
  // onRulerUpdate is modified to use store actions directly
  onRemoveBG: () => void;
  isBGRemovalLoading: boolean;
  // selectedProfileId and profiles are removed
}

const MeasurementTool: React.FC<MeasurementToolProps> = ({ imageUrl, onRemoveBG, isBGRemovalLoading }) => {
  const store = useProfileStore();
  const {
    selectedProfileId,
    profiles,
    updateProfile,
    updateLinkedMeasurementAndAllProfiles,
  } = store;

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number | null>(null); // This local state is fine
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'line' | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedTool, setSelectedTool] = useState<'move' | 'ruler'>('move'); // New state for selected tool
  const [imagePosition, setImagePosition] = useState<Point>({ x: 0, y: 0 });
  const [isImageDragging, setIsImageDragging] = useState<boolean>(false);

  // Performance optimization refs
  const animationFrameRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleZoomChange = (newZoomLevel: number) => {
    setZoomLevel(newZoomLevel);
  };

  const calculateDistance = useCallback((start: Point, end: Point) => {
    return Math.round(Math.sqrt(Math.pow((end.x - start.x), 2) + Math.pow((end.y - start.y), 2)));
  }, []); // Removed zoomLevel dependency as it's not needed for calculation

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

    // Set canvas to window size, not scaled image size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const img = new Image();
    img.onload = () => {
      // Don't scale the image here - let drawMeasurementTool handle it
      imageRef.current = img;
      drawMeasurementTool(); // Initial draw
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

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Convert to unscaled coordinates
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;
    
    if (selectedTool === 'move') {
      setIsImageDragging(true);
    } else if (selectedTool === 'ruler') {
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
          setEndPoint({ x, y });
          setIsDragging('end');
          setDistance(null);
        }
      } else if (!startPoint) {
        setStartPoint({ x, y });
        setEndPoint({ x, y });
        setIsDragging('end');
      } else {
        setEndPoint({ x, y });
        setDistance(calculateDistance({ x, y }, startPoint));
      }
    }
  }, [selectedTool, startPoint, endPoint, isNearLine, zoomLevel, calculateDistance]);

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

  // Throttled and optimized mouse move handler
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    // Extract event properties synchronously as the event object might be pooled by React
    const { movementX, movementY, clientX, clientY, shiftKey } = event;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (selectedTool === 'move' && isImageDragging) {
        const dx = movementX / zoomLevel;
        const dy = movementY / zoomLevel;
        // Use a functional update to ensure we're always updating from the latest state, preventing lag.
        setImagePosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      } else if (selectedTool === 'ruler') {
        const rect = canvas.getBoundingClientRect();
        let x = clientX - rect.left;
        let y = clientY - rect.top;

      // Update cursor style based on mouse position
      if (startPoint && endPoint) {
        // We use scaled coordinates for hit-testing against the cursor position
        const scaledStartPoint = { x: startPoint.x * zoomLevel, y: startPoint.y * zoomLevel };
        const scaledEndPoint = { x: endPoint.x * zoomLevel, y: endPoint.y * zoomLevel };
        
        if (
          isNearLine(x / zoomLevel, y / zoomLevel) ||
          Math.sqrt(Math.pow((x - scaledStartPoint.x), 2) + Math.pow(y - scaledStartPoint.y, 2)) < 10 ||
          Math.sqrt(Math.pow(x - scaledEndPoint.x, 2) + Math.pow(y - scaledEndPoint.y, 2)) < 10
        ) {
          setCursorStyle('move');
        } else {
          setCursorStyle('crosshair');
        }
      }

        if (!isDragging) return;

      // Convert mouse position to unscaled coordinates for updating state
      x = x / zoomLevel;
      y = y / zoomLevel;

        if (shiftKey) {
            if ((isDragging === 'start' || isDragging === 'end') && startPoint && endPoint) {
              const anchorPoint = isDragging === 'start' ? endPoint : startPoint;
              const angle = Math.atan2(y - anchorPoint.y, x - anchorPoint.x);
              const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
              const distance = Math.sqrt(Math.pow(x - anchorPoint.x, 2) + Math.pow(y - anchorPoint.y, 2));
              x = anchorPoint.x + Math.cos(snappedAngle) * distance;
              y = anchorPoint.y + Math.sin(snappedAngle) * distance;
            }
        }
  
        if (isDragging === 'start' && endPoint) {
          setStartPoint({ x, y });
          setDistance(calculateDistance({ x, y }, endPoint));
        } else if (isDragging === 'end' && startPoint) {
          setEndPoint({ x, y });
          setDistance(calculateDistance(startPoint, { x, y }));
        } else if (isDragging === 'line') {
          const dx = movementX / zoomLevel;
          const dy = movementY / zoomLevel;
          // Use functional updates to ensure we're always moving relative to the latest state, preventing lag.
          setStartPoint(prev => prev ? { x: prev.x + dx, y: prev.y + dy } : null);
          setEndPoint(prev => prev ? { x: prev.x + dx, y: prev.y + dy } : null);
        }
      }
    });
  }, [selectedTool, isImageDragging, startPoint, endPoint, isDragging, zoomLevel, isNearLine, calculateDistance]);

  // Debounced store update function
  const debouncedUpdateStore = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (distance && selectedProfile) {
        // Update the selected profile's measurementPixels first
        updateProfile({ ...selectedProfile, measurementPixels: distance });
        
        // Then update all profiles with the linked measurement and save to DB
        updateLinkedMeasurementAndAllProfiles('pixels', distance);
      }
    }, 150); // 300ms debounce
  }, [distance, selectedProfileId]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(null);
    setIsImageDragging(false);
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Use debounced update instead of immediate store update
    debouncedUpdateStore();
  }, [debouncedUpdateStore]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Memoized onboarding steps to prevent unnecessary re-renders
  const onboardingSteps = useMemo(() => [
    {
      condition: (profiles: Profile[]) => profiles.every(profile => profile.measurementMm === null),
      badge: "2",
      title: "Measure a known length",
      description: "Use the ruler tool to measure a known length in pixels. <br />Then enter the length in mm on the left",
    },
    {
      condition: (profiles: Profile[]) => 
        profiles.every(profile => profile.measurementMm !== null) && // Ensure the previous step is met
        profiles.every(profile => profile.cachedImageUrl === null),
      badge: "3",
      title: "Remove the background",
      description: "To get a frontal area estimate, use the remove background tool. This will take a few seconds.",
    },
  ], []);

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
