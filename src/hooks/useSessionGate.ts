import { useState, useEffect, useCallback } from 'react'
import { getSubscription, canStartSession, consumeSession, getSessionsUsed, getSessionsRemaining, type PlanType } from '../lib/subscription'

export function useSessionGate() {
  const [plan, setPlan] = useState<PlanType>('free')
  const [blocked, setBlocked] = useState(false)
  const [sessionsUsed, setSessionsUsed] = useState(0)
  const [remaining, setRemaining] = useState(3)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getSubscription().then(async (sub) => {
      setPlan(sub.plan)
      const [used, rem] = await Promise.all([
        getSessionsUsed(),
        getSessionsRemaining(sub.plan),
      ])
      setSessionsUsed(used)
      setRemaining(rem)
      setReady(true)
    })
  }, [])

  const tryStartSession = useCallback(async (): Promise<boolean> => {
    const allowed = await canStartSession(plan)
    if (!allowed) {
      setBlocked(true)
      return false
    }
    await consumeSession()
    const [used, rem] = await Promise.all([
      getSessionsUsed(),
      getSessionsRemaining(plan),
    ])
    setSessionsUsed(used)
    setRemaining(rem)
    return true
  }, [plan])

  const dismissWall = useCallback(() => {
    setBlocked(false)
  }, [])

  return {
    plan,
    blocked,
    sessionsUsed,
    remaining,
    ready,
    tryStartSession,
    dismissWall,
  }
}
