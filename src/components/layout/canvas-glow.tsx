'use client';

export function CanvasGlow() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top-right purple ambient */}
      <div
        className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Bottom-left blue ambient */}
      <div
        className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.09) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
    </div>
  );
}
