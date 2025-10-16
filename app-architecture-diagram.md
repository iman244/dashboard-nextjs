# Application Flow Architecture Diagram

## Subject: Next.js Authentication Application with TanStack Query & Djoser Integration

This diagram visualizes the complete architecture, data flow, and state management in your Next.js authentication application built with TanStack Query, Djoser backend integration, and sophisticated side effects pattern.

```mermaid
graph TB
    %% Entry Points
    Start([User Visits App]) --> RootLayout[Root Layout<br/>- HTML Structure<br/>- Global Styles]
    RootLayout --> Provider[Main Provider]
    
    %% Provider Hierarchy
    Provider --> GlobalProvider[Global Provider<br/>- Network Error State<br/>- Global UI State]
    GlobalProvider --> QueryClientProvider[QueryClient Provider<br/>- TanStack Query<br/>- Cache Management]
    QueryClientProvider --> AuthProvider[Auth Provider<br/>- Authentication State<br/>- Token Management]
    AuthProvider --> ThemeProvider[Theme Provider<br/>- Dark/Light Mode<br/>- System Theme]
    ThemeProvider --> AppContent[App Content]
    
    %% Global State & Error Handling
    GlobalProvider --> GlobalState[Global State<br/>- networkErrorOpen<br/>- setNetworkErrorOpen]
    GlobalState --> NetworkErrorDialog[Network Error Dialog<br/>- Global Error UI<br/>- Retry Mechanism]
    
    %% Authentication State Management
    AuthProvider --> AuthState[Auth State<br/>- authStatus: Loading/Authenticated/Unauthenticated<br/>- isAuthenticated<br/>- AuthenticateUser<br/>- unauthenticateUser]
    AuthState --> JwtTokenHook[useJwtToken Hook<br/>- Token Storage/Retrieval<br/>- Token Validation]
    AuthState --> TokenVerification[Token Verification<br/>- jwt_verify API<br/>- Automatic Token Validation]
    
    %% Data Layer & API Integration
    QueryClientProvider --> DataLayer[Data Layer<br/>- API Instance<br/>- Axios Interceptors<br/>- Authorization Headers]
    DataLayer --> DjangoAPI[Django API<br/>- Djoser Endpoints<br/>- JWT Authentication<br/>- User Management]
    
    %% API Endpoints
    DjangoAPI --> AuthEndpoints[Auth Endpoints<br/>- /auth/jwt/create<br/>- /auth/jwt/refresh<br/>- /auth/jwt/verify]
    DjangoAPI --> UserEndpoints[User Endpoints<br/>- /auth/users/me<br/>- /auth/users/<br/>- User CRUD Operations]
    
    %% Side Effects Architecture
    AuthState --> SideEffects[Side Effects Layer<br/>- Reactive State Management<br/>- Route Protection<br/>- Error Handling]
    
    %% Individual Side Effects
    SideEffects --> AuthorizedHook[useAuthorized Hook<br/>- Route Protection<br/>- Authenticated User Routing]
    SideEffects --> UnauthorizedHook[useUnauthorized Hook<br/>- 401 Error Handling<br/>- Token Cleanup]
    SideEffects --> NetworkErrorHook[useNetworkError Hook<br/>- Network Error Detection<br/>- Global Error State]
    
    %% Routing Logic & Protection
    AuthorizedHook --> RouteProtection{Route Protection Logic}
    RouteProtection --> ProtectedRouteCheck{Protected Route?}
    ProtectedRouteCheck -->|Yes + Not Authenticated| RedirectToAuth[Redirect to /authentication<br/>- Preserve intended destination]
    ProtectedRouteCheck -->|No| ContinueToPage[Continue to Page]
    
    UnauthorizedHook --> UnauthorizedCheck{401 Error Detected?}
    UnauthorizedCheck -->|Yes| ClearToken[Clear Access Token<br/>- Remove from localStorage<br/>- Reset Auth State]
    ClearToken --> RedirectToAuth
    
    NetworkErrorHook --> NetworkCheck{Network Error?}
    NetworkCheck -->|Yes| ShowNetworkDialog[Show Network Error Dialog<br/>- Global Error UI]
    
    %% Page Routes & Layouts
    AppContent --> RouteDecision{Route Decision}
    RouteDecision -->|/| LandingPage[Landing Page<br/>- Welcome Card<br/>- Navigation Buttons<br/>- Public Access]
    RouteDecision -->|/authentication| AuthFlowLayout[Auth Flow Layout<br/>- Login/Register Pages<br/>- Form Validation]
    RouteDecision -->|/console| AuthenticatedLayout[Authenticated Layout<br/>- Protected Routes<br/>- User Dashboard]
    RouteDecision -->|/loading| LoadingPage[Loading Page<br/>- Loading States<br/>- Spinner UI]
    
    %% Authentication Flow
    AuthFlowLayout --> AuthFlowCheck{Authentication Status?}
    AuthFlowCheck -->|Loading| LoadingPage
    AuthFlowCheck -->|Authenticated| RedirectToConsole[Redirect to /console]
    AuthFlowCheck -->|Unauthenticated| AuthPages[Auth Pages]
    
    AuthPages --> LoginPage[Login Page<br/>- Username/Password Form<br/>- Zod Validation<br/>- TanStack Query Mutation]
    AuthPages --> RegisterPage[Register Page<br/>- User Registration Form<br/>- Similar Validation Pattern]
    
    %% Login Flow with TanStack Query
    LoginPage --> LoginForm[Login Form<br/>- React Hook Form<br/>- Zod Schema Validation<br/>- Error Handling]
    LoginForm --> LoginMutation[TanStack Query Mutation<br/>- jwt_create API Call<br/>- Optimistic Updates]
    LoginMutation --> OnLoginSuccess[On Login Success<br/>- Store Tokens<br/>- Update Auth State<br/>- Redirect to Console]
    OnLoginSuccess --> AuthState
    
    %% Authenticated User Experience
    AuthenticatedLayout --> AuthGuard[Authentication Guard<br/>- Check Auth Status<br/>- Handle Loading States]
    AuthGuard --> UserCheck{User Authenticated?}
    UserCheck -->|No| RedirectToAuth
    UserCheck -->|Yes| ConsolePages[Console Pages<br/>- Dashboard<br/>- User Interface]
    
    ConsolePages --> ConsoleMain[Console Main Page<br/>- User Dashboard<br/>- Main Content Area]
    ConsolePages --> ConsoleInbox[Console Inbox Page<br/>- User Messages<br/>- Communication Hub]
    ConsolePages --> ConsoleSidebar[Console Sidebar<br/>- Navigation<br/>- User Menu]
    
    %% Data Fetching & Caching
    ConsolePages --> UserDataFetch[User Data Fetching<br/>- TanStack Query<br/>- Automatic Caching<br/>- Background Refetch]
    UserDataFetch --> UserMeAPI[User Me API<br/>- /auth/users/me<br/>- User Profile Data]
    
    %% Styling
    classDef provider fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef sideEffect fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef page fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef state fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef decision fill:#fff8e1,stroke:#e65100,stroke-width:2px
    classDef action fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef api fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef data fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class Provider,GlobalProvider,QueryClientProvider,AuthProvider,ThemeProvider provider
    class AuthorizedHook,UnauthorizedHook,NetworkErrorHook,JwtTokenHook sideEffect
    class LandingPage,LoginPage,RegisterPage,ConsoleMain,ConsoleInbox,LoadingPage,AuthFlowLayout,AuthenticatedLayout page
    class AuthState,GlobalState state
    class RouteProtection,ProtectedRouteCheck,UnauthorizedCheck,NetworkCheck,AuthFlowCheck,UserCheck decision
    class RedirectToConsole,RedirectToAuth,ClearToken,ShowNetworkDialog,OnLoginSuccess action
    class DjangoAPI,AuthEndpoints,UserEndpoints,UserMeAPI api
    class DataLayer,UserDataFetch data
```

