import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Thomas Cook Sales Command Center',
  description: 'Corporate Travel Sales Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}