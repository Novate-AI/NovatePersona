import { createContext, useContext, useState, useEffect } from 'react'
import {
  getDuixConfigFromStorage,
} from '../services/duixAvatar'

interface DuixContextValue {
  duixChecked: boolean
  duixEnabled: boolean
  duixVoiceConfigured: boolean
  /** Call after saving voice config in Avatar settings so status updates without refresh */
  refreshDuixStatus: () => void
}

const DuixContext = createContext<DuixContextValue>({
  duixChecked: false,
  duixEnabled: false,
  duixVoiceConfigured: false,
  refreshDuixStatus: () => { },
})

export function DuixProvider({ children }: { children: React.ReactNode }) {
  const [duixChecked, setDuixChecked] = useState(false)
  const [duixEnabled, setDuixEnabled] = useState(false)
  const [duixVoiceConfigured, setDuixVoiceConfigured] = useState(false)

  const refreshDuixStatus = () => {
    const saved = getDuixConfigFromStorage()
    setDuixVoiceConfigured(!!(saved?.referenceAudioUrl?.trim() && saved?.referenceText?.trim()))
  }

  useEffect(() => {
    // Duix integration disabled by default to prevent proxy errors.
    setDuixChecked(true)
    setDuixEnabled(false)
    setDuixVoiceConfigured(false)
  }, [])

  return (
    <DuixContext.Provider value={{ duixChecked, duixEnabled, duixVoiceConfigured, refreshDuixStatus }}>
      {children}
    </DuixContext.Provider>
  )
}

export function useDuix() {
  return useContext(DuixContext)
}
