'use client'
import { useEffect, useRef } from 'react'

interface DataPoint {
    label: string;
    value: number;
}

interface BarChartProps {
    data?: DataPoint[];
    width?: number;
    height?: number;
    color?: string;
    gradient?: boolean;
    animated?: boolean;
    className?: string;
}

export default function BarChart({
    data = [],
    width = 400,
    height = 200,
    color = '#3B82F6',
    gradient = true,
    animated = true,
    className = ''
}: BarChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !data.length) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1

        // Set canvas size
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        ctx.scale(dpr, dpr)

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        if (data.length === 0) return

        // Calculate dimensions
        const padding = 20
        const chartWidth = width - padding * 2
        const chartHeight = height - padding * 2

        // Find max value
        const maxValue = Math.max(...data.map(d => d.value))
        const barWidth = chartWidth / data.length * 0.8
        const barSpacing = chartWidth / data.length * 0.2

        // Animation function
        let progress = animated ? 0 : 1

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            data.forEach((item, index) => {
                const barHeight = (item.value / maxValue) * chartHeight * progress
                const x = padding + index * (barWidth + barSpacing)
                const y = height - padding - barHeight

                // Create gradient
                if (gradient) {
                    const gradientFill = ctx.createLinearGradient(0, y, 0, height - padding)
                    gradientFill.addColorStop(0, color)
                    gradientFill.addColorStop(1, color + '80')
                    ctx.fillStyle = gradientFill
                } else {
                    ctx.fillStyle = color
                }

                // Draw bar
                ctx.fillRect(x, y, barWidth, barHeight)

                // Draw value label
                if (progress > 0.8) {
                    ctx.fillStyle = '#374151'
                    ctx.font = '12px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText(String(item.value), x + barWidth / 2, y - 5)

                    // Draw label
                    ctx.fillText(item.label, x + barWidth / 2, height - 5)
                }
            })

            if (animated && progress < 1) {
                progress += 0.03
                animationRef.current = requestAnimationFrame(animate)
            }
        }

        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [data, width, height, color, gradient, animated])

    return (
        <div className={`relative ${className}`}>
            <canvas
                ref={canvasRef}
                className="rounded-lg"
                style={{ width, height }}
            />
        </div>
    )
}
