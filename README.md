# miAzukr
App de registro de glucosa

## Configuración de Firebase

La configuración se puede realizar desde la linea de comandos con los [firebase-tools](https://firebase.google.com/docs/cli/). Los siguientes pasos pueden ser realizados tanto por la web como por la linea de comandos.

### 1. Archivo de configuración

Copia `src/firebaseConfig.js.example` a `src/firebaseConfig.js` y reemplaza los valores con los de tu proyecto Firebase:

```javascript
export default {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
}
```

> **Nota**: El archivo `src/firebaseConfig.js` está en `.gitignore` y no debe subirse al repositorio.

### 2. Habilitar servicios en Firebase Console

Ve a [Firebase Console](https://console.firebase.google.com/) y configura lo siguiente:

#### Authentication
1. Selecciona tu proyecto
2. Ve a "Authentication" → "Get started"
3. En la pestaña "Sign-in method", habilita:
   - **Google** (para inicio de sesión con Google)
   - **Email/Password** (para inicio de sesión con email)

#### Firestore Database
1. Ve a "Firestore Database" → "Create database"
2. Selecciona el modo (test o production)
3. Elige una ubicación cercana a tus usuarios

### 3. Reglas de seguridad de Firestore

Configura las siguientes reglas en Firestore para proteger los datos de usuarios:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
      match /registros/{recordId} {
        allow read, write: if request.auth != null && request.auth.token.email == userId;
      }
    }
  }
}
```

### 4. Estructura de datos en Firestore

Las colecciones se crean automáticamente cuando guardas datos por primera vez. La estructura es:

```
usuarios (collection)
  └── {email} (document)
      ├── {profile fields} (data)
      └── registros (subcollection)
          └── {recordId} (document)
              ├── ts (timestamp)
              └── {other record fields}
```

**No necesitas crear las colecciones manualmente** - se crearán automáticamente cuando la app guarde el primer registro.