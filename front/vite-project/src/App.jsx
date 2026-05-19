import { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const abilityLabels = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  constitution: 'Телосложение',
  intelligence: 'Интеллект',
  wisdom: 'Мудрость',
  charisma: 'Харизма'
}

const skillLabels = {
  acrobatics: 'Акробатика',
  animalHandling: 'Уход за животными',
  arcana: 'Магия',
  athletics: 'Атлетика',
  deception: 'Обман',
  history: 'История',
  insight: 'Проницательность',
  intimidation: 'Запугивание',
  investigation: 'Анализ',
  medicine: 'Медицина',
  nature: 'Природа',
  perception: 'Внимательность',
  performance: 'Выступление',
  persuasion: 'Убеждение',
  religion: 'Религия',
  sleightOfHand: 'Ловкость рук',
  stealth: 'Скрытность',
  survival: 'Выживание'
}

const baseCombat = {
  armorClass: 10,
  initiative: 0,
  speed: '30 фт',
  hitPoints: { max: 10, current: 10, temporary: 0 },
  hitDice: '1d8',
  proficiencyBonus: 2,
  inspiration: false
}

function createBlankSheet() {
  return {
    name: 'Новый персонаж',
    system: 'D&D 5.5e',
    class: 'Класс',
    level: 1,
    race: 'Раса',
    background: '',
    alignment: '',
    experience: 0,
    gender: '',
    age: '',
    height: '',
    weight: '',
    size: 'Средний',
    gold: 0,
    abilityScores: {
      strength: { score: 10, modifier: 0 },
      dexterity: { score: 10, modifier: 0 },
      constitution: { score: 10, modifier: 0 },
      intelligence: { score: 10, modifier: 0 },
      wisdom: { score: 10, modifier: 0 },
      charisma: { score: 10, modifier: 0 }
    },
    combat: baseCombat,
    skills: {},
    passiveSenses: {
      passiveInsight: 10,
      passivePerception: 10,
      passiveInvestigation: 10
    },
    savingThrows: {},
    weapons: [],
    classFeatures: [],
    racialFeatures: [],
    feats: [],
    languages: [],
    equipment: [],
    background_description: '',
    subtypeNote: ''
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeSheet(sheet) {
  return {
    ...createBlankSheet(),
    ...sheet,
    abilityScores: sheet.abilityScores || {},
    combat: {
      ...baseCombat,
      ...(sheet.combat || {}),
      hitPoints: {
        ...baseCombat.hitPoints,
        ...(sheet.combat?.hitPoints || {})
      }
    },
    skills: sheet.skills || {},
    savingThrows: sheet.savingThrows || {},
    passiveSenses: sheet.passiveSenses || {},
    weapons: sheet.weapons || [],
    classFeatures: sheet.classFeatures || [],
    racialFeatures: sheet.racialFeatures || [],
    feats: sheet.feats || [],
    languages: sheet.languages || [],
    equipment: sheet.equipment || []
  }
}

function Section({ title, actions, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="section-heading">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', min }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        min={min}
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
      />
    </label>
  )
}

function TextareaField({ label, value, onChange }) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export default function App() {
  const [characters, setCharacters] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadCharacters(nextSelectedId) {
    const response = await fetch(`${API_URL}/characters`)

    if (!response.ok) {
      throw new Error('API не отдал список персонажей')
    }

    const data = await response.json()
    setCharacters(data)

    const id = nextSelectedId || data[0]?.id || null
    setSelectedId(id)
    setDraft(data.find((item) => item.id === id)?.data ? normalizeSheet(data.find((item) => item.id === id).data) : null)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCharacters()
      .then(() => setStatus('ready'))
      .catch((loadError) => {
        setError(loadError.message)
        setStatus('error')
      })
  }, [])

  const character = useMemo(() => {
    return characters.find((item) => item.id === selectedId) || null
  }, [characters, selectedId])

  function selectCharacter(id) {
    const nextCharacter = characters.find((item) => item.id === id)
    setSelectedId(id)
    setDraft(nextCharacter ? normalizeSheet(nextCharacter.data) : null)
    setMessage('')
  }

  function createCharacter() {
    setSelectedId(null)
    setDraft(createBlankSheet())
    setMessage('Создан черновик. Заполни поля и нажми "Сохранить".')
  }

  function updateDraft(updater) {
    setDraft((current) => updater(clone(current)))
  }

  function setField(key, value) {
    updateDraft((next) => {
      next[key] = value
      return next
    })
  }

  function setCombat(key, value) {
    updateDraft((next) => {
      next.combat[key] = value
      return next
    })
  }

  function setHitPoints(key, value) {
    updateDraft((next) => {
      next.combat.hitPoints[key] = value
      return next
    })
  }

  function setAbility(key, field, value) {
    updateDraft((next) => {
      next.abilityScores[key][field] = value
      return next
    })
  }

  function removeAbility(key) {
    updateDraft((next) => {
      delete next.abilityScores[key]
      return next
    })
  }

  function addAbility() {
    updateDraft((next) => {
      const key = `custom_${Date.now()}`
      next.abilityScores[key] = { score: 10, modifier: 0, label: 'Новая характеристика' }
      return next
    })
  }

  function setSkill(key, field, value) {
    updateDraft((next) => {
      next.skills[key][field] = value
      return next
    })
  }

  function removeSkill(key) {
    updateDraft((next) => {
      delete next.skills[key]
      return next
    })
  }

  function addSkill() {
    updateDraft((next) => {
      const key = `customSkill_${Date.now()}`
      next.skills[key] = { modifier: 0, proficient: false, label: 'Новый навык' }
      return next
    })
  }

  function setSavingThrow(key, field, value) {
    updateDraft((next) => {
      next.savingThrows[key][field] = value
      return next
    })
  }

  function removeSavingThrow(key) {
    updateDraft((next) => {
      delete next.savingThrows[key]
      return next
    })
  }

  function addSavingThrow() {
    updateDraft((next) => {
      const key = `customSave_${Date.now()}`
      next.savingThrows[key] = { modifier: 0, proficient: false, label: 'Новый спасбросок' }
      return next
    })
  }

  function setPassiveSense(key, value) {
    updateDraft((next) => {
      next.passiveSenses[key] = value
      return next
    })
  }

  function removePassiveSense(key) {
    updateDraft((next) => {
      delete next.passiveSenses[key]
      return next
    })
  }

  function addPassiveSense() {
    updateDraft((next) => {
      const key = `customSense_${Date.now()}`
      next.passiveSenses[key] = 10
      return next
    })
  }

  function setArrayItem(collection, index, key, value) {
    updateDraft((next) => {
      next[collection][index][key] = value
      return next
    })
  }

  function addArrayItem(collection, item) {
    updateDraft((next) => {
      next[collection].push(item)
      return next
    })
  }

  function removeArrayItem(collection, index) {
    updateDraft((next) => {
      next[collection].splice(index, 1)
      return next
    })
  }

  function setLanguage(index, value) {
    updateDraft((next) => {
      next.languages[index] = value
      return next
    })
  }

  function addLanguage() {
    updateDraft((next) => {
      next.languages.push('Новый язык')
      return next
    })
  }

  function removeLanguage(index) {
    updateDraft((next) => {
      next.languages.splice(index, 1)
      return next
    })
  }

  async function saveCharacter() {
    setMessage('')

    const method = character ? 'PUT' : 'POST'
    const url = character ? `${API_URL}/characters/${character.id}` : `${API_URL}/characters`
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    })
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Не удалось сохранить персонажа')
    }

    await loadCharacters(result.id)
    setMessage('Сохранено в Postgres.')
  }

  async function deleteCharacter() {
    if (!character) {
      setDraft(null)
      setMessage('Черновик удалён.')
      return
    }

    const confirmed = window.confirm(`Удалить "${character.name}" из базы?`)
    if (!confirmed) {
      return
    }

    const response = await fetch(`${API_URL}/characters/${character.id}`, { method: 'DELETE' })
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Не удалось удалить персонажа')
    }

    await loadCharacters()
    setMessage('Персонаж удалён.')
  }

  async function handleAction(action) {
    try {
      setStatus('saving')
      await action()
      setStatus('ready')
    } catch (actionError) {
      setStatus('ready')
      setMessage(actionError.message)
    }
  }

  if (status === 'loading') {
    return <main className="screen-state">Загружаю лист персонажа...</main>
  }

  if (status === 'error') {
    return (
      <main className="screen-state error-state">
        <h1>Не удалось подключиться к API</h1>
        <p>{error}</p>
        <p>Проверь, что Express запущен на порту 3001.</p>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Character vault</p>
          <h1>Листы героев</h1>
        </div>

        <button className="create-button" onClick={createCharacter} type="button">
          + Новый персонаж
        </button>

        <div className="character-list">
          {characters.map((item) => (
            <button
              className={item.id === selectedId ? 'active' : ''}
              key={item.id}
              onClick={() => selectCharacter(item.id)}
              type="button"
            >
              <span>{item.name}</span>
              <small>{item.race} / {item.class}</small>
            </button>
          ))}
        </div>
      </aside>

      <div className="content">
        {!draft ? (
          <main className="screen-state inner-state">Выбери персонажа или создай нового.</main>
        ) : (
          <>
            <header className="editor-hero">
              <div>
                <p className="eyebrow">{character ? 'Редактирование' : 'Новый лист'}</p>
                <h1>{draft.name}</h1>
                <p>{draft.race} / {draft.class}, уровень {draft.level}</p>
              </div>
              <div className="toolbar">
                <button className="save-button" disabled={status === 'saving'} onClick={() => handleAction(saveCharacter)} type="button">
                  {status === 'saving' ? 'Сохраняю...' : 'Сохранить'}
                </button>
                <button className="delete-button" disabled={status === 'saving'} onClick={() => handleAction(deleteCharacter)} type="button">
                  Удалить
                </button>
              </div>
            </header>

            {message && <div className="message">{message}</div>}

            <section className="main-grid editor-grid">
              <Section title="Основное">
                <div className="form-grid">
                  <Field label="Имя" value={draft.name} onChange={(value) => setField('name', value)} />
                  <Field label="Система" value={draft.system} onChange={(value) => setField('system', value)} />
                  <Field label="Класс" value={draft.class} onChange={(value) => setField('class', value)} />
                  <Field label="Уровень" min="1" type="number" value={draft.level} onChange={(value) => setField('level', value)} />
                  <Field label="Раса" value={draft.race} onChange={(value) => setField('race', value)} />
                  <Field label="Предыстория" value={draft.background} onChange={(value) => setField('background', value)} />
                  <Field label="Мировоззрение" value={draft.alignment} onChange={(value) => setField('alignment', value)} />
                  <Field label="Опыт" min="0" type="number" value={draft.experience} onChange={(value) => setField('experience', value)} />
                  <Field label="Пол" value={draft.gender} onChange={(value) => setField('gender', value)} />
                  <Field label="Возраст" value={draft.age} onChange={(value) => setField('age', value)} />
                  <Field label="Рост" value={draft.height} onChange={(value) => setField('height', value)} />
                  <Field label="Вес" value={draft.weight} onChange={(value) => setField('weight', value)} />
                  <Field label="Размер" value={draft.size} onChange={(value) => setField('size', value)} />
                  <Field label="Золото" min="0" type="number" value={draft.gold} onChange={(value) => setField('gold', value)} />
                  <TextareaField label="Описание предыстории" value={draft.background_description} onChange={(value) => setField('background_description', value)} />
                </div>
              </Section>

              <Section title="Боевые статы">
                <div className="form-grid">
                  <Field label="КД" type="number" value={draft.combat.armorClass} onChange={(value) => setCombat('armorClass', value)} />
                  <Field label="Инициатива" type="number" value={draft.combat.initiative} onChange={(value) => setCombat('initiative', value)} />
                  <Field label="Скорость" value={draft.combat.speed} onChange={(value) => setCombat('speed', value)} />
                  <Field label="Кость хитов" value={draft.combat.hitDice} onChange={(value) => setCombat('hitDice', value)} />
                  <Field label="Бонус мастерства" type="number" value={draft.combat.proficiencyBonus} onChange={(value) => setCombat('proficiencyBonus', value)} />
                  <Field label="Хиты сейчас" type="number" value={draft.combat.hitPoints.current} onChange={(value) => setHitPoints('current', value)} />
                  <Field label="Хиты максимум" type="number" value={draft.combat.hitPoints.max} onChange={(value) => setHitPoints('max', value)} />
                  <Field label="Временные хиты" type="number" value={draft.combat.hitPoints.temporary} onChange={(value) => setHitPoints('temporary', value)} />
                </div>
              </Section>

              <Section title="Характеристики" actions={<button className="ghost-button" onClick={addAbility} type="button">Добавить</button>}>
                <div className="editable-list">
                  {Object.entries(draft.abilityScores).map(([key, ability]) => (
                    <div className="editable-row" key={key}>
                      <Field label="Название" value={ability.label || abilityLabels[key] || key} onChange={(value) => setAbility(key, 'label', value)} />
                      <Field label="Значение" type="number" value={ability.score} onChange={(value) => setAbility(key, 'score', value)} />
                      <Field label="Модификатор" type="number" value={ability.modifier} onChange={(value) => setAbility(key, 'modifier', value)} />
                      <button className="row-delete" onClick={() => removeAbility(key)} type="button">Удалить</button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Навыки" actions={<button className="ghost-button" onClick={addSkill} type="button">Добавить</button>}>
                <div className="editable-list">
                  {Object.entries(draft.skills).map(([key, skill]) => (
                    <div className="editable-row" key={key}>
                      <Field label="Название" value={skill.label || skillLabels[key] || key} onChange={(value) => setSkill(key, 'label', value)} />
                      <Field label="Модификатор" type="number" value={skill.modifier} onChange={(value) => setSkill(key, 'modifier', value)} />
                      <label className="check-field">
                        <input checked={skill.proficient} type="checkbox" onChange={(event) => setSkill(key, 'proficient', event.target.checked)} />
                        Владение
                      </label>
                      <button className="row-delete" onClick={() => removeSkill(key)} type="button">Удалить</button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Спасброски" actions={<button className="ghost-button" onClick={addSavingThrow} type="button">Добавить</button>}>
                <div className="editable-list">
                  {Object.entries(draft.savingThrows).map(([key, save]) => (
                    <div className="editable-row" key={key}>
                      <Field label="Название" value={save.label || abilityLabels[key] || key} onChange={(value) => setSavingThrow(key, 'label', value)} />
                      <Field label="Модификатор" type="number" value={save.modifier} onChange={(value) => setSavingThrow(key, 'modifier', value)} />
                      <label className="check-field">
                        <input checked={save.proficient} type="checkbox" onChange={(event) => setSavingThrow(key, 'proficient', event.target.checked)} />
                        Владение
                      </label>
                      <button className="row-delete" onClick={() => removeSavingThrow(key)} type="button">Удалить</button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Пассивные чувства" actions={<button className="ghost-button" onClick={addPassiveSense} type="button">Добавить</button>}>
                <div className="editable-list">
                  {Object.entries(draft.passiveSenses).map(([key, value]) => (
                    <div className="editable-row" key={key}>
                      <Field label="Название" value={key} onChange={(nextKey) => {
                        updateDraft((next) => {
                          const currentValue = next.passiveSenses[key]
                          delete next.passiveSenses[key]
                          next.passiveSenses[nextKey] = currentValue
                          return next
                        })
                      }} />
                      <Field label="Значение" type="number" value={value} onChange={(nextValue) => setPassiveSense(key, nextValue)} />
                      <button className="row-delete" onClick={() => removePassiveSense(key)} type="button">Удалить</button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Оружие" actions={<button className="ghost-button" onClick={() => addArrayItem('weapons', { name: 'Новое оружие', type: '', attackBonus: 0, damage: '', damageType: '', properties: '' })} type="button">Добавить</button>}>
                <div className="editable-list">
                  {draft.weapons.map((weapon, index) => (
                    <div className="editable-row wide-row" key={`${weapon.name}-${index}`}>
                      <Field label="Название" value={weapon.name} onChange={(value) => setArrayItem('weapons', index, 'name', value)} />
                      <Field label="Тип" value={weapon.type} onChange={(value) => setArrayItem('weapons', index, 'type', value)} />
                      <Field label="Бонус" type="number" value={weapon.attackBonus} onChange={(value) => setArrayItem('weapons', index, 'attackBonus', value)} />
                      <Field label="Урон" value={weapon.damage} onChange={(value) => setArrayItem('weapons', index, 'damage', value)} />
                      <Field label="Тип урона" value={weapon.damageType} onChange={(value) => setArrayItem('weapons', index, 'damageType', value)} />
                      <Field label="Свойства" value={weapon.properties} onChange={(value) => setArrayItem('weapons', index, 'properties', value)} />
                      <button className="row-delete" onClick={() => removeArrayItem('weapons', index)} type="button">Удалить</button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Инвентарь" actions={<button className="ghost-button" onClick={() => addArrayItem('equipment', { name: 'Новый предмет', quantity: 1 })} type="button">Добавить</button>}>
                <div className="editable-list">
                  {draft.equipment.map((item, index) => (
                    <div className="editable-row" key={`${item.name}-${index}`}>
                      <Field label="Предмет" value={item.name} onChange={(value) => setArrayItem('equipment', index, 'name', value)} />
                      <Field label="Кол-во" min="0" type="number" value={item.quantity} onChange={(value) => setArrayItem('equipment', index, 'quantity', value)} />
                      <button className="row-delete" onClick={() => removeArrayItem('equipment', index)} type="button">Удалить</button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Особенности класса" actions={<button className="ghost-button" onClick={() => addArrayItem('classFeatures', { name: 'Новая особенность', level: draft.level, description: '' })} type="button">Добавить</button>}>
                <FeatureEditor collection="classFeatures" features={draft.classFeatures} removeArrayItem={removeArrayItem} setArrayItem={setArrayItem} />
              </Section>

              <Section title="Расовые особенности" actions={<button className="ghost-button" onClick={() => addArrayItem('racialFeatures', { name: 'Новая особенность', description: '' })} type="button">Добавить</button>}>
                <FeatureEditor collection="racialFeatures" features={draft.racialFeatures} removeArrayItem={removeArrayItem} setArrayItem={setArrayItem} />
              </Section>

              <Section title="Черты" actions={<button className="ghost-button" onClick={() => addArrayItem('feats', { name: 'Новая черта', description: '' })} type="button">Добавить</button>}>
                <FeatureEditor collection="feats" features={draft.feats} removeArrayItem={removeArrayItem} setArrayItem={setArrayItem} />
              </Section>

              <Section title="Языки" actions={<button className="ghost-button" onClick={addLanguage} type="button">Добавить</button>}>
                <div className="editable-list">
                  {draft.languages.map((language, index) => (
                    <div className="editable-row" key={`${language}-${index}`}>
                      <Field label="Язык" value={language} onChange={(value) => setLanguage(index, value)} />
                      <button className="row-delete" onClick={() => removeLanguage(index)} type="button">Удалить</button>
                    </div>
                  ))}
                </div>
              </Section>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function FeatureEditor({ collection, features, setArrayItem, removeArrayItem }) {
  return (
    <div className="editable-list">
      {features.map((feature, index) => (
        <div className="editable-row wide-row" key={`${feature.name}-${index}`}>
          <Field label="Название" value={feature.name} onChange={(value) => setArrayItem(collection, index, 'name', value)} />
          {'level' in feature && (
            <Field label="Уровень" type="number" value={feature.level} onChange={(value) => setArrayItem(collection, index, 'level', value)} />
          )}
          <TextareaField label="Описание" value={feature.description} onChange={(value) => setArrayItem(collection, index, 'description', value)} />
          <button className="row-delete" onClick={() => removeArrayItem(collection, index)} type="button">Удалить</button>
        </div>
      ))}
    </div>
  )
}
