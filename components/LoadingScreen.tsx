'use client'

export default function LoadingScreen() {
  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-50 via-white to-purple-50 flex items-center justify-center z-50">
        <div className="relative w-full h-full overflow-hidden">
          {/* Floating Music Notes */}
          {Array.from({ length: 12 }).map((_, i) => {
            const delay = i * 0.3
            const left = 10 + (i % 4) * 25
            const duration = 3 + (i % 3) * 0.5
            
            return (
              <div
                key={i}
                className="absolute text-4xl opacity-70"
                style={{
                  left: `${left}%`,
                  bottom: '-10%',
                  animation: `floatUp ${duration}s ease-out ${delay}s forwards`,
                  color: i % 3 === 0 ? '#3B82F6' : i % 3 === 1 ? '#8B5CF6' : '#EC4899',
                }}
              >
                {i % 2 === 0 ? '♪' : '♫'}
              </div>
            )
          })}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

