# File: Design Standard v2.4.md

# Path: Docs/Standards/Design Standard v2.4.md

# Standard: AIDEV-PascalCase-2.4

# Created: 2025-09-11

# Last Modified: 2025-09-11 01:03AM

"""
Description: Design Standard v2.4 - Symlink-Aware Development + Distribution Security Framework
Extends v2.3 with mandatory distribution security protocols for credential protection
"""

---

# Design Standard v2.4 - Symlink-Aware Development + Distribution Security Framework

## Author & Project

**Author:** Herb Bowers  
**Project:** Project Himalaya  
**Contact:** HimalayaProject1@gmail.com  
**Evolution:** v1.8 → v1.8a → v1.9 → v2.0 → v2.1 → v2.2 → v2.3 → **v2.4**

---

## 🚨 CRITICAL: THE "MEMOREX vs REALITY" PROBLEM

### **FROM v2.3: SYMLINK IDENTITY CRISIS**

**PROBLEM STATEMENT:**
Scripts accessed via symlinks suffer from "Memorex vs Reality" syndrome:

- ❌ **Memorex Behavior:** Script works in its original file location
- ✅ **Reality Behavior:** Script works in the context where it was invoked
- ❌ **Identity Confusion:** Script doesn't know which environment it's in
- ❌ **Path Resolution Failures:** Wrong project detection, missing files
- ❌ **Context Sensitivity Loss:** Tools don't adapt to project environment

**CRITICAL INSIGHT:**

> In sophisticated development environments, **ALL SCRIPTS MUST BE ASSUMED TO BE SYMLINKED**

---

## 🛡️ MANDATORY SYMLINK DEFENSE PATTERNS

### **STEP 1: UNIVERSAL SYMLINK ASSUMPTION**

**Every Python script MUST include this defensive pattern:**

```python
#!/usr/bin/env python3
# File: ScriptName.py
# Path: ProjectName/path/to/ScriptName.py
# Standard: AIDEV-PascalCase-2.4
# Created: YYYY-MM-DD
# Last Modified: YYYY-MM-DD  HH:MM[AM|PM]

"""
SYMLINK-AWARE SCRIPT: Designed to work correctly whether accessed 
directly or via symlink. Follows Design Standard v2.4.
"""

import os
import sys
from pathlib import Path

def get_execution_context():
    """
    Symlink-aware context detection following Design Standard v2.4

    Returns:
        dict: Execution context information
    """
    context = {
        'working_directory': os.getcwd(),
        'project_name': os.path.basename(os.getcwd()),
        'script_path': sys.argv[0],
        'is_symlinked': Path(sys.argv[0]).is_symlink() if Path(sys.argv[0]).exists() else False,
        'script_real_location': Path(sys.argv[0]).resolve() if Path(sys.argv[0]).exists() else None
    }

    # CRITICAL: For project tools, ALWAYS work in current directory (Reality)
    # Only use script location for self-contained utilities (rare)

    return context

def main():
    """Main function with symlink-aware operation"""

    # STANDARD PATTERN: Work in current directory context
    project_name = os.path.basename(os.getcwd())

    # Validate project environment
    if not os.path.exists('.git'):
        print(f"❌ Error: Not in a git repository")
        print(f"   Current directory: {os.getcwd()}")
        print(f"   Expected: Project directory with .git folder")
        return False

    print(f"✅ Operating on project: {project_name}")
    print(f"📁 Working directory: {os.getcwd()}")

    # Context debugging (remove in production)
    context = get_execution_context()
    if context['is_symlinked']:
        print(f"🔗 Script accessed via symlink")
        print(f"   Symlink: {context['script_path']}")
        print(f"   Real location: {context['script_real_location']}")
        print(f"   Working in REALITY: {project_name}")

    # ... rest of script logic here

    return True

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
```

### **STEP 2: SYMLINK BEHAVIOR PATTERNS**

#### **Pattern A: Project Tools (99% of scripts)**

```python
# FOR PROJECT UTILITIES: Work where invoked (Reality)
def project_tool_main():
    # ALWAYS use current working directory
    project_name = os.path.basename(os.getcwd())

    # Work with files relative to current directory
    if not os.path.exists('.git'):
        raise RuntimeError("Must be run from project directory")

    # Operate on current project context
    return operate_on_current_project(project_name)
```

