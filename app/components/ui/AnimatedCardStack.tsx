"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Target, Zap, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Card {
  id: number
  contentType: 1 | 2 | 3
}

const cardData = {
  1: {
    title: "Die Vision",
    description: "Die Zukunft des kollektiven Unternehmertums schmieden.",
    gradient: "from-amber-500 via-yellow-600 to-orange-700",
    icon: Sparkles,
    font: "font-serif italic",
  },
  2: {
    title: "DIE STRATEGIE",
    description: "Institutionelles Risikomanagement für die Gemeinschaft.",
    gradient: "from-blue-600 via-indigo-600 to-violet-700",
    icon: Target,
    font: "font-sans font-black tracking-tighter",
  },
  3: {
    title: "FORGE.EXE",
    description: "Kapital und Skills in hochprofitable Produkte verwandeln.",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    icon: Zap,
    font: "font-mono uppercase tracking-widest",
  },
}

const initialCards: Card[] = [
  { id: 1, contentType: 1 },
  { id: 2, contentType: 2 },
  { id: 3, contentType: 3 },
]

const positionStyles = [
  { scale: 1, y: 0, opacity: 1 },
  { scale: 0.94, y: -25, opacity: 0.6 },
  { scale: 0.88, y: -50, opacity: 0.3 },
]

const exitAnimation = {
  y: 300,
  scale: 0.9,
  opacity: 0,
  transition: { duration: 0.4, ease: "easeOut" }
}

function CardContent({ contentType }: { contentType: 1 | 2 | 3 }) {
  const data = cardData[contentType]
  const Icon = data.icon

  return (
    <div className="flex h-full w-full flex-col p-6 text-white relative overflow-hidden group">
      {/* Background Gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", data.gradient)} />
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 industrial-texture opacity-20 group-hover:scale-110 transition-transform duration-700" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/30">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className={cn("text-3xl sm:text-4xl mb-3", data.font)}>
            {data.title}
          </h3>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-[80%]">
            {data.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <span>Protokoll lesen</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}

function AnimatedCard({
  card,
  index,
  isAnimating,
}: {
  card: Card
  index: number
  isAnimating: boolean
}) {
  const style = positionStyles[index] ?? positionStyles[2]
  const zIndex = index === 0 && isAnimating ? 10 : 3 - index

  return (
    <motion.div
      key={card.id}
      initial={{ y: -50, scale: 0.8, opacity: 0 }}
      animate={{ y: style.y, scale: style.scale, opacity: style.opacity }}
      exit={exitAnimation as any}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      style={{
        zIndex,
        left: "50%",
        x: "-50%",
        bottom: 40,
      }}
      className="absolute flex h-[320px] w-[300px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl will-change-transform sm:w-[480px] glass-card"
    >
      <CardContent contentType={card.contentType} />
    </motion.div>
  )
}

export default function AnimatedCardStack() {
  const [cards, setCards] = useState(initialCards)
  const [isAnimating, setIsAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)

  const handleAnimate = () => {
    if (isAnimating) return
    setIsAnimating(true)

    const nextContentType = ((cards[2].contentType % 3) + 1) as 1 | 2 | 3

    setCards([...cards.slice(1), { id: nextId, contentType: nextContentType }])
    setNextId((prev) => prev + 1)
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 400)
  }

  return (
    <div className="flex w-full flex-col items-center justify-center py-12">
      <div className="relative h-[420px] w-full overflow-hidden sm:w-[600px]">
        <AnimatePresence initial={false}>
          {cards.slice(0, 3).map((card, index) => (
            <AnimatedCard key={card.id} card={card} index={index} isAnimating={isAnimating} />
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-20 mt-12">
        <button
          onClick={handleAnimate}
          className="btn-shimmer flex h-12 cursor-pointer select-none items-center justify-center gap-3 overflow-hidden rounded-full bg-[var(--foreground)] px-8 text-sm font-bold uppercase tracking-widest text-[var(--background)] transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          Nächstes Level schmieden
          <Zap className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  )
}
