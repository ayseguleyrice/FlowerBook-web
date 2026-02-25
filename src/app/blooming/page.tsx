"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/Navigation"
import { PostCard } from "@/components/PostCard"
import { Post } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function BloomingFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated fetching of public posts sorted by trending score
    // Score = (TotalStars) / (HoursSincePost + 2)
    const mockPosts: Post[] = [
      {
        postId: "1",
        ownerId: "u1",
        ownerName: "CactusChris",
        ownerAvatar: "https://picsum.photos/seed/user-cactus/100/100",
        photoUrl: "https://picsum.photos/seed/plant-c/600/600",
        plantName: "Saguaro Cactus",
        nickname: "Spiky",
        privacyStatus: "public",
        timestamp: Date.now() - 3600000,
        starSum: 45,
        starCount: 10,
        trendingScore: 4.5,
        location: { latitude: 0, longitude: 0 }
      },
      {
        postId: "2",
        ownerId: "u2",
        ownerName: "FernFanatic",
        ownerAvatar: "https://picsum.photos/seed/user-fern/100/100",
        photoUrl: "https://picsum.photos/seed/plant-f/600/600",
        plantName: "Boston Fern",
        nickname: "Bosty",
        privacyStatus: "public",
        timestamp: Date.now() - 7200000,
        starSum: 30,
        starCount: 8,
        trendingScore: 3.2,
      },
       {
        postId: "3",
        ownerId: "u3",
        ownerName: "LillyLover",
        ownerAvatar: "https://picsum.photos/seed/user-lilly/100/100",
        photoUrl: "https://picsum.photos/seed/plant-l/600/600",
        plantName: "Peace Lily",
        nickname: "Shantih",
        privacyStatus: "public",
        timestamp: Date.now() - 14400000,
        starSum: 80,
        starCount: 18,
        trendingScore: 5.8,
      }
    ].sort((a, b) => b.trendingScore - a.trendingScore)

    setPosts(mockPosts)
    setLoading(false)
  }, [])

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border">
        <h1 className="text-xl font-bold text-primary italic">Blooming</h1>
        <div className="flex items-center space-x-2">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
             <MapPin size={20} />
           </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
             <Search size={20} />
           </Button>
        </div>
      </header>

      <div className="px-4 py-4 max-w-md mx-auto">
        {loading ? (
          <div className="flex flex-col space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-96 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.postId} post={post} />
          ))
        )}
      </div>

      <Navigation />
    </main>
  )
}