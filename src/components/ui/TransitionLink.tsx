import { useRef, type AnchorHTMLAttributes, type MouseEvent } from "react"
import { Link, useLocation } from "react-router"
import { useScroll } from "@/hooks/useScroll"
import { useTransition } from "@/hooks/useTransition"
import { preloadRoute } from "@/utils/preload-route"
import { isExternalHref, isSamePage } from "@/utils/links"

interface TransitionLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

// Drop-in for react-router's Link. Click order is non-negotiable (06-TRANSITIONS).
export const TransitionLink = ({ href, onClick, onPointerEnter, onPointerDown, target, children, ...rest }: TransitionLinkProps) => {
  const { pathname } = useLocation()
  const { navigateTo } = useTransition()
  const { scrollToTop } = useScroll()
  const preloaded = useRef(false)

  const preload = () => {
    if (preloaded.current || isExternalHref(href) || isSamePage(pathname, href)) return
    preloaded.current = true
    void preloadRoute(href)
  }

  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (rest.download !== undefined || (target && target !== "_self")) return
    if (isExternalHref(href)) return
    if (isSamePage(pathname, href)) {
      event.preventDefault()
      scrollToTop()
      onClick?.(event)
      return
    }
    event.preventDefault()
    await navigateTo(href)
    onClick?.(event)
  }

  if (isExternalHref(href)) {
    return <a href={href} target={target} onClick={onClick} {...rest}>{children}</a>
  }

  return (
    <Link
      to={href}
      target={target}
      onClick={handleClick}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") preload(); onPointerEnter?.(e) }}
      onPointerDown={(e) => { preload(); onPointerDown?.(e) }}
      {...rest}
    >
      {children}
    </Link>
  )
}
