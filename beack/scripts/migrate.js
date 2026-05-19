require('dotenv').config()

const fs = require('fs/promises')
const path = require('path')
const pool = require('../db')

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql')
  const schema = await fs.readFile(schemaPath, 'utf8')

  await pool.query(schema)
  console.log('Database schema is ready')
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
