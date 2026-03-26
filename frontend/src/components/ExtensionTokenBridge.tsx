import { useEffect } from 'react'
import { useAuth } from '../AuthContext'

export default function ExtensionTokenBridge() {
  const { accessToken } = useAuth()

  useEffect(() => {
    const origin = window.location.origin

    if (accessToken) {
      window.postMessage(
        {
          type: 'METRO_EXTENSION_SET_TOKEN',
          token: accessToken,
        },
        origin,
      )
      return
    }

    window.postMessage(
      {
        type: 'METRO_EXTENSION_CLEAR_TOKEN',
      },
      origin,
    )
  }, [accessToken])

  return null
}
