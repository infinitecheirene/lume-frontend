"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

const FAQ_DATA = [
  {
    question: "What type of establishment is Lumè Bean and Bar?",
    answer:
      "Lumè Bean and Bar is a premium coffee shop and bar specializing in artisan coffee, craft cocktails, and a curated selection of pastries and light bites. Our name reflects our commitment to quality beans and exceptional beverages.",
  },
  {
    question: "What are your operating hours?",
    answer:
      "Our operating hours are Monday to Friday from 7:00 AM to 12:00 AM, Saturday from 8:00 AM to 1:00 AM, and Sunday from 8:00 AM to 11:00 PM.",
  },
  {
    question: "Do you offer vegetarian or vegan options?",
    answer:
      "Yes! We offer vegetarian and vegan options including plant-based pastries, dairy-free lattes, vegetable-based light bites, and various coffee alternatives.",
  },
  {
    question: "What makes Lumè Bean and Bar special?",
    answer:
      "Lumè Bean and Bar stands out with our commitment to artisan coffee roasting, premium ingredients, and a cozy atmosphere perfect for any time of day. Whether you're starting your morning or enjoying an evening cocktail, we provide an exceptional experience.",
  },
  {
    question: "Do you take reservations?",
    answer:
      "Yes, we accept reservations! You can book a table through our website or contact us directly. We recommend reservations for evening dining and special occasions.",
  },
  {
    question: "What are your signature items?",
    answer:
      "Our signature items include our house-roasted coffee blends, craft cocktails, artisanal pastries, and specialty lattes. Each drink is crafted with precision and the finest ingredients.",
  },
]

export default function CustomerServiceChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChatEnded, setIsChatEnded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0 && !isChatEnded) {
      setTimeout(() => {
        addBotMessage("Hello! Welcome to Lumè Bean and Bar! Please select a question below to get started.")
      }, 500)
    }
  }, [isOpen])

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isTyping])

  const addBotMessage = (text: string) => {
    const messageId = Date.now().toString()
    const newMessage: Message = {
      id: messageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])

    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, text: text.substring(0, currentIndex + 1) } : msg)),
        )
        currentIndex++
      } else {
        clearInterval(typingInterval)
      }
    }, 60)
  }

  const handleEndChat = () => {
    setIsTyping(true)
    setTimeout(() => {
      addBotMessage(
        "Thank you for chatting with Lumè Bean and Bar! This conversation has ended. If you have more questions, please start a new chat. We hope to serve you soon!",
      )
      setIsTyping(false)
      setIsChatEnded(true)
    }, 2000)
  }

  const handleNewChat = () => {
    setMessages([])
    setIsChatEnded(false)
    setTimeout(() => {
      addBotMessage(
        "Hello! Welcome back to Lumè Bean and Bar! Please select a question below to get started.",
      )
    }, 500)
  }

  const handleFAQClick = (question: string, answer: string) => {
    if (isChatEnded) return

    const questionMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, questionMessage])

    setIsTyping(true)
    setTimeout(() => {
      addBotMessage(answer)
      setIsTyping(false)
    }, 2000)
  }

  return (
    <>
      {/* Floating Button - Crimson themed */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl bg-gradient-to-r from-[#d4a24c] to-[#8b4513] hover:from-[#e0b060] hover:to-[#a0522d] z-50 transition-all duration-300 hover:scale-110"
          size="icon"
        >
          <MessageCircle className="h-7 w-7 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[500px] h-[85vh] md:h-[600px] max-h-[700px] shadow-2xl z-50 flex flex-col border-[#d4a24c]/20 rounded-t-2xl md:rounded-2xl overflow-hidden p-0 bg-white">
          {/* Header - Crimson gradient */}
          <CardHeader className="bg-gradient-to-r from-[#d4a24c] to-[#8b4513] text-white flex flex-row items-center justify-between p-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Customer Service</CardTitle>
                <p className="text-xs text-white/90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Lumè Bean and Bar
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-3">
                <div className="space-y-3 pb-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          message.sender === "user"
                            ? "bg-gradient-to-r from-[#d4a24c] to-[#8b4513] text-white rounded-tr-sm"
                            : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p
                          className={`text-[10px] mt-1.5 ${
                            message.sender === "user" ? "text-white/80" : "text-gray-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-200">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[#d4a24c] rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Quick Replies Section */}
            {!isChatEnded && (
              <div className="border-t-2 border-gray-200 bg-white px-4 py-3 flex-shrink-0">
                <p className="text-[11px] font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Quick replies:</p>
                <div className="max-h-[140px] overflow-y-auto">
                  <div className="flex flex-wrap gap-2 pr-1">
                    {FAQ_DATA.map((faq, index) => (
                      <button
                        key={index}
                        onClick={() => handleFAQClick(faq.question, faq.answer)}
                        disabled={isTyping}
                        className="text-[11px] px-3 py-1.5 rounded-full border-2 border-[#d4a24c]/30 text-[#d4a24c] hover:bg-[#d4a24c] hover:text-white hover:border-[#d4a24c] bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-normal text-left leading-snug"
                      >
                        {faq.question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 bg-white flex-shrink-0">
              {!isChatEnded ? (
                <Button
                  onClick={handleEndChat}
                  variant="outline"
                  className="w-full text-sm border-2 border-[#d4a24c]/30 text-[#d4a24c] hover:bg-[#d4a24c] hover:text-white hover:border-[#d4a24c] bg-white font-medium rounded-xl h-10 transition-all duration-200"
                  disabled={isTyping}
                >
                  End Chat
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3 font-medium">Chat has ended</p>
                  <Button
                    onClick={handleNewChat}
                    className="w-full bg-gradient-to-r from-[#d4a24c] to-[#8b4513] hover:from-[#e0b060] hover:to-[#a0522d] text-white font-medium rounded-xl h-10 shadow-md"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
