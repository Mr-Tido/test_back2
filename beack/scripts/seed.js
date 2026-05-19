require('dotenv').config()

const seedCharacter = require('../data/kheyyan_character.json')
const pool = require('../db')

async function seed() {
  const result = await pool.query(`
    INSERT INTO characters (name, system, class_name, level, race, background, alignment, sheet_data)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (name)
    DO UPDATE SET
      system = EXCLUDED.system,
      class_name = EXCLUDED.class_name,
      level = EXCLUDED.level,
      race = EXCLUDED.race,
      background = EXCLUDED.background,
      alignment = EXCLUDED.alignment,
      sheet_data = EXCLUDED.sheet_data,
      updated_at = now()
    RETURNING id, name
  `, [
    seedCharacter.name,
    seedCharacter.system || 'D&D 5.5e',
    seedCharacter.class,
    seedCharacter.level || 1,
    seedCharacter.race,
    seedCharacter.background || null,
    seedCharacter.alignment || null,
    seedCharacter
  ])

  console.log(`Seeded character: ${result.rows[0].name} (${result.rows[0].id})`)
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
