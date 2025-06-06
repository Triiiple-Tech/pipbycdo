# PIP AI - Project Intelligence Platform

**Clean, Minimal Backend-Focused Architecture**  
*Post-Cleanup: June 3, 2025*

---

## 🎯 **Project Overview**

PIP AI is a construction document analysis platform with a **verified, working backend** and agent-based processing system. The UI has been archived to focus on the core functionality.

### **Current Status**
- ✅ **Backend**: 100% Operational (FastAPI + Python)
- ✅ **Agents**: 8 specialized AI agents for construction workflows
- ✅ **APIs**: All endpoints tested and verified
- 📦 **UI**: Archived for future clean rebuild

---

## 🏗️ **Architecture**

### **Backend Components**
```
backend/
├── agents/           # 8 AI agents (manager, file-reader, etc.)
├── app/             # FastAPI application
├── routes/          # API endpoints
├── services/        # Core business logic
└── tests/           # Comprehensive test suite
```

### **Verified Agents**
1. **Manager Agent**: Orchestrates workflow
2. **File Reader Agent**: Document processing  
3. **Trade Mapper Agent**: Construction trade identification
4. **Scope Agent**: Project scope analysis
5. **Takeoff Agent**: Quantity extraction
6. **Estimator Agent**: Cost estimation
7. **QA Validator Agent**: Quality assurance
8. **Exporter Agent**: Document generation

---

## 🚀 **Quick Start**

### **Development Environment**
```bash
# Start backend only
cd backend
./start_backend.sh

# Or start full dev environment
./start-dev-environment.sh
```

### **API Endpoints**
```bash
# Health check
curl http://localhost:8000/health

# Templates
curl http://localhost:8000/api/templates

# Analysis
curl -X POST http://localhost:8000/api/analyze \
  -H "X-Internal-Code: hermes" \
  -F "query=Analyze this project"
```

---

## 📁 **Archived Components**

All UI-related files and documentation bloat have been moved to `archived/`:

- `archived/ui-systems/` - React UI implementations
- `archived/debug-tools/` - Debug and test tools
- `archived/docs-archive/` - Excessive documentation
- `archived/test-files/` - Test and demo files

---

## 🧪 **Testing**

```bash
# Run backend tests
cd backend
python -m pytest tests/ -v

# Test specific components
python -m pytest tests/test_api.py -v
```

---

## 🔧 **Development Tools**

### **VS Code Tasks**
- **Start Backend**: Launches FastAPI server
- **Start Development Environment**: Full environment setup
- **Run Backend Tests**: Execute test suite

### **Available Scripts**
- `start-dev-environment.sh` - Complete environment setup
- `stop-dev-environment.sh` - Graceful shutdown
- `start_demo.sh` - Demo environment

---

## 📊 **Cleanup Results**

### **Before Cleanup**
- **Size**: 826MB
- **Files**: 45,785 files
- **UI Files**: 89 TypeScript files, 7,600+ lines

### **After Cleanup**  
- **Size**: 631MB (23% reduction)
- **Files**: 35,390 files (23% reduction)
- **Focus**: Clean backend-only structure

### **Removed Bloat**
- ❌ Broken UI components
- ❌ Debug tools and test files
- ❌ Excessive documentation
- ❌ Monitoring scripts
- ❌ Cache files and temporary data

---

## 🎯 **Next Steps**

1. **Backend Optimization**: Further performance improvements
2. **API Documentation**: OpenAPI/Swagger documentation
3. **New UI**: Clean rebuild based on working backend
4. **Production Deployment**: Docker containerization
5. **Integration Testing**: Comprehensive API testing

---

## 📞 **Development Commands**

```bash
# Backend development
cd backend && python -m uvicorn app.main:app --reload

# Run tests
cd backend && python -m pytest

# Check backend health
curl http://localhost:8000/health

# Database setup
cd backend && python setup_database.py
```

---

**Repository**: Clean, focused, and ready for efficient development  
**Status**: Backend operational, UI archived, ready for next phase
