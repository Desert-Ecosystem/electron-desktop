/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './update.css'

function UpdateDialog(): React.JSX.Element {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    window.api
      .getUpdateInfo()
      .then((info) => {
        if (info && typeof info.version === 'string') setVersion(info.version)
      })
      .catch(() => {})
  }, [])

  const handleRestart = async (): Promise<void> => {
    await window.api.confirmUpdateRestart()
  }

  const handleLater = async (): Promise<void> => {
    await window.api.dismissUpdate()
  }

  return (
    <div className="update-container">
      <div className="update-badge">Desert</div>
      <h2>Обновление готово</h2>
      {version && <div className="update-version">Версия {version} уже загружена</div>}
      <div className="update-description">
        Перезапустите приложение, чтобы перейти на новую версию. Это займёт всего пару секунд.
      </div>
      <div className="update-footer">
        <button className="btn btn-cancel" onClick={handleLater}>
          Позже
        </button>
        <button className="btn btn-primary" onClick={handleRestart}>
          Перезапустить
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<UpdateDialog />)
