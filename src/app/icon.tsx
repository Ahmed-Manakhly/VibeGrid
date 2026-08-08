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
        }}
      >
        <div style={{ width: '13px', height: '13px', background: '#00BFFF', borderTopLeftRadius: '100%' }} />
        <div style={{ width: '13px', height: '13px', background: '#00BFFF', borderTopRightRadius: '3px' }} />
        <div style={{ width: '13px', height: '13px', background: '#00BFFF', borderBottomLeftRadius: '3px' }} />
        <div style={{ width: '13px', height: '13px', background: '#D946EF', borderBottomRightRadius: '100%' }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
