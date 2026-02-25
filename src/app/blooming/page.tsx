"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/Navigation"
import { PostCard } from "@/components/PostCard"
import { Post } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFreshPublicPosts, getNearbyPublicPosts, getTrendingPublicPosts } from "@/lib/firestore"

type FeedTab = "trending" | "fresh" | "nearby"

export default function BloomingFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FeedTab>("trending")

  const loadPosts = async (activeTab: FeedTab) => {
    setLoading(true)

    try {
      if (activeTab === "trending") {
        setPosts(await getTrendingPublicPosts())
        return
      }

      if (activeTab === "fresh") {
        setPosts(await getFreshPublicPosts())
        return
      }

      const location = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null)
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        )
      })

      if (!location) {
        setPosts([])
        return
      }

      setPosts(await getNearbyPublicPosts(location))
    } catch (error) {
      console.error(error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts(tab)
  }, [tab])

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
        <Tabs value={tab} onValueChange={(value) => setTab(value as FeedTab)} className="mb-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="trending">Yıldız Yağmuru</TabsTrigger>
            <TabsTrigger value="fresh">Yeni Açanlar</TabsTrigger>
            <TabsTrigger value="nearby">Mahalle</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex flex-col space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-96 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            Bu sekmede henüz gönderi yok.
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