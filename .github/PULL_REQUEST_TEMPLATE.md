# Pull Request

## Description
<!-- Describe your changes in detail -->

## Type of Change
<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Test addition/update

## Checklist

### Code Quality
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] No console.log statements in production code
- [ ] No debugger statements

### Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested this on multiple browsers (if frontend change)

### Documentation
- [ ] I have made corresponding changes to the documentation
- [ ] I have updated the README if needed
- [ ] I have added/updated JSDoc comments for new functions

### Frontend Specific
- [ ] Code passes ESLint checks (`npx eslint src/`)
- [ ] Code is formatted with Prettier (`npx prettier --check "src/**/*.{js,jsx,css}"`)
- [ ] Components are responsive and mobile-friendly
- [ ] Accessibility standards are followed
- [ ] Error handling is implemented
- [ ] Loading states are implemented

### Backend Specific
- [ ] Code passes Flake8 checks (`flake8 app/`)
- [ ] Code is formatted with Black (`black app/`)
- [ ] Input validation is implemented (Pydantic)
- [ ] Error handling is implemented
- [ ] API endpoints are documented
- [ ] Database migrations are included (if needed)

### Security
- [ ] No sensitive data (API keys, passwords) in code
- [ ] Environment variables are used for secrets
- [ ] Input validation is implemented
- [ ] SQL injection prevention is considered
- [ ] XSS prevention is considered

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

## Related Issues
<!-- Link to related issues: Fixes #123, Closes #456 -->

## Additional Notes
<!-- Any additional information that reviewers should know -->

