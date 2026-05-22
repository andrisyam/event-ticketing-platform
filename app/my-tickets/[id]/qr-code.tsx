'use client'

import { useEffect, useRef } from 'react'

interface QRCodeDisplayProps {
  value: string
  size?: number
}

export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return
      
      // Dynamic import of qrcode library
      const QRCode = (await import('qrcode')).default
      
      try {
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    }

    generateQR()
  }, [value, size])

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-border">
      <canvas ref={canvasRef} />
    </div>
  )
}
