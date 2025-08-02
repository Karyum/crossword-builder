import '../styles/globals.css'
import type { AppProps } from 'next/app'
import 'antd/dist/antd.css'
import { Space } from 'antd'
import Link from 'next/link'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Space size={10} style={{ margin: 10 }}>
        <Link href="/">
          <a>Builder</a>
        </Link>
        <Link href="/play">
          <a>Play Crossword</a>
        </Link>
        <Link href="/mine">
          <a>Minesweeper</a>
        </Link>
      </Space>
      <div>
        <Component {...pageProps} />
      </div>
    </>
  )
}

export default MyApp
