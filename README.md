# 🌾 AgriTracker Pro - Farmers Management System

A comprehensive farmers management system built with React, TypeScript, and modern web technologies. Features a beautiful glassmorphism UI design and complete CRUD operations for managing farmers, lands, crops, and transactions.

![AgriTracker Pro](https://img.shields.io/badge/Version-1.0.0-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)
![Tests](https://img.shields.io/badge/Tests-Vitest-green.svg)

## ✨ Features

### 🚀 Core Functionality
- **👨‍🌾 Farmers Management**: Complete farmer profiles with personal and agricultural information
- **🏞️ Land Management**: Track land parcels, soil types, and locations
- **🌱 Crop Management**: Monitor crop lifecycle from planting to harvest
- **💰 Transaction Management**: Record sales, purchases, and financial transactions
- **📊 Dashboard Analytics**: Real-time insights and data visualization
- **📈 Reports & Analytics**: Comprehensive reporting system
- **⚙️ Settings**: Application configuration and Supabase integration

### 🎨 UI/UX Features
- **✨ Glassmorphism Design**: Modern glass-effect UI with emerald-teal gradient theme
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🔍 Advanced Search & Filtering**: Multi-criteria search across all modules
- **🌐 PWA Ready**: Progressive Web App capabilities
- **♿ Accessibility**: WCAG compliant interface

### 🔧 Technical Features
- **☁️ Supabase Integration**: Cloud database connectivity with real-time sync
- **💾 Local Storage**: Offline-first data persistence
- **🧪 Comprehensive Testing**: Unit, integration, and end-to-end tests
- **📊 Chart.js Integration**: Beautiful data visualizations
- **🔄 Real-time Updates**: Live data synchronization
- **🛡️ Type Safety**: Full TypeScript implementation

## 🛠️ Technology Stack

- **Frontend**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.4
- **Charts**: Chart.js + React-Chartjs-2
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/agritracker-pro.git
   cd agritracker-pro
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
# Build the application
pnpm build

# Preview the build
pnpm preview
```

## 🧪 Testing

AgriTracker Pro includes a comprehensive testing suite covering all features:

### Test Commands

```bash
# Run tests in watch mode
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run with coverage report
pnpm test:coverage

# Run with visual UI
pnpm test:ui
```

### Test Coverage

- ✅ **Component Tests**: All UI components with user interactions
- ✅ **Integration Tests**: Complete CRUD workflows
- ✅ **Utility Tests**: Supabase integration and data utilities
- ✅ **Responsive Tests**: Mobile and desktop viewport testing
- ✅ **Error Handling**: Edge cases and error scenarios

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing information.

## 🗂️ Project Structure

```
src/
├── components/           # React components
│   ├── AnalyticsManager.tsx
│   ├── CropsManager.tsx
│   ├── Dashboard.tsx
│   ├── FarmersManager.tsx
│   ├── LandsManager.tsx
│   ├── Navigation.tsx
│   ├── ReportsManager.tsx
│   ├── SettingsManager.tsx
│   ├── TransactionsManager.tsx
│   └── __tests__/       # Component tests
├── types/
│   └── index.ts         # TypeScript interfaces
├── utils/
│   ├── supabase.ts      # Supabase integration
│   ├── sync.ts          # Data synchronization
│   └── __tests__/       # Utility tests
├── test/
│   ├── setup.ts         # Test configuration
│   └── utils.tsx        # Test utilities
└── __tests__/           # Integration tests
```

## ☁️ Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your credentials**:
   - Project URL: `https://your-project.supabase.co`
   - API Key: Your project's anon/public key

3. **Configure in the app**:
   - Go to Settings → Supabase Config
   - Enter your URL and API Key
   - Test the connection

## 📊 Data Models

### Farmer
```typescript
interface Farmer {
  id: string
  firstName: string
  lastName: string
  phone: string
  address: string
  barangay: string
  municipality: string
  province: string
  totalHectares: number
  datePlanted?: string
  dateHarvested?: string
  dateRegistered: string
  isActive: boolean
}
```

### Land, Crop, Transaction
See [src/types/index.ts](./src/types/index.ts) for complete type definitions.

## 🎯 Usage Examples

### Adding a New Farmer
1. Navigate to **Farmers** module
2. Click **Add Farmer** button
3. Fill in the required information
4. Save to persist locally and sync to Supabase

### Tracking Crop Lifecycle
1. Go to **Crops** module
2. Add new crop with planting details
3. Update status as crop grows
4. Record harvest data when ready

### Financial Tracking
1. Use **Transactions** module
2. Record sales and purchases
3. View revenue analytics in **Dashboard**

## 🔧 Configuration

### Environment Variables (Optional)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Customization
- **Colors**: Modify Tailwind config for theme changes
- **Components**: All components are modular and customizable
- **Data Models**: Extend types in `src/types/index.ts`

## 📱 Mobile Support

AgriTracker Pro is fully responsive and optimized for:
- 📱 Mobile phones (320px+)
- 📟 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1440px+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Make changes and test
   pnpm test:watch
   
   # Build and verify
   pnpm build
   ```

2. **Testing**
   ```bash
   # Run all tests
   pnpm test:run
   
   # Check coverage
   pnpm test:coverage
   ```

3. **Code Quality**
   ```bash
   # Lint code
   pnpm lint
   
   # Type check
   pnpm build
   ```

## 🐛 Known Issues

- Chart rendering may show warnings in test environment (mocked components)
- Some form labels in tests need accessibility improvements
- Supabase mock setup requires refinement for complete test coverage

## 🔮 Future Enhancements

- [ ] **Multi-language Support**: Internationalization (i18n)
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Mobile App**: React Native version
- [ ] **Offline Sync**: Advanced conflict resolution
- [ ] **Export Features**: PDF/Excel report generation
- [ ] **User Management**: Multi-user support with roles
- [ ] **Weather Integration**: Weather data for crop planning
- [ ] **Marketplace**: Connect farmers with buyers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Supabase** for the backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **Chart.js** for beautiful data visualizations
- **Vitest** for the modern testing framework

## 📞 Support

If you have any questions or need help:

1. **Documentation**: Check this README and [TESTING_GUIDE.md](./TESTING_GUIDE.md)
2. **Issues**: Create an issue on GitHub
3. **Discussions**: Use GitHub Discussions for questions

---

<div align="center">

**🌾 Built with ❤️ for farmers and agricultural communities 🌾**

[⭐ Star this repo](https://github.com/yourusername/agritracker-pro) if you found it helpful!

</div> 