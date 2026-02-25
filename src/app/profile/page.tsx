"use client"

import { Navigation } from "@/components/Navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Flower, Star, Users, MapPin } from "lucide-react"

export default function ProfilePage() {
  const user = {
    displayName: "Jane Botanist",
    username: "@janeplants",
    avatar: "https://picsum.photos/seed/jane/200/200",
    rank: "Wise Plane Tree",
    totalStars: 1240,
    gardenHappiness: 92,
    location: "Portland, OR"
  }

  return (
    <main className="min-h-screen bg-background pb-24 px-4 py-8">
      <header className="flex justify-end mb-6">
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </header>

      <div className="flex flex-col items-center mb-8">
        <Avatar className="h-32 w-32 border-4 border-white shadow-xl mb-4">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold">{user.displayName}</h2>
        <p className="text-muted-foreground text-sm">{user.username}</p>
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <MapPin size={12} className="mr-1" />
          {user.location}
        </div>
        <Badge className="mt-4 bg-primary text-primary-foreground px-4 py-1 rounded-full">
          {user.rank}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-4 flex flex-col items-center">
            <Star className="text-yellow-500 mb-1" />
            <span className="text-lg font-bold">{user.totalStars}</span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Stars Earned</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-4 flex flex-col items-center">
            <Users className="text-primary mb-1" />
            <span className="text-lg font-bold">42</span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Friend Group</span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg bg-primary/5 max-w-md mx-auto overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Flower className="mr-2 text-primary" size={18} />
            My Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span>Garden Happiness Meter</span>
            <span className="font-bold text-primary">{user.gardenHappiness}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
             <div 
               className="h-full bg-primary" 
               style={{ width: `${user.gardenHappiness}%` }} 
             />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            You're currently in the top 5% of gardeners in your area! Keep nurturing.
          </p>
          <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">
            View Achievements
          </Button>
        </CardContent>
      </Card>

      <Navigation />
    </main>
  )
}