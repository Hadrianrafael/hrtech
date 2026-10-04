'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Erro inesperado</h1>
          <p>A aplicação encontrou um problema. Tente recarregar.</p>
          <button onClick={reset}>Recarregar</button>
        </div>
      </body>
    </html>
  );
}
