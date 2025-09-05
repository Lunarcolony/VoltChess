# Authentication Configuration

VoltChess supports flexible authentication configuration. You can easily enable or disable authentication requirements based on your needs.

## How to Configure Authentication

### Method 1: Environment Variable (Recommended)

1. Create a `.env` file in the root directory (or copy from `.env.example`)
2. Set the `VITE_ENABLE_AUTHENTICATION` variable:

```bash
# To disable authentication (allow access without login)
VITE_ENABLE_AUTHENTICATION=false

# To enable authentication (require login for protected routes)
VITE_ENABLE_AUTHENTICATION=true
```

### Method 2: Direct Code Modification

1. Open `src/constants.ts`
2. Modify the `ENABLE_AUTHENTICATION` constant:

```typescript
// Set to false to disable authentication
export const ENABLE_AUTHENTICATION = false;

// Set to true to enable authentication (default)
export const ENABLE_AUTHENTICATION = true;
```

## What Changes When Authentication is Disabled

When `ENABLE_AUTHENTICATION` is set to `false`:

- Users can access `/analysis`, `/play`, and `/reanalysis` pages without logging in
- The "Start Analyzing" button on the home page will work without authentication
- Login and registration pages remain accessible but are not required
- All existing functionality works the same, just without authentication barriers

## Protected Routes

The following routes are protected by authentication (when enabled):

- `/analysis` - Chess game analysis page
- `/play` - Play chess page
- `/reanalysis` - Re-analyze saved games

## Public Routes (Always Accessible)

These routes are always accessible regardless of authentication settings:

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/database` - Games database
- `/terms-and-conditions` - Terms and conditions
- `/thanks` - Thank you page

## Note

After changing the authentication setting, you may need to restart your development server for the changes to take effect.
