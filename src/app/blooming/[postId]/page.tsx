"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { PostCard } from "@/components/PostCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { addComment, getComments, getPostById } from "@/lib/firestore"
import type { Comment, CommentType, Post } from "@/lib/types"

const commentTypes: CommentType[] = ["question", "advice", "experience"]

export default function BloomingPostDetailPage() {
  const params = useParams<{ postId: string }>()
  const postId = params.postId

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentType, setCommentType] = useState<CommentType>("question")
  const [commentText, setCommentText] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const load = async () => {
    try {
      const [postData, commentsData] = await Promise.all([getPostById(postId), getComments(postId)])
      setPost(postData)
      setComments(commentsData)
    } catch (error) {
      console.error(error)
      setPost(null)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!postId) return
    load()
  }, [postId])

  const grouped = useMemo(() => {
    const roots = comments.filter((comment: Comment) => !comment.parentCommentId)
    const byParent = comments.reduce<Record<string, Comment[]>>((acc: Record<string, Comment[]>, comment: Comment) => {
      if (!comment.parentCommentId) return acc
      if (!acc[comment.parentCommentId]) acc[comment.parentCommentId] = []
      acc[comment.parentCommentId].push(comment)
      return acc
    }, {})

    return { roots, byParent }
  }, [comments])

  const onSubmitComment = async () => {
    if (!commentText.trim()) return

    setSending(true)
    try {
      await addComment({
        postId,
        text: commentText.trim(),
        type: commentType,
        parentCommentId: replyTo,
      })
      setCommentText("")
      setReplyTo(null)
      await load()
    } catch (error) {
      console.error(error)
      alert("Yorum gönderilemedi. Arkadaşlık yetkiniz veya giriş durumunuzu kontrol edin.")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/blooming">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <h1 className="font-bold text-primary italic">Blooming Thread</h1>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {loading ? (
          <div className="h-96 rounded-xl bg-muted animate-pulse" />
        ) : !post ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Gönderi bulunamadı.
            </CardContent>
          </Card>
        ) : (
          <>
            <PostCard post={post} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Forum Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {commentTypes.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      size="sm"
                      variant={commentType === type ? "default" : "outline"}
                      onClick={() => setCommentType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                {replyTo && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setReplyTo(null)}>
                    Yanıt modu aktif (kaldırmak için dokun)
                  </Badge>
                )}

                <Textarea
                  placeholder="Bitki hakkında soru, öneri veya deneyimini yaz..."
                  value={commentText}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setCommentText(event.target.value)}
                />

                <Button onClick={onSubmitComment} disabled={sending} className="w-full">
                  <Send className="mr-2" size={14} />
                  Yorumu Gönder
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Accordion type="single" collapsible>
                  {grouped.roots.map((comment: Comment) => (
                    <AccordionItem key={comment.commentId} value={comment.commentId}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.authorName}</span>
                          <Badge variant="outline" className="capitalize">{comment.type}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm mb-3">{comment.text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mb-3"
                          onClick={() => setReplyTo(comment.commentId)}
                        >
                          Yanıtla
                        </Button>

                        <div className="space-y-2 pl-3 border-l">
                          {(grouped.byParent[comment.commentId] || []).map((reply: Comment) => (
                            <div key={reply.commentId} className="rounded-lg bg-secondary/50 p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold">{reply.authorName}</span>
                                <Badge variant="secondary" className="capitalize text-[10px]">{reply.type}</Badge>
                              </div>
                              <p className="text-xs">{reply.text}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {grouped.roots.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    İlk yorumu sen bırak 🌱
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Navigation />
    </main>
  )
}