#### **Pattern B: Self-Contained Utilities (rare)**

```python
# FOR STANDALONE UTILITIES: Work from script location (Memorex)
def standalone_utility_main():
    # Use script's actual location
    script_dir = Path(__file__).parent.resolve()
    original_cwd = os.getcwd()

    try:
        os.chdir(script_dir)
        return perform_standalone_operation()
    finally:
        os.chdir(original_cwd)  # Always restore
```

#### **Pattern C: Hybrid/Adaptive Scripts (advanced)**

```python
# FOR ADAPTIVE SCRIPTS: Detect context and adapt
def adaptive_main():
    script_path = Path(sys.argv[0])

    if script_path.is_symlink():
        # Symlinked - assume project tool context
        return project_tool_behavior()
    else:
        # Direct execution - could be standalone
        if os.path.exists('.git'):
            return project_tool_behavior()
        else:
            return standalone_utility_behavior()
```

## 🎯 MANDATORY SYMLINK COMPLIANCE CHECKLIST

### **Before Writing ANY Script:**

- [ ] **Assume Symlinked:** Design as if script will ALWAYS be symlinked
- [ ] **Choose Pattern:** Project tool (A), Standalone (B), or Adaptive (C)
- [ ] **Test Both Ways:** Direct execution AND symlink execution
- [ ] **Validate Context:** Script works in intended environment
- [ ] **Document Behavior:** Clear comments about symlink handling

### **Standard Script Header (ENHANCED for v2.4):**

```python
#!/usr/bin/env python3
# File: ScriptName.py
# Path: ProjectName/path/to/ScriptName.py  
# Standard: AIDEV-PascalCase-2.4
# Created: YYYY-MM-DD
# Last Modified: YYYY-MM-DD  HH:MM[AM|PM]
# Symlink Pattern: [PROJECT_TOOL|STANDALONE|ADAPTIVE]

"""
Description: Brief description of what this script does

Symlink Behavior: 
- Designed to work correctly when accessed via symlink
- Pattern: PROJECT_TOOL (works in current directory context)
- Context: Operates on the project where invoked, not script location
"""
```

### **Mandatory Testing Pattern:**

```bash
# EVERY script must pass both tests:

# Test 1: Direct execution
cd /path/to/project
python /actual/path/to/script.py

# Test 2: Symlinked execution  
cd /path/to/project
python symlinked/path/to/script.py

# BOTH must produce identical behavior for project tools
```

---

## 🧪 SYMLINK DEBUGGING UTILITIES

### **Quick Symlink Test Function:**

```python
def debug_symlink_context():
    """Debug symlink execution context - remove in production"""
    print("🔍 SYMLINK DEBUG INFO:")
    print(f"   Current working dir: {os.getcwd()}")
    print(f"   Script argv[0]: {sys.argv[0]}")
    print(f"   Script is symlink: {Path(sys.argv[0]).is_symlink()}")
    print(f"   Script real path: {Path(sys.argv[0]).resolve()}")
    print(f"   Project name detected: {os.path.basename(os.getcwd())}")
    print(f"   Git repo exists: {os.path.exists('.git')}")
```

### **Memorex vs Reality Test:**

```python
def test_memorex_vs_reality():
    """Verify script operates in Reality, not Memorex"""
    project_from_cwd = os.path.basename(os.getcwd())
    script_real_dir = Path(sys.argv[0]).resolve().parent.name

    if project_from_cwd == script_real_dir:
        print("⚠️  UNCLEAR: CWD matches script location")
    else:
        print(f"✅ REALITY: Working on {project_from_cwd}")
        print(f"📄 Script lives in: {script_real_dir}")
        print(f"🎯 This is REALITY, not Memorex!")

    return project_from_cwd
```

---

## 🚨 CRITICAL ANTI-PATTERNS TO AVOID

### **❌ WRONG - Memorex Behavior:**

```python
# DON'T DO THIS - causes Memorex syndrome
def bad_script():
    script_dir = Path(sys.argv[0]).parent.resolve()  # Follows symlink!
    project_name = script_dir.name                   # Wrong project!
    os.chdir(script_dir)                            # Wrong directory!

    # Now working in script's location, not project context
```

### **❌ WRONG - Naive Path Resolution:**

