// Chrome / Android / desktop Chrome: the event that lets the app show its own install button
export type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export type InstallPlatform = "prompt" | "ios" | null
