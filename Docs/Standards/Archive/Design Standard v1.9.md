# File: Design Standard v1.9.md
# Path: Docs/Standards/Design Standard v1.9.md
# Standard: AIDEV-PascalCase-1.9
# Created: 2025-07-07
# Last Modified: 2025-07-07  04:38PM
---

# Design Standard v1.9 - Web-Enhanced & AI-Compliant Edition

## Author & Project

**Author:** Herb Bowers  
**Project:** Project Himalaya  
**Contact:** HimalayaProject1@gmail.com

---

## 🚨 CRITICAL AI COLLABORATION REQUIREMENTS

### **MANDATORY FIRST STEP FOR ALL AI ASSISTANTS**

Before generating ANY code, AI assistants MUST:

1. **Search project knowledge** for "Design Standard v1.9"
2. **Acknowledge understanding** of header requirements in response
3. **Commit to using ACTUAL CURRENT TIME** in all headers
4. **Confirm compliance** before proceeding

### **TIMESTAMP COMPLIANCE - ABSOLUTE REQUIREMENT**

**❌ WRONG - Static/Copy-Paste Timestamps:**
```python
# Last Modified: 2025-07-06  02:57PM  # Same time in all files - VIOLATION
```

**✅ CORRECT - Actual Current Time:**
```python
# File 1 created at 4:38 PM:
# Last Modified: 2025-07-07  04:38PM

# File 2 created at 4:41 PM:  
# Last Modified: 2025-07-07  04:41PM

# File 3 created at 4:44 PM:
# Last Modified: 2025-07-07  04:44PM
```

### **SESSION START PROTOCOL**
Every AI session MUST begin with:
```
"I acknowledge Design Standard v1.9 requirements:
✅ I will use ACTUAL CURRENT TIME in Last Modified headers
✅ I will update timestamps for EVERY file change  
✅ I will search project specs before coding
✅ I understand timestamp compliance is NOT OPTIONAL"
```

---

## Table of Contents

