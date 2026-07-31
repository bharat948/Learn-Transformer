import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeKatex from 'rehype-katex'

export default defineConfig({
  plugins: [
    { 
      enforce: 'pre', 
      ...mdx({ 
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [
          rehypeKatex,
          [rehypePrettyCode, { theme: 'github-dark-dimmed' }]
        ]
      }) 
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
})
