# File: Design Standard v2.0.md
# Path: Docs/Standards/Design Standard v2.0.txt
# Standard: AIDEV-PascalCase-2.0
# Created: 2025-07-07
# Last Modified: 2025-07-07  08:58PM
"""
Description: Project Himalaya Design Standard v2.0 - Web Compatibility First Edition
Major paradigm shift: "Compatibility First, Consistency Second" for web development.
Acknowledges the chaotic nature of web ecosystem casing requirements.
"""

# Design Standard v2.0 - Web Compatibility First Edition

## Author & Project

**Author:** Herb Bowers  
**Project:** Project Himalaya  
**Contact:** HimalayaProject1@gmail.com

---

## 🚨 MAJOR PARADIGM SHIFT IN v2.0

### **NEW CORE PRINCIPLE: "COMPATIBILITY FIRST, CONSISTENCY SECOND"**

**v1.9 Approach:** Try to use PascalCase with exceptions
**v2.0 Approach:** Use whatever casing the ecosystem demands, document why

**The Reality Check:**
Web development is a chaotic ecosystem where every library, framework, build tool, 
and hosting platform has different casing requirements. Attempting to impose 
universal casing rules is futile and counterproductive.

### **UNIVERSAL TRUTH: Web Casing Chaos**

```
React:     <BookCard />          (PascalCase components)
Vue:       <book-card />         (kebab-case templates) 
Angular:   selector: 'book-card' (kebab-case selectors)
Bootstrap: .container-fluid      (kebab-case classes)
Tailwind:  .bg-blue-500         (kebab-case utilities)
REST APIs: /api/book-categories  (kebab-case paths)
GraphQL:   bookCategories { }    (camelCase fields)
npm:       "devDependencies"     (camelCase keys)
ENV:       API_BASE_URL=         (UPPER_SNAKE_CASE)
```

**Bottom Line:** Every web technology has different requirements. Fighting this 
reality breaks tools and wastes developer time.

---

## 🚨 CRITICAL AI COLLABORATION REQUIREMENTS (UNCHANGED)

### **MANDATORY FIRST STEP FOR ALL AI ASSISTANTS**

Before generating ANY code, AI assistants MUST:

1. **Search project knowledge** for "Design Standard v2.0"
2. **Acknowledge understanding** of new compatibility-first approach
3. **Commit to using ACTUAL CURRENT TIME** in all headers
4. **Confirm compliance** before proceeding

### **TIMESTAMP COMPLIANCE - ABSOLUTE REQUIREMENT (UNCHANGED)**

**❌ WRONG - Static/Copy-Paste Timestamps:**
```
# Last Modified: 2025-07-06  02:57PM  # Same time in all files - VIOLATION
```

**✅ CORRECT - Actual Current Time:**
```
# File 1 created at 8:58 PM:
# Last Modified: 2025-07-07  08:58PM

# File 2 created at 9:01 PM:  
# Last Modified: 2025-07-07  09:01PM

# File 3 created at 9:04 PM:
# Last Modified: 2025-07-07  09:04PM
```

### **SESSION START PROTOCOL (UPDATED)**
Every AI session MUST begin with:
```
"I acknowledge Design Standard v2.0 requirements:
✅ I will use ACTUAL CURRENT TIME in Last Modified headers
✅ I will follow COMPATIBILITY FIRST approach for web development
✅ I will document ecosystem requirements in headers
✅ I understand casing must serve functionality, not aesthetics"
```

---

## Table of Contents

