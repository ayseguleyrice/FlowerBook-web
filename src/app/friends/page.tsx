"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { Navigation } from "@/components/Navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Check, Search, UserPlus, Clock } from "lucide-react"
import {
  acceptFriendRequest,
  createOrUpdateFriendship,
  getMyFriendships,
  searchUsersByUsername,
  type FriendshipWithUser,
} from "@/lib/firestore"

type SearchResult = {
  uid: string
  username: string
  displayName: string
  avatarUrl: string
}

export default function FriendsPage() {
  const [friendships, setFriendships] = useState<FriendshipWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  const load = async () => {
    try {
      setFriendships(await getMyFriendships())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setSearching(true)
    try {
      setSearchResults(await searchUsersByUsername(searchTerm.trim()))
    } catch (error) {
      console.error(error)
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (uid: string) => {
    try {
      await createOrUpdateFriendship(uid)
      setSentRequests((prev) => new Set([...prev, uid]))
    } catch (error) {
      console.error(error)
    }
  }

  const handleAccept = async (docId: string) => {
    try {
      await acceptFriendRequest(docId)
      await load()
    } catch (error) {
      console.error(error)
    }
  }

  const accepted = friendships.filter((f) => f.status === "accepted")
  const incoming = friendships.filter((f) => f.status === "pending" && f.direction === "received")
  const outgoing = friendships.filter((f) => f.status === "pending" && f.direction === "sent")

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold text-primary italic">Bitki Arkadaşları</h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2">Kullanıcı Bul</p>
            <div className="flex gap-2">
              <Input
                placeholder="Kullanıcı adı ara..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button size="icon" onClick={handleSearch} disabled={searching}>
                <Search size={16} />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {searchResults.map((user) => (
                  <div key={user.uid} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={sentRequests.has(user.uid) ? "secondary" : "default"}
                      onClick={() => handleSendRequest(user.uid)}
                      disabled={sentRequests.has(user.uid)}
                    >
                      {sentRequests.has(user.uid) ? (
                        <Clock size={14} className="mr-1" />
                      ) : (
                        <UserPlus size={14} className="mr-1" />
                      )}
                      {sentRequests.has(user.uid) ? "İstendi" : "Arkadaş Ekle"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friendship tabs */}
        <Tabs defaultValue="friends">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="friends">
              Arkadaşlar {accepted.length > 0 && <span className="ml-1 text-primary">({accepted.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="incoming">
              Gelen {incoming.length > 0 && (
                <Badge className="ml-1 h-4 px-1.5 text-[10px]">{incoming.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">Gönderilen</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-3 space-y-2">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))
            ) : accepted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz arkadaşın yok 🌱
              </p>
            ) : (
              accepted.map((f) => (
                <Card key={f.docId}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={f.avatarUrl} />
                      <AvatarFallback>{f.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{f.displayName}</p>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Arkadaş
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="incoming" className="mt-3 space-y-2">
            {incoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Gelen istek yok
              </p>
            ) : (
              incoming.map((f) => (
                <Card key={f.docId}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={f.avatarUrl} />
                      <AvatarFallback>{f.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{f.displayName}</p>
                      <p className="text-xs text-muted-foreground">Arkadaşlık isteği gönderdi</p>
                    </div>
                    <Button size="sm" onClick={() => handleAccept(f.docId)}>
                      <Check size={14} className="mr-1" /> Kabul Et
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-3 space-y-2">
            {outgoing.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Gönderilen istek yok
              </p>
            ) : (
              outgoing.map((f) => (
                <Card key={f.docId}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={f.avatarUrl} />
                      <AvatarFallback>{f.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{f.displayName}</p>
                      <p className="text-xs text-muted-foreground">Onay bekleniyor</p>
                    </div>
                    <Clock size={16} className="text-muted-foreground" />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </main>
  )
}
