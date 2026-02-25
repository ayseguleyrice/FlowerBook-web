"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, MessageCircle, MoreVertical, MapPin, Share2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Post } from "@/lib/types"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [rating, setRating] = useState([0])
  const [showParticles, setShowParticles] = useState(false)

  const handleRatingChange = (val: number[]) => {
    setRating(val)
    if (val[0] === 5) {
      triggerParticles()
    }
  }

  const triggerParticles = () => {
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 2000)
  }

  return (
    <Card className="max-w-md mx-auto mb-6 border-none shadow-md bg-card overflow-hidden">
      <CardHeader className="flex flex-row items-center space-x-3 p-4">
        <Avatar className="h-10 w-10 border border-primary/20">
          <AvatarImage src={post.ownerAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {post.ownerName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col">
          <span className="text-sm font-bold leading-none">{post.ownerName}</span>
          {post.location && (
            <div className="flex items-center text-[10px] text-muted-foreground mt-1">
              <MapPin className="h-2 w-2 mr-1" />
              <span>Nearby</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <div className="relative aspect-square w-full">
        <Image 
          src={post.photoUrl} 
          alt={post.plantName} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 450px"
        />
        {showParticles && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
             {[...Array(12)].map((_, i) => (
               <div 
                 key={i} 
                 className="petal-animation" 
                 style={{ 
                   left: `${Math.random() * 100}%`,
                   top: `-10%`,
                   animationDelay: `${Math.random() * 0.5}s`,
                   backgroundColor: i % 2 === 0 ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                   width: '8px',
                   height: '8px',
                   borderRadius: '50% 0 50% 0'
                 }} 
               />
             ))}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
              {post.plantName}
            </Badge>
            {post.nickname && (
              <Badge variant="outline" className="border-primary/20 italic">
                "{post.nickname}"
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-primary">
            <Star className="h-3 w-3 fill-primary" />
            <span>{(post.starSum / (post.starCount || 1)).toFixed(1)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
             <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-1">Rate this plant</p>
                <Slider 
                  max={5} 
                  step={1} 
                  value={rating} 
                  onValueChange={handleRatingChange}
                  className="w-full"
                />
             </div>
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
               {rating[0]}
             </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="h-8 px-2 space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Comment</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {new Date(post.timestamp).toLocaleDateString()}
        </span>
      </CardFooter>
    </Card>
  )
}