import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react'

const RouterContext = createContext({ path: '/', go: (_path: string, _replace = false) => {} })
export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname.replace(/\/$/, '') || '/')
  const previousPath = useRef(path)
  useEffect(() => {
    const onBack = () => setPath(window.location.pathname.replace(/\/$/, '') || '/')
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [])
  useEffect(() => {
    if (previousPath.current === path) return
    previousPath.current = path
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [path])
  function go(next: string, replace = false) {
    if (next !== path) window.history[replace ? 'replaceState' : 'pushState']({}, '', next)
    setPath(next)
  }
  return <RouterContext.Provider value={{ path, go }}>{children}</RouterContext.Provider>
}
export const useRouter = () => useContext(RouterContext)
export function Link({ href = '/', onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { go } = useRouter()
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          !props.target
        ) {
          event.preventDefault()
          go(href)
        }
      }}
    />
  )
}
