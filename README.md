# CBT Platform Frontend

A modern, production-ready frontend for a university Computer-Based Testing (CBT) platform built for Nigerian universities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` to view the application.

## 📋 Tech Stack

- **React 18.3.1** + **TypeScript** - UI library with type safety
- **Vite 6.3.5** - Lightning-fast build tool
- **React Router 7** - Client-side routing
- **TanStack Query** - Server state management & caching
- **Axios** - HTTP client with interceptors
- **React Hook Form + Zod** - Form handling & validation
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI + shadcn/ui** - Accessible component primitives
- **Recharts** - Data visualization
- **React Hot Toast** - Elegant notifications
- **Lucide React** - Beautiful icons

## 🎯 Features Implemented

### 🔐 Complete Authentication System
- ✅ User registration with validation
- ✅ Login with JWT tokens
- ✅ Email verification flow
- ✅ Password reset (forgot & reset)
- ✅ Auto token refresh
- ✅ Protected routes (student & admin)
- ✅ Persistent sessions

### 📚 Academic Structure
- ✅ Universities browsing
- ✅ Faculties, Departments, Courses, Topics
- ✅ Hierarchical navigation
- ✅ Empty states & loading indicators

### 📝 Exam System
- ✅ Dashboard with real-time analytics
- ✅ Active exam detection
- ✅ Exam history
- ✅ Start/Continue exam flows
- ✅ Results viewing
- ⏳ Exam in-progress (needs completion)

### 📊 Analytics
- ✅ Performance metrics (scores, accuracy, time)
- ✅ Improvement indicators
- ✅ Recent activity tracking
- ⏳ Admin analytics (partial)

### 👥 User Management
- ✅ Student dashboard
- ✅ Profile management
- ⏳ Admin user management (setup)

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (40+ components)
│   │   ├── Layout.tsx       # Main layout with nav
│   │   ├── ProtectedRoute.tsx # Route guards
│   │   └── ErrorBoundary.tsx
│   ├── context/
│   │   └── AuthContext.tsx  # Auth state management
│   ├── pages/
│   │   ├── Landing.tsx       # Public landing page
│   │   ├── Login.tsx         # Login page
│   │   ├── Register.tsx      # Registration
│   │   ├── VerifyEmail.tsx   # Email verification
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── Dashboard.tsx     # Student dashboard
│   │   ├── Universities.tsx  # Browse universities
│   │   ├── Faculties.tsx
│   │   ├── Departments.tsx
│   │   ├── Courses.tsx
│   │   ├── Topics.tsx
│   │   ├── ExamHistory.tsx
│   │   ├── ExamInProgress.tsx
│   │   ├── ExamResults.tsx
│   │   ├── StartExam.tsx
│   │   ├── Analytics.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── StudyMaterials.tsx
│   │   ├── Plans.tsx
│   │   ├── NotFound.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── UserManagement.tsx
│   │       └── QuestionBank.tsx
│   ├── App.tsx
│   └── routes.ts            # Route configuration
├── lib/
│   ├── services/            # API service layer
│   │   ├── auth.service.ts
│   │   ├── exam.service.ts
│   │   ├── question.service.ts
│   │   ├── academic.service.ts
│   │   ├── material.service.ts
│   │   ├── analytics.service.ts
│   │   ├── studyPlan.service.ts
│   │   ├── leaderboard.service.ts
│   │   ├── payment.service.ts
│   │   └── index.ts
│   ├── api.ts               # Axios config + interceptors
│   └── query.tsx            # TanStack Query setup
├── types/
│   └── index.ts             # TypeScript interfaces (all models)
└── styles/                  # Global CSS

## 🔌 API Integration

**Base URL:** `https://cbt-1nas.onrender.com`

All API services are fully implemented with TypeScript interfaces:
- Authentication (login, register, verify, reset)
- Academic structure (universities → topics)
- Exams (start, answer, submit, results, history)
- Questions (CRUD, approve, reject, search)
- Materials (upload, generate questions)
- Analytics (student & admin)
- Study plans, Leaderboard, Payments

