# Application Flow Architecture Diagram

## Subject: Application Flow Architecture and State Management

This diagram visualizes the flows, pages, and side effects in your Next.js authentication application.

```mermaid
graph TB
    %% Entry Points
    Start([User Visits App]) --> RootLayout[Root Layout]
    RootLayout --> Provider[Main Provider]
    
    %% Provider Hierarchy
    Provider --> GlobalProvider[Global Provider]
    GlobalProvider --> AuthProvider[Auth Provider]
    AuthProvider --> ThemeProvider[Theme Provider]
    ThemeProvider --> AppContent[App Content]
    
    %% Global State
    GlobalProvider --> GlobalState[Global State<br/>- networkErrorOpen<br/>- setNetworkErrorOpen]
    GlobalState --> NetworkErrorDialog[Network Error Dialog]
    
    %% Auth State & Side Effects
    AuthProvider --> AuthState[Auth State<br/>- user<br/>- token_found<br/>- isLoading<br/>- loadToken]
    AuthState --> LoadToken[Load Token Side Effect]
    AuthState --> SWR[SWR Data Fetching<br/>- me API call]
    
    %% Side Effects Chain
    LoadToken --> TokenCheck{Token Found?}
    TokenCheck -->|Yes| TokenFound[Token Found = true]
    TokenCheck -->|No| TokenNotFound[Token Found = false]
    TokenCheck -->|Undefined| LoadingState[Loading State]
    
    SWR --> AuthData[Auth Data<br/>- user data<br/>- error state]
    
    %% Side Effects Hooks
    AuthData --> AuthorizedHook[useAuthorized Hook]
    AuthData --> UnauthorizedHook[useUnauthorized Hook]
    AuthData --> NetworkErrorHook[useNetworkError Hook]
    
    %% Routing Logic
    AuthorizedHook --> AuthFlowCheck{On Auth Flow Route?}
    AuthFlowCheck -->|Yes + Authenticated| RedirectToConsole[Redirect to /console]
    AuthFlowCheck -->|No| ProtectedCheck{On Protected Route?}
    ProtectedCheck -->|Yes + Not Authenticated| RedirectToAuth[Redirect to /authentication]
    ProtectedCheck -->|No| Continue[Continue to Page]
    
    UnauthorizedHook --> UnauthorizedCheck{401 Error?}
    UnauthorizedCheck -->|Yes| ClearToken[Clear Access Token]
    ClearToken --> RedirectToAuth
    
    NetworkErrorHook --> NetworkCheck{Network Error?}
    NetworkCheck -->|Yes| ShowNetworkDialog[Show Network Error Dialog]
    
    %% Page Routes
    AppContent --> RouteDecision{Route Decision}
    RouteDecision -->|/| LandingPage[Landing Page<br/>- Welcome Card<br/>- Navigation Buttons]
    RouteDecision -->|/authentication| AuthFlowLayout[Auth Flow Layout]
    RouteDecision -->|/console| AuthenticatedLayout[Authenticated Layout]
    RouteDecision -->|/loading| LoadingPage[Loading Page]
    
    %% Auth Flow Pages
    AuthFlowLayout --> AuthFlowCheck2{Token Found?}
    AuthFlowCheck2 -->|Undefined| LoadingPage
    AuthFlowCheck2 -->|Defined| AuthPages[Auth Pages]
    AuthPages --> LoginPage[Login Page<br/>- Form with validation<br/>- SWR mutation]
    AuthPages --> RegisterPage[Register Page<br/>- Similar to login]
    
    %% Login Flow
    LoginPage --> LoginForm[Login Form<br/>- Username/Password<br/>- Zod validation]
    LoginForm --> LoginMutation[SWR Mutation<br/>- jwt_create API]
    LoginMutation --> OnLoginHook[useOnLogin Hook]
    OnLoginHook --> StoreTokens[Store Tokens<br/>- Access Token<br/>- Refresh Token]
    StoreTokens --> ReloadToken[Reload Token]
    ReloadToken --> AuthState
    
    %% Authenticated Pages
    AuthenticatedLayout --> UserCheck{User Exists?}
    UserCheck -->|No| LoadingPage
    UserCheck -->|Yes| ConsolePages[Console Pages]
    ConsolePages --> ConsoleMain[Console Main Page]
    ConsolePages --> ConsoleInbox[Console Inbox Page]
    ConsolePages --> ConsoleSidebar[Console Sidebar]
    
    %% Styling
    classDef provider fill:#e1f5fe
    classDef sideEffect fill:#fff3e0
    classDef page fill:#f3e5f5
    classDef state fill:#e8f5e8
    classDef decision fill:#fff8e1
    classDef action fill:#ffebee
    
    class Provider,GlobalProvider,AuthProvider,ThemeProvider provider
    class LoadToken,AuthorizedHook,UnauthorizedHook,NetworkErrorHook,OnLoginHook sideEffect
    class LandingPage,LoginPage,RegisterPage,ConsoleMain,ConsoleInbox,LoadingPage page
    class AuthState,GlobalState,AuthData state
    class TokenCheck,AuthFlowCheck,ProtectedCheck,UnauthorizedCheck,NetworkCheck,AuthFlowCheck2,UserCheck decision
    class RedirectToConsole,RedirectToAuth,ClearToken,ShowNetworkDialog,StoreTokens,ReloadToken action
```

## Key Architectural Patterns

### 1. **Provider Hierarchy**
- **GlobalProvider**: Manages global UI state (network errors)
- **AuthProvider**: Manages authentication state and side effects
- **ThemeProvider**: Handles theming

### 2. **Side Effects Pattern**
Your app uses a sophisticated side effects pattern where:
- **useLoadToken**: Checks for existing tokens on app load
- **useAuthorized**: Handles routing for authenticated users
- **useUnauthorized**: Handles 401 errors and token cleanup
- **useNetworkError**: Manages network error dialogs
- **useOnLogin**: Handles successful login token storage

### 3. **Route Protection**
- **Protected Routes**: `/console` - requires authentication
- **Auth Flow Routes**: `/authentication` - redirects authenticated users
- **Public Routes**: `/loading` - accessible to all

### 4. **State Management Flow**
1. App loads → Check for existing token
2. If token exists → Fetch user data via SWR
3. Side effects react to auth state changes
4. Routing decisions based on auth state and current route

### 5. **Error Handling**
- **401 Errors**: Clear tokens and redirect to auth
- **Network Errors**: Show global error dialog
- **API Errors**: Display in form components

## Benefits of This Architecture

1. **Separation of Concerns**: Each side effect has a single responsibility
2. **Reactive State**: UI automatically updates based on auth state changes
3. **Type Safety**: Full TypeScript integration with proper typing
4. **Error Boundaries**: Centralized error handling for different error types
5. **Performance**: SWR for efficient data fetching and caching
