# File: Design Standard v2.3.md

# Path: Docs/Standards/Design Standard v2.3.md

# Standard: AIDEV-PascalCase-2.3

# Created: 2025-07-21

# Last Modified: 2025-07-21  12:30PM

"""
Description: Design Standard v2.3 - Symlink-Aware Development Framework
Extends v2.2 with mandatory symlink handling patterns for context-sensitive tooling
"""

---

# Design Standard v2.3 - Symlink-Aware Development Framework

## Author & Project

**Author:** Herb Bowers  
**Project:** Project Himalaya  
**Contact:** HimalayaProject1@gmail.com  
**Evolution:** v1.8 → v1.8a → v1.9 → v2.0 → v2.1 → v2.2 → **v2.3**

---

## 🚨 CRITICAL: THE "MEMOREX vs REALITY" PROBLEM

### **NEW IN v2.3: SYMLINK IDENTITY CRISIS**

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
# Standard: AIDEV-PascalCase-2.3
# Created: YYYY-MM-DD
# Last Modified: YYYY-MM-DD  HH:MM[AM|PM]

"""
SYMLINK-AWARE SCRIPT: Designed to work correctly whether accessed 
directly or via symlink. Follows Design Standard v2.3.
"""

import os
import sys
from pathlib import Path

def get_execution_context():
    """
    Symlink-aware context detection following Design Standard v2.3

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

---

## 🎯 MANDATORY SYMLINK COMPLIANCE CHECKLIST

### **Before Writing ANY Script:**

- [ ] **Assume Symlinked:** Design as if script will ALWAYS be symlinked
- [ ] **Choose Pattern:** Project tool (A), Standalone (B), or Adaptive (C)
- [ ] **Test Both Ways:** Direct execution AND symlink execution
- [ ] **Validate Context:** Script works in intended environment
- [ ] **Document Behavior:** Clear comments about symlink handling

### **Standard Script Header (ENHANCED for v2.3):**

```python
#!/usr/bin/env python3
# File: ScriptName.py
# Path: ProjectName/path/to/ScriptName.py  
# Standard: AIDEV-PascalCase-2.3
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

## 🎯 ENHANCED AI COMPLIANCE FOR v2.3

### **AI Session Protocol - Updated:**

**Every AI session working with scripts MUST begin with:**

```
🚨 DESIGN STANDARD v2.3 SYMLINK COMPLIANCE ACKNOWLEDGED 🚨

I commit to the following NON-NEGOTIABLE symlink requirements:
✅ Assume ALL scripts may be accessed via symlinks
✅ Use PROJECT_TOOL pattern for 99% of scripts (work in current dir)
✅ Include symlink-aware context detection
✅ Test both direct AND symlinked execution
✅ Validate project environment before operations
✅ Document symlink behavior in headers
✅ Use actual current time in headers (never placeholders)
✅ Use relative paths from project base
✅ Update Last Modified timestamp on every change

VIOLATION OF THESE REQUIREMENTS = IMMEDIATE SESSION RESTART
```

### **Script Creation Checklist:**

When creating ANY script, AI must:

1. **Choose symlink pattern** (PROJECT_TOOL/STANDALONE/ADAPTIVE)
2. **Include context detection** function
3. **Validate execution environment** 
4. **Use defensive path handling**
5. **Add symlink behavior documentation**
6. **Test both execution methods**

---

## 📊 COMPLIANCE VALIDATION

### **Automated Compliance Check:**

```python
def validate_v23_compliance(script_path):
    """Validate script follows Design Standard v2.3"""

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
    if 'AIDEV-PascalCase-2.3' not in content:
        violations.append("Missing v2.3 standard declaration")

    return violations
```

---

## 🏆 DESIGN STANDARD EVOLUTION SUMMARY

- **v1.8:** Basic header compliance
- **v1.8a:** Timestamp accuracy 
- **v1.9:** Enhanced accountability
- **v2.0:** Process improvements
- **v2.1:** Multi-session tracking
- **v2.2:** **Relative path requirements**
- **v2.3:** **Symlink-aware defensive patterns** ← **YOU ARE HERE**

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

## 🚀 IMPLEMENTATION PRIORITY

**IMMEDIATE (All new scripts):**

- Use PROJECT_TOOL pattern by default
- Include context validation
- Test both execution methods

**SHORT TERM (Existing scripts):**

- Audit for symlink compatibility
- Add context detection
- Update to v2.3 headers

**ONGOING (Development culture):**

- Assume symlink usage in all designs
- Build context-sensitive tooling
- Maintain Reality over Memorex

---

**BOTTOM LINE: Design Standard v2.3 addresses the critical "Memorex vs Reality" problem in symlink-heavy development environments. This is the pattern that enables sophisticated cross-project tooling while maintaining predictable, context-aware script behavior. All scripts must assume they will be symlinked and defend accordingly.**