### Authentication Flow
- JWT tokens stored in localStorage
- Axios interceptor auto-adds `Authorization: Bearer <token>`
- Automatic token refresh on 401 errors
- Refresh requests always send credentials/cookies (`withCredentials: true`)
- Request queue during refresh to prevent race conditions
- Multi-device sessions supported by backend refresh-session tracking
- Logout revokes only the current device/session token
- Password reset revokes all sessions across devices

### Production Cookie Requirements
- Frontend and API must both run over HTTPS in production
- For cross-site refresh cookies, backend must set `SameSite=None; Secure`
- API base URL should be HTTPS (`VITE_API_BASE_URL=https://...`)

## 🛣️ Route Structure

### Public
- `/` - Landing
- `/login` - Login
- `/register` - Register
- `/forgot-password` - Request reset
- `/reset-password` - Confirm reset
- `/verify-email` - Verify email

### Protected (Student)
- `/dashboard` - Main dashboard
- `/universities` - Browse structure
- `/exams` - Exam history
- `/exams/start` - Start exam
- `/exams/:id/in-progress` - Active exam
- `/exams/:id/results` - Results
- `/analytics` - Performance
- `/leaderboard` - Rankings
- `/materials` - Study materials
- `/plans` - Subscriptions

### Protected (Admin)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/questions` - Question bank

## 🛡️ Security & Best Practices

✅ Protected routes with role-based access  
✅ JWT token management with refresh  
✅ XSS protection  
✅ Type-safe API calls  
✅ Error boundaries  
✅ Loading & empty states  
✅ Toast notifications  
✅ Responsive design  
✅ Accessible components (Radix UI)  
✅ Service layer architecture  
✅ Query caching & invalidation  

## 🎨 UI/UX Features

- **Responsive**: Mobile-first design
- **Animations**: Smooth transitions
- **Loading States**: Skeletons & spinners
- **Empty States**: Helpful placeholders
- **Error Handling**: User-friendly messages
- **Notifications**: Toast for success/error
- **Dark Theme Ready**: CSS variables in place
- **Accessibility**: ARIA labels, keyboard nav

## 📦 Environment Setup

Create `.env` file:
```
VITE_API_BASE_URL=https://cbt-1nas.onrender.com
```

## 🚧 Next Steps (TODO)

### High Priority
- [ ] Complete exam in-progress functionality
- [ ] Implement question navigation with flagging
- [ ] Add countdown timer for exams
- [ ] Auto-submit on time expiry
- [ ] Full analytics dashboard
- [ ] Leaderboard with filters
- [ ] Study plans CRUD UI
- [ ] Material viewer

### Medium Priority
- [ ] Admin question approval workflow
- [ ] Material upload with progress bar
- [ ] AI question generation UI
- [ ] Payment gateway (Paystack) integration
- [ ] User profile editor
- [ ] Settings page
- [ ] Notification center

### Low Priority
- [ ] Dark mode toggle
- [ ] Offline support (PWA)
- [ ] Export results (PDF)
- [ ] Print exam results
- [ ] Social features (share achievements)

## 🐛 Known Issues

1. Dashboard shows empty state until API responds
2. Some admin pages need full implementation
3. Material content viewer pending
4. Payment integration incomplete

## 📝 API Service Example

```typescript
// Using the service layer
import { examService } from '@/lib/services';

// Start an exam
const exam = await examService.startExam({
  topicId: 'topic-123',
  numberOfQuestions: 20,
  duration: 30
});

// With TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['exam', examId],
  queryFn: () => examService.getSummary(examId)
});
```

## 🤝 Contributing

1. Follow existing code patterns
2. Use TypeScript types
3. Add loading/error states
4. Write responsive components
5. Test on mobile

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for Nigerian Universities**
  