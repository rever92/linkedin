// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de error
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Puedes registrar el error en un servicio de reporte de errores
    console.error("Error capturado en ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier interfaz de error personalizada
      return <h1>Algo salió mal. Por favor, intenta de nuevo más tarde.</h1>;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;