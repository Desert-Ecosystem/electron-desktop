/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './picker.css'

interface Source {
  id: string
  name: string
  thumbnailDataUrl: string
}

function ScreenSharePicker(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'screen' | 'window'>('screen')
  const [sources, setSources] = useState<Source[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [includeAudio, setIncludeAudio] = useState(false)

  const loadSources = async (): Promise<void> => {
    try {
      const allSources = await window.api.getSources()
      if (Array.isArray(allSources)) {
        setSources(allSources as Source[])
      } else if (allSources && typeof allSources === 'object' && 'error' in allSources) {
        console.error('No screen permission:', allSources)
      }
    } catch (error) {
      console.error('Failed to load sources:', error)
    }
  }

  useEffect(() => {
    void loadSources()
  }, [])

  const handleSelect = async (): Promise<void> => {
    if (selectedSource) {
      await window.api.selectSource(selectedSource, includeAudio)
    }
  }

  const handleCancel = async (): Promise<void> => {
    await window.api.cancelPicker()
  }

  const filteredSources = sources.filter((source) => {
    if (activeTab === 'screen') {
      return source.name.includes('Entire Screen') || source.name.includes('Screen')
    }
    return !source.name.includes('Entire Screen') && !source.name.includes('Screen')
  })

  return (
    <div className="picker-container">
      <div className="picker-header">
        <h2>Выберите источник для демонстрации</h2>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'screen' ? 'active' : ''}`}
          onClick={() => setActiveTab('screen')}
        >
          Экраны
        </button>
        <button
          className={`tab ${activeTab === 'window' ? 'active' : ''}`}
          onClick={() => setActiveTab('window')}
        >
          Окна
        </button>
      </div>

      <div className="sources-grid">
        {filteredSources.map((source) => (
          <div
            key={source.id}
            className={`source-item ${selectedSource === source.id ? 'selected' : ''}`}
            onClick={() => setSelectedSource(source.id)}
          >
            <img src={source.thumbnailDataUrl} alt={source.name} />
            <div className="source-name">{source.name}</div>
          </div>
        ))}
      </div>

      <div className="picker-footer">
        <div className="audio-toggle">
          <label>
            <input
              type="checkbox"
              checked={includeAudio}
              onChange={(e) => setIncludeAudio(e.target.checked)}
            />
            <span>Включить системное аудио</span>
          </label>
        </div>

        <div className="actions">
          <button className="btn btn-cancel" onClick={handleCancel}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSelect} disabled={!selectedSource}>
            Поделиться
          </button>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<ScreenSharePicker />)