```python
# DON'T DO THIS - ignores symlink reality
def naive_script():
    # Assumes script is in project directory
    project_name = Path(__file__).parent.name  # Wrong if symlinked!
```

### **❌ WRONG - No Context Validation:**

```python
# DON'T DO THIS - no environment checking  
def unchecked_script():
    # Blindly operates without verifying context
    subprocess.run(['git', 'status'])  # May fail if wrong directory
```

---

## 🎭 THE MEMOREX vs REALITY PRINCIPLE

> **"In a sophisticated development environment, assume every tool may be symlinked. Build for Reality (current context), not Memorex (script location). When in doubt, work where you were invoked."**

**This principle prevents:**

- Scripts operating in wrong directories
- Project misidentification 
- File access failures
- Context sensitivity loss
- Development workflow breaks

**This principle enables:**

- Portable project tooling
- Context-aware utilities
- Robust symlink handling
- Professional development environments
- Predictable script behavior

---

## 📊 COMPLIANCE VALIDATION

### **Automated Compliance Check:**

```python
def validate_v24_compliance(script_path):
    """Validate script follows Design Standard v2.4"""

    with open(script_path, 'r') as f:
        content = f.read()

    violations = []

    # Check for symlink pattern indication
    if 'Symlink Pattern:' not in content:
        violations.append("Missing symlink pattern declaration")

    # Check for context validation
    if 'os.getcwd()' not in content:
        violations.append("Missing current directory usage")

    # Check for defensive programming
    if '.exists()' not in content or '.git' not in content:
        violations.append("Missing environment validation")

    # Check for proper header
    if 'AIDEV-PascalCase-2.4' not in content:
        violations.append("Missing v2.4 standard declaration")

    # Check for security compliance (new in v2.4)
    if any(pattern in content.lower() for pattern in ['client_secret', 'api_key', 'password']):
        violations.append("SECURITY VIOLATION: Credentials found in code")

    return violations
```

---

## 🎯 ENHANCED AI COMPLIANCE FOR v2.4

### **AI Session Protocol - Updated for v2.4:**

**Every AI session working with scripts MUST begin with:**

```
🚨 DESIGN STANDARD v2.4 DISTRIBUTION SECURITY ACKNOWLEDGED 🚨

I commit to the following NON-NEGOTIABLE requirements:
✅ Assume ALL scripts may be accessed via symlinks
✅ Use PROJECT_TOOL pattern for 99% of scripts (work in current dir)
✅ Include symlink-aware context detection
✅ Test both direct AND symlinked execution
✅ Validate project environment before operations
✅ Document symlink behavior in headers
✅ Use actual current time in headers (never placeholders)
✅ Use relative paths from project base
✅ Update Last Modified timestamp on every change
✅ NO credentials in any build artifacts
✅ Pre-build security audit for every build operation
✅ Manual extraction and inspection of all distributions
✅ Environment-based configuration patterns only

VIOLATION OF THESE REQUIREMENTS = IMMEDIATE SESSION RESTART
CREDENTIAL LEAK = PROJECT TERMINATION RISK
```

### **Enhanced Script Creation Checklist:**

When creating ANY script, AI must:

1. **Choose symlink pattern** (PROJECT_TOOL/STANDALONE/ADAPTIVE)
2. **Include context detection** function
3. **Validate execution environment** 
4. **Use defensive path handling**
5. **Add symlink behavior documentation**
6. **Test both execution methods**
7. **Scan for credential patterns** (NEW in v2.4)
8. **Validate build artifacts** if script generates distributions
9. **Implement environment-based configuration** for sensitive data

---

## 🚀 IMPLEMENTATION PRIORITY

**IMMEDIATE (All new scripts and builds):**

- Use PROJECT_TOOL pattern by default
- Include context validation
- Test both execution methods
- **Implement credential-free build processes** (NEW in v2.4)
- **Add security audit to build workflows** (NEW in v2.4)

**SHORT TERM (Existing scripts and systems):**

- Audit for symlink compatibility
- Add context detection
- Update to v2.4 headers
- **Audit existing builds for credential exposure** (NEW in v2.4)
- **Implement environment variable configuration** (NEW in v2.4)

**ONGOING (Development culture):**

- Assume symlink usage in all designs
- Build context-sensitive tooling
- Maintain Reality over Memorex
- **Treat all builds as distribution builds** (NEW in v2.4)
- **Never compromise on credential security** (NEW in v2.4)

