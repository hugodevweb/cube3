import { Routes, Route } from 'react-router-dom';

function HomePage() {
  return (
    <main>
      <h1>La Petite Maison de l'Épouvante</h1>
      <p>Bienvenue sur la plateforme dédiée à l'horreur, la fantasy et l'héroïc fantasy.</p>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
