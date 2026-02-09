'use client'
import { useEffect, useRef } from 'react'

interface DataPoint {
    label: string;
    value: number;
}

interface PieChartProps {
    data?: DataPoint[];
    size?: number;
    colors?: string[];
    animated?: boolean;
    showLabels?: boolean;
    className?: string;
}

export default function PieChart({
    data = [],
    size = 200,
    colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
    animated = true,
    showLabels = true,
    className = ''
}: PieChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !data.length) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1

        // Set canvas size
        canvas.width = size * dpr
        canvas.height = size * dpr
        canvas.style.width = size + 'px'
        canvas.style.height = size + 'px'
        ctx.scale(dpr, dpr)

        // Clear canvas
        ctx.clearRect(0, 0, size, size)

        if (data.length === 0) return

        // Calculate total and center
        const total = data.reduce((sum, item) => sum + item.value, 0)
        const centerX = size / 2
        const centerY = size / 2
        const radius = Math.min(size, size) / 2 - 20

        // Animation function
        let progress = animated ? 0 : 1

        const animate = () => {
            ctx.clearRect(0, 0, size, size)

            let currentAngle = -Math.PI / 2 // Start from top

            data.forEach((item, index) => {
                const sliceAngle = (item.value / total) * 2 * Math.PI * progress
                const color = colors[index % colors.length]

                // Draw slice
                ctx.beginPath()
                ctx.moveTo(centerX, centerY)
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
                ctx.closePath()
                ctx.fillStyle = color
                ctx.fill()

                // Draw border
                ctx.strokeStyle = '#fff'
                ctx.lineWidth = 2
                ctx.stroke()

                // Draw labels
                if (showLabels && progress > 0.8) {
                    const labelAngle = currentAngle + sliceAngle / 2
                    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
                    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)

                    ctx.fillStyle = '#fff'
                    ctx.font = 'bold 12px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText(`${Math.round((item.value / total) * 100)}%`, labelX, labelY)
                }

                currentAngle += sliceAngle
            })

            if (animated && progress < 1) {
                progress += 0.02
                animationRef.current = requestAnimationFrame(animate)
            }
        }

        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [data, size, colors, animated, showLabels])

    return (
        <div className={`relative ${className}`}>
            <canvas
                ref={canvasRef}
                className="rounded-lg"
                style={{ width: size, height: size }}
            />

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
