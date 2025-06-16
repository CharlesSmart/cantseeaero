import React, { useState, useRef, useEffect, useCallback /*, useMemo*/ } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent /*, CardHeader*/ } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
// import { Badge } from "@/components/ui/badge"
import { ChevronDown, Eraser, MousePointer2, Ruler, Wand2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
// import { Profile } from '@/types/Profile';
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
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number | null>(null); // This local state is fine
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'line' | null>(null);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedTool, setSelectedTool] = useState<'move' | 'ruler' | 'eraser'>('move');
  const [imagePosition, setImagePosition] = useState<Point>({ x: 0, y: 0 });
  const [isImageDragging, setIsImageDragging] = useState<boolean>(false);
  const [eraserSize] = useState<number>(40);
  const [eraserPreviewPosition, setEraserPreviewPosition] = useState<Point | null>(null);

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
    } else if (selectedTool === 'eraser') {
      setCursorStyle('none');
    } else {
      setCursorStyle('default');
    }
  }, [selectedTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageUrl) return;

    // Set canvas to window size, not scaled image size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Don't scale the image here - let drawMeasurementTool handle it
      imageRef.current = img;

      // Create an off-screen canvas for persistent image manipulation
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = img.width;
      offscreenCanvas.height = img.height;
      const offscreenCtx = offscreenCanvas.getContext('2d');
      offscreenCtx?.drawImage(img, 0, 0);
      imageCanvasRef.current = offscreenCanvas;

      drawMeasurementTool(); // Initial draw
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const isNearLine = useCallback((x: number, y: number): boolean => {
    if (!startPoint || !endPoint) return false;

    const lineLength = calculateDistance(startPoint, endPoint);
    const d1 = calculateDistance(startPoint, { x, y });
    const d2 = calculateDistance(endPoint, { x, y });

    // Check if point is close to the line using distance formula
    return Math.abs(d1 + d2 - lineLength) < 5;
  }, [startPoint, endPoint, calculateDistance]);

  const drawMeasurementTool = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    // Redraw the background image from the off-screen canvas
    if (imageCanvasRef.current) {
      ctx.drawImage(imageCanvasRef.current, imagePosition.x, imagePosition.y);
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

    if (selectedTool === 'eraser' && eraserPreviewPosition) {
      ctx.beginPath();
      ctx.arc(eraserPreviewPosition.x, eraserPreviewPosition.y, (eraserSize / 2), 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eraserPreviewPosition.x, eraserPreviewPosition.y, (eraserSize / 2) - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  }, [startPoint, endPoint, zoomLevel, imagePosition, selectedTool, eraserPreviewPosition, eraserSize]);

  const performErase = useCallback((canvasX: number, canvasY: number) => {
    const imageCanvas = imageCanvasRef.current;
    if (!imageCanvas) return;

    const ctx = imageCanvas.getContext('2d');
    if (!ctx) return;

    const imageX = (canvasX / zoomLevel) - imagePosition.x;
    const imageY = (canvasY / zoomLevel) - imagePosition.y;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(imageX, imageY, eraserSize / 2 / zoomLevel, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.restore();

    drawMeasurementTool();
  }, [zoomLevel, imagePosition, eraserSize, drawMeasurementTool]);

  const handleFinishErasing = useCallback(() => {
    const imageCanvas = imageCanvasRef.current;
    if (!imageCanvas || !selectedProfile || !updateProfile) return;

    imageCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "erased_image.png", { type: 'image/png' });
        const updatedProfile = {
          ...selectedProfile,
          cachedImage: file,
        };
        updateProfile(updatedProfile);
      }
    }, 'image/png');
  }, [selectedProfile, updateProfile]);

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
    } else if (selectedTool === 'eraser') {
      setIsErasing(true);
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      performErase(canvasX, canvasY);
    }
  }, [selectedTool, startPoint, endPoint, isNearLine, zoomLevel, calculateDistance, performErase]);

  // Redraw after profile or ruler changes.
  useEffect(() => {
    drawMeasurementTool();
  }, [drawMeasurementTool]);

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
      } else if (selectedTool === 'eraser') {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        setEraserPreviewPosition({ x, y });

        if (isErasing) {
            performErase(x, y);
        }
      }
    });
  }, [selectedTool, isImageDragging, startPoint, endPoint, isDragging, zoomLevel, isNearLine, calculateDistance, isErasing, performErase]);

  // Debounced store update function
  const debouncedUpdateStore = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (distance && selectedProfile) {
        // Update the selected profile's measurementPixels first
        // updateProfile({ ...selectedProfile, measurementPixels: distance });
        // commenting this out as it seems to be causing issues with async update profile clashes deleting cached image
        
        // Then update all profiles with the linked measurement and save to DB
        updateLinkedMeasurementAndAllProfiles('pixels', distance);
      }
    }, 150); // 300ms debounce
  }, [distance, selectedProfile, updateLinkedMeasurementAndAllProfiles]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isErasing) {
      setIsErasing(false);
      setEraserPreviewPosition(null);
      handleFinishErasing();
    }
    setIsDragging(null);
    setIsImageDragging(false);
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Use debounced update instead of immediate store update
    if (selectedTool === 'ruler') {
      debouncedUpdateStore();
    }
  }, [debouncedUpdateStore, isErasing, handleFinishErasing, selectedTool]);

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
  /* const onboardingSteps = useMemo(() => [
    {
      condition: (profiles: Profile[]) => profiles.every(profile => profile.measurementPixels === null && profile.measurementMm === null),
      badge: "STEP 1",
      title: "Measure a known length in pixels.",
      description: "Use the ruler tool to measure a known length in pixels. <br />For example: 300mm of a tape measure.",
    },
    {
      condition: (profiles: Profile[]) => profiles.every(profile => profile.measurementMm === null && profile.measurementPixels !== null),
      badge: "STEP 2",
      title: "Great, now calibrate with the true length.",
      description: "In the left panel, enter the length in mm as a known length.",
    },
    {
      condition: (profiles: Profile[]) => 
        profiles.every(profile => profile.measurementMm !== null) && // Ensure the previous step is met
        profiles.every(profile => profile.cachedImage === null), //if every cached image is null user hasn't hit remove bg once.
      badge: "STEP 3",
      title: "Remove the background",
      description: "To get a frontal area estimate, use the remove background tool. This will take a few seconds.",
    },
  ], []); */

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
          {/* {onboardingSteps.map((step, index) => (
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
          ))} */}

          <CardContent className='pt-4'>
          <div className='flex flex-row gap-2'>
          <ToggleGroup defaultValue="move" type="single" onValueChange={(value) => { if (value) setSelectedTool(value as 'move' | 'ruler' | 'eraser')}}>
              <ToggleGroupItem value="move" className='gap-2 group'><MousePointer2 className="w-4 h-4" /><span className='hidden md:block'>Move</span></ToggleGroupItem>
              <ToggleGroupItem value="ruler" className='gap-2 group'><Ruler className="w-4 h-4" /><span className='hidden md:block'>Ruler</span></ToggleGroupItem>
              <ToggleGroupItem value="eraser" className='gap-2 group' disabled={!selectedProfile?.cachedImage}><Eraser className="w-4 h-4" /><span className='hidden md:block'>Erase</span></ToggleGroupItem>
            </ToggleGroup>
            <Button variant="ghost" onClick={onRemoveBG}><Wand2 className="w-4 h-4" /><span className='hidden md:block'>Remove BG</span></Button>
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
