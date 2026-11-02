import * as esbuild from 'esbuild'
import path from 'node:path'
await esbuild.build({
  entryPoints: [process.env.ENTRY],
  bundle: true,
  outfile: process.env.OUT,
  platform: 'node', format: 'esm', target: 'node22', jsx: 'automatic',
  packages: 'external', mainFields: ['module','main'], conditions: ['node','import','require','default'],
  alias: { '@': path.resolve('src') },
  plugins: [{
    name: 'stub-auth',
    setup(b) {
      b.onResolve({ filter: /^@\/auth$/ }, () => ({ path: 'auth-stub', namespace: 'authstub' }))
      b.onLoad({ filter: /.*/, namespace: 'authstub' }, () => ({ contents: `
        import { PrismaClient } from '@prisma/client'
        const p = new PrismaClient()
        let cached = null
        export async function getCurrentUser() {
          if (!cached) cached = await p.user.findUnique({ where: { email: process.env.HARNESS_EMAIL || 'admin@stayora.com' } })
          return cached
        }
        export async function auth() { return { user: { email: process.env.HARNESS_EMAIL } } }
        export const handlers = {}, signIn = async () => {}, signOut = async () => {}
      `, resolveDir: path.resolve('.') }))
      b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'nav-stub', namespace: 'navstub' }))
      b.onLoad({ filter: /.*/, namespace: 'navstub' }, () => ({ contents: `
        export function usePathname(){return '/'}
        export function useRouter(){return {push(){},replace(){},refresh(){},back(){}}}
        export function useSearchParams(){return new URLSearchParams()}
        export function redirect(u){const e=new Error('REDIRECT:'+u);e.digest='REDIRECT';throw e}
        export function notFound(){const e=new Error('NOT_FOUND');e.digest='NOT_FOUND';throw e}
      `, resolveDir: path.resolve('.') }))
    }
  }],
  logLevel: 'error',
})
console.log('bundled')
