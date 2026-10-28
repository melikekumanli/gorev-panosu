import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
const pipelineDemo: string = 123

type Task = {
  id: string
  title: string
  completed: boolean
}

type Filter = 'all' | 'active' | 'completed'

const STORAGE_KEY = 'gorev-panosu.tasks.v1'

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'completed' in value &&
    typeof value.completed === 'boolean'
  )
}

function loadTasks(): { tasks: Task[]; warning: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved === null) {
      return { tasks: [], warning: '' }
    }

    const parsed: unknown = JSON.parse(saved)

    if (!Array.isArray(parsed) || !parsed.every(isTask)) {
      throw new Error('Geçersiz kayıt')
    }

    const ids = new Set(parsed.map((task) => task.id))

    if (ids.size !== parsed.length) {
      throw new Error('Tekrarlanan kimlik')
    }

    return { tasks: parsed, warning: '' }
  } catch {
    return {
      tasks: [],
      warning:
        'Kayıtlı görevler okunamadı. Boş listeyle başlandı; yeni bir işlem kaydı değiştirebilir.',
    }
  }
}

function App() {
  const [initialData] = useState(loadTasks)
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks)
  const [storageWarning, setStorageWarning] = useState(initialData.warning)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  function updateTasks(nextTasks: Task[]) {
    setTasks(nextTasks)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks))
      setStorageWarning('')
    } catch {
      setStorageWarning(
        'Değişiklikler tarayıcıya kaydedilemedi. Sayfayı kapatırsan son değişiklikler kaybolabilir.',
      )
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanTitle = title.trim()

    if (!cleanTitle) {
      setError('Lütfen bir görev başlığı yaz.')
      return
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      completed: false,
    }

    updateTasks([...tasks, newTask])
    setTitle('')
    setError('')
  }

  function toggleTask(id: string) {
    updateTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task,
      ),
    )
  }

  function deleteTask(id: string) {
    updateTasks(tasks.filter((task) => task.id !== id))
  }

  const activeCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.length - activeCount

  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tümü' },
    { value: 'active', label: 'Aktif' },
    { value: 'completed', label: 'Tamamlanan' },
  ]

  return (
    <main className="app">
      <header className="page-header">
        <span className="eyebrow">CI/CD ÖĞRENME PROJESİ</span>
        <h1>Görev Panosu</h1>
        <p>Küçük adımlar, tamamlanan işler.</p>
      </header>

      <section className="card" aria-labelledby="add-heading">
        <h2 id="add-heading">Yeni görev</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="task-title">Görev başlığı</label>

          <div className="form-row">
            <input
              id="task-title"
              name="title"
              type="text"
              placeholder="Örneğin: İlk pipeline’ımı oluştur"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={error !== ''}
              aria-describedby={error ? 'task-error' : undefined}
            />

            <button className="primary-button" type="submit">
              Ekle
            </button>
          </div>

          {error && (
            <p className="error" id="task-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>

      {storageWarning && (
        <p className="warning" role="alert">
          {storageWarning}
        </p>
      )}

      <section className="card" aria-labelledby="tasks-heading">
        <div className="section-heading">
          <h2 id="tasks-heading">Görevlerim</h2>
          <span className="counter">{activeCount} aktif görev</span>
        </div>

        <div className="filters" role="group" aria-label="Görev filtreleri">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visibleTasks.length === 0 ? (
          <div className="empty-state">
            <p>
              {tasks.length === 0
                ? 'Henüz görev yok. İlk görevini ekle!'
                : 'Bu filtrede gösterilecek görev yok.'}
            </p>
          </div>
        ) : (
          <ul className="task-list">
            {visibleTasks.map((task) => (
              <li className="task-item" key={task.id}>
                <label className="task-label">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />

                  <span className={task.completed ? 'completed' : ''}>
                    {task.title}
                  </span>
                </label>

                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`${task.title} görevini sil`}
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="list-footer">
          <span>{tasks.length} toplam görev</span>
          <span>{completedCount} tamamlanan</span>
        </footer>
      </section>

      <p className="storage-note">
        Görevlerin bu tarayıcıda saklanır.
      </p>
    </main>
  )
}

export default App