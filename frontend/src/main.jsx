import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'
import { Provider } from 'react-redux'
import store from './redux/Store'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import ThemeProvider from './components/ThemeProvider'
import { HelmetProvider } from 'react-helmet-async'

const persistor = persistStore(store)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <App />
            <Toaster position="bottom-right" reverseOrder={false} />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </HelmetProvider>
  </StrictMode>
)
