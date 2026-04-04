# Contributing to DeepVision

Thank you for your interest in contributing to DeepVision! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## 🚀 Getting Started

### 1. Fork & Clone
```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/deepvision.git
cd deepvision
```

### 2. Setup Development Environment
```bash
# Follow the setup guide
# See docs/setup/README.md
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 📝 Development Guidelines

### Code Style

#### Python (Backend)
- Follow PEP 8
- Use type hints
- Write docstrings
- Keep functions small and focused

```python
def get_user_by_id(user_id: str) -> UserPublic:
    """
    Fetch user by ID from database.
    
    Args:
        user_id: UUID of the user
        
    Returns:
        UserPublic: User data
        
    Raises:
        HTTPException: If user not found
    """
    # Implementation
```

#### JavaScript/React (Frontend)
- Use ES6+ features
- Functional components with hooks
- Descriptive variable names
- Keep components small

```javascript
// Good
const UserCard = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="user-card">
      {/* Component content */}
    </div>
  );
};
```

### Commit Messages

Follow conventional commits:

```
feat: add user profile page
fix: resolve login redirect issue
docs: update setup guide
style: format code with prettier
refactor: simplify error handling
test: add user service tests
chore: update dependencies
```

### Testing

#### Backend Tests
```bash
cd backend
pytest tests/
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Documentation

- Update relevant documentation
- Add JSDoc/docstrings
- Update README if needed
- Include examples

## 🔄 Pull Request Process

### 1. Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Tested locally

### 2. Submit PR

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### 3. Review Process

- Maintainers will review your PR
- Address feedback promptly
- Keep PR focused and small
- Be patient and respectful

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try latest version
3. Gather information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

**Additional context**
Any other information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution**
How you'd like it to work

**Describe alternatives**
Other solutions you've considered

**Additional context**
Mockups, examples, etc.
```

## 📁 Project Structure

```
deepvision/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── database/         # SQL scripts
├── docs/            # Documentation
└── ai_models/       # AI models
```

See [docs/architecture/folder-structure.md](docs/architecture/folder-structure.md) for details.

## 🎯 Areas to Contribute

### Good First Issues
- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Test coverage

### Advanced
- New features
- Performance optimization
- Security improvements
- Architecture changes

## 📚 Resources

- [Setup Guide](docs/setup/README.md)
- [Architecture Docs](docs/architecture/)
- [API Documentation](docs/api/)
- [Best Practices](docs/architecture/best-practices.md)

## 🙏 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in commits

## 📞 Questions?

- Open a discussion on GitHub
- Join our Discord
- Email: dev@deepvision.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to DeepVision! 🎉**
