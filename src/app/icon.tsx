import { ImageResponse } from 'next/og'
 
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          padding: '2px',
          background: 'transparent',
          transform: 'rotate(-12deg)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '13px', height: '13px', background: '#10b981', borderRadius: '2px' }} />
        <div style={{ width: '13px', height: '13px', background: '#9234B2', borderRadius: '2px' }} />
        <div style={{ width: '13px', height: '13px', background: '#9234B2', borderRadius: '2px' }} />
        <div style={{ width: '13px', height: '13px', background: '#10b981', borderRadius: '2px' }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