## Key Architectural Patterns

### 1. **Provider Hierarchy & State Management**
- **GlobalProvider**: Manages global UI state (network errors, global dialogs)
- **QueryClientProvider**: Handles data fetching, caching, and synchronization with TanStack Query
- **AuthProvider**: Manages authentication state with enum-based status (Loading/Authenticated/Unauthenticated)
- **ThemeProvider**: Handles dark/light mode with system preference detection

### 2. **Side Effects Pattern (Reactive Architecture)**
Your app uses a sophisticated side effects pattern where each hook has a single responsibility:
- **useAuthorized**: Handles route protection and authenticated user routing
- **useUnauthorized**: Manages 401 errors and automatic token cleanup
- **useNetworkError**: Detects network failures and shows global error dialogs
- **useJwtToken**: Manages token storage, retrieval, and validation lifecycle

### 3. **Data Layer Architecture**
- **API Instance**: Centralized Axios configuration with interceptors
- **Authorization Headers**: Automatic token injection for authenticated requests
- **Django Integration**: Seamless integration with Djoser authentication backend
- **Type Safety**: Full TypeScript integration with proper API response typing

### 4. **Route Protection & Navigation**
- **Protected Routes**: `/console` - requires authentication with automatic redirect
- **Auth Flow Routes**: `/authentication` - handles login/register with form validation
- **Public Routes**: `/` (landing) and `/loading` - accessible to all users
- **Smart Redirects**: Preserves intended destination for post-login navigation

