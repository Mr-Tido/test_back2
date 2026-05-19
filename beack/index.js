require('dotenv').config()

const express = require('express')
const cors = require('cors')
const pool = require('./db')

const app = express()
const PORT = process.env.PORT || 3001
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))

function normalizeCharacter(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    system: row.system,
    class: row.class_name,
    level: row.level,
    race: row.race,
    background: row.background,
    alignment: row.alignment,
    data: row.sheet_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function pickCharacterFields(body) {
  return {
    name: body.name,
    system: body.system || 'D&D 5.5e',
    className: body.class || body.className,
    level: body.level || 1,
    race: body.race,
    background: body.background || null,
    alignment: body.alignment || null,
    sheetData: body.data || body
  }
}

function validateCharacter(character) {
  const missingFields = []

  if (!character.name) missingFields.push('name')
  if (!character.className) missingFields.push('class')
  if (!character.race) missingFields.push('race')

  return missingFields
}

function mergeSheet(currentValue, patchValue) {
  if (
    currentValue &&
    patchValue &&
    typeof currentValue === 'object' &&
    typeof patchValue === 'object' &&
    !Array.isArray(currentValue) &&
    !Array.isArray(patchValue)
  ) {
    return Object.keys(patchValue).reduce((merged, key) => ({
      ...merged,
      [key]: mergeSheet(currentValue[key], patchValue[key])
    }), { ...currentValue })
  }

  return patchValue
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, database: 'connected' })
  } catch (error) {
    res.status(503).json({ ok: false, database: 'unavailable', error: error.message })
  }
})

app.get('/api/characters', async (req, res) => {
  const { search } = req.query

  try {
    const result = await pool.query(`
      SELECT id, name, system, class_name, level, race, background, alignment, sheet_data, created_at, updated_at
      FROM characters
      WHERE $1::text IS NULL
        OR name ILIKE '%' || $1 || '%'
        OR race ILIKE '%' || $1 || '%'
        OR class_name ILIKE '%' || $1 || '%'
      ORDER BY updated_at DESC
    `, [search || null])

    res.json(result.rows.map(normalizeCharacter))
  } catch (error) {
    res.status(500).json({ error: 'Не удалось получить персонажей', details: error.message })
  }
})

app.get('/api/characters/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, system, class_name, level, race, background, alignment, sheet_data, created_at, updated_at
      FROM characters
      WHERE id = $1
    `, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден' })
    }

    res.json(normalizeCharacter(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Не удалось получить персонажа', details: error.message })
  }
})

app.post('/api/characters', async (req, res) => {
  const character = pickCharacterFields(req.body)
  const missingFields = validateCharacter(character)

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Не хватает полей: ${missingFields.join(', ')}` })
  }

  try {
    const result = await pool.query(`
      INSERT INTO characters (name, system, class_name, level, race, background, alignment, sheet_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, system, class_name, level, race, background, alignment, sheet_data, created_at, updated_at
    `, [
      character.name,
      character.system,
      character.className,
      character.level,
      character.race,
      character.background,
      character.alignment,
      character.sheetData
    ])

    res.status(201).json(normalizeCharacter(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Не удалось сохранить персонажа', details: error.message })
  }
})

app.put('/api/characters/:id', async (req, res) => {
  const character = pickCharacterFields(req.body)
  const missingFields = validateCharacter(character)

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Не хватает полей: ${missingFields.join(', ')}` })
  }

  try {
    const result = await pool.query(`
      UPDATE characters
      SET name = $1,
          system = $2,
          class_name = $3,
          level = $4,
          race = $5,
          background = $6,
          alignment = $7,
          sheet_data = $8,
          updated_at = now()
      WHERE id = $9
      RETURNING id, name, system, class_name, level, race, background, alignment, sheet_data, created_at, updated_at
    `, [
      character.name,
      character.system,
      character.className,
      character.level,
      character.race,
      character.background,
      character.alignment,
      character.sheetData,
      req.params.id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден' })
    }

    res.json(normalizeCharacter(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Не удалось обновить персонажа', details: error.message })
  }
})

app.patch('/api/characters/:id', async (req, res) => {
  try {
    const currentResult = await pool.query(`
      SELECT sheet_data
      FROM characters
      WHERE id = $1
    `, [req.params.id])

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден' })
    }

    const currentSheet = currentResult.rows[0].sheet_data
    const mergedSheet = mergeSheet(currentSheet, req.body)
    const character = pickCharacterFields(mergedSheet)
    const missingFields = validateCharacter(character)

    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Не хватает полей: ${missingFields.join(', ')}` })
    }

    const result = await pool.query(`
      UPDATE characters
      SET name = $1,
          system = $2,
          class_name = $3,
          level = $4,
          race = $5,
          background = $6,
          alignment = $7,
          sheet_data = $8,
          updated_at = now()
      WHERE id = $9
      RETURNING id, name, system, class_name, level, race, background, alignment, sheet_data, created_at, updated_at
    `, [
      character.name,
      character.system,
      character.className,
      character.level,
      character.race,
      character.background,
      character.alignment,
      character.sheetData,
      req.params.id
    ])

    res.json(normalizeCharacter(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Не удалось частично обновить персонажа', details: error.message })
  }
})

app.delete('/api/characters/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM characters
      WHERE id = $1
      RETURNING id, name
    `, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден' })
    }

    res.json({ success: true, deleted: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Не удалось удалить персонажа', details: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
