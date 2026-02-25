"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, X, Globe, Lock, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/Navigation"
import type { IdentifyPlantAndRecommendCareOutput } from "@/ai/flows/identify-plant-and-recommend-care"
import { createPost, updateMyLocation, uploadTemporaryImage } from "@/lib/firestore"
import Image from "next/image"

export default function CameraPage() {
  const [image, setImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<IdentifyPlantAndRecommendCareOutput | null>(null)
  const [temporaryPhotoUrl, setTemporaryPhotoUrl] = useState<string | null>(null)
  const [nickname, setNickname] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const getCurrentLocation = () =>
    new Promise<{ latitude: number; longitude: number } | undefined>((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => resolve(undefined),
        { enableHighAccuracy: true, timeout: 5000 }
      )
    })

  const handleIdentify = async () => {
    if (!image || !selectedFile) return
    setLoading(true)
    try {
      const upload = await uploadTemporaryImage(selectedFile)
      setTemporaryPhotoUrl(upload.downloadUrl)

      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoDataUri: image,
          description: description || "No description provided",
        }),
      })

      if (!response.ok) {
        const body = (await response.json()) as { error?: string }
        throw new Error(body.error || "Failed to identify plant")
      }

      const res = (await response.json()) as IdentifyPlantAndRecommendCareOutput
      setResult(res)
    } catch (error) {
      console.error(error)
      alert("Failed to identify plant. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async (mode: "info" | "private" | "public") => {
    if (!result) return

    if (mode === "info") {
      setResult(null)
      setImage(null)
      setSelectedFile(null)
      setTemporaryPhotoUrl(null)
      setNickname("")
      return
    }

    if (!temporaryPhotoUrl) {
      alert("Photo upload is missing. Please retry.")
      return
    }

    setSaving(true)
    try {
      const location = await getCurrentLocation()
      if (location) {
        await updateMyLocation(location)
      }

      await createPost({
        photoUrl: temporaryPhotoUrl,
        plantCommonName: result.identification.commonName,
        nickname,
        privacyStatus: mode,
        location,
        careInfo: {
          watering: result.careRecommendations.watering,
          pruning: result.careRecommendations.pruning,
          light: result.careRecommendations.light,
          humidity: result.careRecommendations.humidity,
          toxicity: result.careRecommendations.toxicity,
        },
      })

      router.push(mode === "public" ? "/blooming" : "/garden")
    } catch (error) {
      console.error(error)
      alert("Failed to save this plant post.")
    } finally {
      setSaving(false)
    }
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
                 <div className="p-3 bg-secondary rounded-lg">
                   <p className="font-bold text-primary mb-1">Pruning</p>
                   <p>{result.careRecommendations.pruning}</p>
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
            <h3 className="font-bold mb-4">Ne yapmak istersin?</h3>
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

               <Button
                 variant="outline"
                 onClick={() => handleFinish("info")}
                 className="w-full h-11"
                 disabled={saving}
               >
                 <BookOpen className="mr-2" /> Sadece Bilgi Al
               </Button>

               <Button
                 variant="secondary"
                 onClick={() => handleFinish("private")}
                 className="w-full h-11"
                 disabled={saving}
               >
                 <Lock className="mr-2" /> Save to My Garden (Private)
               </Button>

               <Button
                 onClick={() => handleFinish("public")}
                 className="w-full h-12 text-lg"
                 disabled={saving}
               >
                 {saving ? <Loader2 className="mr-2 animate-spin" /> : <Globe className="mr-2" />}
                 Share to Blooming (Global)
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