1. [Purpose & Philosophy](#purpose--philosophy)
2. [Compatibility First Methodology](#compatibility-first-methodology)
3. [Header Format (UNCHANGED)](#header-format)
4. [Web Technology Casing Matrix](#web-technology-casing-matrix)
5. [Backend Standards (PascalCase Preserved)](#backend-standards)
6. [Exception Documentation Requirements](#exception-documentation-requirements)
7. [File & Directory Structure](#file--directory-structure)
8. [Testing & Quality (UNCHANGED)](#testing--quality)
9. [SQL and Data Access (UNCHANGED)](#sql-and-data-access)
10. [AI Collaboration Practices](#ai-collaboration-practices)
11. [Migration from v1.9](#migration-from-v19)
12. [Attribution & License](#attribution--license)
13. [Revision History](#revision-history)

---

## Purpose & Philosophy

### **v2.0 Philosophy: Pragmatic Compatibility**

- **Compatibility First:** Use whatever casing the specific technology requires
- **Consistency Second:** Apply PascalCase only when no tool cares
- **Document Everything:** Always explain why specific casing was chosen
- **No Fighting Ecosystems:** Never break tools for aesthetic consistency

### **What Changed:**
- **v1.9:** "Use PascalCase unless forced otherwise"
- **v2.0:** "Use ecosystem requirements first, PascalCase as fallback"

### **What Stays the Same:**
- Headers in ALL files (mandatory and NON-NEGOTIABLE)
- Progressive timestamps for AI sessions
- Backend Python code uses PascalCase
- 300-line module limits
- Raw SQL with PascalCase database elements
- pytest testing standards

---

## Compatibility First Methodology

### **Decision Tree for Casing**

```
1. Does a framework/tool/library REQUIRE specific casing?
   YES → Use that casing (document in header)
   NO  → Continue to step 2

2. Does a hosting platform/server care about casing?
   YES → Use platform-safe casing (document in header)
   NO  → Continue to step 3

3. Is there an industry-wide convention?
   YES → Follow convention (document in header)
   NO  → Continue to step 4

4. Use PascalCase (Project Himalaya default)
```

### **Examples of Required vs. Optional Casing**

**REQUIRED (Must Comply):**
```
package.json          # npm REQUIRES this exact name
node_modules/         # npm REQUIRES this exact name
.gitignore           # Git REQUIRES dot + lowercase
robots.txt           # SEO crawlers EXPECT lowercase
sitemap.xml          # SEO crawlers EXPECT lowercase
index.html           # Web server convention (Linux case-sensitive)
manifest.json        # PWA specification requirement
tsconfig.json        # TypeScript REQUIRES this exact name
webpack.config.js    # Webpack REQUIRES this exact name
.env                 # Environment variable convention
src/                 # Frontend build tool convention
public/              # Static file serving convention
```

**FRAMEWORK-DEPENDENT (Follow Framework Rules):**
```
# React
<ComponentName />    # MUST be PascalCase
useState()          # MUST be camelCase
className=""        # MUST be camelCase (not class)

# Vue
<component-name>    # MUST be kebab-case in templates
export default {}   # MUST be camelCase

# Angular
selector: 'app-root'  # MUST be kebab-case
@Component()          # MUST be PascalCase decorator

# CSS Frameworks
.container-fluid      # Bootstrap REQUIRES kebab-case
.bg-blue-500         # Tailwind REQUIRES kebab-case
.MuiButton-root      # Material-UI uses PascalCase prefix

# API Conventions
/api/users           # REST convention: lowercase + plural
userProfiles { }     # GraphQL: camelCase fields
user_id              # Some APIs use snake_case
```

**OPTIONAL (Project Choice):**
```
# Custom JavaScript functions (when not framework-specific)
function GetBooks() {}     # Could use PascalCase
function getBooks() {}     # Could use camelCase

# Custom CSS classes (when not using frameworks)
.BookCard {}              # Could use PascalCase
.book-card {}             # Could use kebab-case

# Custom HTML IDs
<div id="BookGrid">       # Could use PascalCase
<div id="book-grid">      # Could use kebab-case
```

---

## Header Format (UNCHANGED)

**ALL FILES** still require standardized headers. This is NON-NEGOTIABLE.

### Python Files (.py)

```python
# File: BookService.py
# Path: Source/Core/BookService.py
# Standard: AIDEV-PascalCase-2.0
# Created: 2025-07-07
# Last Modified: 2025-07-07  09:02PM
"""
Description: Book business logic service
Backend Python: Uses PascalCase per project standards
"""
```

### HTML Files (.html)

```html
<!-- 
File: index.html
Path: WebPages/index.html
Standard: AIDEV-PascalCase-2.0
Ecosystem Requirement: Lowercase filename for web hosting compatibility
Created: 2025-07-07
Last Modified: 2025-07-07  09:03PM
Description: Main application entry point
-->
```

### CSS Files (.css)

```css
/*
File: main.css
Path: WebPages/src/main.css
Standard: AIDEV-PascalCase-2.0
Framework Requirement: Lowercase for build tool compatibility
Created: 2025-07-07
Last Modified: 2025-07-07  09:04PM
Description: Main application stylesheet with Bootstrap integration
Classes follow Bootstrap conventions (kebab-case)
*/
```

### JavaScript Files (.js)

```javascript
// File: api-service.js
// Path: WebPages/src/api-service.js
// Standard: AIDEV-PascalCase-2.0
// Framework Requirement: kebab-case filename for module bundler
// Function Names: camelCase per JavaScript ecosystem standards
// Created: 2025-07-07
// Last Modified: 2025-07-07  09:05PM
/**
 * Description: API service layer for Anderson's Library
 * Uses JavaScript ecosystem conventions for function naming
 */
```

### Configuration Files

```json
{
  "_comment": "File: package.json",
  "_path": "package.json",
  "_standard": "AIDEV-PascalCase-2.0",
  "_ecosystem_requirement": "npm requires exact filename 'package.json'",
  "_created": "2025-07-07",
  "_lastModified": "2025-07-07 09:06PM",
  "_description": "npm package configuration"
}
```

---

## Web Technology Casing Matrix

### **Frontend Frameworks**

**React Requirements:**
```jsx
// REQUIRED CASING
import BookCard from './BookCard';     // PascalCase component files
function BookCard() {                  // PascalCase component names
  const [bookTitle, setBookTitle] = useState();  // camelCase hooks
  return <div className="book-card">   // camelCase attributes
}

// FILES
BookCard.jsx        # PascalCase component files
api-service.js      # kebab-case utility files
index.js           # lowercase entry points
```

**Vue Requirements:**
```vue
<!-- REQUIRED CASING -->
<template>
  <book-card />     <!-- kebab-case in templates -->
</template>

<script>
export default {
  name: 'BookCard',      // PascalCase component name
  data() { return {} },  // camelCase methods
}
</script>

<!-- FILES -->
BookCard.vue        # PascalCase component files
api-service.js      # kebab-case utility files
main.js            # lowercase entry points
```

**Angular Requirements:**
```typescript
// REQUIRED CASING
@Component({
  selector: 'book-card',    // kebab-case selector
  templateUrl: './book-card.component.html'  // kebab-case files
})
export class BookCardComponent {  // PascalCase class names
  public bookTitle: string;       // camelCase properties
}

// FILES
book-card.component.ts     # kebab-case component files
api.service.ts            # kebab-case service files
main.ts                   # lowercase entry points
```

### **CSS Framework Requirements**

**Bootstrap:**
```css
/* REQUIRED CASING - All kebab-case */
.container-fluid
.btn-primary
.form-control
.navbar-nav
```

**Tailwind:**
```css
/* REQUIRED CASING - All kebab-case */
.bg-blue-500
.text-center
.font-bold
.hover:bg-blue-700
```

**Material-UI:**
```css
/* REQUIRED CASING - PascalCase prefix */
.MuiButton-root
.MuiTextField-input
.MuiAppBar-colorPrimary
```

### **API Conventions**

**REST APIs:**
```
# STANDARD CONVENTIONS
GET /api/books              # lowercase, plural
GET /api/book-categories    # kebab-case compound words
POST /api/users             # lowercase, plural
PUT /api/books/{id}         # lowercase with path params
```

**GraphQL:**
```graphql
# STANDARD CONVENTIONS
type User {
  firstName: String!        # camelCase fields
  lastName: String!
  emailAddress: String!
}

query getBooks($categoryId: ID!) {  # camelCase variables
  books(categoryId: $categoryId) {  # camelCase arguments
    bookTitle                       # camelCase fields
    authorName
  }
}
```

### **Build Tools & Configuration**

**Required Files (EXACT names):**
```
package.json           # npm requirement
package-lock.json      # npm requirement
tsconfig.json          # TypeScript requirement
webpack.config.js      # Webpack requirement
vite.config.js         # Vite requirement
tailwind.config.js     # Tailwind requirement
jest.config.js         # Jest requirement
.babelrc              # Babel requirement
.eslintrc.json        # ESLint requirement
.prettierrc           # Prettier requirement
.gitignore            # Git requirement
.env                  # Environment variables
.env.local            # Environment variables
robots.txt            # SEO requirement
sitemap.xml           # SEO requirement
manifest.json         # PWA requirement
```

**Directory Structure (Web Standards):**
```
src/                  # Source files (lowercase standard)
public/               # Static files (lowercase standard)
dist/                 # Build output (lowercase standard)
build/                # Alternative build output
assets/               # Static assets (lowercase standard)
components/           # UI components (lowercase standard)
pages/                # Page components (lowercase standard)
utils/                # Utility functions (lowercase standard)
hooks/                # React hooks (lowercase standard)
services/             # API services (lowercase standard)
store/                # State management (lowercase standard)
styles/               # CSS files (lowercase standard)
tests/                # Test files (lowercase standard)
node_modules/         # npm dependencies (lowercase required)
```

---

## Backend Standards (PascalCase Preserved)

**Python backend code maintains PascalCase standards:**

```python
# Source/Core/BookService.py
class BookService:
    def GetAllBooks(self) -> List[BookRecord]:
        return self.DatabaseManager.GetBooks()
    
    def SearchBooks(self, SearchTerm: str) -> List[BookRecord]:
        return self.DatabaseManager.SearchBooks(SearchTerm)

# Source/Data/DatabaseModels.py
@dataclass
class BookRecord:
    BookTitle: str
    AuthorName: str
    CategoryName: str
    CreatedDate: datetime
```

**FastAPI endpoint naming follows REST conventions:**

```python
# Source/API/MainAPI.py
@app.get("/api/books")              # lowercase REST convention
async def GetBooks():               # PascalCase function name
    BookService = GetBookService()  # PascalCase variables
    return BookService.GetAllBooks()

@app.get("/api/book-categories")    # kebab-case compound words
async def GetBookCategories():
    return CategoryService.GetCategories()
```

---

## Exception Documentation Requirements

**Every file using non-PascalCase MUST document why:**

### **Required Documentation Fields:**

```python
# File: index.html
# Path: WebPages/index.html
# Standard: AIDEV-PascalCase-2.0
# Ecosystem Requirement: Web hosting compatibility requires lowercase
# Alternative Considered: Index.html (would break Linux hosting)
# Framework: None (standalone HTML)
# Created: 2025-07-07
# Last Modified: 2025-07-07  09:10PM
```

```javascript
// File: api-service.js
// Framework: ES6 modules with Webpack bundler
// Ecosystem Requirement: kebab-case for module resolution
// Function Naming: camelCase per JavaScript conventions
// Class Naming: PascalCase per JavaScript conventions
// Constants: UPPER_SNAKE_CASE per JavaScript conventions
```

```css
/*
File: bootstrap-integration.css
Framework: Bootstrap 5.3
Ecosystem Requirement: All classes must be kebab-case for Bootstrap compatibility
Custom Classes: Follow BEM methodology (kebab-case)
*/
```

### **Documentation Categories:**

1. **Ecosystem Requirement:** Tool/platform mandates specific casing
2. **Framework Requirement:** Library requires specific casing  
3. **Convention Standard:** Industry-wide convention
4. **Hosting Compatibility:** Server/platform compatibility
5. **Build Tool Requirement:** Bundler/compiler requirement
6. **SEO Standard:** Search engine expectation
7. **Security Standard:** Security tool requirement

---

## Testing & Quality (UNCHANGED)

- **All code must be covered by `pytest` unit tests.**
- **Test coverage goal:** 80%+
- **Web API testing:** Use FastAPI TestClient
- **Frontend testing:** Use appropriate framework testing tools
- **Integration testing:** Test full API workflows

**Test file naming follows ecosystem requirements:**

```python
# Backend tests (PascalCase)
Tests/Unit/TestBookService.py
Tests/Integration/TestMainAPI.py

# Frontend tests (framework-dependent)
src/components/__tests__/BookCard.test.js    # React/Jest convention
src/components/BookCard.spec.ts              # Angular convention
tests/unit/book-card.spec.js                 # Vue convention
```

---

## SQL and Data Access (UNCHANGED)

- **NO SQLAlchemy.** Use raw SQL and parameterized queries only.
- **Database naming:** PascalCase for ALL elements (tables, columns, indexes, constraints)
- **SQL file naming:** `CreateUserProfilesTable.sql`, `UpdateSchema_v1_2.sql`

```sql
-- Backend database maintains PascalCase standards
SELECT B.BookTitle, C.CategoryName, B.Rating
FROM Books B
    INNER JOIN Categories C ON B.CategoryID = C.CategoryID
WHERE B.CreatedDate >= @StartDate
    AND C.CategoryName LIKE @CategoryFilter
ORDER BY B.BookTitle;
```

---

## AI Collaboration Practices

### **Enhanced Requirements for v2.0**

**Pre-Code Checklist:**
- [ ] Current date and time determined
- [ ] Header will use ACTUAL timestamp, not placeholder
- [ ] Ecosystem requirements researched for target technology
- [ ] Framework-specific casing rules identified
- [ ] Exception documentation prepared if needed
- [ ] Path matches exact project structure
- [ ] Standard: AIDEV-PascalCase-2.0 included

**Technology Research Required:**
```
1. Identify target platform/framework
2. Research specific casing requirements
3. Check for build tool requirements  
4. Verify hosting platform compatibility
5. Document rationale for casing choice
6. Apply appropriate naming throughout file
```

**Ecosystem Compatibility Validation:**
```python
def ValidateEcosystemCompatibility(FilePath, Technology):
    """Ensure file follows ecosystem requirements"""
    Requirements = GetEcosystemRequirements(Technology)
    
    if not Requirements.ValidateFileName(FilePath):
        raise ValueError(f"Filename violates {Technology} requirements")
        
    if not Requirements.ValidateContent(FileContent):
        raise ValueError(f"Content violates {Technology} conventions")
```

---

## Migration from v1.9

### **What Changes:**

1. **Mindset:** From "PascalCase with exceptions" to "ecosystem-first"
2. **Documentation:** Must explain ecosystem requirements
3. **Research:** Must understand framework/tool requirements
4. **Headers:** Add ecosystem requirement fields

### **What Stays the Same:**

1. **Headers required in ALL files**
2. **Progressive timestamps for AI**
3. **Backend Python uses PascalCase**
4. **Database schema uses PascalCase**
5. **300-line module limits**
6. **Testing coverage requirements**

### **Migration Checklist:**

- [ ] Review all web files for ecosystem compliance
- [ ] Add ecosystem requirement documentation to headers
- [ ] Verify framework-specific naming conventions
- [ ] Check build tool compatibility
- [ ] Validate hosting platform requirements
- [ ] Update UpdateFiles.py for v2.0 logic

---

## Attribution & License

- **Author:** Herb Bowers (HimalayaProject1@gmail.com)
- **License:** MIT License
- **Philosophy:** Pragmatic compatibility over aesthetic consistency
- **Inspiration:** Real-world web development chaos and ecosystem diversity

---

## Revision History

- **1.6:** Original AIDEV-PascalCase Standards (Herb Bowers)
- **1.7:** Clarified ecosystem exceptions, formalized policies
- **1.8:** Extended PascalCase to database elements, added comprehensive headers
- **1.9:** Added web framework exceptions and AI compliance requirements
- **2.0:** **MAJOR PARADIGM SHIFT**
  - **NEW:** "Compatibility First, Consistency Second" methodology
  - **NEW:** Comprehensive web technology casing matrix
  - **NEW:** Ecosystem requirement documentation standards
  - **NEW:** Technology-specific research requirements for AI
  - **ENHANCED:** Exception documentation with rationale requirements
  - **CLARIFIED:** When PascalCase applies vs when ecosystem rules override
  - **FORMALIZED:** Decision tree for casing choices
  - **ACKNOWLEDGED:** Web development ecosystem diversity reality

---

*This standard acknowledges the chaotic reality of web development where every tool has different requirements. Compatibility trumps consistency. When in doubt, make it work first, make it pretty second.*