1. [Purpose & Philosophy](#purpose--philosophy)
2. [Header Format](#header-format)
3. [Naming Conventions](#naming-conventions)
4. [Web Framework Exceptions](#web-framework-exceptions)
5. [Design Standards](#design-standards)
6. [File & Directory Structure](#file--directory-structure)
7. [Project Setup Standards](#project-setup-standards)
8. [Automated File Management](#automated-file-management)
9. [Development Environment](#development-environment)
10. [Imports & Dependencies](#imports--dependencies)
11. [Coding Style & Documentation](#coding-style--documentation)
12. [Testing & Quality](#testing--quality)
13. [SQL and Data Access](#sql-and-data-access)
14. [Modern Web Development](#modern-web-development)
15. [AI Collaboration Practices](#ai-collaboration-practices)
16. [Attribution & License](#attribution--license)
17. [Revision History](#revision-history)

---

## Purpose & Philosophy

This standard documents the unique code style, structure, and best practices for the Project Himalaya codebase.  

- **Philosophy:** My code, my way—clarity, maintainability, and personality matter.  
- **COD (Compulsive Order Disorder)** is a feature: consistent formatting, headers, and naming make the codebase navigable for humans, AI, and any future inheritors (post-apocalypse included).
- **Web-First Approach:** Enhanced for modern web development while maintaining core principles.
- Where required, ecosystem and framework conventions are respected, but all other code follows these personal standards.

---

## Header Format

**ALL FILES** in the project must begin with a standardized header **immediately after the shebang** (for executable scripts). This includes Python (`.py`), shell scripts (`.sh`), markdown (`.md`), text files (`.txt`), configuration files, SQL files (`.sql`), HTML (`.html`), CSS (`.css`), JavaScript (`.js`), and any other project documents.

### Python Files (.py)

```python
# File: <FileName.py>
# Path: <Full/Path/From/ProjectRoot/FileName.py>
# Standard: AIDEV-PascalCase-1.9
# Created: YYYY-MM-DD
# Last Modified: YYYY-MM-DD  HH:MM[AM|PM]
"""
Description: <Short module/class/function description>
Extended details as needed.
"""
```

### HTML Files (.html)

```html
<!-- 
File: <filename.html>
Path: <Full/Path/From/ProjectRoot/filename.html>
Standard: AIDEV-PascalCase-1.9
Created: YYYY-MM-DD
Last Modified: YYYY-MM-DD  HH:MM[AM|PM]
Description: <Short page/component description>
Extended details as needed.
-->
```

### CSS Files (.css)

```css
/*
File: <filename.css>
Path: <Full/Path/From/ProjectRoot/filename.css>
Standard: AIDEV-PascalCase-1.9
Created: YYYY-MM-DD
Last Modified: YYYY-MM-DD  HH:MM[AM|PM]
Description: <Short stylesheet description>
Extended details as needed.
*/
```

### JavaScript Files (.js)

```javascript
// File: <filename.js>
// Path: <Full/Path/From/ProjectRoot/filename.js>
// Standard: AIDEV-PascalCase-1.9
// Created: YYYY-MM-DD
// Last Modified: YYYY-MM-DD  HH:MM[AM|PM]
/**
 * Description: <Short script/module description>
 * Extended details as needed.
 */
```

### Configuration Files (.json, .yml, .toml, etc.)

```json
{
  "_comment": "File: <filename.json>",
  "_path": "<Full/Path/From/ProjectRoot/filename.json>",
  "_standard": "AIDEV-PascalCase-1.9",
  "_created": "YYYY-MM-DD",
  "_lastModified": "YYYY-MM-DD HH:MM[AM|PM]",
  "_description": "<Short config description>"
}
```

---

## Naming Conventions

**Everything uses PascalCase** unless ecosystem or technical requirements force exceptions (see Web Framework Exceptions).

### Files & Directories

- **Python files:** `BookService.py`, `DatabaseManager.py`, `FilterPanel.py`
- **Directories:** `Source/`, `Assets/`, `Tests/`, `Scripts/`
- **Documentation:** `DesignStandard.md`, `ReadMe.md`, `MigrationGuide.md`
- **Scripts:** `UpdateFiles.py`, `CreateThumbnails.py`, `BackupDatabase.py`

### Code Elements

- **Classes:** `BookService`, `DatabaseManager`, `FilterPanel`
- **Functions:** `GetCategories()`, `SearchBooks()`, `DisplayResults()`
- **Variables:** `BookTitle`, `CategoryList`, `SearchCriteria`
- **Constants:** `MAX_RESULTS`, `DEFAULT_PATH`, `API_TIMEOUT`

### Database Elements

- **Databases:** `LibraryDatabase`, `UserProfiles`, `SystemLogs`
- **Tables:** `Books`, `Categories`, `UserSessions`, `AuditLogs`
- **Columns:** `BookTitle`, `CategoryName`, `CreatedDate`, `LastModified`
- **Indexes:** `IX_Books_Category`, `IX_Users_Email`, `IX_Logs_Date`
- **Constraints:** `PK_Books_ID`, `FK_Books_Category`, `UK_Users_Email`

---

## Web Framework Exceptions

**CRITICAL:** Modern web development requires specific ecosystem conventions that override PascalCase rules. These exceptions are mandatory for technical compatibility.

### **Directory Names - Web Specific**

**✅ CORRECT - Web Standards:**
```
WebPages/
├── node_modules/        # npm ecosystem requirement
├── public/              # Static serving convention
├── src/                 # Source code (lowercase standard)
├── assets/              # Static assets (lowercase)
├── components/          # React/Vue components
└── api/                 # API routes (lowercase)
```

**❌ AVOID - Broken Web Conventions:**
```
WebPages/
├── NodeModules/         # Breaks npm
├── Public/              # Confuses static servers
├── Components/          # Framework confusion
└── Api/                 # REST API confusion
```

### **File Names - Web Ecosystem**

**✅ CORRECT - Web Standards:**
```
# Core web files (MUST be lowercase)
index.html               # Entry point standard
package.json             # npm requirement
tsconfig.json            # TypeScript requirement
webpack.config.js        # Bundler requirement
.gitignore              # Git requirement
robots.txt              # SEO standard
sitemap.xml             # SEO standard

# API directories (lowercase for REST conventions)
Source/
├── API/                 # Python API modules (uppercase)
└── api/                 # Web API routes (lowercase)

# Frontend files (follow framework conventions)
app.js                   # Main application
main.css                 # Main stylesheet
style.css                # Generic styles
utils.js                 # Utility functions
```

### **API Naming - Framework Specific**

**✅ CORRECT - API Conventions:**
```python
# FastAPI/Flask modules (PascalCase)
Source/API/MainAPI.py
Source/API/BookAPI.py
Source/API/AuthAPI.py

# REST endpoints (lowercase paths)
GET /api/books           # Standard REST
GET /api/categories      # Plural resources
POST /api/auth/login     # Nested resources
```

### **Frontend Framework Exceptions**

**React/Vue/Angular:**
```javascript
// Component files (PascalCase)
BookCard.js              # React component
BookGrid.vue             # Vue component
BookService.ts           # Angular service

// Utility files (camelCase/lowercase)
api.js                   # API utilities
utils.js                 # General utilities
constants.js             # Constants file
```

### **CSS/SCSS Conventions**

**✅ CORRECT - CSS Standards:**
```css
/* Class names (BEM methodology) */
.book-card { }           # Block
.book-card__title { }    # Element
.book-card--featured { } # Modifier

/* CSS files (lowercase) */
main.css
components.css
responsive.css
variables.scss
```

### **Exception Documentation Required**

All files using exceptions MUST include justification:

```python
# File: api.js
# Path: WebPages/src/api.js
# Standard: AIDEV-PascalCase-1.9
# Exception Reason: Web ecosystem requires lowercase for API utilities
# Created: 2025-07-07
# Last Modified: 2025-07-07  04:41PM
```

---

## Design Standards

**Note:** These standards apply to all production code. Exception: 1-shot down and dirty scripts may deviate from these requirements when documented.

### Code Organization

- **Module size limit:** No module should exceed 300 lines of code
- **Single responsibility:** Modules should address unique sets of design elements
- **Cohesion:** Related functionality should be grouped together
- **Coupling:** Minimize dependencies between modules

### Web-Specific Standards

- **API responses:** Always return consistent JSON structure
- **Error handling:** Use proper HTTP status codes
- **Frontend components:** Maximum 200 lines per component
- **CSS classes:** Follow BEM methodology for complex UIs
- **JavaScript functions:** Maximum 50 lines per function

---

## File & Directory Structure

### Standard Project Directory Structure

```
.
├── ./Assets                    # Static assets (images, icons, etc.)
├── ./Source                    # Main source code (PascalCase)
│   ├── ./API                   # Web API modules (uppercase for Python)
│   ├── ./Core                  # Business logic and services
│   ├── ./Data                  # Data models and database access
│   ├── ./Interface             # UI components and windows
│   ├── ./Utils                 # Utility functions and helpers
│   └── ./Framework             # Reusable framework components
├── ./WebPages                  # Web frontend (follows web conventions)
│   ├── ./src                   # Source files (lowercase web standard)
│   ├── ./public                # Static files (lowercase web standard)
│   ├── ./assets                # Web assets (lowercase web standard)
│   └── ./components            # UI components (lowercase web standard)
├── ./Tests                     # Unit tests and test data
├── ./Scripts                   # Deployment and utility scripts
├── ./Docs                      # All documentation
│   ├── ./Standards             # Design standards and guidelines
│   ├── ./Architecture          # System architecture docs
│   ├── ./Updates               # Update logs and reports
│   └── ./Daily                 # Daily development notes
├── ./Archive                   # Archived versions of files
├── ./Updates                   # Temporary folder for file updates
├── ./Legacy                    # Legacy code being phased out
├── ./node_modules              # npm dependencies (web exception)
├── package.json                # npm configuration (web exception)
└── requirements.txt            # Python dependencies
```

---

## Automated File Management

**Enhanced UpdateFiles.py Integration with Web Framework Support**

### Web-Aware File Processing

```python
# UpdateFiles.py enhanced rules
WEB_EXCEPTIONS = {
    # Directories that MUST stay lowercase
    'node_modules': 'node_modules',
    'public': 'public',
    'src': 'src',
    'assets': 'assets',
    'components': 'components',
    
    # Files that MUST stay lowercase
    'index.html': 'index.html',
    'package.json': 'package.json',
    'tsconfig.json': 'tsconfig.json',
    'webpack.config.js': 'webpack.config.js',
    
    # API special case: uppercase for Python, lowercase for routes
    'API': 'API',          # Source/API/ (Python modules)
    'api': 'api',          # WebPages/api/ (web routes)
}
```

### Processing Rules

1. **Python Backend:** Standard PascalCase rules apply
2. **Web Frontend:** Framework exceptions override PascalCase
3. **Mixed Projects:** Context-sensitive processing based on path
4. **Configuration Files:** Always follow ecosystem requirements

---

## Modern Web Development

### **Frontend Standards**

**HTML5 Requirements:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Descriptive Title</title>
</head>
```

**CSS Best Practices:**
```css
/* Mobile-first responsive design */
.container {
    /* Base styles for mobile */
}

@media (min-width: 768px) {
    /* Tablet styles */
}

@media (min-width: 1024px) {
    /* Desktop styles */
}
```

**JavaScript Standards:**
```javascript
// Use modern ES6+ features
const ApiService = {
    async GetBooks(params = {}) {
        try {
            const response = await fetch('/api/books', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
```

### **Backend API Standards**

**FastAPI Structure:**
```python
# Follow REST conventions
@app.get("/api/books")              # GET collection
@app.get("/api/books/{book_id}")    # GET single resource
@app.post("/api/books")             # POST create resource
@app.put("/api/books/{book_id}")    # PUT update resource
@app.delete("/api/books/{book_id}") # DELETE resource
```

**Response Format:**
```json
{
    "status": "success",
    "data": { },
    "pagination": {
        "limit": 20,
        "offset": 0,
        "total": 100,
        "has_more": true
    },
    "meta": {
        "timestamp": "2025-07-07T21:38:00Z",
        "version": "1.0.0"
    }
}
```

---

## AI Collaboration Practices

### **Enhanced AI Requirements**

**Pre-Code Checklist:**
- [ ] Current date and time determined
- [ ] Header will use ACTUAL timestamp, not placeholder
- [ ] Path matches exact project structure
- [ ] Web framework exceptions considered
- [ ] Standard: AIDEV-PascalCase-1.9 included
- [ ] Description matches module purpose

**Batch File Rules:**
- **Each file gets its own timestamp** when created
- **No copy-paste timestamps** between files
- **Progressive time progression** for files created in sequence
- **Web conventions properly applied**

**Timestamp Validation:**
```python
def ValidateTimestamps(Files):
    """Detect identical timestamps - indicates copy-paste violation"""
    Timestamps = [GetTimestamp(File) for File in Files]
    if len(set(Timestamps)) != len(Timestamps):
        raise ValueError("VIOLATION: Identical timestamps detected")
```

---

## SQL and Data Access

- **NO SQLAlchemy.** Use raw SQL and parameterized queries only.
- **Database naming:** PascalCase for ALL elements (tables, columns, indexes, constraints)
- **SQL file naming:** `CreateUserProfilesTable.sql`, `UpdateSchema_v1_2.sql`
- **SQL files must use standard headers**

**Complete SQL Example:**

```sql
-- Good: Full PascalCase compliance
SELECT B.BookTitle, C.CategoryName, B.Rating
FROM Books B
    INNER JOIN Categories C ON B.CategoryID = C.CategoryID
WHERE B.CreatedDate >= @StartDate
    AND C.CategoryName LIKE @CategoryFilter
ORDER BY B.BookTitle;
```

---

## Testing & Quality

- **All code must be covered by `pytest` unit tests.**
- **Test coverage goal:** 80%+
- **Web API testing:** Use FastAPI TestClient
- **Frontend testing:** Use appropriate framework testing tools
- **Integration testing:** Test full API workflows

**API Test Example:**
```python
def test_get_books():
    response = client.get("/api/books")
    assert response.status_code == 200
    assert "books" in response.json()
```

---

## Attribution & License

- Attribution and contact are included at the head of the standard and in each major module as needed.
- **License:** MIT License
- Special thanks to the open-source community and the AI models that help build and document this project.

---

## Revision History

- **1.6:** Original AIDEV-PascalCase Standards (Herb Bowers)
- **1.7:** Clarified ecosystem exceptions, formalized policies
- **1.8:** Extended PascalCase to database elements, added comprehensive headers, automated file management
- **1.9:** 
  - **MAJOR:** Added comprehensive web framework exceptions
  - **MAJOR:** Integrated AI compliance requirements from v1.8a
  - **MAJOR:** Enhanced for modern web development (FastAPI, React, Vue)
  - **NEW:** Web-aware UpdateFiles.py processing rules
  - **NEW:** Frontend/backend separation standards
  - **NEW:** REST API conventions and response formats
  - **NEW:** HTML/CSS/JavaScript header formats
  - **NEW:** Progressive timestamp enforcement for AI
  - **ENHANCED:** Comprehensive ecosystem exception handling
  - **ENHANCED:** Mobile-first responsive design standards

---

*This standard is a living document. Compliance with timestamp requirements is MANDATORY and NOT NEGOTIABLE for all contributors, human or AI. Web framework exceptions are technically required and override PascalCase rules where specified.*