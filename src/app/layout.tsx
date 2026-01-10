import './globals.css'

export const metadata = {
  title: 'Mini Game Competitions',
  description: 'Competitive mini games',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

