# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-09-02 - Complete PlayFab Migration

### BREAKING CHANGES
- **Architecture**: Converted from full-stack to static site with PlayFab-only backend
- **Deployment**: Removed Express server, now deploys as static site via Railway
- **Task Storage**: Removed 155 local task files, now uses PlayFab Title Data exclusively

### Added
- Complete static site deployment configuration (Railway + nixpacks)
- PlayFab-only data flow (matches Unity implementation exactly)
- Client-side task validation with PlayFab progress tracking
- Pure CDN deployment with zero server infrastructure

### Changed  
- **package.json**: Removed server build/dev scripts, pure Vite workflow
- **README**: Completely rewritten for static + PlayFab architecture
- **CLAUDE.md**: Updated to reflect PlayFab-only data access patterns
- **Build Process**: Static site build only, no server compilation

### Removed
- **server/data/tasks/**: 155 task JSON files (now in PlayFab Title Data)
- **Express Server**: No longer deployed or needed in production
- **API Endpoints**: All functionality moved to PlayFab cloud services

### Migration Complete
- ✅ **Phase 1**: 155 tasks migrated to PlayFab Title Data  
- ✅ **Phase 2**: React components using PlayFab service
- ✅ **Phase 3**: Static deployment configuration
- ✅ **Phase 4**: Server cleanup and documentation updates

**Result**: Pure static web app with PlayFab cloud backend - matches Unity implementation.

---

## [0.0.2] - 2025-09-02

### Changed
- Updated README with PlayFab integration details

## [0.0.1] - 2025-09-02 7:41 PM - Claude 4 Sonnet Thinking via Cascade

### Added
- PlayFab service integration for task management
- Task migration script for PlayFab
- PlayFab Task Migration Plan documentation
- Feature Parity Plan documentation

### Changed
- Updated FIQTest to use PlayFab service instead of server API
- Refactored task loading to support PlayFab backend

### Fixed
- Various bug fixes and performance improvements
