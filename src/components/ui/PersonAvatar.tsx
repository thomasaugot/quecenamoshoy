import { useState } from "react"
import type { Person } from "@/types/person"
import { logger } from "@/utils/logger"
import { initialOf } from "@/utils/people"

// A person's round face: their photo, or their initial (mine on mustard, the others on sage).
// A photo that fails to load falls back to the initial — never an empty circle — and says why.
export const PersonAvatar = ({ person, className = "h-14 w-14" }: { person: Pick<Person, "name" | "isMe" | "avatarUrl">; className?: string }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const url = person.avatarUrl && person.avatarUrl !== failedUrl ? person.avatarUrl : null

  return url ? (
    <img src={url} alt="" width={112} height={112} decoding="async"
      onError={() => { logger.error("avatar failed to load", url.split("?")[0]); setFailedUrl(url) }}
      className={`shrink-0 rounded-full object-cover shadow-sm ${className}`} />
  ) : (
    <span aria-hidden="true"
      className={`text-voice-lg flex shrink-0 items-center justify-center rounded-full ${person.isMe ? "bg-highlight text-on-highlight" : "bg-sage-soft text-text"} ${className}`}>
      {initialOf(person.name)}
    </span>
  )
}
