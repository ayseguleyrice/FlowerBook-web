"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, Upload, Loader2, X, Check, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Navigation } from "@/components/Navigation"
import { identifyPlantAndRecommendCare, type IdentifyPlantAndRecommendCareOutput } from "@/ai/flows/identify-plant-and-recommend-care"
import Image from "next/image"

export default function CameraPage() {
  const [image, setImage] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IdentifyPlantAndRecommendCareOutput | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [nickname, setNickname] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIdentify = async () => {
    if (!image) return
    setLoading(true)
    try {
      const res = await identifyPlantAndRecommendCare({
        photoDataUri: image,
        description: description || "No description provided"
      })
      setResult(res)
    } catch (error) {
      console.error(error)
      alert("Failed to identify plant. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSavePost = () => {
    // In a real app, this would save to Firestore
    alert(`Post saved to ${isPublic ? 'Blooming Feed' : 'My Garden'}!`)
    router.push(isPublic ? "/" : "/garden")
  }

  if (result) {
    return (
      <main className="min-h-screen bg-background pb-24 p-4">
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setResult(null)}>
            <X className="mr-2" /> Cancel
          </Button>
          <h1 className="font-bold text-lg">Plant Whisperer</h1>
          <div className="w-10" />
        </header>

        <div className="max-w-md mx-auto space-y-6">
          <Card className="overflow-hidden border-none shadow-lg">
             <div className="relative aspect-video">
               <Image src={image!} alt="Captured plant" fill className="object-cover" />
             </div>
             <CardContent className="p-6">
               <div className="mb-4">
                 <h2 className="text-2xl font-bold text-primary">{result.identification.commonName}</h2>
                 <p className="text-sm italic text-muted-foreground">{result.identification.latinName}</p>
               </div>

               <div className="grid grid-cols-1 gap-4 text-sm">
                 <div className="p-3 bg-primary/5 rounded-lg">
                   <p className="font-bold text-primary mb-1">Watering</p>
                   <p>{result.careRecommendations.watering}</p>
                 </div>
                 <div className="p-3 bg-accent/10 rounded-lg">
                   <p className="font-bold text-accent-foreground mb-1">Light</p>
                   <p>{result.careRecommendations.light}</p>
                 </div>
                 <div className="p-3 bg-secondary rounded-lg">
                   <p className="font-bold text-primary mb-1">Humidity & Toxicity</p>
                   <p>{result.careRecommendations.humidity}</p>
                   <p className="mt-2 text-destructive font-medium">{result.careRecommendations.toxicity}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          <Card className="p-6 border-none shadow-md">
            <h3 className="font-bold mb-4">Post to FlowerBook</h3>
            <div className="space-y-4">
               <div>
                 <Label htmlFor="nickname">Plant Nickname</Label>
                 <Input 
                   id="nickname" 
                   placeholder="e.g. Spiky Joe" 
                   value={nickname} 
                   onChange={(e) => setNickname(e.target.value)} 
                 />
               </div>
               <div className="flex items-center justify-between py-2">
                 <div className="flex items-center space-x-2">
                    {isPublic ? <Globe className="text-primary" size={18} /> : <Lock className="text-muted-foreground" size={18} />}
                    <span className="text-sm font-medium">{isPublic ? 'Public Post (Blooming)' : 'Private Garden'}</span>
                 </div>
                 <Switch checked={isPublic} onCheckedChange={setIsPublic} />
               </div>
               <Button onClick={handleSavePost} className="w-full h-12 text-lg">
                 <Check className="mr-2" /> Finish Planting
               </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary italic">Magic Camera</h1>
          <p className="text-muted-foreground">Capture your botanical beauty</p>
        </div>

        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[3/4] rounded-3xl border-4 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors group"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera size={40} className="text-primary" />
            </div>
            <p className="mt-4 font-bold text-primary">Tap to open camera</p>
            <p className="text-xs text-muted-foreground">or upload from gallery</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
              <Image src={image} alt="Preview" fill className="object-cover" />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full" 
                onClick={() => setImage(null)}
              >
                <X />
              </Button>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="desc" className="text-lg font-bold">What's the vibe?</Label>
              <Textarea 
                id="desc"
                placeholder="Describe your plant companion..." 
                className="bg-card border-none shadow-inner min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button 
                onClick={handleIdentify} 
                disabled={loading}
                className="w-full h-14 text-xl rounded-2xl shadow-lg shadow-primary/30"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Camera className="mr-2" />}
                Analyze Plant
              </Button>
            </div>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileChange}
        />
      </div>
      <Navigation />
    </main>
  )
}