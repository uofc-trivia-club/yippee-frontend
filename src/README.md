# Yippee Quiz Application Structure

## Directory Structure

```
src/
├── assets/               # Static assets like images, fonts
├── components/           # Reusable UI components
│   ├── common/           # Generic UI components used across features
│   ├── game/             # Game-specific components
│   ├── layout/           # Layout components (Navbar, etc.)
│   ├── quiz/             # Quiz creation & management components
│   └── user/             # User-related components (SignIn, SignUp)
├── hooks/                # Custom React hooks
├── pages/                # Page components that represent routes
├── services/             # API and service layer
├── stores/               # Redux state management
├── styles/               # Global styles and theme config
├── types/                # TypeScript type definitions
└── utils/                # Utility functions and helpers
```

## Importing Components

Always try to use path aliases when importing components for cleaner code.
```tsx
// Good
import { Button } from '@/components/common';

// Avoid
import Button from '../../../../components/common/Button';
```
