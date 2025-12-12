# Alertiqo JavaScript SDK

Client-side SDK for error tracking in web/browser applications.

## Installation

```bash
npm install @hymns/alertiqo
```

## Usage

### Basic Setup

```javascript
import Alertiqo from '@hymns/alertiqo';

const alertiqo = new Alertiqo({
  apiKey: 'your-api-key',
  endpoint: 'https://alertiqo.hamizi.net',
  environment: 'production',
  release: '1.0.0',
});

alertiqo.init();
```

### Capture Exceptions

```javascript
try {
  throw new Error('Something went wrong');
} catch (error) {
  alertiqo.captureException(error);
}
```

### Capture Messages

```javascript
alertiqo.captureMessage('User completed checkout', 'info');
```

### Add Breadcrumbs

```javascript
alertiqo.addBreadcrumb({
  message: 'User clicked button',
  category: 'user-action',
  level: 'info',
  data: { buttonId: 'submit-btn' }
});
```

### Set User Context

```javascript
alertiqo.setUser({
  id: '12345',
  email: 'user@example.com',
  username: 'johndoe'
});
```

### Set Tags

```javascript
alertiqo.setTag('page', 'checkout');
alertiqo.setTags({ 
  feature: 'payments',
  version: '2.1.0'
});
```

## API

### `new Alertiqo(config)`

Creates a new Alertiqo instance.

**Config Options:**
- `apiKey` (required): Your API key
- `endpoint` (required): Backend endpoint URL
- `environment`: Environment name (default: 'production')
- `release`: Release version
- `tags`: Default tags for all errors
- `beforeSend`: Callback to modify/filter errors before sending

### Methods

- `init()`: Initialize error handlers
- `captureException(error, additionalData?)`: Capture an exception
- `captureMessage(message, level?)`: Capture a message
- `addBreadcrumb(breadcrumb)`: Add a breadcrumb
- `setUser(user)`: Set user context
- `setTag(key, value)`: Set a single tag
- `setTags(tags)`: Set multiple tags
