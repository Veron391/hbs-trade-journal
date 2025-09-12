# Trade Journal App

A comprehensive trading journal application with both student-facing and administrative interfaces, built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

### Student Panel
- **Trade Management**: Add, edit, and track trading activities
- **Statistics Dashboard**: Comprehensive trading analytics with charts
- **Calendar View**: Visual trade calendar with daily trade details
- **Profile Management**: User settings and API key configuration
- **Real-time Data**: Live trading data integration

### Admin Panel
- **User Management**: Monitor and manage all students
- **Risk Monitoring**: Real-time risk assessment and alerts
- **Analytics Dashboard**: Platform-wide statistics and KPIs
- **Trades Log**: Complete trading activity monitoring
- **Filter System**: Advanced filtering and search capabilities

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd trade-journal-app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Configuration (if using real APIs)
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_BINANCE_API_URL=https://api.binance.com

# Database (if using real database)
DATABASE_URL=your_database_url

# Authentication (if using real auth)
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
trade-journal-app/
├── app/
│   ├── (student)/              # Student-facing pages
│   │   ├── calendar/
│   │   ├── profile/
│   │   ├── stats/
│   │   └── page.tsx
│   ├── admin/                  # Admin panel
│   │   ├── dashboard/
│   │   ├── risk/
│   │   ├── trades/
│   │   └── users/
│   ├── auth/                   # Authentication pages
│   ├── components/             # Feature-based components
│   │   ├── admin/              # Admin-specific components
│   │   ├── charts/             # Chart components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # Reusable UI components
│   ├── context/                # React contexts
│   ├── services/               # API services
│   └── types.ts               # TypeScript type definitions
├── lib/                       # Utility libraries
│   ├── filters.ts             # Filter state management
│   ├── mock.ts                # Mock data service
│   └── rules.ts               # Risk monitoring rules
├── public/                    # Static assets
└── scripts/                   # Utility scripts
```

## 🎯 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Database (if using real database)
```bash
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database
```

### Testing
```bash
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS with custom configuration in `tailwind.config.js`:

- **Dark Mode**: Class-based dark mode
- **Custom Colors**: Admin theme colors
- **Custom Shadows**: Glassmorphism effects
- **Font Family**: Inter font family

### TypeScript
Strict TypeScript configuration with:
- `noImplicitAny`: true
- `strictNullChecks`: true
- `noUnusedLocals`: true
- `noUnusedParameters`: true

## 📊 Component Architecture

### Feature-Based Organization
Components are organized by feature rather than type:

- **admin/**: Admin panel components
- **charts/**: Data visualization components
- **dashboard/**: Dashboard-specific components
- **forms/**: Form components
- **layout/**: Layout and navigation components
- **ui/**: Reusable UI components

### Component Guidelines
- Use TypeScript interfaces for props
- Implement proper accessibility (ARIA labels, keyboard navigation)
- Follow consistent naming conventions
- Use memo() for performance optimization where appropriate

## 🎨 Styling Guidelines

### Design System
- **Colors**: Consistent color palette with semantic naming
- **Spacing**: Tailwind's spacing scale
- **Typography**: Inter font family with consistent sizing
- **Shadows**: Custom shadow system for depth
- **Borders**: Rounded corners and consistent border styles

### Glassmorphism Effects
Used in filter components and modals:
```css
backdrop-blur-md bg-white/5 border border-white/10
```

## 🔐 Authentication

The app uses a mock authentication system with localStorage. In production, replace with:
- NextAuth.js
- Auth0
- Firebase Auth
- Custom JWT implementation

## 📈 Data Management

### Mock Data Service
Located in `lib/mock.ts`, provides:
- User data generation
- Trade data simulation
- Risk metrics calculation
- Filtered data methods

### State Management
- **Zustand**: Global filter state
- **React Context**: Authentication and trade data
- **Local State**: Component-specific state

## 🚨 Risk Monitoring

### Alert Rules
Defined in `lib/rules.ts`:
- **Equity Drop**: >20% in 7 days → Red alert
- **Low Win Rate**: <35% with >50 trades → Amber alert
- **High Exposure**: >60% of balance → Amber alert

### Risk Metrics
- Largest drawdown tracking
- High frequency trading detection
- Leverage usage monitoring
- Real-time alert generation

## 🧪 Testing

### Test Structure
```
__tests__/
├── components/          # Component tests
├── pages/              # Page tests
├── utils/              # Utility tests
└── __mocks__/          # Mock files
```

### Testing Guidelines
- Use React Testing Library
- Test user interactions, not implementation details
- Mock external dependencies
- Aim for >80% code coverage

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Static site generation
- **AWS**: EC2 or Lambda deployment
- **Docker**: Containerized deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- Database connection strings
- Authentication secrets

## 📝 API Integration

### Binance API
The app includes mock integration with Binance API for:
- Trade data fetching
- Real-time price updates
- Historical data retrieval

### Custom API Endpoints
- `/api/trades` - Trade management
- `/api/users` - User management
- `/api/analytics` - Statistics and analytics

## 🔧 Development Guidelines

### Code Style
- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Git Workflow
- Use feature branches
- Write descriptive commit messages
- Use conventional commits format
- Review code before merging

### Performance
- Use React.memo() for expensive components
- Implement proper loading states
- Optimize images and assets
- Use dynamic imports for code splitting

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

#### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Hook Form](https://react-hook-form.com)
- [Recharts Documentation](https://recharts.org)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Happy Trading! 📈**