---

## 🚨 CRITICAL: DISTRIBUTION SECURITY PROTOCOL (MANDATORY)

### **NEW IN v2.4: CREDENTIAL PROTECTION FRAMEWORK**

**PROBLEM STATEMENT:**
All builds - whether for testing or final distribution - must be completely free of sensitive data. One credential leak can cause unlimited financial damage and complete project compromise.

**CRITICAL PRINCIPLE:**

> **ALL BUILDS ARE DISTRIBUTION BUILDS**
> Whether for testing or production, every build must be clean of sensitive data.

---

## 🛡️ MANDATORY PRE-BUILD SECURITY AUDIT

### **STEP 1: CREDENTIAL ELIMINATION CHECKLIST**

**Before ANY build operation, ALL of the following MUST be verified:**

```markdown
DISTRIBUTION SECURITY AUDIT CHECKLIST:

□ NO production API keys in any files
□ NO OAuth credentials (client_id, client_secret) in codebase  
□ NO database passwords or connection strings
□ NO service account keys or certificates
□ NO authentication tokens or session keys
□ NO email/SMTP credentials
□ NO third-party service API keys
□ NO webhook secrets or signing keys
□ NO encryption keys or certificates
□ NO deployment credentials or access tokens
```

### **STEP 2: BUILD CONTENT INSPECTION (NON-NEGOTIABLE)**

**Every distribution package MUST be extracted and manually audited:**

1. **Extract build artifacts** completely
2. **Search all files** for credential patterns
3. **Verify configuration files** contain only defaults
4. **Check for development artifacts** not intended for distribution
5. **Validate file permissions** and access controls

### **STEP 3: ENVIRONMENT SEPARATION REQUIREMENTS**

**Mandatory separation between development and distribution:**

- Development credentials NEVER in version control
- Production credentials NEVER in build artifacts
- Environment variables for all sensitive configuration
- Separate config files for dev/staging/production environments
- Build processes must explicitly exclude credential directories

---

## 🔒 SECURE CONFIGURATION PATTERNS

### **Pattern A: Environment-Based Configuration**

```json
// CORRECT: Production config with no credentials
{
  "app_name": "OurLibrary",
  "version": "1.0.0",
  "database_type": "sqlite",
  "auth_provider": "google_oauth",
  "features": {
    "offline_mode": true,
    "auto_sync": true
  },
  "ui_config": {
    "theme": "default",
    "language": "en"
  }
}
```

### **Pattern B: Credential Externalization**

```javascript
// CORRECT: Runtime credential loading
function loadCredentials() {
    return {
        clientId: process.env.GOOGLE_CLIENT_ID || 'development-only-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || null,
        apiEndpoint: process.env.API_ENDPOINT || 'https://api.example.com'
    };
}
```

### **Pattern C: Development Mode Detection**

```javascript
// CORRECT: Environment-aware configuration
function getConfiguration() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        return loadDevelopmentConfig();
    } else {
        return loadProductionConfig();
    }
}
```

---

## ⚠️ CRITICAL ANTI-PATTERNS

### **❌ NEVER DO THIS:**

```json
// WRONG: Credentials in configuration files
{
  "client_id": "71206584632-q40tcfnhmjvtj2mlikc8lakk9vrhkngi.apps.googleusercontent.com",
  "client_secret": "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",
  "database_url": "mysql://user:password@localhost:3306/db"
}
```

```javascript
// WRONG: Hardcoded credentials in code
const API_KEY = "sk-1234567890abcdef";
const DB_PASSWORD = "my_secret_password";
```

---

## 🔍 BUILD VALIDATION PROTOCOL

### **Automated Security Scanning**

```bash
# REQUIRED: Run before every build
function scan_for_credentials() {
    echo "🔍 Scanning for credential patterns..."

    # Search for common credential patterns
    grep -r "client_secret" --exclude-dir=node_modules .
    grep -r "api_key" --exclude-dir=node_modules .  
    grep -r "password" --exclude-dir=node_modules .
    grep -r "secret" --exclude-dir=node_modules .
    grep -r "token" --exclude-dir=node_modules .

    echo "✅ Credential scan complete"
}
```

### **Distribution Package Audit**

