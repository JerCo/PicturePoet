
"use client";

import Image from 'next/image';
import { useState, useEffect, ChangeEvent } from 'react';
import { analyzePhotoForKeywords } from '@/ai/flows/analyze-photo-for-keywords';
import { generatePoemFromKeywords } from '@/ai/flows/generate-poem-from-keywords';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, SlidersHorizontal, Sparkles, Save, Loader2, AlertCircle, ImageIcon, FileText, Share2 } from 'lucide-react';

const POEM_LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const POEM_TONES = [
  { value: "joyful", label: "Joyful" },
  { value: "reflective", label: "Reflective" },
  { value: "humorous", label: "Humorous" },
  { value: "melancholic", label: "Melancholic" },
  { value: "epic", label: "Epic" },
  { value: "romantic", label: "Romantic" },
  { value: "mysterious", label: "Mysterious" },
];

export default function PicturePoetApp() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageKeywords, setImageKeywords] = useState<string[] | null>(null);
  const [generatedPoem, setGeneratedPoem] = useState<string | null>(null);
  const [poemStyle, setPoemStyle] = useState({
    length: POEM_LENGTHS[1].value, // Default to medium
    tone: POEM_TONES[1].value,   // Default to reflective
  });
  const [customPrompt, setCustomPrompt] = useState<string>('');


  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isLoadingPoem, setIsLoadingPoem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poemKey, setPoemKey] = useState(0); // For re-triggering animation

  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setError(null); // Clear previous errors
        setGeneratedPoem(null); // Clear previous poem
        setImageKeywords(null); // Clear previous keywords
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (uploadedImage && !imageKeywords && !isLoadingKeywords) {
      handleAnalyzePhoto();
    }
  }, [uploadedImage, imageKeywords, isLoadingKeywords]);

  const handleAnalyzePhoto = async () => {
    if (!uploadedImage) return;
    setIsLoadingKeywords(true);
    setError(null);
    try {
      const result = await analyzePhotoForKeywords({ photoDataUri: uploadedImage });
      setImageKeywords(result.keywords);
      toast({ title: "Keywords Extracted", description: "Photo analyzed successfully." });
    } catch (err) {
      console.error("Error analyzing photo:", err);
      setError("Failed to analyze photo. Please try again.");
      toast({ variant: "destructive", title: "Analysis Failed", description: "Could not extract keywords from the photo." });
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  const handleGeneratePoem = async () => {
    if (!imageKeywords || imageKeywords.length === 0) {
      setError("Cannot generate poem without keywords. Please upload and analyze a photo first.");
      return;
    }
    setIsLoadingPoem(true);
    setError(null);
    try {
      const styleDescription = `A ${poemStyle.length} poem with a ${poemStyle.tone} tone. ${customPrompt ? "Additional context: " + customPrompt : ""}`;
      const result = await generatePoemFromKeywords({
        keywords: imageKeywords.join(', '),
        style: styleDescription,
      });
      setGeneratedPoem(result.poem);
      setPoemKey(prev => prev + 1); // Trigger animation
      toast({ title: "Poem Generated!", description: "Your poetic masterpiece is ready." });
    } catch (err) {
      console.error("Error generating poem:", err);
      setError("Failed to generate poem. Please try again or adjust the style.");
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate the poem." });
    } finally {
      setIsLoadingPoem(false);
    }
  };
  
  const downloadFile = (content: string, filename: string, type: 'text' | 'image') => {
    const link = document.createElement('a');
    if (type === 'text') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      link.href = URL.createObjectURL(blob);
    } else {
      link.href = content; // Assumes content is a data URI for images
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (type === 'text') {
      URL.revokeObjectURL(link.href);
    }
  };

  const handleSaveCreation = () => {
    if (uploadedImage && imageFile) {
      const imageFileName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) || 'photo';
      downloadFile(uploadedImage, `${imageFileName}_picture_poet.png`, 'image');
    }
    if (generatedPoem) {
      const poemFileName = imageFile ? `${imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) || 'poem'}_poem.txt` : 'picture_poet_poem.txt';
      downloadFile(generatedPoem, poemFileName, 'text');
    }
    if ( (uploadedImage && imageFile) || generatedPoem) {
        toast({ title: "Content Saved", description: "Your creation has been downloaded." });
    } else {
        toast({ variant: "destructive", title: "Nothing to Save", description: "Please upload a photo and generate a poem first." });
    }
  };

 const handleSharePoem = async () => {
    if (typeof navigator === 'undefined') {
        // This case might be relevant for server-side rendering or very old browsers.
        setError("Sharing is not supported on this device.");
        return;
    }

    if (!generatedPoem) {
      toast({
        variant: "destructive",
        title: "Nothing to Share",
        description: "Please generate a poem first.",
      });
      return;
    }

    const shareData: ShareData = {
      title: 'Picture Poet Creation',
      text: generatedPoem,
    };

    // Check if the share API can handle files
    if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      shareData.files = [imageFile];
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Content Prepared",
          description: shareData.files
            ? "Your poem and image are ready to be shared."
            : "Your poem is ready to be shared.",
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          toast({
            title: "Sharing Cancelled",
            description: "You cancelled the share action.",
          });
        } else {
          console.error("Error sharing content:", err);
          let errorDescription = "Could not share the content. Your browser might not support this feature, the file type, or an error occurred.";
          if (!shareData.files) { // If only text was attempted
             errorDescription = "Could not share the poem. Your browser might not support this feature or an error occurred.";
          }
           else if (shareData.files && !(navigator.canShare && navigator.canShare({ files: [imageFile!] }))) {
             errorDescription = "Your browser supports sharing, but not with files. The poem has been prepared for sharing instead.";
          }
          toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: errorDescription,
          });
        }
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      try {
          await navigator.clipboard.writeText(generatedPoem);
          let description = "Poem copied to clipboard. Sharing is not supported by your browser.";
          if(imageFile) {
            description = "Poem copied to clipboard. Image sharing via clipboard is not directly supported."
          }
          toast({
              title: "Poem Copied",
              description: description,
          });
      } catch (copyError) {
          console.error("Error copying poem to clipboard:", copyError);
          toast({
              variant: "destructive",
              title: "Copying Failed",
              description: "Could not copy the poem to clipboard.",
          });
      }
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary font-lora">Picture Poet Studio</h1>
        <p className="text-muted-foreground text-md sm:text-lg mt-2">Transform your photos into beautiful poetry.</p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-8 max-w-3xl w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Oops! Something went wrong.</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <main className="w-full max-w-4xl">
        <Card className="shadow-lg w-full">
            <CardHeader className="text-center">
                <CardDescription className="text-lg">Follow the steps below to create your masterpiece.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* --- STEP 1: UPLOAD --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg">1</div>
                        <h3 className="text-xl font-semibold">Upload Your Photo</h3>
                    </div>
                     <div className="text-center">
                        <Input
                            id="photo-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                            aria-label="Upload photo"
                        />
                        <Label
                            htmlFor="photo-upload"
                            className="w-full max-w-sm cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            <UploadCloud className="mr-2 h-5 w-5" /> Choose Photo
                        </Label>
                        {isLoadingKeywords && (
                            <div className="mt-4 flex items-center justify-center text-muted-foreground">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                            Analyzing photo for keywords...
                            </div>
                        )}
                        {imageKeywords && !isLoadingKeywords && (
                            <div className="mt-4 p-3 bg-secondary/50 rounded-md max-w-sm mx-auto">
                            <h4 className="font-semibold text-secondary-foreground mb-1">Identified Keywords:</h4>
                            <p className="text-sm text-secondary-foreground break-words">{imageKeywords.join(', ')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <Separator className="my-6" />

                {/* --- STEP 2: CUSTOMIZE & GENERATE --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg ${uploadedImage && imageKeywords ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                        <h3 className={`text-xl font-semibold ${!uploadedImage || !imageKeywords ? 'text-muted-foreground' : ''}`}>Customize & Generate</h3>
                    </div>

                    <div className={`pl-11 grid grid-cols-1 md:grid-cols-2 gap-6 ${!uploadedImage || !imageKeywords ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="space-y-4">
                             <div>
                                <Label htmlFor="poem-length">Poem Length</Label>
                                <Select
                                    value={poemStyle.length}
                                    onValueChange={(value) => setPoemStyle(prev => ({ ...prev, length: value }))}
                                    disabled={!uploadedImage || !imageKeywords}
                                >
                                    <SelectTrigger id="poem-length" className="w-full">
                                    <SelectValue placeholder="Select length" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {POEM_LENGTHS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="poem-tone">Poem Tone</Label>
                                <Select
                                    value={poemStyle.tone}
                                    onValueChange={(value) => setPoemStyle(prev => ({ ...prev, tone: value }))}
                                    disabled={!uploadedImage || !imageKeywords}
                                >
                                    <SelectTrigger id="poem-tone" className="w-full">
                                    <SelectValue placeholder="Select tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {POEM_TONES.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="custom-prompt">Additional Context (Optional)</Label>
                                <Textarea 
                                    id="custom-prompt"
                                    placeholder="e.g., Focus on the sunset, make it rhyme..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    className="min-h-[60px]"
                                    disabled={!uploadedImage || !imageKeywords}
                                />
                            </div>
                             <Button 
                                onClick={handleGeneratePoem} 
                                disabled={isLoadingPoem || isLoadingKeywords || !imageKeywords}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                aria-label="Generate poem"
                            >
                                {isLoadingPoem ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                <Sparkles className="mr-2 h-5 w-5" />
                                )}
                                Generate Poem
                            </Button>
                        </div>
                    </div>
                </div>

                 <Separator className="my-6" />

                {/* --- STEP 3: CREATION OUTPUT --- */}
                 <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg ${generatedPoem ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
                        <h3 className={`text-xl font-semibold ${!generatedPoem ? 'text-muted-foreground' : ''}`}>Your Creation</h3>
                    </div>
                    <div className="pl-11 space-y-6">
                        {uploadedImage ? (
                        <div className="rounded-lg overflow-hidden border border-border shadow-sm aspect-video relative w-full">
                            <Image 
                            src={uploadedImage} 
                            alt="Uploaded preview" 
                            layout="fill"
                            objectFit="contain"
                            data-ai-hint="user uploaded"
                            />
                        </div>
                        ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 border border-dashed rounded-lg h-48">
                            <ImageIcon size={48} className="mb-4 opacity-50" />
                            <p>Upload a photo to see it here.</p>
                        </div>
                        )}
                        
                        {isLoadingPoem && (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-6">
                            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                            <p>Generating your poem...</p>
                        </div>
                        )}

                        {generatedPoem && !isLoadingPoem && (
                        <div key={poemKey} className="poem-fade-in p-4 bg-card rounded-md border border-border shadow-inner">
                            <h3 className="font-semibold text-lg mb-2 font-lora text-primary">Generated Poem:</h3>
                            <p className="font-poem whitespace-pre-wrap text-foreground text-sm md:text-base leading-relaxed">
                            {generatedPoem}
                            </p>
                        </div>
                        )}

                        {!generatedPoem && !isLoadingPoem && (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 border border-dashed rounded-lg">
                            <p>Your poem will appear here after generation.</p>
                        </div>
                        )}
                    </div>
                </div>

            </CardContent>
            {(uploadedImage || generatedPoem) && (
                <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 bg-muted/50 p-4 mt-6 rounded-b-lg border-t">
                <Button onClick={handleSaveCreation} className="w-full sm:flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" aria-label="Save creation">
                    <Save className="mr-2 h-5 w-5" /> Save Creation
                </Button>
                {generatedPoem && (
                    <Button onClick={handleSharePoem} variant="outline" className="w-full sm:flex-1" aria-label="Share poem">
                    <Share2 className="mr-2 h-5 w-5" /> Share Poem
                    </Button>
                )}
                </CardFooter>
            )}
        </Card>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Picture Poet. All rights reserved.</p>
      </footer>
    </div>
  );
}

interface ShareData {
  files?: File[];
  title?: string;
  text?: string;
  url?: string;
}

    

    

