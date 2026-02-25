"use client"

import { useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Leaf, History, Sparkles, Droplets } from "lucide-react"
import Image from "next/image"

export default function MyGarden() {
  const [happiness] = useState(85)
  
  const myPlants = [
    { id: 1, name: "Monstera Deliciosa", nickname: "Monty", image: "https://picsum.photos/seed/plant1/200/200", status: "Healthy" },
    { id: 2, name: "Snake Plant", nickname: "Sly", image: "https://picsum.photos/seed/plant2/200/200", status: "Needs Water" },
    { id: 3, name: "Pothos", nickname: "Ivy", image: "https://picsum.photos/seed/plant3/200/200", status: "Growing" },
    { id: 4, name: "Fiddle Leaf Fig", nickname: "Figgy", image: "https://picsum.photos/seed/plant4/200/200", status: "Healthy" },
  ]

  return (
    <main className="min-h-screen bg-background pb-24 px-4 py-8">
      <header className="mb-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-primary italic mb-4">My Garden</h1>
        
        <Card className="w-full max-w-sm bg-card/50 border-none shadow-md overflow-hidden">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="relative w-16 h-16 mb-2">
               <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
               <div className="relative bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center">
                 <Leaf className="text-primary" size={32} />
               </div>
            </div>
            <h3 className="font-bold">Garden Happiness</h3>
            <div className="w-full mt-2 space-y-1">
              <Progress value={happiness} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>0%</span>
                <span className="text-primary font-bold">{happiness}%</span>
                <span>100%</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Based on your care frequency</p>
          </CardContent>
        </Card>
      </header>

      <section className="max-w-md mx-auto relative px-2">
        {/* Shelf Background Logic */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-12">
          {myPlants.map((plant, idx) => (
            <div key={plant.id} className="relative group">
              {/* Wooden Shelf Indicator */}
              <div className="absolute -bottom-4 left-0 right-0 h-4 bg-[#8B4513] rounded-sm shadow-md shelf-gradient" />
              
              <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Image src={plant.image} alt={plant.name} fill className="object-cover" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-sm text-white">
                  <p className="text-xs font-bold truncate">{plant.nickname}</p>
                  <p className="text-[8px] opacity-80 truncate">{plant.name}</p>
                </div>
                {plant.status === "Needs Water" && (
                   <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1 text-white animate-bounce">
                     <Droplets size={12} />
                   </div>
                )}
              </div>
              
              <div className="mt-6 flex flex-col items-center">
                <Badge variant={plant.status === "Needs Water" ? "destructive" : "secondary"} className="text-[8px] px-1 h-4">
                  {plant.status}
                </Badge>
                <div className="flex mt-1 space-x-1">
                   <button className="p-1 rounded-full bg-primary/5 hover:bg-primary/20 transition-colors">
                     <History size={14} className="text-primary" />
                   </button>
                   <button className="p-1 rounded-full bg-primary/5 hover:bg-primary/20 transition-colors">
                     <Sparkles size={14} className="text-primary" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Navigation />
    </main>
  )
}