```bash
# REQUIRED: Extract and inspect every build
function audit_distribution() {
    PACKAGE_PATH=$1
    EXTRACT_DIR="./audit_extract"

    echo "🔍 Extracting distribution package..."
    # Extract AppImage, .exe, .dmg, etc.
    extract_package "$PACKAGE_PATH" "$EXTRACT_DIR"

    echo "🔍 Scanning extracted files..."
    find "$EXTRACT_DIR" -type f -name "*.json" -exec grep -l "secret\|key\|password" {} \;
    find "$EXTRACT_DIR" -type f -name "*.js" -exec grep -l "secret\|key\|password" {} \;

    echo "✅ Distribution audit complete"
}
```

---

## 📋 PRE-DISTRIBUTION CHECKLIST

### **MANDATORY VERIFICATION BEFORE ANY RELEASE:**

```markdown
PRE-DISTRIBUTION SECURITY CHECKLIST:

Build Security:
□ Credential scan completed with no findings
□ Distribution package extracted and audited
□ Configuration files contain only non-sensitive defaults
□ Environment variables used for all sensitive data
□ No development artifacts in build output

Testing Security:
□ Clean build tested on separate system
□ Application functions without development credentials
□ Error handling works with missing/invalid credentials
□ Fallback behavior verified for offline scenarios

Distribution Security:
□ Package signed with appropriate certificates
□ File permissions correctly set
□ No sensitive metadata in package info
□ Version control tags match build artifacts
□ Documentation contains no sensitive information
```

---

## 🚨 VIOLATION CONSEQUENCES

### **SECURITY BREACH SEVERITY LEVELS:**

**CRITICAL (Project Termination Risk):**

- Production OAuth credentials in distribution
- Database passwords in build artifacts
- API keys accessible in package files

**SEVERE (Major Security Risk):**

- Development credentials in builds
- Sensitive configuration data exposed
- Authentication tokens in source code

**MODERATE (Security Concern):**

- Internal system information exposed
- Debug information in production builds
- Verbose error messages revealing system details

### **MANDATORY RESPONSE PROTOCOL:**

**If ANY credentials found in distribution:**

1. **STOP all distribution immediately**
2. **Revoke ALL exposed credentials**
3. **Audit complete codebase for other exposures**
4. **Implement additional security controls**
5. **Re-test entire build and distribution process**

---

## 🎯 AI COMPLIANCE FOR v2.4

### **Enhanced AI Session Protocol:**

**Every AI session involving builds MUST begin with:**

```
🚨 DESIGN STANDARD v2.4 DISTRIBUTION SECURITY ACKNOWLEDGED 🚨

I commit to the following NON-NEGOTIABLE security requirements:
✅ NO credentials in any build artifacts
✅ Pre-build security audit for every build operation
✅ Manual extraction and inspection of all distributions
✅ Environment-based configuration patterns only
✅ Separate development and production credential management
✅ Automated security scanning before builds
✅ Complete package auditing before any release
✅ Proper credential externalization patterns

CREDENTIAL LEAK = IMMEDIATE PROJECT TERMINATION RISK
```

---

## 🏆 DESIGN STANDARD EVOLUTION SUMMARY

- **v1.8:** Basic header compliance
- **v1.8a:** Timestamp accuracy 
- **v1.9:** Enhanced accountability
- **v2.0:** Process improvements
- **v2.1:** Multi-session tracking
- **v2.2:** Relative path requirements
- **v2.3:** Symlink-aware defensive patterns
- **v2.4:** **Symlink-aware development + Distribution security framework** ← **YOU ARE HERE**

---

## 🔐 THE DISTRIBUTION SECURITY PRINCIPLE

> **"Every build is a distribution build. Every distribution must be credential-free. One leak can end the project."**

**This principle prevents:**

- Financial liability from exposed API keys
- Unauthorized access to production systems  
- Complete project security compromise
- User privacy violations
- Service abuse and billing attacks

**This principle enables:**

- Safe public distribution
- Secure testing environments
- Professional deployment practices
- Regulatory compliance
- User trust and confidence

---

**BOTTOM LINE: Design Standard v2.4 extends v2.3's symlink-aware development patterns with mandatory distribution security protocols. This addresses the critical "Memorex vs Reality" symlink problem while establishing ironclad security for all build operations. No exceptions, no compromises, no credentials in builds. Together, these frameworks enable sophisticated cross-project tooling while protecting against project-ending security breaches.**