### 5. **Authentication Flow**
1. **App Initialization**: Check for existing tokens in localStorage
2. **Token Validation**: Automatic verification via `jwt_verify` API
3. **State Management**: Enum-based authentication status with reactive updates
4. **Side Effects**: Automatic routing and error handling based on auth state
5. **Token Refresh**: Built-in token refresh mechanism (when implemented)

### 6. **Error Handling Strategy**
- **401 Errors**: Automatic token cleanup and redirect to authentication
- **Network Errors**: Global error dialog with retry mechanism
- **Form Validation**: Zod schema validation with user-friendly error messages
- **API Errors**: Structured error handling with proper TypeScript typing

### 7. **Performance Optimizations**
- **TanStack Query**: Intelligent caching, background refetching, and optimistic updates
- **Code Splitting**: Route-based code splitting with Next.js App Router
- **Lazy Loading**: Dynamic imports for better initial load performance
- **Memoization**: React.memo and useMemo for expensive computations

## Technical Implementation Details

### **Authentication State Management**
```typescript
enum AuthenticationStatus {
  Loading = "Loading",
  Authenticated = "Authenticated", 
  Unauthenticated = "Unauthenticated"
}
```

### **API Integration Pattern**
- **Base URL**: Configurable Django backend endpoint
- **Interceptors**: Automatic authorization header injection
- **Error Handling**: Centralized error processing with type safety
- **Request/Response**: Full TypeScript typing for all API calls

### **Form Handling**
- **React Hook Form**: Efficient form state management
- **Zod Validation**: Runtime type checking and validation
- **Error Display**: User-friendly error messages with proper UX

### **Route Protection Logic**
- **Layout-based Protection**: Authentication checks at layout level
- **Side Effect Hooks**: Reactive routing based on authentication state
- **Loading States**: Proper loading UI during authentication checks

## Benefits of This Architecture

### **1. Separation of Concerns**
- Each provider manages a specific domain (auth, global state, data fetching)
- Side effects are isolated and testable
- Clear boundaries between UI, business logic, and data layers

### **2. Reactive State Management**
- UI automatically updates based on authentication state changes
- Side effects react to state changes without manual intervention
- Consistent user experience across all routes

### **3. Type Safety & Developer Experience**
- Full TypeScript integration with proper typing
- IntelliSense support for all API calls and state
- Compile-time error detection for better code quality

### **4. Performance & Scalability**
- TanStack Query for efficient data fetching and caching
- Optimistic updates for better perceived performance
- Background refetching keeps data fresh
- Code splitting reduces initial bundle size

### **5. Error Boundaries & Resilience**
- Centralized error handling for different error types
- Graceful degradation on network failures
- Automatic token cleanup on authentication errors
- User-friendly error messages and recovery options

### **6. Maintainability & Testing**
- Clear architectural patterns make code easy to understand
- Isolated side effects are easy to test
- Provider pattern enables easy mocking for tests
- Consistent patterns across the application

## Future Enhancements & Recommendations

### **1. Token Refresh Implementation**
- Implement automatic token refresh before expiration
- Add refresh token rotation for enhanced security
- Handle concurrent requests during token refresh

### **2. Offline Support**
- Add service worker for offline functionality
- Cache critical data for offline access
- Queue mutations for when connection is restored

### **3. Enhanced Error Handling**
- Add retry mechanisms for failed requests
- Implement exponential backoff for network errors
- Add error reporting and monitoring

### **4. Performance Monitoring**
- Add performance metrics and monitoring
- Implement bundle analysis and optimization
- Add Core Web Vitals tracking

### **5. Security Enhancements**
- Implement CSRF protection
- Add request rate limiting
- Enhance token security with httpOnly cookies (if applicable)

## Summary

This architecture represents a modern, scalable approach to building authentication-enabled Next.js applications. The combination of:

- **TanStack Query** for sophisticated data management
- **Provider-based state management** for clean separation of concerns
- **Side effects pattern** for reactive UI behavior
- **TypeScript integration** for type safety and developer experience
- **Djoser backend integration** for robust authentication

Creates a solid foundation for building production-ready applications with excellent user experience, maintainable code, and robust error handling.

The architecture is designed to scale with your application needs while maintaining simplicity and clarity in the codebase. Each pattern serves a specific purpose and works together to create a cohesive, reliable system.
