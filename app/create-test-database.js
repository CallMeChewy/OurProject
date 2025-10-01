#!/usr/bin/env node

/**
 * Create a test SQLite database for bootstrap system testing
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function createTestDatabase() {
  try {
    console.log('Creating test database...');

    // Initialize sql.js
    const SQL = await initSqlJs();

    // Create new database
    const db = new SQL.Database();

    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS DatabaseMetadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Categories (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Subjects (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Books (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Title TEXT NOT NULL,
        Author TEXT,
        Category_ID INTEGER,
        Subject_ID INTEGER,
        GoogleDriveID TEXT,
        TierCode TEXT DEFAULT 'F',
        AccessMode TEXT DEFAULT 'D',
        Description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (Category_ID) REFERENCES Categories(ID),
        FOREIGN KEY (Subject_ID) REFERENCES Subjects(ID)
      )
    `);

    // Insert metadata
    db.run(`
      INSERT OR REPLACE INTO DatabaseMetadata (key, value) VALUES
      ('version', '2.0.0'),
      ('created_at', datetime('now')),
      ('description', 'OurLibrary Test Database for Bootstrap System')
    `);

    // Insert sample categories
    db.run(`
      INSERT INTO Categories (Name, Description) VALUES
      ('Programming', 'Computer programming and software development'),
      ('Science', 'Natural sciences and research'),
      ('Literature', 'Fiction and non-fiction books'),
      ('Mathematics', 'Mathematical concepts and education')
    `);

    // Insert sample subjects
    db.run(`
      INSERT INTO Subjects (Name, Description) VALUES
      ('JavaScript', 'Programming with JavaScript'),
      ('Physics', 'Study of matter and energy'),
      ('Fiction', 'Literary fiction works'),
      ('Calculus', 'Mathematical analysis'),
      ('Web Development', 'Building web applications'),
      ('Chemistry', 'Study of chemical substances')
    `);

    // Insert sample books
    const sampleBooks = [
      { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', category: 1, subject: 5, tier: 'F', mode: 'D' },
      { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', category: 1, subject: 1, tier: 'F', mode: 'D' },
      { title: 'Introduction to Physics', author: 'John Doe', category: 2, subject: 2, tier: 'F', mode: 'V' },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 3, subject: 3, tier: 'P', mode: 'D' },
      { title: 'Calculus Made Easy', author: 'Silvanus P. Thompson', category: 4, subject: 4, tier: 'F', mode: 'D' },
      { title: 'Modern Chemistry', author: 'Jane Smith', category: 2, subject: 6, tier: 'P', mode: 'V' },
      { title: 'Clean Code', author: 'Robert C. Martin', category: 1, subject: 5, tier: 'P', mode: 'D' },
      { title: 'The Art of Computer Programming', author: 'Donald Knuth', category: 1, subject: 4, tier: 'P', mode: 'D' }
    ];

    const stmt = db.prepare(`
      INSERT INTO Books (Title, Author, Category_ID, Subject_ID, TierCode, AccessMode)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    sampleBooks.forEach(book => {
      stmt.run([book.title, book.author, book.category, book.subject, book.tier, book.mode]);
    });

    stmt.free();

    // Export database to binary file
    const data = db.export();
    const dbPath = path.join(__dirname, 'Assets', 'OurLibrary.db');

    // Ensure Assets directory exists
    const assetsDir = path.dirname(dbPath);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    fs.writeFileSync(dbPath, data);
    db.close();

    console.log(`✅ Test database created at: ${dbPath}`);
    console.log(`📊 Database contains: ${sampleBooks.length} books, 4 categories, 6 subjects`);

    // Verify database
    const verifyDb = new SQL.Database(data);
    const verifyStmt = verifyDb.prepare("SELECT COUNT(*) as count FROM Books");
    const result = verifyStmt.getAsObject();
    verifyStmt.free();
    verifyDb.close();

    console.log(`✅ Database verification: ${result.count} books found`);

  } catch (error) {
    console.error('❌ Error creating test database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createTestDatabase();
}

module.exports = { createTestDatabase };